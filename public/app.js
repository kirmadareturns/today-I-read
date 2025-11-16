class TextchanApp {
  constructor() {
    this.userId = this.getOrCreateUserId();
    this.status = null;
    this.threads = [];
    this.countdownInterval = null;
    this.statusInterval = null;
    this.threadsInterval = null;
    
    this.init();
  }

  getOrCreateUserId() {
    let userId = localStorage.getItem('textchan_user_id');
    if (!userId) {
      userId = this.generateUserId();
      localStorage.setItem('textchan_user_id', userId);
    }
    return userId;
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
    this.displayUserId();
    this.setupEventListeners();
    this.fetchStatus();
    this.fetchThreads();
    
    this.statusInterval = setInterval(() => this.fetchStatus(), 30000);
    this.threadsInterval = setInterval(() => this.fetchThreads(), 15000);
  }

  displayUserId() {
    document.getElementById('user-id').textContent = this.userId;
  }

  setupEventListeners() {
    const threadForm = document.getElementById('new-thread-form');
    const threadContent = document.getElementById('thread-content');
    const threadCharCount = document.getElementById('thread-char-count');

    threadContent.addEventListener('input', (e) => {
      threadCharCount.textContent = e.target.value.length;
    });

    threadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleNewThread();
    });
  }

  async fetchStatus() {
    try {
      const response = await fetch('/api/status');
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
    const threadForm = document.getElementById('new-thread-form');
    const threadContent = document.getElementById('thread-content');
    const threadSubmit = threadForm.querySelector('button[type="submit"]');
    const threadDisabledMessage = document.getElementById('thread-disabled-message');
    const threadError = document.getElementById('thread-error');

    const storageLimit = this.status.storage && this.status.storage.limitReached;

    if (storageLimit) {
      banner.className = 'status-banner disabled';
      statusMessage.textContent = '⚠ Storage limit reached';
      threadContent.disabled = true;
      threadSubmit.disabled = true;
      threadDisabledMessage.textContent = 'The site is at capacity. Check back later!';
      threadDisabledMessage.classList.add('visible');
      threadError.classList.remove('visible');
    } else if (this.status.postingEnabled) {
      banner.className = 'status-banner enabled';
      statusMessage.textContent = '✓ Posting is currently enabled';
      threadContent.disabled = false;
      threadSubmit.disabled = false;
      threadDisabledMessage.classList.remove('visible');
      threadError.classList.remove('visible');
    } else {
      banner.className = 'status-banner disabled';
      statusMessage.textContent = '✗ Posting is currently disabled';
      threadContent.disabled = true;
      threadSubmit.disabled = true;
      threadDisabledMessage.textContent = 'Posting is only allowed on weekends (Saturday and Sunday, UTC timezone)';
      threadDisabledMessage.classList.add('visible');
      threadError.classList.remove('visible');
    }

    this.updateAllReplyForms();
  }

  updateAllReplyForms() {
    const replyForms = document.querySelectorAll('.reply-form');
    replyForms.forEach(form => {
      const textarea = form.querySelector('textarea');
      const button = form.querySelector('button[type="submit"]');
      const disabledMessage = form.querySelector('.disabled-message');
      const errorMessage = form.querySelector('.error-message');

      const storageLimit = this.status && this.status.storage && this.status.storage.limitReached;

      if (storageLimit) {
        textarea.disabled = true;
        button.disabled = true;
        if (disabledMessage) {
          disabledMessage.textContent = 'The site is at capacity. Check back later!';
          disabledMessage.classList.add('visible');
        }
        if (errorMessage) errorMessage.classList.remove('visible');
      } else if (this.status && this.status.postingEnabled) {
        textarea.disabled = false;
        button.disabled = false;
        if (disabledMessage) disabledMessage.classList.remove('visible');
        if (errorMessage) errorMessage.classList.remove('visible');
      } else {
        textarea.disabled = true;
        button.disabled = true;
        if (disabledMessage) {
          disabledMessage.textContent = 'Posting is only allowed on weekends';
          disabledMessage.classList.add('visible');
        }
        if (errorMessage) errorMessage.classList.remove('visible');
      }
    });
  }

  showStatusError() {
    const banner = document.getElementById('status-banner');
    const statusMessage = banner.querySelector('.status-message');
    banner.className = 'status-banner';
    statusMessage.textContent = 'Failed to load status. Retrying...';
  }

  startCountdown() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }

    this.updateCountdown();
    this.countdownInterval = setInterval(() => {
      this.updateCountdown();
    }, 1000);
  }

  updateCountdown() {
    if (!this.status || !this.status.nextChangeTimestamp) {
      return;
    }

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

  async fetchThreads() {
    try {
      const response = await fetch('/api/threads');
      const data = await response.json();
      this.threads = data;
      this.renderThreads();
    } catch (error) {
      console.error('Failed to fetch threads:', error);
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
  }

  renderThread(thread) {
    const replyCount = thread.replies.length;
    return `
      <div class="thread" data-thread-id="${thread.id}">
        <div class="thread-header">
          <span class="thread-id">#${thread.id}</span> 
          Anonymous/${thread.userId} 
          <span class="thread-timestamp">${this.formatTimestamp(thread.createdAt)}</span>
        </div>
        <div class="thread-content">${this.escapeHtml(thread.body)}</div>
        <div class="thread-footer">
          <span class="reply-count">${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}</span>
          <button id="toggle-${thread.id}" class="btn btn-secondary">[Show Replies]</button>
        </div>
        <div id="replies-${thread.id}" class="replies-section hidden"></div>
      </div>
    `;
  }

  async toggleReplies(threadId) {
    const repliesSection = document.getElementById(`replies-${threadId}`);
    const toggleBtn = document.getElementById(`toggle-${threadId}`);

    if (repliesSection.classList.contains('hidden')) {
      toggleBtn.textContent = '[Loading...]';
      toggleBtn.disabled = true;
      
      try {
        const response = await fetch(`/api/threads/${threadId}/replies`);
        const data = await response.json();
        
        repliesSection.innerHTML = this.renderRepliesSection(threadId, data.replies);
        repliesSection.classList.remove('hidden');
        toggleBtn.textContent = '[Hide Replies]';
        toggleBtn.disabled = false;

        this.setupReplyForm(threadId);
      } catch (error) {
        console.error('Failed to fetch replies:', error);
        toggleBtn.textContent = '[Show Replies]';
        toggleBtn.disabled = false;
      }
    } else {
      repliesSection.classList.add('hidden');
      toggleBtn.textContent = '[Show Replies]';
    }
  }

  renderRepliesSection(threadId, replies) {
    const repliesHtml = replies.length > 0 
      ? `
        <div class="replies-container">
          ${replies.map(reply => this.renderReply(reply)).join('')}
        </div>
      `
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
        <div class="error-message"></div>
        <div class="disabled-message"></div>
      </form>
    `;
  }

  renderReply(reply) {
    return `
      <div class="reply">
        <div class="reply-header">
          <span class="thread-id">#${reply.id}</span> 
          Anonymous/${reply.userId} 
          <span class="thread-timestamp">${this.formatTimestamp(reply.createdAt)}</span>
        </div>
        <div class="reply-content">${this.escapeHtml(reply.body)}</div>
      </div>
    `;
  }

  setupReplyForm(threadId) {
    const form = document.querySelector(`.reply-form[data-thread-id="${threadId}"]`);
    if (!form) return;

    const textarea = form.querySelector('textarea');
    const charCount = form.querySelector('.reply-char-count');
    
    textarea.addEventListener('input', (e) => {
      charCount.textContent = e.target.value.length;
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleReply(threadId, form);
    });

    if (this.status) {
      const button = form.querySelector('button[type="submit"]');
      const disabledMessage = form.querySelector('.disabled-message');
      
      if (!this.status.postingEnabled) {
        textarea.disabled = true;
        button.disabled = true;
        disabledMessage.textContent = 'Posting is only allowed on weekends';
        disabledMessage.classList.add('visible');
      }
    }
  }

  async handleNewThread() {
    const form = document.getElementById('new-thread-form');
    const textarea = document.getElementById('thread-content');
    const button = form.querySelector('button[type="submit"]');
    const errorMessage = document.getElementById('thread-error');
    const content = textarea.value.trim();

    errorMessage.classList.remove('visible');

    if (!content) {
      errorMessage.textContent = 'Please enter some content';
      errorMessage.classList.add('visible');
      return;
    }

    if (content.length > 2000) {
      errorMessage.textContent = 'Content too long (max 2000 characters)';
      errorMessage.classList.add('visible');
      return;
    }

    button.disabled = true;
    button.classList.add('loading');
    button.textContent = 'Posting';

    try {
      const response = await fetch('/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: content,
          userId: this.userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          errorMessage.textContent = 'Posting is only allowed on weekends. Please wait until the weekend to post.';
        } else if (response.status === 507) {
          errorMessage.textContent = 'The site is at capacity. Check back later!';
          await this.fetchStatus();
        } else {
          errorMessage.textContent = data.error || 'Failed to create thread';
        }
        errorMessage.classList.add('visible');
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = 'Post Thread';
        return;
      }

      textarea.value = '';
      document.getElementById('thread-char-count').textContent = '0';
      button.classList.remove('loading');
      button.textContent = 'Post Thread';
      button.disabled = false;

      await this.fetchThreads();
    } catch (error) {
      console.error('Failed to create thread:', error);
      errorMessage.textContent = 'Network error. Please try again.';
      errorMessage.classList.add('visible');
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = 'Post Thread';
    }
  }

  async handleReply(threadId, form) {
    const textarea = form.querySelector('textarea');
    const button = form.querySelector('button[type="submit"]');
    const errorMessage = form.querySelector('.error-message');
    const content = textarea.value.trim();

    errorMessage.classList.remove('visible');

    if (!content) {
      errorMessage.textContent = 'Please enter some content';
      errorMessage.classList.add('visible');
      return;
    }

    if (content.length > 2000) {
      errorMessage.textContent = 'Content too long (max 2000 characters)';
      errorMessage.classList.add('visible');
      return;
    }

    button.disabled = true;
    button.classList.add('loading');
    button.textContent = 'Posting';

    try {
      const response = await fetch(`/api/threads/${threadId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: content,
          userId: this.userId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403) {
          errorMessage.textContent = 'Posting is only allowed on weekends. Please wait until the weekend to post.';
        } else if (response.status === 507) {
          errorMessage.textContent = 'The site is at capacity. Check back later!';
          await this.fetchStatus();
        } else {
          errorMessage.textContent = data.error || 'Failed to create reply';
        }
        errorMessage.classList.add('visible');
        button.disabled = false;
        button.classList.remove('loading');
        button.textContent = 'Post Reply';
        return;
      }

      textarea.value = '';
      form.querySelector('.reply-char-count').textContent = '0';
      button.classList.remove('loading');
      button.textContent = 'Post Reply';
      button.disabled = false;

      await this.toggleReplies(threadId);
      await this.toggleReplies(threadId);
      await this.fetchThreads();
    } catch (error) {
      console.error('Failed to create reply:', error);
      errorMessage.textContent = 'Network error. Please try again.';
      errorMessage.classList.add('visible');
      button.disabled = false;
      button.classList.remove('loading');
      button.textContent = 'Post Reply';
    }
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'just now';
    } else if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
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
