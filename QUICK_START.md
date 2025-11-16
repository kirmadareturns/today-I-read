# Quick Start: Deploy textchan to Fly.io

Ultra-quick guide to deploy textchan to Fly.io in 5 minutes.

## Prerequisites

- [ ] Fly.io account created (https://fly.io/signup)
- [ ] Fly CLI installed
- [ ] Firebase project set up (see FIREBASE_SETUP.md if not)

## 🚀 5-Minute Deployment

### 1. Install Fly CLI (if not installed)

**macOS:**
```bash
brew install flyctl
```

**Linux/macOS (alternative):**
```bash
curl -L https://fly.io/install.sh | sh
```

**Windows:**
```powershell
iwr https://fly.io/install.ps1 -useb | iex
```

### 2. Authenticate

```bash
flyctl auth login
```

### 3. Navigate to Project

```bash
cd /path/to/textchan
```

### 4. Launch App

```bash
flyctl launch
```

**Answer prompts:**
- App name: `textchan` (or your choice - must be globally unique)
- Region: Select closest to your users (e.g., `sjc` for US West)
- Postgres: `NO`
- Redis: `NO`
- Deploy now: `YES`

### 5. Set Firebase Secrets

```bash
# Set your Firebase project ID
flyctl secrets set FIREBASE_PROJECT_ID="your-firebase-project-id"

# Set your Firebase database URL
flyctl secrets set FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.firebaseio.com"

# Set your Firebase service account (get from Firebase Console > Settings > Service Accounts > Generate Key)
flyctl secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Optional: Enable weekday posting for testing:**
```bash
flyctl secrets set ALLOW_WEEKDAY_POSTING=true
```

### 6. Deploy

```bash
flyctl deploy
```

### 7. Open App

```bash
flyctl open
```

## ✅ Verify Deployment

Visit your app at `https://<app-name>.fly.dev` and check:

- [ ] Homepage loads quickly (<2 seconds)
- [ ] Countdown timer appears
- [ ] Can view threads (if any exist)
- [ ] Can create thread (if weekend or ALLOW_WEEKDAY_POSTING=true)
- [ ] Anonymous user ID persists across page reloads

## 🎉 Done!

Your textchan instance is now live on Fly.io!

**Next steps:**
- View logs: `flyctl logs`
- Check status: `flyctl status`
- Set up custom domain (optional): See FLY_DEPLOYMENT.md
- Test thoroughly: See FLY_MIGRATION_CHECKLIST.md

## 📚 Full Documentation

- **Detailed deployment guide:** [FLY_DEPLOYMENT.md](./FLY_DEPLOYMENT.md)
- **Migration checklist:** [FLY_MIGRATION_CHECKLIST.md](./FLY_MIGRATION_CHECKLIST.md)
- **All deployment options:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Firebase setup:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

## 🆘 Troubleshooting

**App not starting?**
```bash
flyctl logs
```

**Check secrets are set:**
```bash
flyctl secrets list
```

**Redeploy:**
```bash
flyctl deploy
```

**Need help?** See [FLY_DEPLOYMENT.md](./FLY_DEPLOYMENT.md) troubleshooting section.

---

**That's it!** Your textchan is now running on Fly.io with no spin-down delays. 🎉
