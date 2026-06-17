/**
 * CarbonLens Main Orchestration Module
 * Connects tabs, manages active sessions, coordinates state updates, and renders challenges.
 */

const App = {
  activeUserProfile: null,

  init() {
    this.bindTabNavigation();
    this.bindAuthentication();
    this.bindAssessmentRedirect();
    
    // Auto-login default demo_user on load
    this.loginUser('demo_user');
  },

  // --- SPA Tab Management ---

  bindTabNavigation() {
    const navButtons = document.querySelectorAll('nav button');
    
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = e.currentTarget.id.replace('tab-', '');
        this.switchTab(targetTab);
      });
    });
  },

  switchTab(tabName) {
    const views = ['dashboard', 'assessment', 'simulator', 'challenges', 'coach'];
    
    views.forEach(v => {
      const viewElem = document.getElementById(`view-${v}`);
      const btnElem = document.getElementById(`tab-${v}`);
      
      if (v === tabName) {
        viewElem.classList.remove('hidden');
        btnElem.classList.add('active');
        btnElem.setAttribute('aria-selected', 'true');
      } else {
        viewElem.classList.add('hidden');
        btnElem.classList.remove('active');
        btnElem.setAttribute('aria-selected', 'false');
      }
    });

    // Custom view trigger updates
    if (tabName === 'simulator' && window.CarbonSimulator) {
      window.CarbonSimulator.syncUserProfile(this.activeUserProfile);
    }
  },

  bindAssessmentRedirect() {
    const btn = document.getElementById('go-to-assessment-btn');
    if (btn) {
      btn.addEventListener('click', () => this.switchTab('assessment'));
    }
  },

  // --- Session Management ---

  bindAuthentication() {
    const select = document.getElementById('username-select');
    const modal = document.getElementById('login-modal');
    const form = document.getElementById('login-form');
    const cancelBtn = document.getElementById('login-cancel-btn');
    const usernameInput = document.getElementById('username-input');
    const errorMsg = document.getElementById('username-error');

    select.addEventListener('change', (e) => {
      const val = e.target.value;
      if (val === 'new_user') {
        // Show create profile modal
        modal.classList.remove('hidden');
        usernameInput.value = '';
        errorMsg.textContent = '';
        usernameInput.focus();
      } else {
        // Load selected profile
        this.loginUser(val);
      }
    });

    cancelBtn.addEventListener('click', () => {
      modal.classList.add('hidden');
      // Revert select picker value
      select.value = this.activeUserProfile ? this.activeUserProfile.username : 'demo_user';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const rawUser = usernameInput.value.trim();
      
      // Basic sanitization/validation check
      if (!/^[a-zA-Z0-9_-]{1,30}$/.test(rawUser)) {
        errorMsg.textContent = 'Use 1-30 letters/numbers (no spaces).';
        return;
      }

      const success = await this.loginUser(rawUser);
      if (success) {
        modal.classList.add('hidden');
      } else {
        errorMsg.textContent = 'Failed to register profile.';
      }
    });
  },

  async loginUser(username) {
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      this.updateActiveUserProfile(data);

      // Add to select picker options if not already there
      const select = document.getElementById('username-select');
      let exists = false;
      for (let i = 0; i < select.options.length; i++) {
        if (select.options[i].value === username) {
          exists = true;
          break;
        }
      }

      if (!exists) {
        const opt = document.createElement('option');
        opt.value = username;
        opt.textContent = username;
        opt.className = 'bg-slate-900 text-white';
        // Insert before '+ Create New Profile' option
        select.insertBefore(opt, select.options[select.options.length - 1]);
      }

      select.value = username;
      return true;

    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  },

  getCurrentUsername() {
    return this.activeUserProfile ? this.activeUserProfile.username : null;
  },

  // --- Central State Dispatcher ---

  updateActiveUserProfile(profile) {
    this.activeUserProfile = profile;

    // 1. Sync header stats
    document.getElementById('header-points').textContent = profile.points.toLocaleString();
    document.getElementById('header-streak').textContent = profile.streak;

    // 2. Refresh Dashboard analytics
    if (window.CarbonInsights) {
      window.CarbonInsights.render(profile);
    }

    // 3. Pre-fill assessment inputs
    if (window.CarbonCalculator) {
      window.CarbonCalculator.populateForm(profile);
    }

    // 4. Update simulator baselines
    if (window.CarbonSimulator) {
      window.CarbonSimulator.syncUserProfile(profile);
    }

    // 5. Update Chat dialog
    if (window.CarbonCoach) {
      window.CarbonCoach.syncChatHistory(profile.chatHistory);
    }

    // 6. Update Challenges Checkbox grid
    this.renderChallenges(profile);
  },

  // --- Render Challenges checklist grid ---

  renderChallenges(profile) {
    const container = document.getElementById('challenges-grid');
    const scoreText = document.getElementById('challenges-score');
    const streakText = document.getElementById('challenges-streak');

    if (!container) return;

    // Sync stats
    scoreText.textContent = profile.points.toLocaleString();
    streakText.textContent = profile.streak;

    container.innerHTML = '';

    const challengesData = profile.challenges || [];
    
    challengesData.forEach(item => {
      const card = document.createElement('div');
      card.className = 'glass-panel-elevated p-5 border-white/10 flex flex-col justify-between h-full hover:border-emerald-500/30 transition-colors';
      
      const descriptions = {
        no_car_friday: 'Walk, cycle, or take the train/bus to school or work today instead of driving your car.',
        plant_based_monday: 'Refrain from eating beef, pork, poultry, or fish today. Choose vegetarian or vegan options.',
        reusable_bottle: 'Say no to single-use water bottles or cups. Commit to using a refillable flask all week.'
      };

      const desc = descriptions[item.id] || 'Engage in simple actions to lower your carbon footprint.';

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">+${item.points} pts</span>
            <span class="text-xs text-amber-400 font-semibold flex items-center gap-1" aria-label="Completion streak of ${item.streak} days">
              🔥 ${item.streak} streak
            </span>
          </div>
          <h3 class="font-bold text-white text-sm mb-1">${item.name}</h3>
          <p class="text-xs text-gray-400 leading-relaxed mb-6">${desc}</p>
        </div>
        <div class="flex items-center justify-between pt-3 border-t border-white/5">
          <label for="chk-${item.id}" class="text-xs font-semibold text-gray-300 cursor-pointer">Completed Today</label>
          <input type="checkbox" id="chk-${item.id}" class="w-4 h-4 rounded border-gray-700 bg-black text-emerald-600 focus:ring-emerald-500 focus:ring-offset-gray-900 focus:ring-2 cursor-pointer" ${item.completed ? 'checked' : ''}>
        </div>
      `;

      // Attach check change handler
      const checkbox = card.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('change', () => this.handleChallengeToggle(item.id, checkbox.checked));

      container.appendChild(card);
    });
  },

  async handleChallengeToggle(challengeId, isChecked) {
    const username = this.getCurrentUsername();
    if (!username) return;

    try {
      const response = await fetch('/api/challenges/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          challengeId,
          completed: isChecked
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }

      this.updateActiveUserProfile(data);
    } catch (err) {
      console.error('Challenge error:', err);
      // Revert checkboxes visually if server error
      this.renderChallenges(this.activeUserProfile);
    }
  }
};

window.getCurrentUsername = App.getCurrentUsername.bind(App);
window.updateActiveUserProfile = App.updateActiveUserProfile.bind(App);
window.switchTab = App.switchTab.bind(App);

document.addEventListener('DOMContentLoaded', () => App.init());
