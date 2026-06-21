/**
 * Validation Utility
 * Contains pure validation helpers for checking and parsing CarbonLens API payloads.
 */

// Validation Limits Constants
const USERNAME_MAX_LENGTH = 30;
const DISTANCE_MAX_LIMIT = 1000;
const ELECTRICITY_MAX_LIMIT = 10000;
const AC_HOURS_MAX_LIMIT = 24;
const PERCENTAGE_MAX_LIMIT = 100;

const VALID_TRANSPORT_TYPES = ['gasoline_car', 'diesel_car', 'electric_car', 'public_transport', 'bicycle_walking'];
const VALID_DIET_TYPES = ['vegetarian', 'mixed', 'heavy_meat'];
const VALID_SHOPPING_HABITS = ['infrequent', 'moderate', 'frequent'];
const VALID_RECYCLING_HABITS = ['always', 'sometimes', 'never'];

/**
 * Validates username string and pattern.
 * @param {string} username Raw username input
 * @returns {string|null} Error message or null if valid
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return 'Username is required and must be a string.';
  }
  const cleanUsername = username.trim();
  const usernameRegex = /^[a-zA-Z0-9_-]{1,30}$/;
  if (!usernameRegex.test(cleanUsername) || cleanUsername.length > USERNAME_MAX_LENGTH) {
    return `Username must be 1-${USERNAME_MAX_LENGTH} characters long and contain only letters, numbers, underscores, or hyphens.`;
  }
  return null;
}

/**
 * Validates carbon assessment form inputs.
 * @param {Object} inputs Raw request payload
 * @returns {Object} Object containing parsed inputs { parsedInputs }, or { error } if invalid
 */
function validateAssessmentInputs(inputs) {
  const distNum = parseFloat(inputs.transportDistance);
  if (isNaN(distNum) || distNum < 0 || distNum > DISTANCE_MAX_LIMIT) {
    return { error: `Daily distance must be a positive number between 0 and ${DISTANCE_MAX_LIMIT}.` };
  }

  if (!VALID_TRANSPORT_TYPES.includes(inputs.transportType)) {
    return { error: 'Invalid vehicle transport type specified.' };
  }

  if (!VALID_DIET_TYPES.includes(inputs.dietType)) {
    return { error: 'Invalid diet type specified.' };
  }

  const electricityNum = parseFloat(inputs.electricity);
  if (isNaN(electricityNum) || electricityNum < 0 || electricityNum > ELECTRICITY_MAX_LIMIT) {
    return { error: `Electricity usage must be a positive number between 0 and ${ELECTRICITY_MAX_LIMIT} kWh.` };
  }

  const acHoursNum = parseFloat(inputs.acHours);
  if (isNaN(acHoursNum) || acHoursNum < 0 || acHoursNum > AC_HOURS_MAX_LIMIT) {
    return { error: `Daily AC usage must be a positive number between 0 and ${AC_HOURS_MAX_LIMIT} hours.` };
  }

  if (!VALID_SHOPPING_HABITS.includes(inputs.shopping)) {
    return { error: 'Invalid shopping consumption habits specified.' };
  }

  if (!VALID_RECYCLING_HABITS.includes(inputs.recycling)) {
    return { error: 'Invalid recycling habits specified.' };
  }

  return {
    parsedInputs: {
      transportDistance: distNum,
      transportType: inputs.transportType,
      dietType: inputs.dietType,
      electricity: electricityNum,
      acHours: acHoursNum,
      shopping: inputs.shopping,
      recycling: inputs.recycling
    }
  };
}

/**
 * Validates habit simulation inputs against a user profile's baseline.
 * @param {Object} inputs Raw simulator request payload
 * @param {number} maxAcHours The user's original AC hours baseline
 * @returns {Object} Object containing parsed inputs { parsedInputs }, or { error } if invalid
 */
function validateSimulationInputs(inputs, maxAcHours) {
  const transRed = parseFloat(inputs.transportReduction);
  if (isNaN(transRed) || transRed < 0 || transRed > PERCENTAGE_MAX_LIMIT) {
    return { error: `Transportation reduction must be a percentage between 0 and ${PERCENTAGE_MAX_LIMIT}.` };
  }

  const acRed = parseFloat(inputs.acReduction);
  if (isNaN(acRed) || acRed < 0 || acRed > maxAcHours) {
    return { error: `AC reduction hours must be between 0 and your current daily AC hours (${maxAcHours}).` };
  }

  if (!VALID_DIET_TYPES.includes(inputs.dietType)) {
    return { error: 'Invalid simulated diet type specified.' };
  }

  return {
    parsedInputs: {
      transportReduction: transRed,
      acReduction: acRed,
      dietType: inputs.dietType
    }
  };
}

/**
 * Basic text sanitization to prevent script injection.
 * @param {string} text Raw string input
 * @returns {string} Sanitized string
 */
function sanitizeInput(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

module.exports = {
  validateUsername,
  validateAssessmentInputs,
  validateSimulationInputs,
  sanitizeInput
};
