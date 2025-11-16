# Firebase Setup Guide for Textchan

This guide will help you migrate Textchan from SQLite to Firebase Realtime Database (free tier only).

## Overview

Textchan now uses Firebase Realtime Database for permanent, cloud-based storage. The implementation includes:

- ✅ Free tier only (NO auto-scaling, NO surprise charges)
- ✅ 1GB storage limit with 90% threshold enforcement
- ✅ Graceful degradation when storage limit is reached
- ✅ All existing functionality preserved (weekend gating, anonymous IDs, replies)
- ✅ Data persists permanently across deployments

## Firebase Free Tier Limits

- **Storage**: 1GB
- **Bandwidth**: 10GB/month download
- **Concurrent connections**: 100
- **No credit card required**

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name (e.g., `textchan-prod`)
4. Disable Google Analytics (optional)
5. Click "Create project"

### 2. Enable Realtime Database

1. In Firebase Console, go to **Build** > **Realtime Database**
2. Click "Create Database"
3. Choose location: **United States (us-central1)** (recommended for free tier)
4. Start in **test mode** (we'll set proper rules next)
5. Click "Enable"

### 3. Configure Database Rules

In the Realtime Database console:

1. Click on the **Rules** tab
2. Replace with these rules:

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

**Important**: Write access is controlled server-side through Firebase Admin SDK. Never allow public write access.

3. Click "Publish"

### 4. Get Firebase Credentials

#### Option A: Service Account (Production - Recommended for Render)

1. Go to **Project Settings** (gear icon) > **Service accounts**
2. Click "Generate new private key"
3. Save the JSON file securely
4. **For Render deployment**: Copy the entire JSON content and set it as an environment variable

#### Option B: Application Default Credentials (Local Development)

1. Install [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
2. Run: `gcloud auth application-default login`
3. This works for local development without needing to copy credentials

### 5. Set Environment Variables

Create a `.env` file in the project root:

```bash
# Required
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com

# For production (Render)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"..."}

# Optional
PORT=3000
ALLOW_WEEKDAY_POSTING=false
```

**Get your values:**
- `FIREBASE_PROJECT_ID`: From Firebase Console > Project Settings > General
- `FIREBASE_DATABASE_URL`: From Realtime Database page (top of screen)

### 6. Install Dependencies

```bash
npm install
```

This will install `firebase-admin` and other dependencies.

### 7. Test Locally

```bash
# Allow posting on weekdays for testing
ALLOW_WEEKDAY_POSTING=true npm start
```

Visit `http://localhost:3000` and verify:
- ✅ Page loads
- ✅ Status shows posting enabled
- ✅ Can create threads
- ✅ Can reply to threads
- ✅ Data persists after restart

### 8. Deploy to Render

1. Push your code to GitHub
2. In Render dashboard, go to your web service
3. Go to **Environment** tab
4. Add environment variables:
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_DATABASE_URL`: Your Firebase database URL
   - `FIREBASE_SERVICE_ACCOUNT`: Paste the entire JSON service account key (as one line)
5. Click "Manual Deploy" or wait for auto-deploy

### 9. Verify Production Deployment

1. Visit your Render URL
2. Test on a weekend (or with `ALLOW_WEEKDAY_POSTING=true`)
3. Create a thread
4. Restart the service (Render dashboard > Manual Deploy > Clear build cache & deploy)
5. Verify the thread persists

### 10. Disable Billing (CRITICAL)

To ensure you never get charged:

1. In Firebase Console, go to **⚙️ Settings** > **Usage and billing**
2. Verify plan is **Spark (Free)**
3. Do NOT add a payment method
4. Do NOT upgrade to Blaze plan

**Without a payment method, Firebase will automatically stop serving requests if you exceed free tier limits.**

## Storage Limit Enforcement

Textchan checks storage usage before accepting new posts:

- **90% threshold**: When database size reaches 900MB, new posts are rejected
- **HTTP 507**: Server returns "Insufficient Storage" status code
- **User message**: "The site is at capacity. Check back later!"
- **Status banner**: Shows "⚠ Storage limit reached"

### Monitoring Storage Usage

Storage usage is logged on every POST request:

```
Storage usage: 45.23 MB (4.42%)
```

Watch your server logs (Render dashboard > Logs) to monitor usage.

### What Happens at 100% Storage?

If you reach 1GB before the 90% check triggers:

1. Firebase will return errors on write operations
2. Read operations continue to work
3. Users see error messages
4. No charges incurred (because no billing enabled)

## Data Structure

Firebase Realtime Database structure:

```
/
└── threads/
    ├── {threadId}/
    │   ├── body: "Thread content"
    │   ├── userId: "ABC12345"
    │   ├── createdAt: "2024-01-20T12:00:00.000Z"
    │   └── replies/
    │       ├── {replyId}/
    │       │   ├── body: "Reply content"
    │       │   ├── userId: "XYZ67890"
    │       │   └── createdAt: "2024-01-20T13:00:00.000Z"
    │       └── {replyId}/
    │           └── ...
    └── {threadId}/
        └── ...
```

## Security Best Practices

1. ✅ **Never commit credentials**: `.env` and `firebase-service-account.json` are in `.gitignore`
2. ✅ **Server-side only writes**: Database rules prevent direct client writes
3. ✅ **No billing**: Never add a payment method to stay on free tier
4. ✅ **Rate limiting**: Consider adding rate limiting in production
5. ✅ **CORS**: Already configured for cross-origin requests

## Troubleshooting

### "Firebase environment variables are not set"

- Check `.env` file exists and has correct values
- Verify `FIREBASE_PROJECT_ID` and `FIREBASE_DATABASE_URL` are set
- For Render: Check environment variables in dashboard

### "Permission denied" errors

- Check database rules allow public read
- Verify service account has proper permissions
- Confirm Firebase Admin SDK is initialized correctly

### "Failed to initialize Firebase"

- Verify `FIREBASE_DATABASE_URL` format: `https://PROJECT-ID-default-rtdb.firebaseio.com`
- Check service account JSON is valid
- Try using application default credentials locally

### Storage usage shows 0%

- This is normal for new/empty databases
- Usage is calculated from JSON-serialized data size
- Start posting to see usage increase

## Migration from SQLite

If you have existing SQLite data:

1. Export existing threads and replies to JSON
2. Use Firebase Admin SDK to import:

```javascript
const admin = require('firebase-admin');
const db = admin.database();

async function importData(threads) {
  for (const thread of threads) {
    const threadRef = db.ref('threads').push();
    await threadRef.set({
      body: thread.body,
      userId: thread.userId,
      createdAt: thread.createdAt
    });
    
    for (const reply of thread.replies) {
      await threadRef.child('replies').push().set({
        body: reply.body,
        userId: reply.userId,
        createdAt: reply.createdAt
      });
    }
  }
}
```

## FAQ

**Q: Can I upgrade to a paid plan later?**
A: Yes, but you must explicitly add a payment method and upgrade to Blaze plan. This will NOT happen automatically.

**Q: What happens if I exceed 1GB?**
A: New posts are rejected with a friendly message. Existing data remains readable. No charges.

**Q: Can I increase the storage limit?**
A: On free tier, no. On Blaze plan (paid), yes - but you'll be charged for usage over 1GB.

**Q: How do I monitor usage in real-time?**
A: Check your Render logs for "Storage usage:" messages on every POST request.

**Q: Can I use Firebase Emulator for local testing?**
A: Yes! Install `firebase-tools` and run `firebase emulators:start --only database`

**Q: Is my data backed up?**
A: Firebase automatically backs up Realtime Database data. You can also manually export from Firebase Console.

## Support

For Firebase-specific issues:
- [Firebase Documentation](https://firebase.google.com/docs/database)
- [Firebase Support](https://firebase.google.com/support)

For Textchan issues:
- Check server logs
- Verify environment variables
- Test with `ALLOW_WEEKDAY_POSTING=true`
