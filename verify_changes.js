#!/usr/bin/env node

// Verify all the key changes have been made correctly

const fs = require('fs');
const path = require('path');

console.log('Verifying all fixes have been applied...\n');

let passCount = 0;
let failCount = 0;

function check(name, condition, details = '') {
  if (condition) {
    console.log(`✓ ${name}`);
    if (details) console.log(`  ${details}`);
    passCount++;
  } else {
    console.log(`✗ ${name}`);
    if (details) console.log(`  ${details}`);
    failCount++;
  }
}

// Check 1: server.js has UTC timezone in /api/status
const serverJs = fs.readFileSync(path.join(__dirname, 'server.js'), 'utf8');
check(
  'Issue 1: server.js includes timezone in /api/status',
  serverJs.includes("timezone: 'UTC'") && serverJs.includes('currentTimestamp'),
  'Response includes timezone: "UTC" and currentTimestamp'
);

// Check 2: firebase.js uses replyCount instead of replies arrays
const firebaseJs = fs.readFileSync(path.join(__dirname, 'firebase.js'), 'utf8');
check(
  'Issue 2: getAllThreads() returns replyCount',
  firebaseJs.includes('const replyCount =') && firebaseJs.includes('replyCount'),
  'getAllThreads returns replyCount instead of full replies array'
);

check(
  'Issue 2: setupThreadListener() returns replyCount',
  firebaseJs.match(/setupThreadListener[\s\S]*?const replyCount = \(threadData\.replies/),
  'Real-time listener events include replyCount'
);

// Check 3: SPA fallback already correct (should be unchanged)
check(
  'Issue 3: SPA fallback serves public/index.html',
  serverJs.includes("res.sendFile(path.join(__dirname, 'public', 'index.html'))"),
  'Wildcard route serves /public/index.html for deep-linking'
);

// Check 4: app.js tracks open threads
const appJs = fs.readFileSync(path.join(__dirname, 'public/app.js'), 'utf8');
check(
  'Issue 4: app.js tracks open threads',
  appJs.includes('this.openThreads = new Set()'),
  'Constructor initializes openThreads Set for tracking'
);

check(
  'Issue 4: app.js has loadAndRenderReplies method',
  appJs.includes('async loadAndRenderReplies(threadId)'),
  'New method loads and renders replies while keeping panel open'
);

check(
  'Issue 4: renderThread uses replyCount',
  appJs.includes('const replyCount = thread.replyCount || 0'),
  'Thread rendering uses thread.replyCount property'
);

check(
  'Issue 4: renderThreads restores open sections',
  appJs.includes('this.openThreads.forEach(threadId =>') && appJs.includes('this.loadAndRenderReplies(threadId)'),
  'After DOM rebuild, open threads are restored'
);

check(
  'Issue 4: refreshReplies method exists',
  appJs.includes('async refreshReplies(threadId)'),
  'New method keeps replies panel open after posting'
);

// Check 5: Client resilience improvements
check(
  'Issue 5: getOrCreateUserId has try/catch',
  appJs.includes('} catch (error) {') && appJs.includes('this.inMemoryUserId'),
  'localStorage access protected with fallback to in-memory ID'
);

check(
  'Issue 5: fetchStatus checks response.ok',
  appJs.includes('fetchStatus()') && appJs.includes('if (!response.ok)'),
  'Response validation prevents crashes on errors'
);

check(
  'Issue 5: fetchThreads checks response.ok and validates array',
  appJs.includes('Array.isArray(data)'),
  'Thread fetching validates response is an array'
);

check(
  'Issue 5: showThreadsError method exists',
  appJs.includes('showThreadsError(message)'),
  'Error display method for thread list failures'
);

// Check 6: CSS error message styling
const stylesJs = fs.readFileSync(path.join(__dirname, 'public/styles.css'), 'utf8');
check(
  'Issue 5: CSS error messages visibility controlled',
  stylesJs.includes('.error-message.visible') && stylesJs.includes('display: none;'),
  'Error messages hidden by default, shown with .visible class'
);

// Check 7: HTML has protected localStorage
const indexHtml = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
check(
  'Issue 5: HTML localStorage access protected',
  indexHtml.includes('try {') && indexHtml.includes('localStorage.getItem'),
  'Theme toggle localStorage wrapped in try/catch'
);

console.log(`\n${passCount}/${passCount + failCount} checks passed`);

if (failCount === 0) {
  console.log('✓ All fixes have been applied successfully!');
  process.exit(0);
} else {
  console.log(`✗ ${failCount} check(s) failed`);
  process.exit(1);
}
