# Fly.io Migration Checklist

Quick reference checklist for migrating textchan from Render to Fly.io.

## ✅ Pre-Migration (Complete before deploying)

- [ ] **Fly.io account created** at https://fly.io/signup
- [ ] **Fly CLI installed** (`brew install flyctl` or download from fly.io/docs)
- [ ] **Authenticated** with Fly.io (`flyctl auth login`)
- [ ] **Firebase credentials ready**:
  - [ ] `FIREBASE_PROJECT_ID`
  - [ ] `FIREBASE_DATABASE_URL`
  - [ ] `FIREBASE_SERVICE_ACCOUNT` (JSON service account key)
- [ ] **Repository cloned/updated** locally with latest code
- [ ] **On correct branch** with fly.toml and Dockerfile

## 🚀 Deployment Steps

### 1. Launch Fly.io App

```bash
cd /path/to/textchan
flyctl launch
```

**Prompts:**
- [ ] App name chosen (e.g., `textchan` or custom)
- [ ] Region selected (closest to users):
  - `sjc` - San Jose, CA (US West)
  - `iad` - Ashburn, VA (US East)
  - `lhr` - London, UK (Europe)
- [ ] Postgres: Select **NO** (using Firebase)
- [ ] Redis: Select **NO** (not needed)
- [ ] Deploy now: Select **YES**

**Note:** If fly.toml already exists, flyctl will use it.

### 2. Set Environment Secrets

```bash
# Required: Firebase credentials
flyctl secrets set FIREBASE_PROJECT_ID="your-firebase-project-id"
flyctl secrets set FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.firebaseio.com"

# Required for production: Service account
flyctl secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'

# Optional: For testing weekday posting
flyctl secrets set ALLOW_WEEKDAY_POSTING=true
```

**Tip:** Get service account JSON from Firebase Console > Project Settings > Service Accounts > Generate New Private Key

### 3. Deploy

```bash
flyctl deploy
```

- [ ] Build completed successfully
- [ ] Container deployed
- [ ] Health checks passing
- [ ] App running

### 4. Verify Deployment

**Check status:**
```bash
flyctl status
```

**View logs:**
```bash
flyctl logs
```

**Open app:**
```bash
flyctl open
```

**Manual verification:**
- [ ] Visit `https://<app-name>.fly.dev`
- [ ] Homepage loads (no 50+ second delay)
- [ ] Countdown timer displays
- [ ] Threads list loads
- [ ] Can create thread (if weekend or ALLOW_WEEKDAY_POSTING=true)
- [ ] Can create reply
- [ ] Anonymous user ID persists
- [ ] Firebase stores data (check Firebase Console)

## 🌐 Custom Domain Setup (Optional)

### If using custom domain:

**Add certificate:**
```bash
flyctl certs create yourdomain.com
```

**Get DNS records:**
```bash
flyctl certs show yourdomain.com
```

**Update DNS at your registrar:**
- [ ] A record: `@` → (IP from Fly)
- [ ] AAAA record: `@` → (IPv6 from Fly)
- [ ] OR CNAME: `www` → `<app-name>.fly.dev`

**Wait for DNS propagation:**
- [ ] Check certificate status: `flyctl certs check yourdomain.com`
- [ ] Wait 5-10 minutes for SSL provisioning
- [ ] Verify HTTPS works: `https://yourdomain.com`

## 🧪 Testing Checklist

### Functionality Tests

- [ ] **Homepage loads instantly** (no spin-down delay)
- [ ] **Countdown timer** displays correct time to next weekend
- [ ] **Weekend status** shows correct day (Saturday/Sunday or weekday)
- [ ] **Create thread**:
  - [ ] Works during weekend (or with ALLOW_WEEKDAY_POSTING=true)
  - [ ] Rejected during weekday with 403 error
  - [ ] Validates content (empty, too long)
  - [ ] Returns thread with ID and timestamp
- [ ] **Create reply**:
  - [ ] Works during weekend
  - [ ] Rejected during weekday with 403 error
  - [ ] Validates content
  - [ ] Increments reply count
- [ ] **View threads**:
  - [ ] Lists all threads
  - [ ] Shows reply counts
  - [ ] Ordered by creation date (newest first)
- [ ] **View single thread**:
  - [ ] Shows thread content
  - [ ] Shows all replies
  - [ ] 404 for non-existent thread
- [ ] **Anonymous user ID**:
  - [ ] Generated on first visit
  - [ ] Persists in localStorage
  - [ ] Same across page reloads
  - [ ] Different per browser/device

### Firebase Integration Tests

- [ ] **Data persists** in Firebase Realtime Database
- [ ] **Check Firebase Console**: See threads and replies
- [ ] **Storage limit enforced**: 90% of 1GB
- [ ] **507 error** when storage limit reached

### Performance Tests

- [ ] **First load** (cold start): < 2 seconds
- [ ] **Subsequent loads**: < 1 second
- [ ] **No spin-down**: App stays responsive 24/7
- [ ] **Weekend traffic**: Can handle viral traffic spikes

### Error Handling Tests

- [ ] **Invalid thread ID**: Returns 404
- [ ] **Missing body**: Returns 400
- [ ] **Too long body** (>2000 chars): Returns 400
- [ ] **Missing user ID**: Returns 400
- [ ] **Weekend gating**: Returns 403 during weekdays
- [ ] **Storage limit**: Returns 507 when full

## 🔄 Migration from Render (If applicable)

### Before switching DNS:

- [ ] **Test Fly.io thoroughly** using `<app-name>.fly.dev`
- [ ] **Verify Firebase connection** works on Fly.io
- [ ] **Check all features** working correctly

### Switch traffic:

If using custom domain on Render:
1. [ ] Update DNS to point to Fly.io (see Custom Domain Setup above)
2. [ ] Wait for DNS propagation (5-60 minutes)
3. [ ] Verify custom domain works on Fly.io
4. [ ] Monitor Fly.io logs for traffic

If not using custom domain:
1. [ ] Update any links/bookmarks to new Fly.io URL
2. [ ] Share new URL with users

### Clean up Render (after 24-48 hours):

- [ ] **Verify Fly.io stable** for 1-2 days
- [ ] **Delete Render service** (optional)
- [ ] **Keep Firebase intact** (shared between both platforms)

**Note:** No data migration needed - Firebase is cloud-hosted and works with both Render and Fly.io simultaneously.

## 📊 Monitoring Post-Migration

### Daily checks (first week):

- [ ] Check Fly.io dashboard: https://fly.io/dashboard
- [ ] View logs: `flyctl logs`
- [ ] Check app status: `flyctl status`
- [ ] Verify uptime: App should show "Running"
- [ ] Monitor Firebase usage: Firebase Console > Usage and Billing

### Weekly checks:

- [ ] Review Fly.io resource usage
- [ ] Check Firebase storage usage (ensure under 90%)
- [ ] Verify no errors in logs
- [ ] Test posting on weekend

### Alerts to set up:

- [ ] Firebase storage alert (approaching 1GB)
- [ ] Firebase bandwidth alert (approaching 10GB/month)
- [ ] Fly.io email alerts (for deployment failures)

## 🐛 Troubleshooting

### App not starting:

```bash
flyctl logs
```

**Common issues:**
- [ ] Missing Firebase secrets: `flyctl secrets list`
- [ ] Wrong PORT (should be 8080)
- [ ] Invalid Firebase credentials
- [ ] Firebase project doesn't exist

### Health checks failing:

- [ ] Verify `/api/status` endpoint works
- [ ] Check internal_port = 8080 in fly.toml
- [ ] View logs: `flyctl logs`

### Slow response times:

- [ ] Verify `auto_stop_machines = false` in fly.toml
- [ ] Check `min_machines_running = 1`
- [ ] Ensure app is in correct region: `flyctl status`

### Custom domain not working:

- [ ] Check DNS records: `dig yourdomain.com`
- [ ] Verify certificate status: `flyctl certs check yourdomain.com`
- [ ] Wait 5-10 minutes for DNS propagation
- [ ] Check certificate issued: `flyctl certs list`

### Firebase errors:

- [ ] Verify Firebase credentials in Fly secrets
- [ ] Check Firebase Console for errors
- [ ] Verify Firebase Realtime Database is enabled
- [ ] Check Firebase security rules allow server-side writes

## 📝 Useful Commands

```bash
# View app info
flyctl info

# View status
flyctl status

# View logs (real-time)
flyctl logs

# View secrets (names only)
flyctl secrets list

# Update a secret
flyctl secrets set KEY=value

# Remove a secret
flyctl secrets unset KEY

# Redeploy
flyctl deploy

# Restart app
flyctl apps restart

# SSH into VM (for debugging)
flyctl ssh console

# Scale memory
flyctl scale memory 512

# View regions
flyctl regions list

# Open app in browser
flyctl open

# Open Fly.io dashboard
flyctl dashboard
```

## ✨ Success Criteria

Migration is complete when:

- [x] Fly.io app deployed and running
- [x] All environment secrets configured
- [x] Custom domain working (if applicable)
- [x] HTTPS/SSL certificate issued
- [x] Homepage loads instantly (<2s)
- [x] All features working (create thread/reply, view, timer)
- [x] Anonymous user IDs persist
- [x] Firebase integration working
- [x] Weekend gating enforced
- [x] App stays running 24/7 (no spin-down)
- [x] Logs show no errors
- [x] Performance better than Render (no cold starts)

## 📚 Additional Resources

- **Full deployment guide:** [FLY_DEPLOYMENT.md](./FLY_DEPLOYMENT.md)
- **Firebase setup:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Testing checklist:** [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)
- **Fly.io docs:** https://fly.io/docs
- **Fly.io community:** https://community.fly.io

---

**Happy migrating! 🚀**
