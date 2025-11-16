# Testing Checklist for Firebase Migration

## Pre-Deployment Tests

### 1. Environment Setup
- [ ] `.env` file created with Firebase credentials
- [ ] `FIREBASE_PROJECT_ID` is set
- [ ] `FIREBASE_DATABASE_URL` is set
- [ ] Firebase Realtime Database is enabled in Firebase Console
- [ ] Database rules allow public read, server-side writes only

### 2. Local Development Tests

#### Start the Server
```bash
ALLOW_WEEKDAY_POSTING=true npm start
```

Expected output:
```
Firebase initialized successfully
Database URL: https://your-project-id-default-rtdb.firebaseio.com
Textchan server running on http://localhost:3000
Weekend posting: ENABLED
✓ Using Firebase Realtime Database for storage
⚠️  Weekday posting override is ACTIVE
```

#### Test API Endpoints

**GET /api/status**
- [ ] Returns posting status
- [ ] Returns storage limit information
- [ ] Returns next change timestamp

```bash
curl http://localhost:3000/api/status
```

Expected response:
```json
{
  "postingEnabled": true,
  "currentDay": "Monday",
  "nextChangeTimestamp": "2024-XX-XXTXX:00:00.000Z",
  "storage": {
    "limitReached": false,
    "usagePercent": 0.00
  }
}
```

**GET /api/threads**
- [ ] Returns empty array for new database
- [ ] Returns array of threads after posting

```bash
curl http://localhost:3000/api/threads
```

**POST /api/threads**
- [ ] Creates new thread successfully
- [ ] Returns 403 on weekdays (without ALLOW_WEEKDAY_POSTING)
- [ ] Returns 507 when storage limit reached
- [ ] Returns 400 for invalid input

```bash
curl -X POST http://localhost:3000/api/threads \
  -H "Content-Type: application/json" \
  -d '{"body":"Test thread","userId":"TEST1234"}'
```

**GET /api/threads/:threadId/replies**
- [ ] Returns thread with empty replies array
- [ ] Returns 404 for non-existent thread

```bash
# Replace THREAD_ID with actual thread ID from Firebase
curl http://localhost:3000/api/threads/THREAD_ID/replies
```

**POST /api/threads/:threadId/replies**
- [ ] Creates reply successfully
- [ ] Returns 403 on weekdays (without ALLOW_WEEKDAY_POSTING)
- [ ] Returns 507 when storage limit reached
- [ ] Returns 404 for non-existent thread

```bash
curl -X POST http://localhost:3000/api/threads/THREAD_ID/replies \
  -H "Content-Type: application/json" \
  -d '{"body":"Test reply","userId":"TEST1234"}'
```

### 3. Frontend Tests

Open `http://localhost:3000` in browser:

**Initial Load**
- [ ] Page loads without errors
- [ ] Status banner shows correct posting status
- [ ] User ID is generated and displayed
- [ ] Countdown timer works
- [ ] Storage status is displayed (if at limit)

**Creating Threads**
- [ ] Can type in textarea (when posting enabled)
- [ ] Character counter updates
- [ ] Submit button works
- [ ] Thread appears in list after posting
- [ ] Error message shows when storage limit reached

**Viewing Threads**
- [ ] Threads display correctly
- [ ] "Show Replies" button works
- [ ] Reply count is correct
- [ ] Timestamps format correctly

**Creating Replies**
- [ ] Reply form appears when thread is expanded
- [ ] Can type reply
- [ ] Character counter works
- [ ] Reply submits successfully
- [ ] Reply appears in thread

**Weekend Gating**
- [ ] Form disabled on weekdays (without override)
- [ ] Message shows "Posting is only allowed on weekends"
- [ ] Form enabled on weekends
- [ ] Countdown shows time until next state change

**Storage Limit Handling**
- [ ] When limit reached, status banner shows "⚠ Storage limit reached"
- [ ] Post forms are disabled
- [ ] Message shows "The site is at capacity. Check back later!"
- [ ] POST requests return 507 error
- [ ] Error message displays to user

### 4. Data Persistence Tests

**Restart Test**
- [ ] Create a thread
- [ ] Stop server (Ctrl+C)
- [ ] Restart server
- [ ] Verify thread still exists
- [ ] Verify replies still exist

**Firebase Console Verification**
- [ ] Open Firebase Console > Realtime Database
- [ ] Verify data structure matches: `/threads/{id}` with `body`, `userId`, `createdAt`
- [ ] Verify replies nested under `/threads/{id}/replies/{replyId}`
- [ ] Verify data persists

### 5. Storage Limit Tests

**Simulate Near-Limit**

To test storage limit behavior, you can temporarily modify `firebase.js`:

```javascript
// Change line:
const STORAGE_WARNING_THRESHOLD = 0.9;

// To:
const STORAGE_WARNING_THRESHOLD = 0.0001; // Trigger at very small size
```

Then:
- [ ] Start server
- [ ] Try to post a thread
- [ ] Verify 507 error is returned
- [ ] Verify UI shows capacity message
- [ ] Revert the change

**Monitor Storage Usage**

In server logs, verify storage logging appears:
```
Storage usage: 0.05 MB (0.00%)
```

## Production Deployment Tests (Render)

### 1. Environment Variables
- [ ] `FIREBASE_PROJECT_ID` set in Render
- [ ] `FIREBASE_DATABASE_URL` set in Render
- [ ] `FIREBASE_SERVICE_ACCOUNT` set in Render (full JSON)
- [ ] `PORT` not needed (Render provides)
- [ ] `ALLOW_WEEKDAY_POSTING` is NOT set (unless testing)

### 2. Deployment
- [ ] Push code to GitHub
- [ ] Render auto-deploys
- [ ] Check Render logs for "Firebase initialized successfully"
- [ ] No errors in deployment logs

### 3. Live Site Tests
- [ ] Visit live URL
- [ ] Test creating threads on weekend
- [ ] Test creating replies
- [ ] Test posting disabled on weekdays
- [ ] Refresh page, verify data persists
- [ ] Open multiple browser tabs, verify concurrent access works

### 4. Firebase Console Checks
- [ ] Verify data appears in Firebase Console
- [ ] Check storage usage (Usage tab)
- [ ] Verify read/write operations (Usage tab)
- [ ] Confirm no errors in Firebase logs

## Security Verification

### Firebase Security
- [ ] Billing is disabled (no payment method)
- [ ] Plan is "Spark (Free)"
- [ ] Database rules prevent direct client writes
- [ ] Service account key not committed to git
- [ ] `.env` file in `.gitignore`

### Application Security
- [ ] Input validation works (max 2000 chars)
- [ ] XSS protection (content is escaped)
- [ ] CORS configured properly
- [ ] No sensitive data in client logs

## Performance Tests

### Load Testing (Optional)
- [ ] Create 10+ threads rapidly
- [ ] Create 50+ replies on one thread
- [ ] Verify performance remains acceptable
- [ ] Check storage usage increases appropriately

### Concurrent Users (Optional)
- [ ] Open site in multiple browsers
- [ ] Post from different browsers simultaneously
- [ ] Verify all posts appear correctly
- [ ] No data corruption or race conditions

## Rollback Plan

If migration fails:
1. Revert to previous commit with SQLite
2. Redeploy to Render
3. Note: Data posted to Firebase will be preserved but not accessible in SQLite version

## Success Criteria

All of the following must be true:
- ✅ Server starts without errors
- ✅ All API endpoints work correctly
- ✅ Data persists across restarts
- ✅ Weekend gating works
- ✅ Storage limit enforcement works
- ✅ Frontend displays data correctly
- ✅ No SQLite files created
- ✅ Firebase Console shows data
- ✅ Billing remains disabled
- ✅ Live site works on Render

## Common Issues and Solutions

### "Firebase environment variables are not set"
- Check `.env` file exists and has correct values
- Verify no typos in variable names
- For Render: Check environment variables in dashboard

### "Permission denied" in Firebase
- Check database rules allow public read
- Verify service account has proper permissions
- Confirm Firebase Admin SDK initialized correctly

### "Network error" from frontend
- Check CORS is enabled in server
- Verify API endpoints return correct status codes
- Check browser console for errors

### High storage usage
- Check for large thread bodies
- Verify storage limit check is working
- Consider implementing data cleanup (future enhancement)

### Posts not persisting
- Verify Firebase credentials are correct
- Check Firebase Console for data
- Verify no write errors in server logs
