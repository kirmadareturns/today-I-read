# Migration from Fly.io to Render - Notes

## Migration Date
November 2024

## Reason for Reversion

Fly.io requires a credit card even for the free tier, which is not accessible to all users. Render provides a truly free tier without any credit card requirement, making it a better option for users who want free hosting.

## Changes Made

### Files Removed (Fly.io-specific)
- `fly.toml` - Fly.io configuration
- `Dockerfile` - Docker container for Fly.io
- `.dockerignore` - Docker exclusions
- `FLY_DEPLOYMENT.md` - Fly.io deployment guide
- `FLY_MIGRATION_CHECKLIST.md` - Fly.io migration checklist
- `FLYIO_MIGRATION_SUMMARY.md` - Fly.io migration summary
- `MIGRATION_SUMMARY.md` - Previous migration notes
- `DEPLOYMENT_INSTRUCTIONS.md` - Outdated deployment instructions

### Files Added
- `RENDER_DEPLOYMENT.md` - Complete Render deployment guide with step-by-step instructions

### Files Updated
- `README.md` - Changed deployment section to prioritize Render over Fly.io
- `DEPLOYMENT_GUIDE.md` - Updated to show Render as recommended option
- `QUICK_START.md` - Replaced Fly.io quick start with Render quick start

## Key Benefits of Render

✅ **No credit card required** - Truly free tier  
✅ **Auto-deploy from Git** - Automatic deployments on push  
✅ **Easy setup** - Web-based UI, no CLI needed  
✅ **Free SSL** - Automatic HTTPS certificates  
✅ **Custom domains** - Free custom domain support  

⚠️ **Trade-off:** Free tier has spin-down after 15 minutes of inactivity, resulting in 10-30 second cold starts on first request. Subsequent requests are fast.

## Deployment Instructions

See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) for complete deployment guide.

Quick version:
1. Go to [render.com](https://render.com) and create free account
2. Create new Web Service from GitHub repository
3. Set environment variables: `FIREBASE_PROJECT_ID`, `FIREBASE_DATABASE_URL`, `FIREBASE_SERVICE_ACCOUNT`
4. Deploy!

## Firebase Database

**Important:** Firebase Realtime Database is cloud-hosted, so no data migration is needed. All posts from the Fly.io deployment will be accessible from Render deployment using the same Firebase project.

## Environment Variables Required

For Render deployment, set these in the Render dashboard:

1. **FIREBASE_PROJECT_ID** - Your Firebase project ID
2. **FIREBASE_DATABASE_URL** - Your Firebase Realtime Database URL
3. **FIREBASE_SERVICE_ACCOUNT** - Service account JSON as single-line string

Optional:
- **ALLOW_WEEKDAY_POSTING** - Set to `true` for testing (should be `false` in production)

## Testing

After deploying to Render:
1. Visit your Render URL (e.g., `https://textchan-xxxxx.onrender.com`)
2. Verify homepage loads (first request may take 10-30 seconds)
3. Test `/api/status` endpoint
4. Create test thread on weekend (or with `ALLOW_WEEKDAY_POSTING=true`)
5. Verify posts save to Firebase

## Optional: Delete Fly.io App

If you previously deployed to Fly.io:
1. Go to Fly.io dashboard
2. Find your textchan app
3. Delete the app to free up resources
4. This is optional but keeps things tidy

## Custom Domain Setup

If you have a custom domain:
1. In Render Dashboard → Settings → Custom Domain
2. Add your domain name
3. Update DNS records at your domain registrar with the records provided by Render
4. Wait for DNS propagation (5-30 minutes)
5. SSL certificate will auto-provision

## Upgrade Path

If you need always-on hosting without spin-down delays:
- **Render Starter Plan:** $7/month (no spin-down, 1GB RAM)
- Upgrade in Render Dashboard → Settings → Instance Type

## Support

- **Render Documentation:** https://render.com/docs
- **Render Community:** https://community.render.com
- **Firebase Support:** https://firebase.google.com/support

---

**Result:** Textchan now deployable to Render for free without credit card! 🎉
