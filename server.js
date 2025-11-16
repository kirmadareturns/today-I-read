const express = require('express');
const cors = require('cors');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { promisify } = require('util');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOW_WEEKDAY_POSTING = process.env.ALLOW_WEEKDAY_POSTING === 'true';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database(path.join(__dirname, 'textchan.db'));

const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

async function initDatabase() {
  try {
    await dbRun(`
      CREATE TABLE IF NOT EXISTS threads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        body TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    await dbRun(`
      CREATE TABLE IF NOT EXISTS replies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        thread_id INTEGER NOT NULL,
        body TEXT NOT NULL,
        user_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (thread_id) REFERENCES threads(id)
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

function isWeekend() {
  if (ALLOW_WEEKDAY_POSTING) {
    return true;
  }
  const now = new Date();
  const day = now.getDay();
  return day === 0 || day === 6;
}

function getCurrentDay() {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  return days[now.getDay()];
}

function getNextChangeTimestamp() {
  if (ALLOW_WEEKDAY_POSTING) {
    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
  }
  
  const now = new Date();
  const day = now.getDay();
  
  let daysUntilChange;
  if (day === 0) {
    daysUntilChange = 1;
  } else if (day === 6) {
    daysUntilChange = 2;
  } else {
    daysUntilChange = 6 - day;
  }
  
  const nextChange = new Date(now);
  nextChange.setDate(now.getDate() + daysUntilChange);
  nextChange.setHours(0, 0, 0, 0);
  
  return nextChange.toISOString();
}

app.get('/api/status', (req, res) => {
  res.json({
    postingEnabled: isWeekend(),
    currentDay: getCurrentDay(),
    nextChangeTimestamp: getNextChangeTimestamp()
  });
});

app.get('/api/threads', async (req, res) => {
  try {
    const threads = await dbAll(`
      SELECT id, body, user_id, created_at
      FROM threads
      ORDER BY created_at DESC
    `);
    
    const threadsWithReplies = await Promise.all(threads.map(async (thread) => {
      const replies = await dbAll(`
        SELECT id, body, user_id, created_at
        FROM replies
        WHERE thread_id = ?
        ORDER BY created_at ASC
      `, thread.id);
      
      return {
        id: thread.id,
        body: thread.body,
        userId: thread.user_id,
        createdAt: thread.created_at,
        replies: replies.map(r => ({
          id: r.id,
          body: r.body,
          userId: r.user_id,
          createdAt: r.created_at
        }))
      };
    }));
    
    res.json(threadsWithReplies);
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
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO threads (body, user_id, created_at) VALUES (?, ?, ?)',
        [trimmedBody, userId.trim(), createdAt],
        function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        }
      );
    });

    res.status(201).json({
      id: result.lastID,
      body: trimmedBody,
      userId: userId.trim(),
      createdAt: createdAt,
      replies: []
    });
  } catch (error) {
    console.error('Error creating thread:', error);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

app.get('/api/threads/:threadId/replies', async (req, res) => {
  const threadId = parseInt(req.params.threadId);

  if (isNaN(threadId)) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }

  try {
    const thread = await dbGet('SELECT * FROM threads WHERE id = ?', threadId);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const replies = await dbAll(`
      SELECT id, body, user_id, created_at
      FROM replies
      WHERE thread_id = ?
      ORDER BY created_at ASC
    `, threadId);

    res.json({
      thread: {
        id: thread.id,
        body: thread.body,
        userId: thread.user_id,
        createdAt: thread.created_at
      },
      replies: replies.map(r => ({
        id: r.id,
        body: r.body,
        userId: r.user_id,
        createdAt: r.created_at
      }))
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

  const threadId = parseInt(req.params.threadId);
  const { body, userId } = req.body;

  if (isNaN(threadId)) {
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
    const thread = await dbGet('SELECT * FROM threads WHERE id = ?', threadId);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const createdAt = new Date().toISOString();
    const result = await new Promise((resolve, reject) => {
      db.run(
        'INSERT INTO replies (thread_id, body, user_id, created_at) VALUES (?, ?, ?, ?)',
        [threadId, trimmedBody, userId.trim(), createdAt],
        function(err) {
          if (err) reject(err);
          else resolve({ lastID: this.lastID });
        }
      );
    });

    res.status(201).json({
      id: result.lastID,
      threadId: threadId,
      body: trimmedBody,
      userId: userId.trim(),
      createdAt: createdAt
    });
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`Textchan server running on http://localhost:${PORT}`);
    console.log(`Weekend posting: ${isWeekend() ? 'ENABLED' : 'DISABLED'}`);
    if (ALLOW_WEEKDAY_POSTING) {
      console.log('⚠️  Weekday posting override is ACTIVE');
    }
  });
}

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    }
    process.exit(0);
  });
});
