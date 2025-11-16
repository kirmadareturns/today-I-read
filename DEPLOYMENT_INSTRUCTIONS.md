# Deployment Instructions

## Quick Start Guide

This guide will help you deploy the Firebase-migrated textchan application.

## Prerequisites Checklist

Before deploying, ensure you have:

- [ ] Firebase project created (free tier)
- [ ] Firebase Realtime Database enabled
- [ ] Firebase credentials obtained
- [ ] Render account (or hosting provider)
- [ ] GitHub repository set up

## Step 1: Firebase Setup

### 1.1 Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Name: `textchan-prod` (or your choice)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 1.2 Enable Realtime Database

1. In Firebase Console → **Build** → **Realtime Database**
2. Click "Create Database"
3. Location: **United States (us-central1)**
4. Security rules: Start in **test mode**
5. Click "Enable"

### 1.3 Set Database Rules

In Realtime Database → **Rules** tab:

```json
{
  "rules": {
    ".read": true,
    ".write": false,
    "threads": {
      ".write": false
    }
  }
}
```

Click "Publish".

### 1.4 Get Credentials

#### For Local Development:

1. Go to **Project Settings** (gear icon)
2. Note your **Project ID**
3. Note your **Database URL** (from Realtime Database page)

#### For Production (Render):

1. Go to **Project Settings** → **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file
4. Copy the entire JSON content (you'll need it for Render)

## Step 2: Local Testing

### 2.1 Set Environment Variables

Create a `.env` file in project root:

```bash
FIREBASE_PROJECT_ID=your-project-id-here
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
ALLOW_WEEKDAY_POSTING=true
```

Replace with your actual Firebase credentials.

### 2.2 Install Dependencies

```bash
npm install
```

### 2.3 Start Server

```bash
npm start
```

You should see:
```
Firebase initialized successfully
Database URL: https://your-project-id-default-rtdb.firebaseio.com
Textchan server running on http://localhost:3000
Weekend posting: ENABLED
✓ Using Firebase Realtime Database for storage
⚠️  Weekday posting override is ACTIVE
```

### 2.4 Test the App

1. Open `http://localhost:3000`
2. Create a test thread
3. Add a reply
4. Stop server (Ctrl+C) and restart
5. Verify thread persists

If everything works, proceed to deployment.

## Step 3: Deploy to Render

### 3.1 Prepare Repository

1. Ensure all changes are committed:
```bash
git add .
git commit -m "Migrate to Firebase Realtime Database"
git push origin feat/migrate-textchan-firebase-free-tier-storage-limit
```

2. Merge to main branch (or your deployment branch):
```bash
git checkout main
git merge feat/migrate-textchan-firebase-free-tier-storage-limit
git push origin main
```

### 3.2 Configure Render

If you already have a Render web service:

1. Go to Render Dashboard → Your web service
2. Click **Environment** tab
3. Add these environment variables:

**Required:**
- Key: `FIREBASE_PROJECT_ID`
  Value: `your-project-id`

- Key: `FIREBASE_DATABASE_URL`
  Value: `https://your-project-id-default-rtdb.firebaseio.com`

- Key: `FIREBASE_SERVICE_ACCOUNT`
  Value: Paste entire JSON from service account key (single line)
  Example: `{"type":"service_account","project_id":"textchan-prod","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...","client_email":"firebase-adminsdk-...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}`

**Optional:**
- Key: `ALLOW_WEEKDAY_POSTING`
  Value: `false` (or omit - only set to `true` for testing)

4. Click "Save Changes"

### 3.3 Deploy

Option A: **Auto-deploy** (if enabled)
- Push to GitHub
- Render automatically deploys

Option B: **Manual deploy**
- Render Dashboard → Your service
- Click "Manual Deploy" → "Deploy latest commit"

### 3.4 Monitor Deployment

Watch the deployment logs:
- Should see "Firebase initialized successfully"
- Should see "Textchan server running..."
- Should see "✓ Using Firebase Realtime Database for storage"

If errors occur, check:
- Environment variables are set correctly
- Service account JSON is valid (no line breaks)
- Firebase project ID matches

## Step 4: Verify Production

### 4.1 Test Live Site

1. Visit your Render URL (e.g., `https://textchan.onrender.com`)
2. Wait until weekend (or set `ALLOW_WEEKDAY_POSTING=true` for testing)
3. Create a thread
4. Add a reply
5. Refresh page - data should persist

### 4.2 Check Firebase Console

1. Firebase Console → Realtime Database
2. You should see data structure:
   ```
   threads/
     └── {some-push-id}/
         ├── body: "..."
         ├── userId: "..."
         ├── createdAt: "..."
         └── replies/
   ```

### 4.3 Verify Storage Monitoring

Check Render logs for storage usage messages:
```
Storage usage: 0.12 MB (0.01%)
```

### 4.4 Test Weekend Gating

On a weekday (with `ALLOW_WEEKDAY_POSTING=false`):
- Posting should be disabled
- Status should show "Posting is only allowed on weekends"
- Countdown timer should show time until weekend

On a weekend:
- Posting should be enabled
- Status should show "Posting is currently enabled"

## Step 5: Security Verification

### 5.1 Disable Billing (CRITICAL)

1. Firebase Console → **⚙️ Settings** → **Usage and billing**
2. Verify plan is **Spark (Free)**
3. Ensure NO payment method is attached
4. This prevents any charges

### 5.2 Verify Database Rules

Firebase Console → Realtime Database → Rules:
- Read should be `true`
- Write should be `false`
- This prevents direct client writes

### 5.3 Check Git Ignored Files

Ensure these are NOT in git:
- `.env`
- `firebase-service-account.json`
- Any credentials

```bash
git status
# Should not show .env or service account files
```

## Step 6: Monitor and Maintain

### Monitor Storage Usage

Check Render logs regularly:
- Look for "Storage usage:" messages
- Watch for approaching 90% threshold

### Set Up Alerts (Optional)

Firebase Console → **⚙️ Settings** → **Integrations**:
- Set up email alerts for high usage
- Get notified at 80% storage

### What Happens at Storage Limit?

When 90% (900MB) is reached:
1. New posts return HTTP 507
2. Users see: "The site is at capacity. Check back later!"
3. Existing data remains readable
4. No charges incurred

### Cleanup Strategy (Future)

If you reach storage limit, options:
1. Upgrade to Blaze plan (paid) - adds billing
2. Archive/delete old threads manually
3. Implement automatic archival (requires code changes)

## Troubleshooting

### "Firebase environment variables are not set"

**Solution:**
- Check Render environment variables tab
- Verify `FIREBASE_PROJECT_ID` and `FIREBASE_DATABASE_URL` are set
- Check for typos

### "Permission denied" errors

**Solution:**
- Check database rules allow public read
- Verify service account JSON is complete
- Ensure no line breaks in `FIREBASE_SERVICE_ACCOUNT` env var

### Site loads but no data persists

**Solution:**
- Check Firebase Console for data
- Verify service account has write permissions
- Check Render logs for Firebase errors

### Storage usage shows 0% even with data

**Solution:**
- This is normal for small amounts of data
- Wait for more posts
- Check Firebase Console for actual data

## Rollback Plan

If critical issues occur:

1. **Immediate rollback:**
   ```bash
   git revert HEAD
   git push origin main
   ```
   Render will auto-deploy previous version

2. **Full rollback to SQLite:**
   - Checkout commit before migration
   - Redeploy to Render
   - Note: Firebase data will be preserved but inaccessible

## Success Checklist

Deployment is successful when:

- [ ] Render deployment succeeds without errors
- [ ] Live site loads correctly
- [ ] Can create threads (on weekend or with override)
- [ ] Can create replies
- [ ] Data persists across page refreshes
- [ ] Weekend gating works correctly
- [ ] Storage usage appears in logs
- [ ] Firebase Console shows data
- [ ] No SQLite files created
- [ ] Billing is disabled in Firebase
- [ ] All tests from TEST_CHECKLIST.md pass

## Next Steps

After successful deployment:

1. **Remove testing override:**
   - Remove `ALLOW_WEEKDAY_POSTING` from Render env vars
   - Or set it to `false`

2. **Test on actual weekend:**
   - Wait until Saturday/Sunday (UTC)
   - Verify posting works
   - Verify countdown timer is accurate

3. **Monitor performance:**
   - Watch Render logs
   - Check Firebase Console usage
   - Verify no errors

4. **Document your setup:**
   - Save Firebase project details
   - Note environment variable values
   - Keep service account key secure

## Support

For help:
- **Firebase Setup**: See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Testing**: See [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)
- **Migration Details**: See [MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)
- **Firebase Docs**: https://firebase.google.com/docs
- **Render Docs**: https://render.com/docs

## Conclusion

You've successfully migrated textchan to Firebase! 🎉

Key benefits:
- ✅ Permanent storage (no more ephemeral file systems)
- ✅ Free forever (with 1GB limit)
- ✅ No surprise charges
- ✅ Automatic backups by Firebase
- ✅ Scales to 1GB of data

Enjoy your weekend-only textboard!
