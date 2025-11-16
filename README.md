# Textchan

A minimalist anonymous imageboard where users can only post threads and replies during weekends. Built with simplicity and weekend-only discourse in mind.

## Overview

Textchan is a weekend-gated discussion board that restricts content creation to Saturdays and Sundays. Users can create text-based threads and reply to existing threads, but only when the weekend posting window is active. The platform is completely anonymous with no user accounts or authentication.

### Problem Statement

Online forums and imageboards often suffer from constant activity and low-quality posts throughout the week. Textchan explores a different model: by restricting posting to weekends only, we create:

- **Intentional participation**: Users plan and craft their posts rather than rapid-fire responses
- **Breathing room**: Weekdays allow time to read and reflect without new content flooding in
- **Weekend culture**: Foster a unique community dynamic around weekend discussions

## Features

- 📅 **Weekend-only posting** - Create threads and replies only on Saturdays and Sundays (UTC)
- 🧵 **Simple threading** - Start text threads and reply to existing discussions
- 👤 **Anonymous by default** - No user accounts, profiles, or authentication
- 💾 **Persistent storage** - Firebase Realtime Database maintains all threads and replies permanently
- 🚀 **Lightweight** - Vanilla JavaScript frontend, no heavy frameworks
- 🌐 **RESTful API** - Clean JSON API for all operations

## Tech Stack

### Backend
- **Node.js** (v18+) - JavaScript runtime
- **Express** (v4) - Web application framework
- **Firebase Admin SDK** (v12) - Firebase backend integration
- **CORS** - Cross-origin resource sharing middleware

### Frontend
- **Vanilla JavaScript** - No frameworks, pure ES6+
- **HTML5** - Semantic markup
- **CSS3** - Custom styling

### Database
- **Firebase Realtime Database** - NoSQL cloud database (free tier)
  - `/threads/{threadId}` - Thread content and metadata
  - `/threads/{threadId}/replies/{replyId}` - Nested replies structure
  - **Storage limit**: 1GB (enforced at 90% to prevent charges)

## Prerequisites

Before running Textchan, ensure you have:

- **Node.js** v18.0.0 or higher ([download here](https://nodejs.org/))
- **npm** (comes with Node.js)
- **Firebase project** with Realtime Database enabled (see [Firebase Setup Guide](./FIREBASE_SETUP.md))
- A command-line terminal

Check your versions:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 9.0.0 or higher
```

## Getting Started

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd textchan
```

2. Install dependencies:
```bash
npm install
```

This will install:
- `express` - Web server framework
- `firebase-admin` - Firebase backend SDK
- `cors` - CORS middleware for API requests

3. Set up Firebase:

Follow the [Firebase Setup Guide](./FIREBASE_SETUP.md) to:
- Create a Firebase project
- Enable Realtime Database
- Get credentials
- Configure environment variables

4. Create a `.env` file:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase credentials:
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

### Running the Server

Start the development server:
```bash
npm start
```

Or use the watch mode for automatic restarts during development:
```bash
npm run dev
```

The server will start on `http://localhost:3000` by default.

You should see output like:
```
Firebase initialized successfully
Database URL: https://your-project-id-default-rtdb.firebaseio.com
Textchan server running on http://localhost:3000
Weekend posting: ENABLED
```

### Firebase Connection

Firebase Realtime Database is automatically connected on server start:

- **Location**: Cloud-hosted at your Firebase project URL
- **Data structure**: Hierarchical JSON tree
  - `/threads/{threadId}` - Thread content and metadata
  - `/threads/{threadId}/replies/{replyId}` - Nested replies
- **Storage limit**: 1GB (free tier), enforced at 90% capacity

No manual database setup is required after configuring environment variables.

### Project Structure

```
textchan/
├── server.js              # Express server with API routes and weekend logic
├── firebase.js            # Firebase initialization and storage operations
├── public/
│   ├── index.html         # Frontend HTML page
│   ├── app.js             # Vanilla JS frontend logic
│   └── styles.css         # CSS styling
├── package.json           # Node dependencies and scripts
├── .env                   # Environment variables (not in git)
├── .env.example           # Environment variables template
├── .gitignore             # Excludes node_modules, .env, credentials
├── FIREBASE_SETUP.md      # Firebase setup guide
└── README.md              # This file
```

## API Reference

All API endpoints return JSON responses. The API uses HTTP status codes to indicate success or failure.

### GET /api/status

Check whether posting is currently allowed based on weekend rules.

**Request:**
```bash
curl http://localhost:3000/api/status
```

**Response (200 OK):**
```json
{
  "isWeekend": true,
  "canPost": true,
  "currentTime": "2024-01-13T15:30:00.000Z",
  "timezone": "UTC"
}
```

**Fields:**
- `isWeekend` (boolean): Whether it's currently Saturday or Sunday
- `canPost` (boolean): Whether posting is allowed (same as isWeekend unless overridden)
- `currentTime` (string): Current server time in ISO 8601 format
- `timezone` (string): Timezone used for weekend calculation (always UTC)

---

### GET /api/threads

Fetch all threads with reply counts.

**Request:**
```bash
curl http://localhost:3000/api/threads
```

**Response (200 OK):**
```json
{
  "threads": [
    {
      "id": 1,
      "content": "What are your weekend plans?",
      "createdAt": 1705156800000,
      "replyCount": 3
    },
    {
      "id": 2,
      "content": "Favorite weekend breakfast?",
      "createdAt": 1705070400000,
      "replyCount": 0
    }
  ]
}
```

**Fields:**
- `threads` (array): List of thread objects ordered by creation date (newest first)
  - `id` (number): Unique thread identifier
  - `content` (string): Thread text content
  - `createdAt` (number): Unix timestamp in milliseconds
  - `replyCount` (number): Number of replies to this thread

**Error Response (500):**
```json
{
  "error": "Failed to fetch threads"
}
```

---

### POST /api/threads

Create a new thread (weekend only).

**Request:**
```bash
curl -X POST http://localhost:3000/api/threads \
  -H "Content-Type: application/json" \
  -d '{"content": "What are your weekend plans?"}'
```

**Request Body:**
```json
{
  "content": "Your thread content here"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "content": "What are your weekend plans?",
  "createdAt": 1705156800000,
  "replyCount": 0
}
```

**Error Responses:**

*403 Forbidden* (not weekend):
```json
{
  "error": "Posting is only allowed on weekends",
  "code": "WEEKEND_ONLY"
}
```

*400 Bad Request* (empty content):
```json
{
  "error": "Content is required"
}
```

*400 Bad Request* (content too long):
```json
{
  "error": "Content too long (max 2000 characters)"
}
```

*500 Internal Server Error*:
```json
{
  "error": "Failed to create thread"
}
```

---

### GET /api/threads/:threadId/replies

Fetch a specific thread and all its replies.

**Request:**
```bash
curl http://localhost:3000/api/threads/1/replies
```

**Response (200 OK):**
```json
{
  "thread": {
    "id": 1,
    "content": "What are your weekend plans?",
    "createdAt": 1705156800000
  },
  "replies": [
    {
      "id": 1,
      "content": "Going hiking in the mountains!",
      "createdAt": 1705157400000
    },
    {
      "id": 2,
      "content": "Just relaxing at home",
      "createdAt": 1705158000000
    }
  ]
}
```

**Fields:**
- `thread` (object): The parent thread
  - `id`, `content`, `createdAt`: Same as in GET /api/threads
- `replies` (array): List of reply objects ordered chronologically
  - `id` (number): Unique reply identifier
  - `content` (string): Reply text content
  - `createdAt` (number): Unix timestamp in milliseconds

**Error Responses:**

*400 Bad Request* (invalid ID):
```json
{
  "error": "Invalid thread ID"
}
```

*404 Not Found*:
```json
{
  "error": "Thread not found"
}
```

*500 Internal Server Error*:
```json
{
  "error": "Failed to fetch thread"
}
```

---

### POST /api/threads/:threadId/replies

Add a reply to an existing thread (weekend only).

**Request:**
```bash
curl -X POST http://localhost:3000/api/threads/1/replies \
  -H "Content-Type: application/json" \
  -d '{"content": "Going hiking in the mountains!"}'
```

**Request Body:**
```json
{
  "content": "Your reply content here"
}
```

**Response (201 Created):**
```json
{
  "id": 1,
  "threadId": 1,
  "content": "Going hiking in the mountains!",
  "createdAt": 1705157400000
}
```

**Error Responses:**

*403 Forbidden* (not weekend):
```json
{
  "error": "Posting is only allowed on weekends",
  "code": "WEEKEND_ONLY"
}
```

*400 Bad Request* (invalid thread ID):
```json
{
  "error": "Invalid thread ID"
}
```

*400 Bad Request* (empty content):
```json
{
  "error": "Content is required"
}
```

*400 Bad Request* (content too long):
```json
{
  "error": "Content too long (max 2000 characters)"
}
```

*404 Not Found* (thread doesn't exist):
```json
{
  "error": "Thread not found"
}
```

*500 Internal Server Error*:
```json
{
  "error": "Failed to create reply"
}
```

## Weekend Logic

### How It Works

Textchan determines whether posting is allowed by checking if the current day is Saturday (6) or Sunday (0) using JavaScript's `Date.getDay()` method.

**Timezone**: All weekend checks use **UTC timezone**. This means:
- Weekend starts: Saturday 00:00:00 UTC
- Weekend ends: Monday 00:00:00 UTC

**Implementation** (in `server.js`):
```javascript
function isWeekend() {
  if (ALLOW_WEEKDAY_POSTING) {
    return true;
  }
  const now = new Date();
  const day = now.getDay();
  return day === 0 || day === 6;  // 0 = Sunday, 6 = Saturday
}
```

### Testing Outside Weekends

During development or testing on weekdays, you can override the weekend check:

#### Method 1: Environment Variable (Recommended)

Set the `ALLOW_WEEKDAY_POSTING` environment variable to `true`:

**Linux/Mac:**
```bash
ALLOW_WEEKDAY_POSTING=true npm start
```

**Windows (CMD):**
```cmd
set ALLOW_WEEKDAY_POSTING=true && npm start
```

**Windows (PowerShell):**
```powershell
$env:ALLOW_WEEKDAY_POSTING="true"; npm start
```

#### Method 2: Code Toggle

Temporarily modify the `isWeekend()` function in `server.js`:

```javascript
function isWeekend() {
  return true;  // Force weekend mode
  
  // Original logic:
  // const now = new Date();
  // const day = now.getDay();
  // return day === 0 || day === 6;
}
```

**⚠️ Remember to revert this change before deploying to production!**

#### Method 3: System Clock

Change your system's date/time to a weekend date (not recommended for development).

### Timezone Considerations

The server uses UTC for all date calculations. This means:

- Users in **PST (UTC-8)**: Weekend posting starts Friday 4:00 PM PST
- Users in **EST (UTC-5)**: Weekend posting starts Friday 7:00 PM EST  
- Users in **GMT (UTC+0)**: Weekend posting starts Saturday 12:00 AM GMT
- Users in **JST (UTC+9)**: Weekend posting starts Saturday 9:00 AM JST

If you want to change the timezone logic, you'll need to modify the `isWeekend()` function to use a specific timezone (e.g., using libraries like `luxon` or `date-fns-tz`).

## Deployment

Textchan can be deployed to various platforms. Since it uses Firebase Realtime Database for cloud storage, no persistent volumes or database setup is required on the hosting platform.

### Platform Options

#### Option 1: Fly.io (Recommended)

[Fly.io](https://fly.io) provides always-on hosting with no spin-down delays, perfect for handling viral weekend traffic.

**Why Fly.io:**
- **No spin-down**: Always running, instant response times (no 50+ second delays)
- **Free tier**: 3 shared-cpu-1x 256MB VMs included
- **Better performance**: Faster than other free tiers
- **Global distribution**: Deploy close to your users
- **160GB outbound data/month** on free tier

**Quick Start:**

1. Install Fly CLI: `brew install flyctl` (or see [docs](https://fly.io/docs/hands-on/install-flyctl/))
2. Log in: `flyctl auth login`
3. Launch your app: `flyctl launch`
4. Set Firebase secrets:
   ```bash
   flyctl secrets set FIREBASE_PROJECT_ID="your-project-id"
   flyctl secrets set FIREBASE_DATABASE_URL="https://your-project-id-default-rtdb.firebaseio.com"
   flyctl secrets set FIREBASE_SERVICE_ACCOUNT='{"type":"service_account",...}'
   ```
5. Deploy: `flyctl deploy`

**📘 Full deployment guide**: See [FLY_DEPLOYMENT.md](./FLY_DEPLOYMENT.md) for detailed step-by-step instructions, custom domain setup, troubleshooting, and more.

**No volumes needed**: Firebase handles all data storage in the cloud, so no persistent disks required.

---

#### Option 2: Render

[Render](https://render.com) supports Node.js web services with easy deployment.

**Steps:**

1. Create a new Web Service on Render
2. Connect your Git repository
3. Configure build settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Set environment variables:
   - `FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `FIREBASE_DATABASE_URL`: Your Firebase database URL
   - `FIREBASE_SERVICE_ACCOUNT`: Service account JSON (stringified)
   - `NODE_ENV`: `production`
5. Deploy!

**Note**: Render's free tier has spin-down after 15 minutes of inactivity, resulting in 50+ second cold starts. Consider Fly.io for always-on performance.

---

#### Option 3: Railway

[Railway](https://railway.app) automatically handles Node.js apps with minimal configuration.

**Steps:**

1. Create a new project on Railway
2. Connect your GitHub repository
3. Railway will auto-detect Node.js and run `npm install` and `npm start`
4. Set environment variables in Settings:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_DATABASE_URL`
   - `FIREBASE_SERVICE_ACCOUNT`
5. Deploy!

**No volumes needed**: All data is stored in Firebase Realtime Database.

---

### Static Frontend + Backend Separation

For better scalability, you can host the frontend (`index.html`) separately from the API:

#### Frontend: Netlify / Vercel

1. Create a `public/` directory and move `index.html` into it
2. Update `index.html` to point to your deployed API URL:
   ```javascript
   const API_BASE = 'https://your-api.onrender.com';
   ```
3. Deploy `public/` directory to [Netlify](https://netlify.com) or [Vercel](https://vercel.com)

#### Backend: Render / Fly / Railway

Deploy the Node.js backend using one of the options above. Make sure CORS is enabled (already configured in `server.js`).

**Benefits:**
- Frontend deploys instantly (no Node.js runtime needed)
- Backend can scale independently
- CDN benefits for static assets

**Considerations:**
- Need to update API URLs in frontend code
- CORS must be properly configured (already done)

---

### Environment Variables

Common environment variables you might want to set in production:

```bash
PORT=3000                          # Port number (often set automatically by host)
NODE_ENV=production                # Enable production optimizations
ALLOW_WEEKDAY_POSTING=false        # Weekend gating (should be false in prod)
```

## Data Persistence

### Storage Model

Textchan uses **Firebase Realtime Database** for cloud-hosted NoSQL storage:

- **Threads**: `/threads/{threadId}` - Thread content, userId, and metadata
- **Replies**: `/threads/{threadId}/replies/{replyId}` - Nested replies structure

**Data Structure:**
```json
{
  "threads": {
    "thread-id-1": {
      "body": "What are your weekend plans?",
      "userId": "anon-abc123",
      "createdAt": "2024-01-13T15:30:00.000Z",
      "replies": {
        "reply-id-1": {
          "body": "Going hiking!",
          "userId": "anon-xyz789",
          "createdAt": "2024-01-13T16:00:00.000Z"
        }
      }
    }
  }
}
```

**Storage Limits:**
- **Free tier**: 1GB total storage
- **Enforcement**: Posts rejected at 90% capacity (507 Insufficient Storage error)
- **No charges**: Never exceeds free tier limit

**Benefits:**
- **Cloud-hosted**: No server-side storage management
- **Automatic backups**: Firebase handles redundancy
- **Real-time sync**: Updates propagate instantly
- **Scalable**: Handles traffic spikes gracefully
- **No data loss**: Persistent across deployments

### Limitations

⚠️ **Current limitations in the base implementation:**

1. **No authentication**: Completely anonymous, no user accounts
2. **No moderation tools**: No way to delete threads/replies or ban users
3. **No rate limiting**: A single user could flood the board
4. **No file uploads**: Text-only posts
5. **No pagination**: All threads/replies loaded at once (can be slow with many posts)
6. **No search**: Can't search through old threads
7. **1GB storage limit**: Free tier caps at 1GB (enforced at 90%)
8. **Firebase dependency**: Requires internet connection to Firebase servers

### Production Hardening Recommendations

If you plan to run Textchan in production for a real community, consider:

#### 1. Add Rate Limiting
```bash
npm install express-rate-limit
```

Limit posts per IP address:
```javascript
const rateLimit = require('express-rate-limit');

const postLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 posts per window
  message: { error: 'Too many posts, please try again later' }
});

app.post('/api/threads', postLimiter, (req, res) => { ... });
app.post('/api/threads/:threadId/replies', postLimiter, (req, res) => { ... });
```

#### 2. Add Content Filtering
```bash
npm install bad-words
```

Filter profanity and spam:
```javascript
const Filter = require('bad-words');
const filter = new Filter();

// In your POST handlers:
const cleanContent = filter.clean(content);
```

#### 3. Add Pagination

Limit threads/replies returned per request using Firebase query methods:
```javascript
app.get('/api/threads', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 20;
  
  // Use Firebase orderBy and limitToLast for pagination
  const threadsRef = admin.database().ref('threads');
  const snapshot = await threadsRef
    .orderByChild('createdAt')
    .limitToLast(limit)
    .once('value');
  
  // Process snapshot...
});
```

#### 4. Implement Moderation

Add admin endpoints with password/token authentication to delete threads/replies:
```javascript
app.delete('/api/admin/threads/:id', authenticateAdmin, async (req, res) => {
  await admin.database().ref(`threads/${req.params.id}`).remove();
  res.json({ success: true });
});
```

#### 5. Monitor Firebase Usage

Keep track of Firebase storage and bandwidth:
- Check Firebase Console: Project Settings > Usage and Billing
- Set up Firebase usage alerts for approaching 1GB limit
- Monitor bandwidth usage (10GB/month download limit on free tier)

#### 6. Add Error Tracking

Use monitoring services to track errors and performance:
- [Sentry](https://sentry.io) for error tracking
- [LogRocket](https://logrocket.com) for session replay
- Firebase Analytics for user metrics

#### 7. Consider Firebase Blaze Plan

For high-traffic scenarios or storage needs beyond 1GB:
- **Firebase Blaze (pay-as-you-go)**:
  - Includes free tier limits
  - Only pay for usage beyond free tier
  - 1GB storage: ~$5/month
  - 10GB bandwidth: included free
- Monitor costs carefully to avoid unexpected charges

---

## Contributing

Contributions are welcome! Some ideas for enhancements:

- Add pagination for threads and replies
- Implement content moderation tools
- Add rate limiting per IP
- Support markdown formatting in posts
- Add thread archival after X days
- Implement thread bumping/pinning
- Add dark mode toggle
- Build a mobile-responsive design

## License

MIT License - feel free to fork and modify for your own use.

---

**Happy weekend posting! 🎉**
