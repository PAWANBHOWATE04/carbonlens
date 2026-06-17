/**
 * Carbon Assessment Form Module
 * Manages input validation and submissions to the assessment endpoint.
 */

const CarbonCalculator = {
  init() {
    const form = document.getElementById('assessment-form');
    if (!form) return;

    form.addEventListener('submit', this.handleSubmit.bind(this));
  },

  async handleSubmit(event) {
    event.preventDefault();
    
    const msgContainer = document.getElementById('assessment-msg');
    const submitBtn = event.target.querySelector('button[type="submit"]');
    
    // Clear message state
    msgContainer.textContent = '';
    msgContainer.className = 'text-xs self-center';

    const username = window.getCurrentUsername();
    if (!username) {
      msgContainer.textContent = 'Please select or create a user profile first.';
      msgContainer.className = 'text-xs text-red-400 self-center';
      return;
    }

    // 1. Gather form values
    const formData = new FormData(event.target);
    const transportDistance = parseFloat(formData.get('transportDistance'));
    const transportType = formData.get('transportType');
    const dietType = formData.get('dietType');
    const electricity = parseFloat(formData.get('electricity'));
    const acHours = parseFloat(formData.get('acHours'));
    const shopping = formData.get('shopping');
    const recycling = formData.get('recycling');

    // 2. Client-side Validation
    if (isNaN(transportDistance) || transportDistance < 0 || transportDistance > 1000) {
      msgContainer.textContent = 'Daily distance must be a positive number between 0 and 1000.';
      msgContainer.className = 'text-xs text-red-400 self-center';
      return;
    }

    if (isNaN(electricity) || electricity < 0 || electricity > 10000) {
      msgContainer.textContent = 'Monthly electricity must be between 0 and 10,000 kWh.';
      msgContainer.className = 'text-xs text-red-400 self-center';
      return;
    }

    if (isNaN(acHours) || acHours < 0 || acHours > 24) {
      msgContainer.textContent = 'Daily AC usage must be between 0 and 24 hours.';
      msgContainer.className = 'text-xs text-red-400 self-center';
      return;
    }

    // 3. Dispatch POST Request
    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Calculating Footprint...';

      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          transportDistance,
          transportType,
          dietType,
          electricity,
          acHours,
          shopping,
          recycling
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit assessment.');
      }

      // 4. Update Application State & Refresh View
      window.updateActiveUserProfile(data);

      msgContainer.textContent = 'Assessment saved successfully!';
      msgContainer.className = 'text-xs text-emerald-400 self-center font-semibold';

      // Quick redirect to dashboard view
      setTimeout(() => {
        msgContainer.textContent = '';
        window.switchTab('dashboard');
      }, 1000);

    } catch (error) {
      console.error(error);
      msgContainer.textContent = error.message || 'An error occurred. Please try again.';
      msgContainer.className = 'text-xs text-red-400 self-center';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit Assessment';
    }
  },

  /**
   * Pre-populates the form fields with user profile data.
   */
  populateForm(profile) {
    if (!profile || !profile.assessment) return;

    const data = profile.assessment;
    
    document.getElementById('input-distance').value = data.transportDistance;
    document.getElementById('input-transport-type').value = data.transportType;
    document.getElementById('input-electricity').value = data.electricity;
    document.getElementById('input-ac').value = data.acHours;
    document.getElementById('input-shopping').value = data.shopping;
    document.getElementById('input-recycling').value = data.recycling;

    const dietRadios = document.getElementsByName('dietType');
    for (const radio of dietRadios) {
      if (radio.value === data.dietType) {
        radio.checked = true;
        // Trigger accessibility focus style class if needed
        radio.closest('label').querySelector('input').checked = true;
      }
    }
  }
};

window.CarbonCalculator = CarbonCalculator;
document.addEventListener('DOMContentLoaded', () => CarbonCalculator.init());
