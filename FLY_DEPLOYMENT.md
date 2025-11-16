# Fly.io Deployment Guide for textchan

This guide walks you through deploying textchan to Fly.io for always-on, high-performance hosting with no spin-down delays.

## Why Fly.io?

- **No spin-down**: Always running, instant response times
- **Free tier**: 3 shared-cpu-1x 256MB VMs included
- **Better performance**: Faster than Render's free tier
- **Global distribution**: Deploy close to your users
- **160GB outbound data/month** on free tier

---

## Prerequisites

Before you start, ensure you have:

1. **A Fly.io account** (sign up at https://fly.io)
2. **Firebase project set up** (see FIREBASE_SETUP.md)
3. **Fly CLI installed** on your local machine

### Install Fly CLI

**macOS (Homebrew):**
```bash
brew install flyctl
```

**macOS/Linux (curl):**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows (PowerShell):**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

Verify installation:
```bash
flyctl version
```

---

## Step 1: Authenticate with Fly.io

Log in to your Fly.io account:

```bash
flyctl auth login
```

This will open a browser window for authentication.

---

## Step 2: Clone/Navigate to Repository

```bash
git clone https://github.com/kirmadareturns/today-I-read.git
cd today-I-read
```

Make sure you're on the branch with the textchan code (if not on main):
```bash
git checkout <textchan-branch>
```

---

## Step 3: Launch the App

From the project root directory, run:

```bash
flyctl launch
```

### Follow the prompts:

1. **App name**: Choose a name (e.g., `textchan` or `textchan-prod`)
   - This becomes your subdomain: `<app-name>.fly.dev`
   - Must be globally unique

2. **Region**: Select the region closest to your expected users
   - `sjc` (San Jose) for US West Coast
   - `iad` (Ashburn) for US East Coast
   - `lhr` (London) for Europe
   - `syd` (Sydney) for Australia

3. **Postgres database**: **NO** (we're using Firebase)

4. **Redis**: **NO** (not needed)

5. **Deploy now**: **YES** (or deploy manually later)

Fly CLI will:
- Detect your Node.js app
- Create a `fly.toml` configuration file (already included in repo)
- Build and deploy your application
- Assign a URL: `https://<app-name>.fly.dev`

---

## Step 4: Set Environment Variables (Secrets)

textchan requires Firebase credentials. Set them as Fly secrets:

```bash
flyctl secrets set FIREBASE_PROJECT_ID="your-firebase-project-id"
flyctl secrets set FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.firebaseio.com"
```

**For production with service account:**
```bash
flyctl secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Optional: Enable weekday posting for testing:**
```bash
flyctl secrets set ALLOW_WEEKDAY_POSTING=true
```

After setting secrets, redeploy:
```bash
flyctl deploy
```

---

## Step 5: Verify Deployment

Check app status:
```bash
flyctl status
```

View logs:
```bash
flyctl logs
```

Open app in browser:
```bash
flyctl open
```

Or visit: `https://<app-name>.fly.dev`

**Test the following:**
- Homepage loads instantly (no 50+ second delay)
- Countdown timer displays correctly
- Weekend posting works (or with ALLOW_WEEKDAY_POSTING=true)
- Threads and replies are stored in Firebase
- Anonymous user ID persists across sessions

---

## Step 6: Configure Custom Domain (Optional)

### Add Domain to Fly.io

1. Add your custom domain:
```bash
flyctl certs create yourdomain.com
```

2. Fly will provide DNS records. Add them to your domain registrar:

**For root domain (yourdomain.com):**
- Type: `A`
- Name: `@`
- Value: (IP provided by Fly)

**For www subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: `<app-name>.fly.dev`

3. Check certificate status:
```bash
flyctl certs check yourdomain.com
```

SSL certificate will be auto-provisioned (takes 5-10 minutes).

### Alternative: CNAME only (for subdomain)

If you want to deploy to a subdomain (e.g., `textchan.yourdomain.com`):

1. Add CNAME record in your DNS:
   - Type: `CNAME`
   - Name: `textchan`
   - Value: `<app-name>.fly.dev`

2. Add certificate in Fly:
```bash
flyctl certs create textchan.yourdomain.com
```

---

## Step 7: Monitor Your App

### View dashboard:
```bash
flyctl dashboard
```

Or visit: https://fly.io/dashboard

### View real-time logs:
```bash
flyctl logs
```

### Check app metrics:
```bash
flyctl status
```

### SSH into your VM (for debugging):
```bash
flyctl ssh console
```

---

## Configuration Details

### fly.toml Breakdown

The `fly.toml` file configures your Fly.io deployment:

- **`app`**: Your app name (must be globally unique)
- **`primary_region`**: Where your app runs (closest to users)
- **`internal_port`**: Port your Node.js server listens on (8080)
- **`auto_stop_machines = false`**: Keeps app always running (no spin-down)
- **`auto_start_machines = false`**: Prevents auto-start (we want manual control)
- **`min_machines_running = 1`**: Ensures 1 instance is always active
- **`http_checks`**: Health checks on `/api/status` every 30 seconds
- **`memory_mb = 256`**: Free tier VM size (sufficient for textchan)

### Environment Variables

- `PORT`: Set to `8080` (Fly.io expects this)
- `NODE_ENV`: Set to `production`
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_DATABASE_URL`: Firebase Realtime Database URL
- `FIREBASE_SERVICE_ACCOUNT`: Service account JSON (optional, for production)
- `ALLOW_WEEKDAY_POSTING`: Override weekend gating (for testing)

---

## Deployment Commands

### Deploy changes:
```bash
flyctl deploy
```

### Restart app:
```bash
flyctl apps restart <app-name>
```

### Scale app (change VM size):
```bash
flyctl scale memory 512
```

### View secrets:
```bash
flyctl secrets list
```

### Update a secret:
```bash
flyctl secrets set KEY=value
```

### Remove a secret:
```bash
flyctl secrets unset KEY
```

---

## Troubleshooting

### App not starting:
1. Check logs: `flyctl logs`
2. Verify secrets are set: `flyctl secrets list`
3. Ensure Firebase credentials are correct
4. Check `fly.toml` port matches `PORT` env var

### Slow response times:
1. Verify `auto_stop_machines = false` in `fly.toml`
2. Check `min_machines_running = 1`
3. Ensure app is in correct region: `flyctl regions list`

### Health check failures:
1. Ensure `/api/status` endpoint is working
2. Check logs for errors: `flyctl logs`
3. Verify internal_port = 8080

### Custom domain not working:
1. Verify DNS records are correct: `dig yourdomain.com`
2. Check certificate status: `flyctl certs check yourdomain.com`
3. Wait 5-10 minutes for DNS propagation

### Out of storage (Firebase):
- textchan enforces 90% of 1GB limit
- Clean up old threads/replies in Firebase Console
- Or upgrade to Firebase Blaze plan

---

## Cost Breakdown (Free Tier)

Fly.io free tier includes:
- **3 shared-cpu-1x 256MB VMs** (we use 1)
- **160GB outbound data transfer/month**
- **Always-on**: No spin-down or cold starts

textchan uses:
- **1 VM**: 256MB RAM (fits comfortably in free tier)
- **Minimal bandwidth**: Text-only data (no images)
- **Estimated cost**: $0/month (within free tier limits)

**If you exceed free tier:**
- Additional VMs: ~$2-3/month each
- Extra bandwidth: ~$0.02/GB
- Monitor usage: https://fly.io/dashboard

---

## Migrating from Render

If migrating from Render:

1. **Deploy to Fly.io** (follow steps above)
2. **Test Fly.io app** thoroughly (all features work)
3. **Update DNS** to point to Fly.io (if using custom domain)
4. **Wait for DNS propagation** (~5-60 minutes)
5. **Delete Render service** (optional, after confirming Fly.io works)

**Data migration:**
- textchan uses Firebase (cloud-hosted)
- No data migration needed - both Render and Fly.io use same Firebase backend
- Simply deploy to Fly.io and it will connect to existing Firebase data

---

## Next Steps

- [ ] Deploy to Fly.io
- [ ] Set Firebase secrets
- [ ] Test all functionality
- [ ] Configure custom domain (optional)
- [ ] Monitor logs and metrics
- [ ] Delete Render service (optional)

For Firebase setup, see: `FIREBASE_SETUP.md`
For testing checklist, see: `TEST_CHECKLIST.md`

---

## Support

- Fly.io docs: https://fly.io/docs
- Fly.io community: https://community.fly.io
- Firebase docs: https://firebase.google.com/docs

**Fly.io-specific help:**
```bash
flyctl help
flyctl help <command>
```

Happy deploying! 🚀
