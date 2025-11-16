# Textchan Deployment Guide

Complete guide to deploying textchan with different hosting options.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Deployment Options](#deployment-options)
3. [Prerequisites](#prerequisites)
4. [Documentation Index](#documentation-index)

---

## Quick Start

**Recommended: Render for free hosting (no credit card required)**

1. Go to [render.com](https://render.com) and create a free account
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Set environment variables:
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_DATABASE_URL`: Your Firebase database URL
   - `FIREBASE_SERVICE_ACCOUNT`: Service account JSON (single-line string)
6. Click **Create Web Service**

✅ **Done!** Your app is now live at `https://<app-name>.onrender.com`

**Note:** First request may take 10-30 seconds (cold start), then it's fast.

---

## Deployment Options

### 🥇 Render (Recommended)

**Best for:** Free hosting without credit card, easy setup

**Pros:**
- ✅ **No credit card required** - Truly free tier
- ✅ Auto-deploy from GitHub
- ✅ Easy setup (web UI)
- ✅ Free SSL certificates
- ✅ Custom domain support

**Cons:**
- ⚠️ Spin-down after 15 min (10-30 second cold starts)
- ⚠️ Slower first request after inactivity

**Setup time:** 5-10 minutes

📘 **Full guide:** [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

---

### 🥈 Fly.io

**Best for:** Always-on hosting, better performance (requires credit card)

**Pros:**
- ✅ Always running (no spin-down)
- ✅ Instant response times (<2s)
- ✅ Free tier (3x 256MB VMs)
- ✅ Global distribution

**Cons:**
- ❌ **Requires credit card** (even for free tier)
- ❌ Requires Fly CLI
- ❌ Manual setup (not auto-deploy from Git)

**Setup time:** 10-15 minutes

📘 **Full guide:** [FLY_DEPLOYMENT.md](./FLY_DEPLOYMENT.md) *(if available)*  
📋 **Migration checklist:** [FLY_MIGRATION_CHECKLIST.md](./FLY_MIGRATION_CHECKLIST.md) *(if available)*

---

### 🥉 Railway

**Best for:** Simple deployment, automatic detection

**Pros:**
- ✅ Auto-detects Node.js
- ✅ Free tier (limited)
- ✅ Simple setup

**Cons:**
- ❌ Limited free tier (500 hours/month)
- ❌ May spin down

**Setup time:** 5-10 minutes

📘 **Guide:** See [README.md - Deployment - Option 3: Railway](./README.md#option-3-railway)

---

## Prerequisites

Before deploying textchan to any platform, ensure you have:

### 1. Firebase Project Set Up

- [x] Firebase project created
- [x] Realtime Database enabled
- [x] Service account key generated
- [x] Database URL obtained
- [x] Security rules configured

📘 **Firebase setup guide:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### 2. Environment Variables Ready

You'll need these for deployment:

```bash
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}  # JSON service account
```

Optional:
```bash
ALLOW_WEEKDAY_POSTING=true  # For testing outside weekends
NODE_ENV=production          # Usually set automatically
PORT=8080                    # Usually set automatically
```

### 3. Code Repository

- [x] Code cloned/downloaded locally
- [x] Dependencies installed: `npm install`
- [x] Tested locally: `npm start`

---

## Documentation Index

### 🚀 Deployment Guides

- **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** - Complete Render deployment guide
  - Prerequisites and Firebase setup
  - Step-by-step deployment
  - Environment variables configuration
  - Custom domain setup
  - Troubleshooting
  - Monitoring and maintenance

- **[FLY_DEPLOYMENT.md](./FLY_DEPLOYMENT.md)** - Fly.io deployment guide *(if available)*
  - Installation
  - Configuration
  - Secrets management
  - Custom domain setup
  - Troubleshooting
  - Monitoring

### 🔥 Firebase Setup

- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** - Firebase configuration
  - Create Firebase project
  - Enable Realtime Database
  - Generate service account
  - Security rules
  - Environment variables

### 📖 General Documentation

- **[README.md](./README.md)** - Complete project documentation
  - Overview and features
  - Tech stack
  - API reference
  - Weekend logic
  - Deployment options (all platforms)
  - Data persistence
  - Production hardening

### ✅ Testing

- **[TEST_CHECKLIST.md](./TEST_CHECKLIST.md)** - Testing guide
  - Functionality tests
  - Weekend gating tests
  - Firebase integration tests
  - Performance tests

---

## Configuration Files

### Render Deployment

Render deployment requires no special configuration files - it works directly with standard Node.js projects:

- **`package.json`** - Render auto-detects Node.js from this file
- **`.env.example`** - Template for environment variables (set in Render dashboard)
- **`.gitignore`** - Git exclusions (keep environment variables secure)

### General Configuration

- **`package.json`** - Node.js project metadata
  - Dependencies: express, firebase-admin, cors
  - Scripts: start, dev, test
  - Node version: >=18.0.0

- **`.env.example`** - Environment variable template
  - Firebase configuration variables
  - Server configuration
  - Testing overrides

- **`.gitignore`** - Git exclusions
  - node_modules
  - .env files
  - Database files
  - Service account keys

---

## Deployment Comparison

| Feature | Render | Fly.io | Railway |
|---------|--------|--------|---------|
| **Credit card** | ❌ Not required | ⚠️ Required | ⚠️ Required |
| **Spin-down** | ⚠️ Yes (15 min) | ❌ No | ⚠️ Yes |
| **Cold start** | 10-30 seconds | <2s | ~10 seconds |
| **Free tier** | 750 hrs/month | 3x 256MB VMs | 500 hrs/month |
| **Bandwidth** | 100GB/month | 160GB/month | 100GB/month |
| **Custom domain** | ✅ Free SSL | ✅ Free SSL | ✅ Free SSL |
| **Auto-deploy** | ✅ Git push | ❌ Manual | ✅ Git push |
| **CLI required** | ❌ No | ✅ Yes | ❌ No |
| **Setup complexity** | Easy | Medium | Easy |
| **Best for** | Free hosting | Always-on | Simple apps |

---

## Quick Reference Commands

### Render

**Deployment:**
- Auto-deploys on Git push to connected branch
- Manual deploy: Render Dashboard → Manual Deploy → Deploy latest commit

**Monitoring:**
- View logs: Render Dashboard → Logs tab
- Check status: Render Dashboard → Events tab
- View environment variables: Settings → Environment

**URL:**
- Access app: `https://<service-name>.onrender.com`

### Local Development

```bash
# Install dependencies
npm install

# Start server (production)
npm start

# Start server (development with watch mode)
npm run dev

# Test with weekday posting enabled
ALLOW_WEEKDAY_POSTING=true npm start

# View app
open http://localhost:3000
```

### Firebase

```bash
# Install Firebase CLI (for management)
npm install -g firebase-tools

# Login to Firebase
firebase login

# View Firebase projects
firebase projects:list

# Open Firebase Console
open https://console.firebase.google.com
```

---

## Support & Troubleshooting

### Common Issues

**Issue:** App not starting on Render
- **Check:** Render Dashboard → Logs for error messages
- **Verify:** Environment variables are set correctly
- **Solution:** Ensure Firebase credentials are correct and valid JSON

**Issue:** Weekend posting not working
- **Check:** Current day and time (uses UTC)
- **Solution:** Set `ALLOW_WEEKDAY_POSTING=true` for testing
- **Verify:** `/api/status` endpoint returns correct `postingEnabled`

**Issue:** Firebase connection errors
- **Check:** Firebase Console - Database URL and security rules
- **Verify:** Service account JSON is valid single-line string
- **Solution:** Regenerate service account key and update environment variable

**Issue:** Slow first load (cold start)
- **Expected:** Free tier spins down after 15 minutes
- **Impact:** First request takes 10-30 seconds, then fast
- **Solution:** Upgrade to Starter plan ($7/month) for no spin-down, or accept delay

### Getting Help

- **Render support:** https://community.render.com
- **Firebase support:** https://firebase.google.com/support
- **Project issues:** Open an issue on GitHub

---

## Migration Paths

### From Fly.io to Render (No Credit Card Required)

1. ✅ Deploy to Render (follow RENDER_DEPLOYMENT.md)
2. ✅ Test thoroughly on Render URL
3. ✅ Update DNS to point to Render (if using custom domain)
4. ✅ Monitor for 24-48 hours
5. ✅ Delete Fly.io app (optional, to avoid confusion)

**No data migration needed** - Firebase is cloud-hosted

### From Render to Fly.io (Better Performance, Requires CC)

1. ✅ Deploy to Fly.io (follow FLY_DEPLOYMENT.md if available)
2. ✅ Test thoroughly on Fly.io URL
3. ✅ Update DNS to point to Fly.io
4. ✅ Monitor for 24-48 hours
5. ✅ Delete Render service

**No data migration needed** - Firebase is cloud-hosted

### From Local to Production

1. ✅ Set up Firebase project (FIREBASE_SETUP.md)
2. ✅ Choose hosting platform (Fly.io recommended)
3. ✅ Deploy using platform guide
4. ✅ Configure custom domain (optional)
5. ✅ Test all functionality (TEST_CHECKLIST.md)

---

## Next Steps

After deployment:

1. **Monitor logs** - Check for errors daily (first week)
2. **Test functionality** - Use TEST_CHECKLIST.md
3. **Set up alerts** - Firebase storage/bandwidth limits
4. **Configure custom domain** - If desired
5. **Share with users** - Post weekend only!

---

## License

MIT License - See LICENSE file for details

---

**Need help?** Check the documentation files or open an issue!
