const admin = require('firebase-admin');

const STORAGE_LIMIT_BYTES = 1024 * 1024 * 1024;
const STORAGE_WARNING_THRESHOLD = 0.9;

let db = null;
let firebaseApp = null;

function initializeFirebase() {
  return new Promise((resolve, reject) => {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const databaseURL = process.env.FIREBASE_DATABASE_URL;

      if (!projectId || !databaseURL) {
        throw new Error('Firebase environment variables are not set. Required: FIREBASE_PROJECT_ID, FIREBASE_DATABASE_URL');
      }

      const credential = process.env.FIREBASE_SERVICE_ACCOUNT
        ? admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT))
        : admin.credential.applicationDefault();

      firebaseApp = admin.initializeApp({
        credential,
        databaseURL,
        projectId
      });

      db = admin.database();

      console.log('Firebase initialized successfully');
      console.log(`Database URL: ${databaseURL}`);
      resolve(db);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      reject(error);
    }
  });
}

async function checkStorageLimit() {
  try {
    const snapshot = await db.ref('/').get();
    const dataSize = JSON.stringify(snapshot.val() || {}).length;
    
    const usagePercent = (dataSize / STORAGE_LIMIT_BYTES) * 100;
    const limitReached = dataSize >= (STORAGE_LIMIT_BYTES * STORAGE_WARNING_THRESHOLD);
    
    console.log(`Storage usage: ${(dataSize / 1024 / 1024).toFixed(2)} MB (${usagePercent.toFixed(2)}%)`);
    
    return {
      limitReached,
      currentSize: dataSize,
      maxSize: STORAGE_LIMIT_BYTES,
      usagePercent
    };
  } catch (error) {
    console.error('Error checking storage limit:', error);
    return {
      limitReached: false,
      currentSize: 0,
      maxSize: STORAGE_LIMIT_BYTES,
      usagePercent: 0
    };
  }
}

async function createThread(body, userId, createdAt) {
  const storageCheck = await checkStorageLimit();
  if (storageCheck.limitReached) {
    throw new Error('STORAGE_LIMIT_REACHED');
  }

  const threadRef = db.ref('threads').push();
  await threadRef.set({
    body,
    userId,
    createdAt
  });

  return {
    id: threadRef.key,
    body,
    userId,
    createdAt,
    replies: []
  };
}

async function getAllThreads() {
  const snapshot = await db.ref('threads').orderByChild('createdAt').once('value');
  const threadsData = snapshot.val() || {};
  
  const threads = await Promise.all(
    Object.entries(threadsData).map(async ([threadId, thread]) => {
      const replies = await getRepliesByThreadId(threadId);
      return {
        id: threadId,
        body: thread.body,
        userId: thread.userId,
        createdAt: thread.createdAt,
        replies
      };
    })
  );
  
  threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  return threads;
}

async function getThreadById(threadId) {
  const snapshot = await db.ref(`threads/${threadId}`).once('value');
  const thread = snapshot.val();
  
  if (!thread) {
    return null;
  }
  
  return {
    id: threadId,
    body: thread.body,
    userId: thread.userId,
    createdAt: thread.createdAt
  };
}

async function getRepliesByThreadId(threadId) {
  const snapshot = await db.ref(`threads/${threadId}/replies`).orderByChild('createdAt').once('value');
  const repliesData = snapshot.val() || {};
  
  const replies = Object.entries(repliesData).map(([replyId, reply]) => ({
    id: replyId,
    body: reply.body,
    userId: reply.userId,
    createdAt: reply.createdAt
  }));
  
  replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  return replies;
}

async function createReply(threadId, body, userId, createdAt) {
  const storageCheck = await checkStorageLimit();
  if (storageCheck.limitReached) {
    throw new Error('STORAGE_LIMIT_REACHED');
  }

  const thread = await getThreadById(threadId);
  if (!thread) {
    throw new Error('THREAD_NOT_FOUND');
  }

  const replyRef = db.ref(`threads/${threadId}/replies`).push();
  await replyRef.set({
    body,
    userId,
    createdAt
  });

  return {
    id: replyRef.key,
    threadId,
    body,
    userId,
    createdAt
  };
}

function getDatabase() {
  return db;
}

function cleanup() {
  if (firebaseApp) {
    return firebaseApp.delete();
  }
}

module.exports = {
  initializeFirebase,
  checkStorageLimit,
  createThread,
  getAllThreads,
  getThreadById,
  getRepliesByThreadId,
  createReply,
  getDatabase,
  cleanup
};
