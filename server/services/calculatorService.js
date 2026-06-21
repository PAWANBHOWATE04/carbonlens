/**
 * Calculator Service
 * Handles carbon footprint calculation logic, scoring, and rating categorization.
 */

/**
 * Coefficient factors used to translate user habits into monthly kg CO2 emissions.
 */
const EMISSION_FACTORS = {
  transport: {
    gasoline_car: 0.18,      // kg CO2 per km
    diesel_car: 0.17,        // kg CO2 per km
    electric_car: 0.05,      // kg CO2 per km
    public_transport: 0.04,  // kg CO2 per km
    bicycle_walking: 0.0     // kg CO2 per km
  },
  food: {
    vegetarian: 80,          // kg CO2 per month
    mixed: 150,              // kg CO2 per month
    heavy_meat: 250          // kg CO2 per month
  },
  shopping: {
    infrequent: 30,          // kg CO2 per month
    moderate: 100,           // kg CO2 per month
    frequent: 250            // kg CO2 per month
  },
  waste: {
    always: 10,              // kg CO2 per month (high recycling)
    sometimes: 25,           // kg CO2 per month (moderate recycling)
    never: 50                // kg CO2 per month (no recycling)
  },
  electricity: 0.4,          // kg CO2 per kWh
  acHour: 18                 // kg CO2 per hour of daily AC use per month (1.5 kW * 30 days * 0.4 kg/kWh)
};

// Global Calculation & Scoring Constants
const DAYS_IN_MONTH = 30;
const MAX_SCORE = 100;
const SCORE_CONVERSION_FACTOR = 15;
const PERCENTAGE_MULTIPLIER = 100;

// Rating Thresholds
const RATING_GREEN_THRESHOLD = 75;
const RATING_IMPROVING_THRESHOLD = 45;

/**
 * Calculates monthly carbon footprint based on assessment inputs.
 * 
 * @param {Object} inputs Assessment inputs
 * @param {number} inputs.transportDistance Daily distance in km
 * @param {string} inputs.transportType Vehicle type
 * @param {string} inputs.dietType Diet type
 * @param {number} inputs.electricity Monthly electricity in kWh
 * @param {number} inputs.acHours Daily AC usage in hours
 * @param {string} inputs.shopping Shopping consumption habits
 * @param {string} inputs.recycling Recycling habits
 * 
 * @returns {Object} Calculated emission results, percentages, score, and rating
 */
function calculateCarbonFootprint(inputs) {
  // 1. Fallback & validation defaults
  const transportDistance = parseFloat(inputs.transportDistance) || 0;
  const transportType = inputs.transportType || 'gasoline_car';
  const dietType = inputs.dietType || 'mixed';
  const electricity = parseFloat(inputs.electricity) || 0;
  const acHours = parseFloat(inputs.acHours) || 0;
  const shopping = inputs.shopping || 'moderate';
  const recycling = inputs.recycling || 'sometimes';

  // 2. Calculations per category
  const transportFactor = EMISSION_FACTORS.transport[transportType] !== undefined 
    ? EMISSION_FACTORS.transport[transportType] 
    : EMISSION_FACTORS.transport.gasoline_car;
  
  const transportEmissions = Math.round(transportDistance * DAYS_IN_MONTH * transportFactor);

  const foodEmissions = EMISSION_FACTORS.food[dietType] !== undefined 
    ? EMISSION_FACTORS.food[dietType] 
    : EMISSION_FACTORS.food.mixed;

  const electricityEmissions = electricity * EMISSION_FACTORS.electricity;
  const acEmissions = acHours * EMISSION_FACTORS.acHour;
  const energyEmissions = Math.round(electricityEmissions + acEmissions);

  const shoppingEmissions = EMISSION_FACTORS.shopping[shopping] !== undefined 
    ? EMISSION_FACTORS.shopping[shopping] 
    : EMISSION_FACTORS.shopping.moderate;

  const wasteEmissions = EMISSION_FACTORS.waste[recycling] !== undefined 
    ? EMISSION_FACTORS.waste[recycling] 
    : EMISSION_FACTORS.waste.sometimes;

  // 3. Totals
  const totalMonthlyCO2 = transportEmissions + foodEmissions + energyEmissions + shoppingEmissions + wasteEmissions;

  // 4. Carbon Score calculation (0 - 100 scale, higher is cleaner/better)
  // A score of 100 corresponds to 0 emissions. Every 15 kg of CO2 reduces score by 1.
  const carbonScore = Math.max(0, MAX_SCORE - Math.round(totalMonthlyCO2 / SCORE_CONVERSION_FACTOR));

  // 5. Sustainability Rating categorization
  let rating = 'High Impact';
  if (carbonScore >= RATING_GREEN_THRESHOLD) {
    rating = 'Green';
  } else if (carbonScore >= RATING_IMPROVING_THRESHOLD) {
    rating = 'Improving';
  }

  // 6. Category breakdown percentage details
  const breakdown = {
    transportation: transportEmissions,
    food: foodEmissions,
    energy: energyEmissions,
    shopping: shoppingEmissions,
    waste: wasteEmissions
  };

  const percentages = {};
  for (const cat in breakdown) {
    percentages[cat] = totalMonthlyCO2 > 0 
      ? Math.round((breakdown[cat] / totalMonthlyCO2) * PERCENTAGE_MULTIPLIER) 
      : 0;
  }

  return {
    breakdown,
    percentages,
    totalMonthlyCO2,
    carbonScore,
    rating
  };
}

module.exports = {
  EMISSION_FACTORS,
  calculateCarbonFootprint
};
