/**
 * Dashboard Insights & Visualizations Rendering Module
 * Updates the charts, scorecard gauges, Top 3 actions list, and personal roadmap.
 */

const CarbonInsights = {
  render(profile) {
    if (!profile || !profile.results || !profile.insights) {
      this.toggleDashboardDataView(false);
      return;
    }

    this.toggleDashboardDataView(true);

    const { results, insights } = profile;

    // 1. Render Scorecard Gauge Circle
    this.updateScorecardGauge(results.carbonScore, results.rating);

    // 2. Render Numerical Stats
    document.getElementById('monthly-co2-display').textContent = results.totalMonthlyCO2.toLocaleString();
    const annualTons = (results.totalMonthlyCO2 * 12) / 1000;
    document.getElementById('annual-co2-display').textContent = annualTons.toFixed(1);

    // 3. Render Category Breakdown Percentages
    this.updateBreakdownBars(results.breakdown, results.percentages);

    // 4. Render Highest/Lowest Contributor Badges
    document.getElementById('highest-contrib-display').textContent = insights.highestContributor.name;
    document.getElementById('lowest-contrib-display').textContent = insights.lowestContributor.name;

    // 5. Render Top 3 Actions Cards
    this.renderTopActions(insights.topActions);

    // 6. Render Personal 30-60-90 Day Roadmap
    this.renderRoadmap(insights.roadmap);
  },

  /**
   * Toggles the dashboard view state depending on whether the user has assessment data.
   */
  toggleDashboardDataView(hasData) {
    const alertBox = document.getElementById('no-data-alert');
    const resultsGrid = document.getElementById('dashboard-results-grid');
    const roadmapPanel = document.getElementById('dashboard-roadmap-panel');

    if (hasData) {
      alertBox.classList.add('hidden');
      resultsGrid.classList.remove('hidden');
      roadmapPanel.classList.remove('hidden');
    } else {
      alertBox.classList.remove('hidden');
      resultsGrid.classList.add('hidden');
      roadmapPanel.classList.add('hidden');
    }
  },

  /**
   * Updates the circular progress bar indicator and score texts.
   */
  updateScorecardGauge(score, rating) {
    const circle = document.getElementById('score-circle-fill');
    const scoreDisplay = document.getElementById('score-display');
    const badge = document.getElementById('rating-badge');

    // Update text
    scoreDisplay.textContent = score;
    badge.textContent = rating;

    // Remove old rating classes
    badge.className = 'inline-block px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider';

    // Apply color class and update SVG stroke color
    let strokeColor = 'var(--color-green-rating)';
    if (rating === 'Green') {
      badge.classList.add('rating-pill-green');
      strokeColor = '#10B981';
    } else if (rating === 'Improving') {
      badge.classList.add('rating-pill-improving');
      strokeColor = '#F59E0B';
    } else {
      badge.classList.add('rating-pill-high-impact');
      strokeColor = '#EF4444';
    }

    circle.style.stroke = strokeColor;

    // SVG Circumference = 2 * PI * r = 2 * 3.14159 * 70 = 439.6 (approx 440)
    const circumference = 439.6;
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;
  },

  /**
   * Updates the category horizontal progress fills and text percentages.
   */
  updateBreakdownBars(breakdown, percentages) {
    const categories = ['transportation', 'food', 'energy', 'shopping', 'waste'];
    const shortNames = {
      transportation: 'transport',
      food: 'food',
      energy: 'energy',
      shopping: 'shopping',
      waste: 'waste'
    };

    categories.forEach(cat => {
      const short = shortNames[cat];
      const pct = percentages[cat] || 0;

      // Update text percentage
      const textElem = document.getElementById(`pct-${short}`);
      if (textElem) textElem.textContent = `${pct}%`;

      // Update fill width
      const barElem = document.getElementById(`bar-${short}`);
      if (barElem) barElem.style.width = `${pct}%`;
    });
  },

  /**
   * Builds and inserts the Top 3 actions HTML structure.
   */
  renderTopActions(actions) {
    const container = document.getElementById('top-actions-container');
    container.innerHTML = '';

    if (!actions || actions.length === 0) {
      container.innerHTML = `<div class="text-center text-xs text-gray-500 py-6">No recommendations found.</div>`;
      return;
    }

    actions.forEach(action => {
      let diffClass = 'bg-emerald-500/10 text-emerald-400';
      if (action.difficulty === 'Medium') {
        diffClass = 'bg-indigo-500/10 text-indigo-400';
      } else if (action.difficulty === 'Hard') {
        diffClass = 'bg-rose-500/10 text-rose-400';
      }

      const card = document.createElement('div');
      card.className = 'p-4 bg-slate-900/50 hover:bg-slate-900/80 border border-white/5 rounded-xl transition-all pulse-glow-hover flex flex-col justify-between';
      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="text-[9px] font-bold px-2 py-0.5 rounded ${diffClass} uppercase tracking-wider">${action.difficulty}</span>
            <span class="text-[10px] text-gray-400 font-medium">Impact Score: <span class="text-emerald-400 font-bold">${action.impactScore}</span></span>
          </div>
          <h3 class="font-bold text-white text-sm mb-1">${action.name}</h3>
          <p class="text-[11px] text-gray-400 leading-relaxed mb-3">${action.description}</p>
        </div>
        <div class="flex items-center justify-between text-[10px] text-gray-500 border-t border-white/5 pt-2 mt-2">
          <span>Estimated Annual Saving:</span>
          <span class="text-emerald-400 font-bold text-xs">${action.annualReduction.toLocaleString()} kg CO₂</span>
        </div>
      `;
      container.appendChild(card);
    });
  },

  /**
   * Renders the dynamic 30-60-90 Day Roadmap.
   */
  renderRoadmap(roadmap) {
    if (!roadmap) return;

    const stages = [
      { key: 'goal30', prefix: '30' },
      { key: 'goal60', prefix: '60' },
      { key: 'goal90', prefix: '90' }
    ];

    stages.forEach(stage => {
      const data = roadmap[stage.key];
      if (!data) return;

      document.getElementById(`roadmap-action-${stage.prefix}`).textContent = data.action;
      document.getElementById(`roadmap-benefit-${stage.prefix}`).textContent = data.benefit;
      document.getElementById(`roadmap-reduction-${stage.prefix}`).textContent = data.reduction.toLocaleString();
      
      const diffElem = document.getElementById(`roadmap-difficulty-${stage.prefix}`);
      diffElem.textContent = data.difficulty;

      // Update difficulty styling
      diffElem.className = 'px-2 py-0.5 text-[9px] font-bold rounded uppercase tracking-wider';
      if (data.difficulty === 'Easy') {
        diffElem.classList.add('bg-emerald-500/10', 'text-emerald-400');
      } else if (data.difficulty === 'Medium') {
        diffElem.classList.add('bg-indigo-500/10', 'text-indigo-400');
      } else {
        diffElem.classList.add('bg-rose-500/10', 'text-rose-400');
      }
    });
  }
};

window.CarbonInsights = CarbonInsights;
