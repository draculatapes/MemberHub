# MemberHub - Quick Start Guide

## ⚡ 5-Minute Setup

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB (local or Atlas cloud)

---

## Step 1: MongoDB Setup (Choose One)

### Option A: Local MongoDB
```bash
# macOS
brew install mongodb-community
mongod

# Windows: Download from https://www.mongodb.com/try/download/community
# Then: MongoDB Community Server is already running as a service
```

### Option B: MongoDB Atlas (Cloud)
1. Visit: https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Copy connection string
5. Save for later

---

## Step 2: Backend Setup

```bash
# 1. Open terminal in 'backend' folder
cd backend

# 2. Create virtual environment
python -m venv venv

# 3. Activate it
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 4. Install packages
pip install -r requirements.txt

# 5. Create .env file
# Windows:
copy .env.example .env
# macOS/Linux:
cp .env.example .env

# 6. Edit .env and set MongoDB URL
# Open .env file and update:
# MONGO_URL=mongodb://localhost:27017
# or if using MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster...

# 7. Start server
python -m uvicorn main:app --reload

# ✅ Backend running at: http://localhost:8000
# ✅ API docs at: http://localhost:8000/docs
```

---

## Step 3: Frontend Setup

```bash
# 1. Open new terminal in 'frontend' folder
cd frontend

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev

# ✅ Frontend running at: http://localhost:5173
```

---

## Step 4: Test the Application

1. Open **http://localhost:5173** in browser
2. Click "Register"
3. Create account:
   - Name: Test User
   - Email: test@example.com
   - Password: TestPassword123

4. Login with those credentials

5. Try features:
   - **Dashboard**: View statistics
   - **Members**: Add a member
   - **Analytics**: View charts
   - **Payments**: Process payment
   - **Certificates**: Generate certificate

---

## 📊 Quick Feature Test

### Add a Member
1. Go to Members page
2. Click "Add Member"
3. Fill details:
   - Name: John Doe
   - Email: john@example.com
   - Tier: Basic
4. Click "Create Member"

### Generate Certificate
1. Click on member
2. Click "Generate Certificate"
3. View/Download certificate

### Make Payment
1. Click on member
2. Click "Make Payment"
3. Select tier
4. Click "Pay"

---

## 🔧 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Connection refused 27017` | MongoDB not running. Run `mongod` |
| `Port 8000 already in use` | Change to port 8001: `--port 8001` |
| `Module not found` | Run `pip install -r requirements.txt` |
| `npm install fails` | Delete `node_modules` and `package-lock.json`, then retry |
| `CORS Error` | Check `.env` has correct API URL |

---

## 📁 Project Structure

```
backend/
  ├── main.py              ← FastAPI app
  ├── requirements.txt     ← Python packages
  └── .env                 ← Config (create from .env.example)

frontend/
  ├── src/
  │   ├── pages/          ← Page components
  │   ├── components/     ← Reusable components
  │   ├── styles/         ← CSS files
  │   └── App.jsx         ← Main app
  ├── package.json        ← npm packages
  └── vite.config.js      ← Build config
```

---

## 🎯 Default Test Account

After first registration, you can use:
```
Email: test@example.com
Password: TestPassword123
```

---

## 📝 API Endpoints (for testing with Postman)

### Register
```
POST http://localhost:8000/api/auth/register
Body: {
  "email": "user@example.com",
  "password": "Password123",
  "name": "User Name"
}
```

### Login
```
POST http://localhost:8000/api/auth/login
Body: {
  "email": "user@example.com",
  "password": "Password123"
}
Returns: { "access_token": "..." }
```

### Get Members
```
GET http://localhost:8000/api/members
Header: Authorization: Bearer <token>
```

### Create Member
```
POST http://localhost:8000/api/members/create
Header: Authorization: Bearer <token>
Body: {
  "name": "Member Name",
  "email": "member@example.com",
  "tier": "basic"
}
```

---

## 🚀 Next Steps

1. **Customize**: Edit colors in CSS files
2. **Add Features**: Extend backend with new endpoints
3. **Deploy**: Follow "Production Deployment" in README.md
4. **Integrate Payments**: Add real Stripe/Razorpay integration

---

## 📚 Learn More

- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **MongoDB**: https://docs.mongodb.com/

---

## ✅ You're All Set!

Your MemberHub application is now running locally!

Questions? Check the full README.md file.
