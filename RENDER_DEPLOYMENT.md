# Textchan Deployment Guide - Render.com

Complete step-by-step guide for deploying textchan to Render.com with free hosting (no credit card required).

## Why Render?

- ✅ **No credit card required** - Free tier doesn't require payment method
- ✅ **Auto-deploy from Git** - Automatic deployments on push
- ✅ **Easy setup** - Web-based interface, no CLI needed
- ✅ **Free SSL** - Automatic HTTPS certificates
- ✅ **Custom domains** - Free custom domain support

**Trade-off:** Free tier has spin-down after 15 minutes of inactivity, resulting in 10-30 second cold starts on first request. Subsequent requests are fast.

---

## Prerequisites

Before deploying to Render, ensure you have:

1. **Firebase project configured** - See [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
2. **GitHub repository** - Code pushed to GitHub
3. **Render account** - Create free account at [render.com](https://render.com)

---

## Step 1: Prepare Firebase Credentials

You'll need these from your Firebase project:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** (gear icon) > **General**
4. Note down:
   - **Project ID** (e.g., `textchan-abc123`)
   - **Database URL** (found in Realtime Database section, e.g., `https://textchan-abc123-default-rtdb.firebaseio.com`)

5. Generate service account key:
   - Go to **Project Settings** > **Service Accounts**
   - Click **Generate New Private Key**
   - Download the JSON file
   - **Keep this file secure** - it provides full access to your Firebase project

---

## Step 2: Create Render Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** button → **Web Service**
3. Connect your GitHub account if not already connected
4. Select your repository (e.g., `kirmadareturns/today-I-read`)
5. Click **Connect**

---

## Step 3: Configure Service Settings

### Basic Settings

- **Name**: `textchan` (or your preferred name)
- **Region**: Choose closest to your users (e.g., Oregon (US West) or Ohio (US East))
- **Branch**: `main` (or your deployment branch)
- **Root Directory**: Leave blank (uses repository root)

### Build Settings

- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### Instance Type

- **Plan**: `Free` (no credit card required)

---

## Step 4: Set Environment Variables

In the **Environment Variables** section, add the following:

### Required Variables

1. **FIREBASE_PROJECT_ID**
   - Value: Your Firebase project ID (e.g., `textchan-abc123`)

2. **FIREBASE_DATABASE_URL**
   - Value: Your Firebase Realtime Database URL (e.g., `https://textchan-abc123-default-rtdb.firebaseio.com`)

3. **FIREBASE_SERVICE_ACCOUNT**
   - Value: Your service account JSON as a **single-line string**
   - To convert the JSON file to a single line:
     ```bash
     cat path/to/serviceAccountKey.json | jq -c
     ```
   - Or manually copy the JSON and remove all newlines/spaces between elements
   - Example format: `{"type":"service_account","project_id":"textchan-abc123","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}`

### Optional Variables

4. **NODE_ENV** (optional, Render sets this automatically)
   - Value: `production`

5. **ALLOW_WEEKDAY_POSTING** (for testing only)
   - Value: `false` (set to `true` only for testing outside weekends)

---

## Step 5: Deploy

1. Click **Create Web Service**
2. Render will:
   - Clone your repository
   - Run `npm install`
   - Start the server with `npm start`
   - Assign a URL like `https://textchan-xxxxx.onrender.com`

3. Watch the deployment logs in real-time
4. Look for success messages:
   ```
   Firebase initialized successfully
   Textchan server running on http://localhost:10000
   Weekend posting: ENABLED
   ✓ Using Firebase Realtime Database for storage
   ```

5. Deployment typically takes 2-5 minutes

---

## Step 6: Test Your Deployment

Once deployed, test your app:

### 1. Homepage Test
- Visit your Render URL (e.g., `https://textchan-xxxxx.onrender.com`)
- **Note:** First request may take 10-30 seconds (cold start)
- Homepage should load with "Create New Thread" section

### 2. Weekend Status Test
```bash
curl https://textchan-xxxxx.onrender.com/api/status
```

Expected response:
```json
{
  "postingEnabled": true,
  "currentDay": "Saturday",
  "nextChangeTimestamp": "2024-01-15T00:00:00.000Z",
  "storage": {
    "limitReached": false,
    "usagePercent": 0.5
  }
}
```

### 3. Post Test (Weekend Only)

Create a test thread:
```bash
curl -X POST https://textchan-xxxxx.onrender.com/api/threads \
  -H "Content-Type: application/json" \
  -d '{"body": "Test post from Render!", "userId": "test-user-123"}'
```

On weekdays, you should get:
```json
{
  "error": "Posting is only allowed on weekends"
}
```

### 4. Firebase Integration Test
- Check [Firebase Console](https://console.firebase.google.com)
- Go to **Realtime Database** > **Data**
- Verify threads appear under `/threads/`

---

## Step 7: Configure Custom Domain (Optional)

To use your own domain instead of `*.onrender.com`:

### 1. In Render Dashboard

1. Go to your service → **Settings**
2. Scroll to **Custom Domain**
3. Click **Add Custom Domain**
4. Enter your domain (e.g., `textchan.yourdomain.com`)
5. Render will show DNS records to add:
   - **CNAME record** for subdomain
   - Or **A records** for apex domain

### 2. In Your Domain Registrar

1. Log in to your domain registrar (Namecheap, GoDaddy, Cloudflare, etc.)
2. Go to DNS settings
3. Add the DNS records provided by Render:

**For subdomain (textchan.yourdomain.com):**
- Type: `CNAME`
- Name: `textchan`
- Value: `textchan-xxxxx.onrender.com`
- TTL: `3600` (or automatic)

**For apex domain (yourdomain.com):**
- Type: `A`
- Name: `@`
- Value: IP addresses provided by Render
- TTL: `3600`

### 3. SSL Certificate

- Render automatically provisions free SSL certificates
- This may take 5-15 minutes after DNS propagation
- Your site will be accessible via HTTPS

### 4. Verify

- Wait 5-30 minutes for DNS propagation
- Visit your custom domain
- Verify HTTPS works (green padlock)

---

## Monitoring & Maintenance

### View Logs

1. Go to your service in Render Dashboard
2. Click **Logs** tab
3. View real-time logs or search historical logs

Look for:
- `Textchan server running on...` - Server started successfully
- `Firebase initialized successfully` - Firebase connection working
- Error messages or stack traces

### Monitor Usage

**Firebase:**
- Go to [Firebase Console](https://console.firebase.google.com)
- **Usage and billing** tab
- Monitor:
  - Storage: Free tier = 1GB (textchan enforces 90% limit)
  - Downloads: Free tier = 10GB/month
  - Connections: Free tier = 100 simultaneous

**Render:**
- Free tier includes 750 hours/month (more than enough for 24/7)
- View usage in **Account Settings** > **Usage**

### Redeploy

Render automatically redeploys when you push to your connected branch:

1. Make changes to code locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update feature X"
   git push origin main
   ```
3. Render automatically detects push and redeploys
4. Watch deployment logs in Render Dashboard

**Manual redeploy:**
- Click **Manual Deploy** → **Deploy latest commit**

---

## Troubleshooting

### Issue: App won't start

**Symptoms:** Deployment fails with error messages

**Solutions:**
1. Check logs for specific error messages
2. Verify all environment variables are set correctly
3. Verify `FIREBASE_SERVICE_ACCOUNT` is valid JSON (no syntax errors)
4. Check Firebase project ID and database URL are correct
5. Ensure Firebase Realtime Database is enabled

### Issue: "Firebase connection failed"

**Solutions:**
1. Verify `FIREBASE_DATABASE_URL` is correct
2. Check Firebase security rules allow read/write:
   ```json
   {
     "rules": {
       "threads": {
         ".read": true,
         ".write": true
       }
     }
   }
   ```
3. Regenerate service account key and update `FIREBASE_SERVICE_ACCOUNT`

### Issue: "Cannot POST /api/threads" (403 error)

**Cause:** Not weekend, posting disabled

**Solutions:**
- Wait until weekend (Saturday or Sunday UTC)
- Or set `ALLOW_WEEKDAY_POSTING=true` in environment variables for testing
- Verify with `/api/status` endpoint

### Issue: Slow first load (cold start)

**Expected behavior:** Render free tier spins down after 15 minutes of inactivity

**Impact:** First request takes 10-30 seconds, subsequent requests are fast

**Workarounds:**
- Upgrade to paid plan ($7/month) for no spin-down
- Use external uptime monitor to ping site every 10 minutes
- Accept the delay as trade-off for free hosting

### Issue: Posts not saving to Firebase

**Solutions:**
1. Check Firebase Console → Realtime Database → Data
2. Verify security rules allow writes
3. Check Firebase storage limit (1GB free tier)
4. Look for "STORAGE_LIMIT_REACHED" in logs

---

## Upgrading to Paid Tier

If your app grows or you need better performance:

### Render Paid Plans

- **Starter**: $7/month
  - No spin-down
  - Faster response times
  - 1GB RAM (vs 512MB free)

To upgrade:
1. Go to service → **Settings**
2. Change **Instance Type** to **Starter**
3. Add payment method
4. Confirm upgrade

### Firebase Paid Plans

- **Blaze (Pay as you go)**:
  - Includes free tier limits
  - Pay only for usage beyond free tier
  - ~$5/month per additional GB storage
  - Monitor costs carefully in Firebase Console

---

## Security Best Practices

1. **Never commit service account key** to Git
   - Verify `.gitignore` includes `*.json` for Firebase keys
   - Use environment variables only

2. **Restrict Firebase security rules** for production:
   ```json
   {
     "rules": {
       "threads": {
         ".read": true,
         ".write": "auth != null"
       }
     }
   }
   ```
   (Note: Current implementation uses open writes for simplicity)

3. **Enable rate limiting** to prevent abuse (see README.md)

4. **Monitor Firebase usage** to avoid unexpected charges

---

## Next Steps

After successful deployment:

1. ✅ Test all functionality using [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)
2. ✅ Configure custom domain (optional)
3. ✅ Set up uptime monitoring (e.g., UptimeRobot, Pingdom)
4. ✅ Share your textchan URL with users
5. ✅ Monitor Firebase storage and bandwidth usage
6. ✅ Wait for weekend to test posting functionality

---

## Comparison: Render vs Other Platforms

| Feature | Render | Fly.io | Railway |
|---------|--------|--------|---------|
| **Credit card required** | ❌ No | ✅ Yes | ⚠️ Trial only |
| **Spin-down** | ✅ Yes (15 min) | ❌ No | ✅ Yes |
| **Cold start** | 10-30 seconds | <2 seconds | ~10 seconds |
| **Free tier** | 750 hrs/month | 3x 256MB VMs | 500 hrs/month |
| **Auto-deploy** | ✅ Git push | ❌ Manual | ✅ Git push |
| **Setup** | Web UI (easy) | CLI (medium) | Web UI (easy) |
| **Best for** | Free, no CC | Always-on | Simple apps |

---

## Support

- **Render Documentation**: https://render.com/docs
- **Render Community**: https://community.render.com
- **Firebase Support**: https://firebase.google.com/support
- **Project Issues**: Open an issue on GitHub

---

**Enjoy your free textchan deployment! 🎉**

No credit card needed. Posts every weekend. Simple and fun.
