# Textchan Deployment Guide

Complete guide to deploying textchan with different hosting options.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Deployment Options](#deployment-options)
3. [Prerequisites](#prerequisites)
4. [Documentation Index](#documentation-index)

---

## Quick Start

**Recommended: Fly.io for always-on, high-performance hosting**

```bash
# 1. Install Fly CLI
brew install flyctl  # or download from fly.io/docs

# 2. Authenticate
flyctl auth login

# 3. Launch app
flyctl launch

# 4. Set Firebase secrets
flyctl secrets set FIREBASE_PROJECT_ID="your-project-id"
flyctl secrets set FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.firebaseio.com"
flyctl secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'

# 5. Deploy
flyctl deploy

# 6. Open app
flyctl open
```

✅ **Done!** Your app is now live at `https://<app-name>.fly.dev`

---

## Deployment Options

### 🥇 Fly.io (Recommended)

**Best for:** Production, viral traffic, always-on hosting

**Pros:**
- ✅ Always running (no spin-down)
- ✅ Instant response times (<2s)
- ✅ Free tier (3x 256MB VMs)
- ✅ Global distribution
- ✅ 160GB bandwidth/month

**Cons:**
- ❌ Requires Fly CLI
- ❌ Manual setup (not auto-deploy from Git)

**Setup time:** 10-15 minutes

📘 **Full guide:** [FLY_DEPLOYMENT.md](./FLY_DEPLOYMENT.md)  
📋 **Migration checklist:** [FLY_MIGRATION_CHECKLIST.md](./FLY_MIGRATION_CHECKLIST.md)

---

### 🥈 Render

**Best for:** Quick setup, Git-based auto-deploy

**Pros:**
- ✅ Auto-deploy from GitHub
- ✅ Easy setup (web UI)
- ✅ Free tier

**Cons:**
- ❌ Spin-down after 15 min (50+ second cold starts)
- ❌ Slower than Fly.io
- ❌ Poor for viral traffic

**Setup time:** 5-10 minutes

📘 **Guide:** See [README.md - Deployment - Option 2: Render](./README.md#option-2-render)

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

- **[FLY_DEPLOYMENT.md](./FLY_DEPLOYMENT.md)** - Complete Fly.io deployment guide
  - Installation
  - Configuration
  - Secrets management
  - Custom domain setup
  - Troubleshooting
  - Monitoring

- **[FLY_MIGRATION_CHECKLIST.md](./FLY_MIGRATION_CHECKLIST.md)** - Quick checklist for Fly.io
  - Pre-migration steps
  - Deployment commands
  - Testing checklist
  - Migration from Render
  - Post-migration monitoring

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

### Fly.io Deployment

- **`fly.toml`** - Fly.io configuration
  - App name and region
  - Port configuration (8080)
  - Health checks
  - Auto-scaling settings (disabled for always-on)
  - VM size (256MB free tier)

- **`Dockerfile`** - Docker container configuration
  - Node.js 18 Alpine base image
  - Production dependencies only
  - Health check command
  - Optimized for Fly.io

- **`.dockerignore`** - Docker build exclusions
  - node_modules (installed during build)
  - Documentation files
  - Environment files (use Fly secrets)
  - Git files
  - IDE configs

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

| Feature | Fly.io | Render | Railway |
|---------|--------|--------|---------|
| **Spin-down** | ❌ No | ✅ Yes (15 min) | ✅ Yes |
| **Cold start** | <2s | 50+ seconds | ~10 seconds |
| **Free tier** | 3x 256MB VMs | 1 service | 500 hrs/month |
| **Bandwidth** | 160GB/month | 100GB/month | 100GB/month |
| **Custom domain** | ✅ Free SSL | ✅ Free SSL | ✅ Free SSL |
| **Auto-deploy** | ❌ Manual | ✅ Git push | ✅ Git push |
| **CLI required** | ✅ Yes | ❌ No | ❌ No |
| **Setup complexity** | Medium | Easy | Easy |
| **Best for** | Production | Quick setup | Simple apps |

---

## Quick Reference Commands

### Fly.io

```bash
# Deploy
flyctl deploy

# View logs
flyctl logs

# Check status
flyctl status

# Open app
flyctl open

# Set secret
flyctl secrets set KEY=value

# SSH into VM
flyctl ssh console
```

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

**Issue:** App not starting on Fly.io
- **Check:** Logs with `flyctl logs`
- **Verify:** Secrets set with `flyctl secrets list`
- **Solution:** Ensure Firebase credentials are correct

**Issue:** Weekend posting not working
- **Check:** Current day and time (uses UTC)
- **Solution:** Set `ALLOW_WEEKDAY_POSTING=true` for testing
- **Verify:** `/api/status` endpoint returns correct `postingEnabled`

**Issue:** Firebase connection errors
- **Check:** Firebase Console - Database URL and security rules
- **Verify:** Service account JSON is valid
- **Solution:** Regenerate service account key

**Issue:** Slow response times
- **Check:** Fly.io `auto_stop_machines = false` in fly.toml
- **Verify:** `min_machines_running = 1`
- **Solution:** Redeploy with correct fly.toml settings

### Getting Help

- **Fly.io support:** https://community.fly.io
- **Firebase support:** https://firebase.google.com/support
- **Project issues:** Open an issue on GitHub

---

## Migration Paths

### From Render to Fly.io

1. ✅ Deploy to Fly.io (follow FLY_DEPLOYMENT.md)
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
