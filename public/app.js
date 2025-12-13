class TextchanApp {
  constructor() {
    this.inMemoryUserId = null;
    this.userId = this.getOrCreateUserId();
    this.status = null;
    this.threads = [];
    this.countdownInterval = null;
    this.statusInterval = null;
    this.openThreads = new Set();
    this.loadingThreads = new Set();
    
    // Initialize UX Components
    this.initToastContainer();
    
    this.init();
  }

  // --- UX: Toast Notification System ---
  initToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Remove after 3 seconds (matches CSS animation)
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // --- UX: Auto-Resize Textarea ---
  autoResize(element) {
    element.style.height = 'auto';
    element.style.height = element.scrollHeight + 'px';
  }

  getOrCreateUserId() {
    try {
      let userId = localStorage.getItem('textchan_user_id');
      if (!userId) {
        userId = this.generateUserId();
        localStorage.setItem('textchan_user_id', userId);
      }
      return userId;
    } catch (error) {
      console.warn('localStorage unavailable (private mode?), using in-memory user ID:', error);
      if (!this.inMemoryUserId) {
        this.inMemoryUserId = this.generateUserId();
      }
      return this.inMemoryUserId;
    }
  }

  generateUserId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let id = '';
    for (let i = 0; i < 8; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
  }

  init() {
    this.displayUserId(); // Includes the shuffle effect
    this.setupEventListeners();
    this.fetchStatus();
    
    // UX: Show skeletons immediately before fetching
    this.renderSkeletons(); 
    this.fetchThreads();
    
    this.setupRealtimeListeners();
    this.statusInterval = setInterval(() => this.fetchStatus(), 30000);
  }

  // --- UX: Hacker Shuffle Effect ---
  displayUserId() {
    const el = document.getElementById('user-id');
    const finalId = this.userId;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let iterations = 0;
    
    const interval = setInterval(() => {
      el.innerText = Array(8).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
      iterations++;
      if (iterations > 12) { // Run for about 600ms
        clearInterval(interval);
        el.innerText = finalId;
      }
    }, 50);
  }

  // --- UX: Skeleton Loading ---
  renderSkeletons() {
    const container = document.getElementById('threads-container');
    container.innerHTML = '';
    for(let i=0; i<3; i++) {
        const div = document.createElement('div');
        div.className = 'thread';
        // Note: Ensure styles.css has the .skeleton classes provided previously
        div.innerHTML = `
            <div class="skeleton skeleton-header"></div>
            <div class="skeleton skeleton-text"></div>
            <div class="skeleton skeleton-text"></div>
        `;
        container.appendChild(div);
    }
  }

  setupEventListeners() {
    const threadForm = document.getElementById('new-thread-form');
    const threadContent = document.getElementById('thread-content');
    const threadCharCount = document.getElementById('thread-char-count');

    // UX: Auto-expand and char count color warning
    threadContent.addEventListener('input', (e) => {
      this.autoResize(e.target);
      const len = e.target.value.length;
      threadCharCount.textContent = len;
      
      if(len > 1800) {
        threadCharCount.style.color = '#ef5350';
        threadCharCount.style.fontWeight = 'bold';
      } else {
        threadCharCount.style.color = '#888';
        threadCharCount.style.fontWeight = 'normal';
      }
    });

    threadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleNewThread();
    });
  }

  async fetchStatus() {
    try {
      const response = await fetch('/api/status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch status`);
      }
      const data = await response.json();
      this.status = data;
      this.updateStatusUI();
      this.startCountdown();
    } catch (error) {
      console.error('Failed to fetch status:', error);
      this.showStatusError();
    }
  }

  updateStatusUI() {
    const banner = document.getElementById('status-banner');
    const statusMessage = banner.querySelector('.status-message');
    const threadContent = document.getElementById('thread-content');
    const threadSubmit = document.querySelector('#new-thread-form button[type="submit"]');
    const threadDisabledMessage = document.getElementById('thread-disabled-message');
    const threadError = document.getElementById('thread-error');

    const storageLimit = this.status.storage && this.status.storage.limitReached;

    // Reset classes first
    banner.classList.remove('enabled', 'disabled');
    threadDisabledMessage.classList.remove('visible');
    threadError.classList.remove('visible');

    if (storageLimit) {
      banner.classList.add('disabled');
      statusMessage.textContent = '⚠ Storage limit reached';
      threadContent.disabled = true;
      threadSubmit.disabled = true;
      threadDisabledMessage.textContent = 'The site is at capacity. Check back later!';
      threadDisabledMessage.classList.add('visible');
    } else if (this.status.postingEnabled) {
      banner.classList.add('enabled');
      statusMessage.textContent = '✓ Posting is currently enabled';
      threadContent.disabled = false;
      threadSubmit.disabled = false;
    } else {
      banner.classList.add('disabled');
      statusMessage.textContent = '✗ Posting is currently disabled';
      threadContent.disabled = true;
      threadSubmit.disabled = true;
      threadDisabledMessage.textContent = 'Posting is only allowed on weekends (Saturday and Sunday, UTC timezone)';
      threadDisabledMessage.classList.add('visible');
    }

    this.updateAllReplyForms();
  }

  updateAllReplyForms() {
    const replyForms = document.querySelectorAll('.reply-form');
    replyForms.forEach(form => {
      const textarea = form.querySelector('textarea');
      const button = form.querySelector('button[type="submit"]');
      const disabledMessage = form.querySelector('.disabled-message');
      
      // Logic remains same, just cleaner DOM manipulation
      const storageLimit = this.status && this.status.storage && this.status.storage.limitReached;
      
      if (disabledMessage) disabledMessage.classList.remove('visible');

      if (storageLimit) {
        textarea.disabled = true;
        button.disabled = true;
        if (disabledMessage) {
            disabledMessage.textContent = 'Site at capacity.';
            disabledMessage.classList.add('visible');
        }
      } else if (this.status && this.status.postingEnabled) {
        textarea.disabled = false;
        button.disabled = false;
      } else {
        textarea.disabled = true;
        button.disabled = true;
        if (disabledMessage) {
            disabledMessage.textContent = 'Weekends only.';
            disabledMessage.classList.add('visible');
        }
      }
    });
  }

  showStatusError() {
    // Instead of changing the banner aggressively, let's just use a toast
    // to keep the UI clean, or subtle text.
    const statusMessage = document.querySelector('.status-message');
    statusMessage.textContent = 'Reconnecting...';
  }

  showThreadsError(message) {
    const container = document.getElementById('threads-container');
    const emptyState = document.getElementById('threads-empty');
    
    emptyState.style.display = 'block';
    emptyState.innerHTML = `<p style="color: var(--error);">${this.escapeHtml(message)}</p>`;
    container.innerHTML = '';
  }

  startCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.updateCountdown();
    this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
  }

  updateCountdown() {
    if (!this.status || !this.status.nextChangeTimestamp) return;

    const countdownEl = document.getElementById('countdown');
    const now = new Date();
    const target = new Date(this.status.nextChangeTimestamp);
    const diff = target - now;

    if (diff <= 0) {
      countdownEl.textContent = 'Refreshing status...';
      this.fetchStatus();
      return;
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0 || days > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);

    const action = this.status.postingEnabled ? 'until posting closes' : 'until posting opens';
    countdownEl.textContent = `${parts.join(' ')} ${action}`;
  }

  sortThreads() {
    this.threads.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  setupRealtimeListeners() {
    const threadEventSource = new EventSource('/api/threads/stream');
    
    threadEventSource.addEventListener('thread-added', (event) => {
      const thread = JSON.parse(event.data);
      const exists = this.threads.find(t => t.id === thread.id);
      if (!exists) {
        this.threads.unshift(thread);
        this.sortThreads();
        this.renderThreads();
        this.showToast('New thread received', 'success');
      }
    });
    
    threadEventSource.addEventListener('thread-modified', (event) => {
      const thread = JSON.parse(event.data);
      const index = this.threads.findIndex(t => t.id === thread.id);
      if (index !== -1) {
        this.threads[index] = thread;
        this.sortThreads();
        this.renderThreads();
      }
    });
    
    threadEventSource.addEventListener('thread-removed', (event) => {
      const threadId = event.data;
      this.threads = this.threads.filter(t => t.id !== threadId);
      this.renderThreads();
    });
    
    threadEventSource.addEventListener('error', () => {
      console.log('Real-time connection lost, falling back to polling');
      threadEventSource.close();
    });
  }

  async fetchThreads() {
    try {
      const response = await fetch('/api/threads');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch threads`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Invalid threads data received');
      }
      this.threads = data;
      this.sortThreads();
      this.renderThreads();
    } catch (error) {
      console.error('Failed to fetch threads:', error);
      this.showThreadsError('Failed to load threads. Retrying...');
    }
  }

  renderThreads() {
    const container = document.getElementById('threads-container');
    const emptyState = document.getElementById('threads-empty');

    if (this.threads.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';
    container.innerHTML = this.threads.map(thread => this.renderThread(thread)).join('');
    
    this.threads.forEach(thread => {
      const toggleBtn = document.getElementById(`toggle-${thread.id}`);
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => this.toggleReplies(thread.id));
      }
    });

    // Restore open reply sections
    this.openThreads.forEach(threadId => {
      const repliesSection = document.getElementById(`replies-${threadId}`);
      if (repliesSection && !this.loadingThreads.has(threadId)) {
        this.loadAndRenderReplies(threadId);
      }
    });

    this.setupReadMoreButtons();
  }

  renderThread(thread) {
    const replyCount = thread.replyCount || 0;
    const isOpen = this.openThreads.has(thread.id);
    const lines = thread.body.split('\n');
    const needsTruncation = lines.length > 3;
    
    let contentHtml = '';
    if (needsTruncation) {
      const truncatedText = lines.slice(0, 3).join('\n');
      contentHtml = `
        <div class="thread-content" data-truncated="true">
          <div class="content-truncated">${this.escapeHtml(truncatedText)}<span class="truncated-indicator">...</span></div>
          <div class="content-full hidden">${this.escapeHtml(thread.body)}</div>
          <button class="read-more-btn" data-content-id="thread-${thread.id}">[Read More]</button>
        </div>
      `;
    } else {
      contentHtml = `<div class="thread-content">${this.escapeHtml(thread.body)}</div>`;
    }
    
    const repliesSectionClass = isOpen ? '' : 'hidden';
    const toggleButtonText = isOpen ? '[Hide Replies]' : '[Show Replies]';
    
    // Note: The 'thread' class in CSS handles the slide-up animation automatically
    return `
      <div class="thread" data-thread-id="${thread.id}">
        <div class="thread-header">
          <span class="thread-id">#${thread.id}</span> 
          Anonymous/${thread.userId} 
          <span class="thread-timestamp">${this.formatTimestamp(thread.createdAt)}</span>
        </div>
        ${contentHtml}
        <div class="thread-footer">
          <span class="reply-count">${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}</span>
          <button id="toggle-${thread.id}" class="btn btn-secondary">${toggleButtonText}</button>
        </div>
        <div id="replies-${thread.id}" class="replies-section ${repliesSectionClass}"></div>
      </div>
    `;
  }

  async toggleReplies(threadId) {
    const repliesSection = document.getElementById(`replies-${threadId}`);
    const toggleBtn = document.getElementById(`toggle-${threadId}`);

    if (repliesSection.classList.contains('hidden')) {
      this.openThreads.add(threadId);
      await this.loadAndRenderReplies(threadId);
    } else {
      this.openThreads.delete(threadId);
      repliesSection.classList.add('hidden');
      if (toggleBtn) {
        toggleBtn.textContent = '[Show Replies]';
      }
    }
  }

  async loadAndRenderReplies(threadId) {
    const repliesSection = document.getElementById(`replies-${threadId}`);
    const toggleBtn = document.getElementById(`toggle-${threadId}`);

    if (!repliesSection) return;

    this.loadingThreads.add(threadId);
    if (toggleBtn) {
      toggleBtn.textContent = 'Loading...';
      toggleBtn.disabled = true;
    }
    
    try {
      const response = await fetch(`/api/threads/${threadId}/replies`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch replies`);
      }
      const data = await response.json();
      
      repliesSection.innerHTML = this.renderRepliesSection(threadId, data.replies);
      repliesSection.classList.remove('hidden');
      if (toggleBtn) {
        toggleBtn.textContent = '[Hide Replies]';
        toggleBtn.disabled = false;
      }

      this.setupReplyForm(threadId);
      this.setupReadMoreButtons();
    } catch (error) {
      console.error('Failed to fetch replies:', error);
      this.showToast('Failed to fetch replies', 'error');
      this.openThreads.delete(threadId);
      if (toggleBtn) {
        toggleBtn.textContent = '[Show Replies]';
        toggleBtn.disabled = false;
      }
    } finally {
      this.loadingThreads.delete(threadId);
    }
  }

  setupReadMoreButtons() {
    const readMoreButtons = document.querySelectorAll('.read-more-btn');
    readMoreButtons.forEach(button => {
      button.removeEventListener('click', this.handleReadMoreClick);
      button.addEventListener('click', this.handleReadMoreClick.bind(this));
    });
  }

  handleReadMoreClick(e) {
    const button = e.target;
    const contentContainer = button.closest('[data-truncated]');
    if (!contentContainer) return;
    
    const truncatedDiv = contentContainer.querySelector('.content-truncated');
    const fullDiv = contentContainer.querySelector('.content-full');
    
    if (truncatedDiv.classList.contains('hidden')) {
      truncatedDiv.classList.remove('hidden');
      fullDiv.classList.add('hidden');
      button.textContent = '[Read More]';
    } else {
      truncatedDiv.classList.add('hidden');
      fullDiv.classList.remove('hidden');
      button.textContent = '[Read Less]';
    }
  }

  renderRepliesSection(threadId, replies) {
    const repliesHtml = replies.length > 0 
      ? `<div class="replies-container">${replies.map(reply => this.renderReply(reply)).join('')}</div>`
      : '<div class="empty-state">No replies yet. Be the first to reply!</div>';

    return `
      ${repliesHtml}
      <form class="reply-form" data-thread-id="${threadId}">
        <textarea 
          placeholder="Write a reply... (max 2000 chars)"
          maxlength="2000"
          rows="3"
        ></textarea>
        <div class="form-footer">
          <div class="char-counter">
            <span class="reply-char-count">0</span>/2000
          </div>
          <button type="submit" class="btn btn-primary">Post Reply</button>
        </div>
        <div class="disabled-message"></div>
      </form>
    `;
  }

  renderReply(reply) {
    const lines = reply.body.split('\n');
    const needsTruncation = lines.length > 3;
    
    let contentHtml = '';
    if (needsTruncation) {
      const truncatedText = lines.slice(0, 3).join('\n');
      contentHtml = `
        <div class="reply-content" data-truncated="true">
          <div class="content-truncated">${this.escapeHtml(truncatedText)}<span class="truncated-indicator">...</span></div>
          <div class="content-full hidden">${this.escapeHtml(reply.body)}</div>
          <button class="read-more-btn" data-content-id="reply-${reply.id}">[Read More]</button>
        </div>
      `;
    } else {
      contentHtml = `<div class="reply-content">${this.escapeHtml(reply.body)}</div>`;
    }
    
    return `
      <div class="reply">
        <div class="reply-header">
          <span class="thread-id">#${reply.id}</span> 
          Anonymous/${reply.userId} 
          <span class="thread-timestamp">${this.formatTimestamp(reply.createdAt)}</span>
        </div>
        ${contentHtml}
      </div>
    `;
  }

  setupReplyForm(threadId) {
    const form = document.querySelector(`.reply-form[data-thread-id="${threadId}"]`);
    if (!form) return;

    const textarea = form.querySelector('textarea');
    const charCount = form.querySelector('.reply-char-count');
    
    // UX: Auto resize for replies too
    textarea.addEventListener('input', (e) => {
      this.autoResize(e.target);
      charCount.textContent = e.target.value.length;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleReply(threadId, form);
    });

    if (this.status && !this.status.postingEnabled) {
        const button = form.querySelector('button[type="submit"]');
        const disabledMessage = form.querySelector('.disabled-message');
        textarea.disabled = true;
        button.disabled = true;
        disabledMessage.textContent = 'Posting is only allowed on weekends';
        disabledMessage.classList.add('visible');
    }
  }

  async handleNewThread() {
    const form = document.getElementById('new-thread-form');
    const textarea = document.getElementById('thread-content');
    const button = form.querySelector('button[type="submit"]');
    const content = textarea.value.trim();

    if (!content) {
      this.showToast('Please enter some content', 'error');
      // UX: Shake the input
      textarea.focus();
      return;
    }

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Posting...';

    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: content, userId: this.userId })
      });

      const data = await response.json();

      if (!response.ok) {
        this.showToast(data.error || 'Failed to create thread', 'error');
        if (response.status === 507) await this.fetchStatus();
      } else {
        textarea.value = '';
        textarea.style.height = 'auto'; // Reset height
        document.getElementById('thread-char-count').textContent = '0';
        this.showToast('Thread posted successfully!');
        await this.fetchThreads();
      }
    } catch (error) {
      this.showToast('Network error. Try again later.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
  }

  async handleReply(threadId, form) {
    const textarea = form.querySelector('textarea');
    const button = form.querySelector('button[type="submit"]');
    const content = textarea.value.trim();

    if (!content) {
      this.showToast('Please enter some content', 'error');
      return;
    }

    button.disabled = true;
    const originalText = button.textContent;
    button.textContent = 'Posting...';

    try {
      const response = await fetch(`/api/threads/${threadId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: content, userId: this.userId })
      });

      const data = await response.json();

      if (!response.ok) {
        this.showToast(data.error || 'Failed to post reply', 'error');
      } else {
        textarea.value = '';
        textarea.style.height = 'auto';
        form.querySelector('.reply-char-count').textContent = '0';
        this.showToast('Reply posted!');
        await this.refreshReplies(threadId);
      }
    } catch (error) {
      this.showToast('Network error.', 'error');
    } finally {
        button.disabled = false;
        button.textContent = originalText;
    }
  }

  async refreshReplies(threadId) {
    if (!this.openThreads.has(threadId)) {
      this.openThreads.add(threadId);
    }
    await this.loadAndRenderReplies(threadId);
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins/60)}h ago`;
    
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new TextchanApp();
});
