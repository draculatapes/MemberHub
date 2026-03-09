from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from datetime import datetime, timedelta
import jwt
import bcrypt
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
import os
from dotenv import load_dotenv
import certifi
from bson import ObjectId

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="MemberHub API", version="2.0.0", description="Membership Management & Certificate Generation")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB Connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "memberhub")
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Admin credentials (used for seeding)
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@memberhub.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123456")

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None

# ============ Startup & Shutdown ============

@app.on_event("startup")
async def startup():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
    db = client[DATABASE_NAME]
    print("✓ Connected to MongoDB")
    
    # Seed admin user if not exists
    admin = await db.users.find_one({"email": ADMIN_EMAIL})
    if not admin:
        admin_doc = {
            "email": ADMIN_EMAIL,
            "password": hash_password(ADMIN_PASSWORD),
            "name": "Admin",
            "role": "admin",
            "status": "approved",
            "created_at": datetime.utcnow(),
            "is_admin": True
        }
        await db.users.insert_one(admin_doc)
        print(f"✓ Admin user seeded: {ADMIN_EMAIL}")
    else:
        print(f"✓ Admin user exists: {ADMIN_EMAIL}")

@app.on_event("shutdown")
async def shutdown():
    if client:
        client.close()
        print("✓ Disconnected from MongoDB")

# ============ Pydantic Models ============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    phone: Optional[str] = None
    organization: Optional[str] = None
    
    @validator('password')
    def password_valid(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    status: str
    name: str

class MemberTier(BaseModel):
    tier_id: str
    name: str
    price: float
    benefits: List[str]
    duration_days: int

class Payment(BaseModel):
    amount: float
    tier: str
    payment_method: str
    transaction_id: str

class Certificate(BaseModel):
    member_id: str
    member_name: str
    tier: str
    issue_date: datetime
    certificate_url: str

# ============ Helper Functions ============

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_access_token(user_id: str, role: str, expires_delta: Optional[timedelta] = None):
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str, role: str):
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "role": role, "exp": expire, "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> dict:
    """Returns dict with user_id and role"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        role = payload.get("role", "user")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id, "role": role}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> dict:
    """Verify token AND check admin role"""
    token_data = await verify_token(credentials)
    if token_data["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return token_data

# ============ Authentication Routes ============

@app.post("/api/auth/register")
async def register(user: UserRegister):
    """Register new user — status starts as 'pending'"""
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "phone": user.phone,
        "organization": user.organization,
        "role": "user",
        "status": "pending",  # Admin must approve
        "tier": None,
        "created_at": datetime.utcnow(),
        "is_admin": False
    }
    
    result = await db.users.insert_one(user_doc)
    
    return {
        "message": "Registration submitted! Please wait for admin approval.",
        "user_id": str(result.inserted_id)
    }

@app.post("/api/auth/login")
async def login(credentials: UserLogin):
    """Login user and return tokens with role and status"""
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_id = str(user["_id"])
    role = user.get("role", "user")
    user_status = user.get("status", "pending")
    name = user.get("name", "")
    
    access_token = create_access_token(user_id, role)
    refresh_token = create_refresh_token(user_id, role)
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "role": role,
        "status": user_status,
        "name": name,
        "user_id": user_id
    }

@app.get("/api/auth/me")
async def get_current_user(token_data: dict = Depends(verify_token)):
    """Get current user info"""
    user = await db.users.find_one({"_id": ObjectId(token_data["user_id"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if user has a member record
    member = await db.members.find_one({"user_id": token_data["user_id"]})
    
    # Check if payment is done
    has_paid = False
    member_id = None
    if member:
        member_id = str(member["_id"])
        payment = await db.payments.find_one({"member_id": member_id, "status": "completed"})
        has_paid = payment is not None
    
    # Check if certificate exists
    has_certificate = False
    if member_id:
        cert = await db.certificates.find_one({"member_id": member_id})
        has_certificate = cert is not None
    
    return {
        "user_id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "phone": user.get("phone"),
        "organization": user.get("organization"),
        "role": user.get("role", "user"),
        "status": user.get("status", "pending"),
        "tier": user.get("tier"),
        "member_id": member_id,
        "has_paid": has_paid,
        "has_certificate": has_certificate
    }

@app.post("/api/auth/refresh")
async def refresh(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """Refresh access token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        role = payload.get("role", "user")
        access_token = create_access_token(user_id, role)
        refresh_token = create_refresh_token(user_id, role)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

# ============ Admin Routes ============

@app.get("/api/admin/pending-users")
async def get_pending_users(token_data: dict = Depends(verify_admin)):
    """Get all pending user registrations"""
    users = await db.users.find({"status": "pending", "role": "user"}).to_list(100)
    return [{
        "user_id": str(u["_id"]),
        "name": u.get("name", ""),
        "email": u["email"],
        "phone": u.get("phone"),
        "organization": u.get("organization"),
        "created_at": u.get("created_at"),
    } for u in users]

@app.get("/api/admin/all-users")
async def get_all_users(token_data: dict = Depends(verify_admin)):
    """Get all users (non-admin)"""
    users = await db.users.find({"role": "user"}).to_list(200)
    result = []
    for u in users:
        user_id = str(u["_id"])
        member = await db.members.find_one({"user_id": user_id})
        has_paid = False
        if member:
            payment = await db.payments.find_one({"member_id": str(member["_id"]), "status": "completed"})
            has_paid = payment is not None
        
        result.append({
            "user_id": user_id,
            "name": u.get("name", ""),
            "email": u["email"],
            "phone": u.get("phone"),
            "organization": u.get("organization"),
            "status": u.get("status", "pending"),
            "tier": u.get("tier"),
            "has_paid": has_paid,
            "created_at": u.get("created_at"),
        })
    return result

@app.post("/api/admin/approve/{user_id}")
async def approve_user(user_id: str, tier: str = "basic", token_data: dict = Depends(verify_admin)):
    """Approve a pending user and auto-create their member record"""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.get("status") == "approved":
        raise HTTPException(status_code=400, detail="User already approved")
    
    # Update user status
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": "approved", "tier": tier}}
    )
    
    # Auto-create member record
    existing_member = await db.members.find_one({"user_id": user_id})
    if not existing_member:
        member_doc = {
            "user_id": user_id,
            "name": user.get("name", ""),
            "email": user["email"],
            "phone": user.get("phone"),
            "tier": tier,
            "organization": user.get("organization"),
            "status": "active",
            "joined_date": datetime.utcnow(),
            "tier_expiry_date": datetime.utcnow() + timedelta(days=30),
            "certificate_issued": False,
            "created_at": datetime.utcnow()
        }
        await db.members.insert_one(member_doc)
    
    return {"message": f"User {user.get('name', '')} approved and member created"}

@app.post("/api/admin/reject/{user_id}")
async def reject_user(user_id: str, token_data: dict = Depends(verify_admin)):
    """Reject a pending user"""
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"status": "rejected"}}
    )
    
    return {"message": f"User {user.get('name', '')} rejected"}

@app.get("/api/admin/analytics")
async def get_admin_analytics(token_data: dict = Depends(verify_admin)):
    """Get admin dashboard analytics"""
    total_users = await db.users.count_documents({"role": "user"})
    pending_users = await db.users.count_documents({"status": "pending", "role": "user"})
    approved_users = await db.users.count_documents({"status": "approved", "role": "user"})
    rejected_users = await db.users.count_documents({"status": "rejected", "role": "user"})
    
    total_members = await db.members.count_documents({})
    active_members = await db.members.count_documents({"status": "active"})
    
    tier_basic = await db.members.count_documents({"tier": "basic"})
    tier_premium = await db.members.count_documents({"tier": "premium"})
    tier_gold = await db.members.count_documents({"tier": "gold"})
    
    payments = await db.payments.find({"status": "completed"}).to_list(None)
    total_revenue = sum(p.get("amount", 0) for p in payments)
    
    certificates_issued = await db.certificates.count_documents({})
    
    return {
        "total_users": total_users,
        "pending_users": pending_users,
        "approved_users": approved_users,
        "rejected_users": rejected_users,
        "total_members": total_members,
        "active_members": active_members,
        "tier_distribution": {
            "basic": tier_basic,
            "premium": tier_premium,
            "gold": tier_gold
        },
        "total_revenue": total_revenue,
        "certificates_issued": certificates_issued
    }

# ============ Membership Routes ============

@app.get("/api/membership/tiers")
async def get_membership_tiers():
    """Get all membership tiers"""
    tiers = [
        {
            "tier_id": "basic",
            "name": "Basic",
            "price": 99.99,
            "benefits": ["Basic access", "Email support", "Certificate"],
            "duration_days": 30
        },
        {
            "tier_id": "premium",
            "name": "Premium",
            "price": 199.99,
            "benefits": ["All Basic features", "Priority support", "Advanced analytics", "Custom certificate"],
            "duration_days": 30
        },
        {
            "tier_id": "gold",
            "name": "Gold",
            "price": 299.99,
            "benefits": ["All Premium features", "24/7 Support", "Dedicated account manager", "Custom domain"],
            "duration_days": 30
        }
    ]
    return tiers

@app.get("/api/members/{member_id}")
async def get_member(member_id: str, token_data: dict = Depends(verify_token)):
    """Get member details"""
    member = await db.members.find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    member["member_id"] = str(member["_id"])
    del member["_id"]
    return member

@app.get("/api/members")
async def list_members(token_data: dict = Depends(verify_token)):
    """List all members for current user"""
    user_id = token_data["user_id"]
    members = await db.members.find({"user_id": user_id}).to_list(100)
    return [{"member_id": str(m["_id"]), **{k: v for k, v in m.items() if k != "_id"}} for m in members]

# ============ Payment Routes ============

@app.post("/api/payments/create")
async def create_payment(payment: Payment, token_data: dict = Depends(verify_token)):
    """Create payment — user must be approved"""
    user_id = token_data["user_id"]
    
    # Verify user is approved
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user or user.get("status") != "approved":
        raise HTTPException(status_code=403, detail="User not approved for payment")
    
    # Find member record
    member = await db.members.find_one({"user_id": user_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member record not found")
    
    member_id = str(member["_id"])
    
    payment_doc = {
        "member_id": member_id,
        "user_id": user_id,
        "amount": payment.amount,
        "tier": payment.tier,
        "payment_method": payment.payment_method,
        "status": "completed",
        "transaction_id": payment.transaction_id,
        "created_at": datetime.utcnow()
    }
    
    await db.payments.insert_one(payment_doc)
    
    # Update member tier
    await db.members.update_one(
        {"_id": member["_id"]},
        {"$set": {
            "tier": payment.tier,
            "tier_expiry_date": datetime.utcnow() + timedelta(days=30)
        }}
    )
    
    # Update user tier
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"tier": payment.tier}}
    )
    
    # Auto-generate certificate after payment
    certificate_url = f"/certificates/{member_id}.pdf"
    cert_doc = {
        "member_id": member_id,
        "member_name": member["name"],
        "tier": payment.tier,
        "issue_date": datetime.utcnow(),
        "certificate_url": certificate_url,
        "created_at": datetime.utcnow()
    }
    
    # Remove old certificate if exists
    await db.certificates.delete_many({"member_id": member_id})
    await db.certificates.insert_one(cert_doc)
    
    # Update member certificate status
    await db.members.update_one(
        {"_id": member["_id"]},
        {"$set": {"certificate_issued": True, "certificate_url": certificate_url}}
    )
    
    return {
        "message": "Payment completed and certificate generated!",
        "member_id": member_id,
        "transaction_id": payment.transaction_id
    }

@app.get("/api/payments/{member_id}")
async def get_payment_history(member_id: str, token_data: dict = Depends(verify_token)):
    """Get payment history for member"""
    payments = await db.payments.find({"member_id": member_id}).to_list(100)
    for p in payments:
        p["_id"] = str(p["_id"])
    return payments

# ============ Certificate Routes ============

@app.get("/api/certificates/{member_id}")
async def get_certificate(member_id: str, token_data: dict = Depends(verify_token)):
    """Get certificate for member"""
    certificate = await db.certificates.find_one({"member_id": member_id})
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    certificate["_id"] = str(certificate["_id"])
    return certificate

# ============ Health Check ============

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "2.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
