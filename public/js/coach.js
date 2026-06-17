/**
 * AI Climate Coach Dialogues Module
 * Manages the assistant chat terminal view, message streams, and quick questions.
 */

const CarbonCoach = {
  init() {
    const form = document.getElementById('chat-form');
    const input = document.getElementById('chat-input');
    const clearBtn = document.getElementById('clear-chat-btn');
    const quickButtons = document.querySelectorAll('.quick-question-btn');

    if (!form || !input || !clearBtn) return;

    form.addEventListener('submit', this.handleSubmit.bind(this));
    clearBtn.addEventListener('click', this.clearChatHistory.bind(this));

    // Bind quick questions buttons
    quickButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const text = e.target.textContent.trim();
        input.value = text;
        form.dispatchEvent(new Event('submit'));
      });
    });
  },

  /**
   * Submits a user message and fetches the consultant response.
   */
  async handleSubmit(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const username = window.getCurrentUsername();
    if (!username) {
      this.appendMessage('coach', 'Please select or create a user profile first to consult.');
      return;
    }

    // 1. Render user message in chat terminal
    this.appendMessage('user', text);
    input.value = '';

    // 2. Display typing state
    this.toggleTypingIndicator(true);

    try {
      const response = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, message: text })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch coach reply.');
      }

      // 3. Render coach response and update profile history
      // Add a slight visual delay for realism (typing animation)
      setTimeout(() => {
        this.toggleTypingIndicator(false);
        this.appendMessage('coach', data.reply);
        
        // Sync chat history to window profile state
        if (window.activeUserProfile) {
          window.activeUserProfile.chatHistory = data.chatHistory;
        }
      }, 700);

    } catch (err) {
      console.error(err);
      this.toggleTypingIndicator(false);
      this.appendMessage('coach', 'Sorry, I encountered an issue while generating advice. Please try again.');
    }
  },

  /**
   * Appends a styled message bubble to the chat logs.
   */
  appendMessage(role, text) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'flex items-start gap-3';
    
    if (role === 'user') {
      wrapper.classList.add('justify-end');
    }

    const iconHtml = role === 'user' 
      ? `<div class="w-8 h-8 rounded-full bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-xs mt-1 order-last" aria-hidden="true">U</div>`
      : `<div class="w-8 h-8 rounded-full bg-emerald-600/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-xs mt-1" aria-hidden="true">C</div>`;

    const bubbleClass = role === 'user' ? 'chat-bubble-user' : 'chat-bubble-coach';
    
    // Replace newline formatting in text
    const formattedText = text.replace(/\n/g, '<br>');

    wrapper.innerHTML = `
      ${iconHtml}
      <div class="${bubbleClass} rounded-xl p-4 text-xs max-w-[80%] leading-relaxed">
        ${formattedText}
      </div>
    `;

    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
  },

  /**
   * Toggles the "Coach is typing..." loader indicator.
   */
  toggleTypingIndicator(show) {
    const indicator = document.getElementById('coach-typing');
    const container = document.getElementById('chat-messages');
    
    if (show) {
      indicator.classList.remove('hidden');
      container.scrollTop = container.scrollHeight;
    } else {
      indicator.classList.add('hidden');
    }
  },

  /**
   * Loads and renders user chat history pairs.
   */
  syncChatHistory(history) {
    const container = document.getElementById('chat-messages');
    container.innerHTML = '';

    // Standard welcome message
    this.appendMessage('coach', 'Hello! I am your CarbonLens Climate Consultant. Complete your Assessment form so I can evaluate your profile and advise you. Otherwise, ask me anything about reducing transportation emissions, switching energy habits, recycling, or shopping!');

    if (history && history.length > 0) {
      history.forEach(pair => {
        this.appendMessage(pair.role, pair.text);
      });
    }
  },

  /**
   * Resets frontend chat panel.
   */
  clearChatHistory() {
    this.syncChatHistory([]);
    // Optionally notify server or keep it local
  }
};

window.CarbonCoach = CarbonCoach;
document.addEventListener('DOMContentLoaded', () => CarbonCoach.init());
