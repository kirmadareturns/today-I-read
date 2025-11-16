# Quick Start: Deploy textchan to Render

Ultra-quick guide to deploy textchan to Render in 5 minutes - **no credit card required**.

## Prerequisites

- [ ] GitHub account (to connect repository)
- [ ] Render account created (https://render.com/signup) - **free, no credit card needed**
- [ ] Firebase project set up (see FIREBASE_SETUP.md if not)
- [ ] Code pushed to GitHub repository

## 🚀 5-Minute Deployment

### 1. Create Render Account

Go to [render.com](https://render.com) and sign up with GitHub (or email).

**No credit card required!** ✅

### 2. Create New Web Service

1. Click **New +** → **Web Service**
2. Connect your GitHub account (if not already connected)
3. Select your repository (e.g., `kirmadareturns/today-I-read`)
4. Click **Connect**

### 3. Configure Service

**Basic settings:**
- **Name**: `textchan` (or your choice)
- **Region**: Choose closest to your users (e.g., Oregon or Ohio)
- **Branch**: `main` (or your deployment branch)

**Build settings:**
- **Runtime**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

**Plan:**
- **Instance Type**: `Free`

### 4. Set Environment Variables

Click **Add Environment Variable** for each:

1. **FIREBASE_PROJECT_ID**
   - Value: `your-firebase-project-id`

2. **FIREBASE_DATABASE_URL**
   - Value: `https://your-project-id-default-rtdb.firebaseio.com`

3. **FIREBASE_SERVICE_ACCOUNT**
   - Value: Your service account JSON as single-line string
   - Get from: Firebase Console > Settings > Service Accounts > Generate Key
   - Convert to single line: `cat serviceAccountKey.json | jq -c`
   - Example: `{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}`

**Optional: Enable weekday posting for testing:**

4. **ALLOW_WEEKDAY_POSTING**
   - Value: `true` (change to `false` for production)

### 5. Deploy

Click **Create Web Service**

Render will:
- Clone your repository
- Run `npm install`
- Start server with `npm start`
- Assign URL like `https://textchan-xxxxx.onrender.com`

**Note:** First deployment takes 2-5 minutes.

### 6. Open Your App

Click the URL at the top of the dashboard (e.g., `https://textchan-xxxxx.onrender.com`)

**Note:** First request may take 10-30 seconds (cold start), then it's fast!

## ✅ Verify Deployment

Visit your Render URL and check:

- [ ] Homepage loads (first load: 10-30s, then fast)
- [ ] Countdown timer appears and works
- [ ] Can view threads (if any exist)
- [ ] Can create thread (if weekend or ALLOW_WEEKDAY_POSTING=true)
- [ ] Anonymous user ID persists across page reloads
- [ ] Posts save to Firebase

**Test API status:**
```bash
curl https://textchan-xxxxx.onrender.com/api/status
```

Expected response:
```json
{
  "postingEnabled": true,
  "currentDay": "Saturday",
  "nextChangeTimestamp": "...",
  "storage": {
    "limitReached": false,
    "usagePercent": 0.5
  }
}
```

## 🎉 Done!

Your textchan instance is now live on Render - **100% free, no credit card!**

**Your live URL:** `https://textchan-xxxxx.onrender.com`

**Next steps:**
- View logs: Render Dashboard → Logs tab
- Set up custom domain (optional): See RENDER_DEPLOYMENT.md
- Test thoroughly: See TEST_CHECKLIST.md
- Share with users and wait for the weekend! 🎉

## 📚 Full Documentation

- **Detailed deployment guide:** [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)
- **All deployment options:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Firebase setup:** [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)
- **Testing guide:** [TEST_CHECKLIST.md](./TEST_CHECKLIST.md)

## 🆘 Troubleshooting

**App not starting?**
1. Go to Render Dashboard → Your service → Logs
2. Look for error messages
3. Verify environment variables are set correctly

**Firebase connection error?**
- Check `FIREBASE_PROJECT_ID` and `FIREBASE_DATABASE_URL` are correct
- Verify `FIREBASE_SERVICE_ACCOUNT` is valid JSON (no syntax errors)
- Check Firebase Console that Realtime Database is enabled

**Posts not working?**
- Check `/api/status` - verify `postingEnabled: true`
- Remember: posting only works on weekends (Saturday/Sunday UTC)
- Or set `ALLOW_WEEKDAY_POSTING=true` for testing

**Slow first load?**
- Expected behavior on free tier (spin-down after 15 min)
- First request: 10-30 seconds
- Subsequent requests: fast (<2s)
- Upgrade to $7/month Starter plan for no spin-down

**Need help?** See [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) troubleshooting section.

## 🔄 Auto-Deploy

Render automatically redeploys when you push to your connected branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Render detects the push and redeploys automatically! ✨

---

**That's it!** Your textchan is now running on Render with **no credit card required**. 🎉

**Remember:** Free tier has spin-down delays, but it's truly free and functional!
