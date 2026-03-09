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

load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="MemberHub API", version="1.0.0", description="Membership Management & Certificate Generation")

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

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None

# ============ Startup & Shutdown ============
@app.on_event("startup")
async def startup():
    global client, db
    client = AsyncIOMotorClient(MONGO_URL, tlsCAFile=certifi.where())
    db = client[DATABASE_NAME]
    print("✓ Connected to MongoDB")

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

class MemberTier(BaseModel):
    tier_id: str
    name: str  # Basic, Premium, Gold
    price: float
    benefits: List[str]
    duration_days: int

# class MemberCreate(BaseModel):
#     user_id: str
#     name: str
#     email: EmailStr
#     phone: Optional[str] = None
#     tier: str  # basic, premium, gold
#     organization: Optional[str] = None
class MemberCreate(BaseModel):
    user_id: Optional[str] = None
    name: str
    email: EmailStr
    phone: Optional[str] = None
    tier: str
    organization: Optional[str] = None

class Member(MemberCreate):
    member_id: str
    status: str  # active, inactive, suspended
    joined_date: datetime
    certificate_url: Optional[str] = None
    tier_expiry_date: datetime

class Payment(BaseModel):
    member_id: str
    amount: float
    tier: str
    payment_method: str  # stripe, razorpay, bank_transfer
    status: str  # pending, completed, failed
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

def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None):
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def create_refresh_token(user_id: str):
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {"sub": user_id, "exp": expire, "type": "refresh"}
    encoded_jwt = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())) -> str:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ Authentication Routes ============

@app.post("/api/auth/register", response_model=dict)
async def register(user: UserRegister):
    """Register new user"""
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_doc = {
        "email": user.email,
        "password": hash_password(user.password),
        "name": user.name,
        "created_at": datetime.utcnow(),
        "is_admin": False
    }
    
    user_doc["_id"] = str(result.inserted_id)
    
    return {
        "message": "User registered successfully",
        "user_id": str(result.inserted_id)
    }

@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    """Login user and return tokens"""
    user = await db.users.find_one({"email": credentials.email})
    
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(str(user["_id"]))
    refresh_token = create_refresh_token(str(user["_id"]))
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }

@app.post("/api/auth/refresh", response_model=TokenResponse)
async def refresh(credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())):
    """Refresh access token using refresh token"""
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        user_id = payload.get("sub")
        access_token = create_access_token(user_id)
        refresh_token = create_refresh_token(user_id)
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

# ============ Membership Routes ============

@app.get("/api/membership/tiers", response_model=List[dict])
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

@app.post("/api/members/create")
async def create_member(member: MemberCreate, user_id: str = Depends(verify_token)):
    """Create new member"""
    member_doc = {
        "user_id": user_id,
        "name": member.name,
        "email": member.email,
        "phone": member.phone,
        "tier": member.tier,
        "organization": member.organization,
        "status": "active",
        "joined_date": datetime.utcnow(),
        "tier_expiry_date": datetime.utcnow() + timedelta(days=30),
        "certificate_issued": False,
        "created_at": datetime.utcnow()
    }
    
    result = await db.members.insert_one(member_doc)
    
    return {
        "message": "Member created successfully",
        "member_id": str(result.inserted_id)
    }

@app.get("/api/members/{member_id}")
async def get_member(member_id: str, user_id: str = Depends(verify_token)):
    """Get member details"""
    from bson import ObjectId
    
    member = await db.members.find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    member["member_id"] = str(member["_id"])
    del member["_id"]
    return member

@app.get("/api/members", response_model=List[dict])
async def list_members(user_id: str = Depends(verify_token)):
    """List all members for current user"""
    members = await db.members.find({"user_id": user_id}).to_list(100)
    return [{"member_id": str(m["_id"]), **{k: v for k, v in m.items() if k != "_id"}} for m in members]

@app.post("/api/members/{member_id}/upgrade-tier")
async def upgrade_tier(member_id: str, new_tier: str, user_id: str = Depends(verify_token)):
    """Upgrade member tier"""
    from bson import ObjectId
    
    result = await db.members.update_one(
        {"_id": ObjectId(member_id)},
        {"$set": {"tier": new_tier, "tier_expiry_date": datetime.utcnow() + timedelta(days=30)}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Member not found")
    
    return {"message": "Tier upgraded successfully"}

# ============ Payment Routes ============

@app.post("/api/payments/create")
async def create_payment(payment: Payment, user_id: str = Depends(verify_token)):
    """Create payment record"""
    payment_doc = {
        "member_id": payment.member_id,
        "amount": payment.amount,
        "tier": payment.tier,
        "payment_method": payment.payment_method,
        "status": "completed",  # In production, use actual payment gateway
        "transaction_id": payment.transaction_id,
        "created_at": datetime.utcnow()
    }
    
    result = await db.payments.insert_one(payment_doc)
    
    return {
        "message": "Payment recorded successfully",
        "transaction_id": payment.transaction_id
    }

@app.get("/api/payments/{member_id}")
async def get_payment_history(member_id: str, user_id: str = Depends(verify_token)):
    """Get payment history for member"""
    payments = await db.payments.find({"member_id": member_id}).to_list(100)
    for p in payments:
        p["_id"] = str(p["_id"])
    return payments

# ============ Certificate Routes ============

@app.post("/api/certificates/generate")
async def generate_certificate(member_id: str, user_id: str = Depends(verify_token)):
    """Generate certificate for member (auto-generated)"""
    from bson import ObjectId
    
    member = await db.members.find_one({"_id": ObjectId(member_id)})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    # In production, generate actual PDF
    certificate_url = f"/certificates/{member_id}.pdf"
    
    cert_doc = {
        "member_id": member_id,
        "member_name": member["name"],
        "tier": member["tier"],
        "issue_date": datetime.utcnow(),
        "certificate_url": certificate_url,
        "created_at": datetime.utcnow()
    }
    
    result = await db.certificates.insert_one(cert_doc)
    
    # Update member certificate status
    await db.members.update_one(
        {"_id": ObjectId(member_id)},
        {"$set": {"certificate_issued": True, "certificate_url": certificate_url}}
    )
    
    return {
        "message": "Certificate generated successfully",
        "certificate_url": certificate_url
    }

@app.get("/api/certificates/{member_id}")
async def get_certificate(member_id: str, user_id: str = Depends(verify_token)):
    """Get certificate for member"""
    certificate = await db.certificates.find_one({"member_id": member_id})
    if not certificate:
        raise HTTPException(status_code=404, detail="Certificate not found")
    
    certificate["_id"] = str(certificate["_id"])
    return certificate

# ============ Analytics Routes ============

@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics(user_id: str = Depends(verify_token)):
    """Get dashboard analytics"""
    total_members = await db.members.count_documents({"user_id": user_id})
    active_members = await db.members.count_documents({"user_id": user_id, "status": "active"})
    
    # Tier distribution
    tier_basic = await db.members.count_documents({"user_id": user_id, "tier": "basic"})
    tier_premium = await db.members.count_documents({"user_id": user_id, "tier": "premium"})
    tier_gold = await db.members.count_documents({"user_id": user_id, "tier": "gold"})
    
    # Revenue (sum of all payments)
    payments = await db.payments.find({"status": "completed"}).to_list(None)
    total_revenue = sum(p.get("amount", 0) for p in payments)
    
    return {
        "total_members": total_members,
        "active_members": active_members,
        "tier_distribution": {
            "basic": tier_basic,
            "premium": tier_premium,
            "gold": tier_gold
        },
        "total_revenue": total_revenue,
        "certificates_issued": await db.certificates.count_documents({})
    }

# ============ Health Check ============

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
