
const express = require('express');
const cors = require('cors');
const path = require('path');
const {
  initializeFirebase,
  checkStorageLimit,
  createThread,
  getAllThreads,
  getThreadById,
  getRepliesByThreadId,
  createReply,
  cleanup
} = require('./firebase');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOW_WEEKDAY_POSTING = process.env.ALLOW_WEEKDAY_POSTING === 'true';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function isWeekend() {
  if (ALLOW_WEEKDAY_POSTING) {
    return true;
  }
  const now = new Date();
  const day = now.getUTCDay();
  return day === 0 || day === 6;
}

function getNextChangeTimestamp() {
  const now = new Date();
  const day = now.getUTCDay();
  const hours = now.getUTCHours();
  const minutes = now.getUTCMinutes();
  const seconds = now.getUTCSeconds();

  let daysUntilChange;
  if (day === 0) {
    daysUntilChange = 1;
  } else if (day > 0 && day < 6) {
    daysUntilChange = 6 - day;
  } else {
    daysUntilChange = 2;
  }
  
  const nextChange = new Date(now);
  nextChange.setUTCDate(now.getUTCDate() + daysUntilChange);
  nextChange.setUTCHours(0, 0, 0, 0);
  
  return nextChange.toISOString();
}

app.get('/api/status', async (req, res) => {
  let storageStatus = { limitReached: false, usagePercent: 0 };
  try {
    storageStatus = await checkStorageLimit();
  } catch (error) {
    console.error('Error fetching storage status:', error);
  }

  res.json({
    postingEnabled: isWeekend(),
    nextChangeTimestamp: getNextChangeTimestamp(),
    storage: storageStatus,
  });
});

app.get('/api/threads', async (req, res) => {
  try {
    const threads = await getAllThreads();
    res.json(threads);
  } catch (error) {
    console.error('Error fetching threads:', error);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

app.post('/api/threads', async (req, res) => {
  if (!isWeekend()) {
    return res.status(403).json({
      error: 'Posting is only allowed on weekends'
    });
  }

  const { body, userId } = req.body;
  
  if (!body || body.trim().length === 0) {
    return res.status(400).json({ error: 'Body is required' });
  }

  if (!userId || userId.trim().length === 0) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const trimmedBody = body.trim();
  
  if (trimmedBody.length > 2000) {
    return res.status(400).json({ error: 'Body too long (max 2000 characters)' });
  }

  try {
    const createdAt = new Date().toISOString();
    const thread = await createThread(trimmedBody, userId.trim(), createdAt);
    
    res.status(201).json(thread);
  } catch (error) {
    console.error('Error creating thread:', error);
    
    if (error.message === 'STORAGE_LIMIT_REACHED') {
      return res.status(507).json({
        error: 'Storage limit reached. Posts temporarily disabled.',
        storageLimit: true
      });
    }
    
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

app.get('/api/threads/:threadId/replies', async (req, res) => {
  const { threadId } = req.params;

  if (!threadId) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }

  try {
    const thread = await getThreadById(threadId);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const replies = await getRepliesByThreadId(threadId);

    res.json({
      thread,
      replies
    });
  } catch (error) {
    console.error('Error fetching thread:', error);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

app.post('/api/threads/:threadId/replies', async (req, res) => {
  if (!isWeekend()) {
    return res.status(403).json({
      error: 'Posting is only allowed on weekends'
    });
  }

  const { threadId } = req.params;
  const { body, userId } = req.body;

  if (!threadId) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }

  if (!body || body.trim().length === 0) {
    return res.status(400).json({ error: 'Body is required' });
  }

  if (!userId || userId.trim().length === 0) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  const trimmedBody = body.trim();

  if (trimmedBody.length > 2000) {
    return res.status(400).json({ error: 'Body too long (max 2000 characters)' });
  }

  try {
    const createdAt = new Date().toISOString();
    const reply = await createReply(threadId, trimmedBody, userId.trim(), createdAt);
    
    res.status(201).json(reply);
  } catch (error) {
    console.error('Error creating reply:', error);
    
    if (error.message === 'STORAGE_LIMIT_REACHED') {
      return res.status(507).json({
        error: 'Storage limit reached. Posts temporarily disabled.',
        storageLimit: true
      });
    }
    
    if (error.message === 'THREAD_NOT_FOUND') {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.status(500).json({ error: 'Failed to create reply' });
  }
});
app.get('/api/threads/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial threads
  (async () => {
    try {
      const threads = await getAllThreads();
      threads.forEach(thread => {
        res.write(`event: thread-added\n`);
        res.write(`data: ${JSON.stringify(thread)}\n\n`);
      });
    } catch (error) {
      console.error('Error streaming threads:', error);
    }
  })();
  
  // Keep connection alive
  const interval = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 30000);
  
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

async function startServer() {
  try {
    await initializeFirebase();
    
    app.listen(PORT, () => {
      console.log(`Textchan server running on http://localhost:${PORT}`);
      console.log(`Weekend posting: ${isWeekend() ? 'ENABLED' : 'DISABLED'}`);
      if (ALLOW_WEEKDAY_POSTING) {
        console.log('⚠️  Weekday posting override is ACTIVE');
      }
      console.log('✓ Using Firebase Realtime Database for storage');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('Shutting down gracefully...');
  try {
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
});
