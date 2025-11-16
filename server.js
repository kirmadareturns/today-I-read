const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;
const ALLOW_WEEKDAY_POSTING = process.env.ALLOW_WEEKDAY_POSTING === 'true';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const db = new Database(path.join(__dirname, 'textchan.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS threads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS replies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thread_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (thread_id) REFERENCES threads(id)
  );
`);

function isWeekend() {
  if (ALLOW_WEEKDAY_POSTING) {
    return true;
  }
  const now = new Date();
  const day = now.getDay();
  return day === 0 || day === 6;
}

app.get('/api/status', (req, res) => {
  const weekend = isWeekend();
  res.json({
    isWeekend: weekend,
    canPost: weekend,
    currentTime: new Date().toISOString(),
    timezone: 'UTC'
  });
});

app.get('/api/threads', (req, res) => {
  try {
    const threads = db.prepare(`
      SELECT t.id, t.content, t.created_at,
             COUNT(r.id) as reply_count
      FROM threads t
      LEFT JOIN replies r ON t.id = r.thread_id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `).all();
    
    res.json({
      threads: threads.map(t => ({
        id: t.id,
        content: t.content,
        createdAt: t.created_at,
        replyCount: t.reply_count
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

app.post('/api/threads', (req, res) => {
  if (!isWeekend()) {
    return res.status(403).json({
      error: 'Posting is only allowed on weekends',
      code: 'WEEKEND_ONLY'
    });
  }

  const { content } = req.body;
  
  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: 'Content too long (max 2000 characters)' });
  }

  try {
    const result = db.prepare(
      'INSERT INTO threads (content, created_at) VALUES (?, ?)'
    ).run(content.trim(), Date.now());

    res.status(201).json({
      id: result.lastInsertRowid,
      content: content.trim(),
      createdAt: Date.now(),
      replyCount: 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

app.get('/api/threads/:threadId/replies', (req, res) => {
  const threadId = parseInt(req.params.threadId);

  if (isNaN(threadId)) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }

  try {
    const thread = db.prepare('SELECT * FROM threads WHERE id = ?').get(threadId);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const replies = db.prepare(`
      SELECT id, content, created_at
      FROM replies
      WHERE thread_id = ?
      ORDER BY created_at ASC
    `).all(threadId);

    res.json({
      thread: {
        id: thread.id,
        content: thread.content,
        createdAt: thread.created_at
      },
      replies: replies.map(r => ({
        id: r.id,
        content: r.content,
        createdAt: r.created_at
      }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

app.post('/api/threads/:threadId/replies', (req, res) => {
  if (!isWeekend()) {
    return res.status(403).json({
      error: 'Posting is only allowed on weekends',
      code: 'WEEKEND_ONLY'
    });
  }

  const threadId = parseInt(req.params.threadId);
  const { content } = req.body;

  if (isNaN(threadId)) {
    return res.status(400).json({ error: 'Invalid thread ID' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Content is required' });
  }

  if (content.length > 2000) {
    return res.status(400).json({ error: 'Content too long (max 2000 characters)' });
  }

  try {
    const thread = db.prepare('SELECT * FROM threads WHERE id = ?').get(threadId);
    
    if (!thread) {
      return res.status(404).json({ error: 'Thread not found' });
    }

    const result = db.prepare(
      'INSERT INTO replies (thread_id, content, created_at) VALUES (?, ?, ?)'
    ).run(threadId, content.trim(), Date.now());

    res.status(201).json({
      id: result.lastInsertRowid,
      threadId: threadId,
      content: content.trim(),
      createdAt: Date.now()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create reply' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Textchan server running on http://localhost:${PORT}`);
  console.log(`Weekend posting: ${isWeekend() ? 'ENABLED' : 'DISABLED'}`);
  if (ALLOW_WEEKDAY_POSTING) {
    console.log('⚠️  Weekday posting override is ACTIVE');
  }
});

process.on('SIGINT', () => {
  db.close();
  process.exit(0);
});
