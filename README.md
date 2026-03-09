# MemberHub - Membership Management & Certificate Generation

A full-stack web application for managing memberships, processing payments, generating certificates, and providing analytics dashboards.

## 📋 Project Overview

MemberHub is a complete solution for organizations to:
- ✅ Manage members efficiently
- ✅ Generate professional PDF certificates automatically
- ✅ Process online payments with multiple payment gateways
- ✅ Send automated email notifications
- ✅ Track analytics and member statistics
- ✅ Support multi-tier membership system

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - NoSQL database
- **Motor** - Async MongoDB driver
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Bcrypt** - Password hashing

## 📦 Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- MongoDB 4.4+

## 🚀 Setup Instructions

### 1. Database Setup (MongoDB)

#### Option A: Local MongoDB
```bash
# Install MongoDB (Windows)
# Download from: https://www.mongodb.com/try/download/community

# Install MongoDB (macOS with Homebrew)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a new cluster
4. Get connection string
5. Use connection string in backend `.env` file

### 2. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env

# Edit .env and set MongoDB URL
# MONGO_URL=mongodb://localhost:27017
# or for MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/memberhub

# Run backend server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs** (Swagger UI)

### 3. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Create .env.local file (optional)
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local

# Start development server
npm run dev
```

Frontend will be available at: **http://localhost:5173**

## 📝 Environment Variables

### Backend (.env)
```
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=memberhub
JWT_SECRET=your-secret-key-change-this-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Frontend (.env.local)
```
REACT_APP_API_URL=http://localhost:8000
```

## 🔑 Default Test Credentials

After setup, register a new account or use these for testing:
```
Email: test@example.com
Password: Test@12345
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Members
- `POST /api/members/create` - Create new member
- `GET /api/members` - List all members
- `GET /api/members/{id}` - Get member details
- `POST /api/members/{id}/upgrade-tier` - Upgrade membership tier

### Payments
- `POST /api/payments/create` - Create payment record
- `GET /api/payments/{member_id}` - Get payment history

### Certificates
- `POST /api/certificates/generate` - Generate certificate
- `GET /api/certificates/{member_id}` - Get certificate

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics

### Health
- `GET /api/health` - Health check

## 🎯 Features

### User Management
- User registration and authentication
- Secure JWT token-based authentication
- Password hashing with bcrypt
- Token refresh mechanism

### Member Management
- Add/edit/delete members
- Search and filter members
- Member status tracking (active, inactive, suspended)
- View member details and history

### Multi-Tier Membership
- **Basic**: $99.99/month
- **Premium**: $199.99/month
- **Gold**: $299.99/month
- Automatic tier upgrades/downgrades
- Tier-based feature access

### Payments
- Payment processing integration
- Support for Stripe, Razorpay, Bank Transfer
- Payment history tracking
- Invoice generation

### Certificates
- Automatic PDF certificate generation
- Professional certificate templates
- Download and print functionality
- Certificate issuance tracking

### Email Notifications
- Registration confirmation
- Tier upgrade notifications
- Certificate delivery
- Payment reminders

### Analytics Dashboard
- Total member statistics
- Active member count
- Revenue analytics
- Tier distribution charts
- Certificate issuance tracking

## 🧪 Testing

### Test Registration
1. Open http://localhost:5173
2. Click "Register"
3. Fill in details:
   - Name: Test User
   - Email: test@example.com
   - Password: Test@12345

### Test Member Creation
1. Login to dashboard
2. Go to Members page
3. Click "Add Member"
4. Fill in member details
5. Select membership tier

### Test Payment
1. Click on a member
2. Click "Make Payment"
3. Select tier and complete payment

### Test Certificate
1. Click on a member
2. Click "Generate Certificate"
3. View/Download generated certificate

## 📱 Project Structure

```
MemberHub/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── requirements.txt         # Python dependencies
│   └── .env.example             # Environment variables template
│
└── frontend/
    ├── src/
    │   ├── pages/              # Page components
    │   │   ├── LoginPage.jsx
    │   │   ├── RegisterPage.jsx
    │   │   ├── DashboardPage.jsx
    │   │   ├── MembersPage.jsx
    │   │   ├── MemberDetailPage.jsx
    │   │   ├── AnalyticsPage.jsx
    │   │   ├── PaymentPage.jsx
    │   │   └── CertificatePage.jsx
    │   │
    │   ├── components/          # Reusable components
    │   │   ├── Navbar.jsx
    │   │   └── PrivateRoute.jsx
    │   │
    │   ├── styles/              # CSS files
    │   │   ├── index.css
    │   │   ├── Auth.css
    │   │   ├── Navbar.css
    │   │   ├── Dashboard.css
    │   │   ├── Members.css
    │   │   ├── MemberDetail.css
    │   │   ├── Analytics.css
    │   │   ├── Payment.css
    │   │   └── Certificate.css
    │   │
    │   ├── App.jsx             # Main app component
    │   └── main.jsx            # Entry point
    │
    ├── package.json
    └── vite.config.js
```

## 🐛 Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:**
- Make sure MongoDB is running
- Check `MONGO_URL` in `.env` file
- Verify MongoDB port is 27017

### Port Already in Use
```
Error: Address already in use :::8000
```
**Solution:**
```bash
# Change port in backend
python -m uvicorn main:app --port 8001
```

### CORS Error
```
Error: Access to XMLHttpRequest blocked by CORS policy
```
**Solution:**
- Make sure backend CORS is configured
- Check `REACT_APP_API_URL` points to correct backend URL
- Restart both servers

### Module Not Found
```
Error: No module named 'fastapi'
```
**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt
```

## 🚢 Production Deployment

### Backend (Deploy to Heroku/Railway)
```bash
# Create Procfile
echo "web: uvicorn main:app --host 0.0.0.0 --port $PORT" > Procfile

# Push to hosting platform
git push heroku main
```

### Frontend (Deploy to Vercel/Netlify)
```bash
# Build production version
npm run build

# Deploy to Vercel
vercel --prod

# or to Netlify
npm run build
# Drag and drop 'dist' folder to Netlify
```

## 📚 API Documentation

After running backend, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Authentication](https://jwt.io/)

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💼 Author

**Amarjeet Kumar**
- Gaya College of Engineering
- Department of Computer Science and Engineering
- Registration No: 23105110905
- AICTE ID: STU6801382dabeae1744910381

## 📞 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review API documentation at `/docs`
3. Check MongoDB connection settings
4. Verify all dependencies are installed

---

**Happy Coding! 🚀**
