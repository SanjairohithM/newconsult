# 🚀 Deployment Guide

## 📍 **Current Setup:**
- **Frontend**: React app (deployed on Netlify)
- **Backend**: Node.js/Express app (needs separate hosting)

## 🌐 **Frontend Deployment (Netlify):**
✅ **Already configured and working!**
- **URL**: Your Netlify domain
- **Port**: 80/443 (handled by Netlify)
- **Build**: Automatically builds from `frontend/` directory

## 🔧 **Backend Deployment Options:**

### **Option 1: Railway (Recommended)**
```bash
# 1. Go to railway.app
# 2. Connect your GitHub repo
# 3. Deploy from backend/ directory
# 4. Set environment variables
```

**Environment Variables to set in Railway:**
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=5000
```

### **Option 2: Render**
```bash
# 1. Go to render.com
# 2. Create new Web Service
# 3. Point to backend/ directory
# 4. Set build command: npm install
# 5. Set start command: npm start
```

### **Option 3: Heroku**
```bash
# 1. Install Heroku CLI
# 2. heroku create your-app-name
# 3. git subtree push --prefix=backend heroku main
```

## 🔗 **Connect Frontend to Backend:**

### **Step 1: Get Backend URL**
After deploying backend, you'll get a URL like:
- Railway: `https://your-app.railway.app`
- Render: `https://your-app.onrender.com`
- Heroku: `https://your-app.herokuapp.com`

### **Step 2: Update Frontend Environment**
In Netlify, go to **Site settings > Environment variables** and add:
```env
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

### **Step 3: Update Backend CORS**
In your `backend/server.js`, update CORS to allow your Netlify domain:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-app.netlify.app', // Your Netlify domain
    'https://your-backend-domain.com' // Your backend domain
  ],
  credentials: true
}));
```

## 📱 **Port Configuration:**

### **Development:**
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:5000`

### **Production:**
- **Frontend**: `https://your-app.netlify.app` (port 80/443)
- **Backend**: `https://your-backend-domain.com` (port 80/443)

## 🚨 **Important Notes:**
1. **Never hardcode URLs** - always use environment variables
2. **Update CORS** in backend to allow your frontend domain
3. **Set all environment variables** in both frontend and backend
4. **Test locally first** before deploying

## 🔍 **Testing:**
1. Deploy backend first
2. Test backend endpoints
3. Update frontend environment variables
4. Deploy frontend
5. Test full application
