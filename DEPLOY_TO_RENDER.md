# 🚀 Deploy Textchan to Render - Free Hosting (No Credit Card!)

## Quick Deploy Guide

### Step 1: Create Render Account
👉 Go to [render.com](https://render.com) and sign up (FREE - no credit card required!)

### Step 2: Deploy
1. Click **New +** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

### Step 3: Set Environment Variables
Add these three environment variables in Render dashboard:

```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
```

### Step 4: Deploy!
Click **Create Web Service** and wait 2-5 minutes.

Your app will be live at: `https://textchan-xxxxx.onrender.com`

---

## ✅ What You Get

- ✅ **Free hosting** - No credit card required
- ✅ **Auto-deploy** - Push to GitHub = automatic deployment
- ✅ **Custom domains** - Free SSL certificates
- ✅ **Easy setup** - No CLI tools needed

## ⚠️ Free Tier Note

First request after 15 minutes of inactivity takes 10-30 seconds (cold start).  
Subsequent requests are fast (<2 seconds).

Want always-on? Upgrade to Starter plan ($7/month).

---

## 📚 Need More Details?

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for:
- Complete step-by-step instructions
- Firebase setup guide
- Custom domain configuration
- Troubleshooting tips
- Testing checklist

## 🔥 Firebase Setup

Don't have Firebase set up yet? See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

---

**That's it! Free hosting with no credit card required.** 🎉
