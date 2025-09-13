# Weather AGI DOC - Railway Deployment Guide

## 🚄 **Railway Full Stack Deployment**

### Prerequisites
1. [Railway Account](https://railway.app) - Sign up for free
2. Railway CLI installed: `npm install -g @railway/cli`
3. Git repository with your Weather AGI code

### Backend Deployment

1. **Create Railway Project**
   ```bash
   railway login
   railway new weather-agi-backend
   cd backend
   railway link
   ```

2. **Set Environment Variables**
   ```bash
   railway variables set OPENAI_API_KEY=your_openai_key
   railway variables set NASA_API_KEY=your_nasa_key
   railway variables set PYTHON_VERSION=3.11.0
   ```

3. **Deploy Backend**
   ```bash
   git add .
   git commit -m "Initial backend deployment"
   railway up
   ```

### Frontend Deployment

1. **Create Frontend Service**
   ```bash
   railway new weather-agi-frontend
   cd ../frontend
   railway link
   ```

2. **Update Environment Variables**
   ```bash
   # Update .env to point to Railway backend URL
   railway variables set VITE_API_URL=https://your-backend-url.railway.app/api
   railway variables set VITE_NASA_API_KEY=your_nasa_key
   railway variables set VITE_OPENAI_API_KEY=your_openai_key
   railway variables set VITE_AI_FEATURES_ENABLED=true
   ```

3. **Deploy Frontend**
   ```bash
   git add .
   git commit -m "Initial frontend deployment"
   railway up
   ```

## 📋 **Deployment Configuration**

### Backend Files Created:
- ✅ `railway.json` - Railway service configuration
- ✅ `Procfile` - Process definition
- ✅ `runtime.txt` - Python version specification
- ✅ `requirements.txt` - Python dependencies

### Frontend Files Created:
- ✅ `railway.json` - Railway service configuration  
- ✅ `package.json` - Node.js dependencies

## 🎤 **Voice Features Included:**
- ✅ Speech Recognition API integration
- ✅ Speech Synthesis for DOC responses
- ✅ "What's up Doc" activation phrase
- ✅ Microphone permissions handling
- ✅ Real-time voice chat interface

## 🌟 **Features Ready for Production:**
- ✅ Professional weather analysis
- ✅ DOC AI chat with voice support
- ✅ NWS/NASA/NOAA integration
- ✅ Real-time weather monitoring
- ✅ Modern React dashboard
- ✅ FastAPI backend with full documentation

## 🔧 **Post-Deployment Setup:**

1. **Test the APIs:**
   ```bash
   curl https://your-backend-url.railway.app/api/health
   ```

2. **Initialize the system:**
   ```bash
   curl -X POST https://your-backend-url.railway.app/api/initialize \
     -H "Content-Type: application/json" \
     -d '{"api_keys": {"openai": "your_key", "nasa": "your_key"}}'
   ```

3. **Test DOC chat:**
   ```bash
   curl -X POST https://your-backend-url.railway.app/api/doc/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "What'\''s up Doc, what'\''s the weather?", "location": [40.0, -95.0]}'
   ```

## 🚀 **Your URLs:**
- **Backend API**: `https://your-backend-project.railway.app`
- **Frontend App**: `https://your-frontend-project.railway.app`

Both services will auto-deploy on git push and include:
- Automatic HTTPS
- Custom domains available
- Environment variable management
- Build logs and monitoring
- Automatic scaling

Your Weather AGI DOC system is ready for production! 🌟