/**
 * Impact Simulator Module
 * Interacts with the habits sliders and handles emissions comparisons.
 */

const CarbonSimulator = {
  activeProfile: null,

  init() {
    const transportRange = document.getElementById('sim-transport-range');
    const acRange = document.getElementById('sim-ac-range');
    const dietSelect = document.getElementById('sim-diet');
    const resetBtn = document.getElementById('reset-sim-btn');

    if (!transportRange || !acRange || !dietSelect || !resetBtn) return;

    // Attach slider listeners
    transportRange.addEventListener('input', this.handleSliderInput.bind(this));
    acRange.addEventListener('input', this.handleSliderInput.bind(this));
    dietSelect.addEventListener('change', this.triggerSimulation.bind(this));
    resetBtn.addEventListener('click', this.resetSimulation.bind(this));
  },

  /**
   * Updates slider text indicator and triggers simulation query.
   */
  handleSliderInput(event) {
    const id = event.target.id;
    const value = event.target.value;

    if (id === 'sim-transport-range') {
      document.getElementById('sim-transport-value').textContent = `${value}%`;
    } else if (id === 'sim-ac-range') {
      document.getElementById('sim-ac-value').textContent = `${value} hrs/day`;
    }

    this.triggerSimulation();
  },

  /**
   * Syncs simulator config constraints with the user's logged-in profile.
   */
  syncUserProfile(profile) {
    this.activeProfile = profile;

    const transportRange = document.getElementById('sim-transport-range');
    const acRange = document.getElementById('sim-ac-range');
    const dietSelect = document.getElementById('sim-diet');

    if (!profile || !profile.assessment) {
      // No assessment data: disable sliders
      transportRange.disabled = true;
      acRange.disabled = true;
      dietSelect.disabled = true;
      return;
    }

    // Enable sliders
    transportRange.disabled = false;
    acRange.disabled = false;
    dietSelect.disabled = false;

    // Set constraints based on user profile
    const acHours = profile.assessment.acHours || 0;
    acRange.max = acHours;
    
    // Seed initial values to 0 reduction
    transportRange.value = 0;
    acRange.value = 0;
    dietSelect.value = profile.assessment.dietType || 'mixed';

    document.getElementById('sim-transport-value').textContent = '0%';
    document.getElementById('sim-ac-value').textContent = '0 hrs/day';

    // Clear labels and charts
    this.triggerSimulation();
  },

  /**
   * Performs the simulation post request to the backend.
   */
  async triggerSimulation() {
    const username = window.getCurrentUsername();
    if (!username || !this.activeProfile || !this.activeProfile.assessment) {
      this.renderSimResults({
        currentFootprint: 0,
        predictedFootprint: 0,
        reductionAmount: 0,
        reductionPercentage: 0
      });
      return;
    }

    const transportReduction = parseFloat(document.getElementById('sim-transport-range').value) || 0;
    const acReduction = parseFloat(document.getElementById('sim-ac-range').value) || 0;
    const dietType = document.getElementById('sim-diet').value;

    try {
      const response = await fetch('/api/simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          transportReduction,
          acReduction,
          dietType
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Simulation failed.');
      }

      this.renderSimResults(data);
    } catch (err) {
      console.error('Simulation error:', err);
    }
  },

  /**
   * Renders the simulation calculation results and fits comparative bar widths.
   */
  renderSimResults(data) {
    const currentVal = data.currentFootprint || 0;
    const predictedVal = data.predictedFootprint || 0;
    const reduction = data.reductionAmount || 0;
    const percentage = data.reductionPercentage || 0;

    // Set text outputs
    document.getElementById('sim-saving-amount').textContent = reduction.toLocaleString();
    document.getElementById('sim-saving-pct').textContent = `${percentage}%`;

    // Set labels on progress bars
    document.getElementById('label-current-bar').textContent = `${currentVal.toLocaleString()} kg`;
    document.getElementById('label-predicted-bar').textContent = `${predictedVal.toLocaleString()} kg`;

    // Calculate width sizes relative to maximum value
    const currentBar = document.getElementById('bar-current-fill');
    const predictedBar = document.getElementById('bar-predicted-fill');

    const maxVal = Math.max(currentVal, predictedVal, 1);
    const currentPct = (currentVal / maxVal) * 100;
    const predictedPct = (predictedVal / maxVal) * 100;

    currentBar.style.width = `${Math.max(12, currentPct)}%`;
    predictedBar.style.width = `${Math.max(12, predictedPct)}%`;
  },

  /**
   * Resets elements to 0 reduction.
   */
  resetSimulation() {
    if (!this.activeProfile) return;
    this.syncUserProfile(this.activeProfile);
  }
};

window.CarbonSimulator = CarbonSimulator;
document.addEventListener('DOMContentLoaded', () => CarbonSimulator.init());
