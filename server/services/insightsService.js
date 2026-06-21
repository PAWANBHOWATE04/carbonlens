/**
 * Insights Service
 * Analyzes carbon profile results to generate personalized insights,
 * dynamic actions ranking, and a progressive sustainability roadmap.
 */

const { EMISSION_FACTORS } = require('./calculatorService');

const DIFFICULTY_WEIGHTS = {
  'Easy': 1.0,
  'Medium': 1.5,
  'Hard': 2.0
};

/**
 * Identifies high/low emission categories, ranks actions, and creates a roadmap.
 * 
 * @param {Object} inputs Original user assessment inputs
 * @param {Object} results Calculated assessment results (from calculatorService)
 * @returns {Object} Comprehensive insights package
 */
function generateInsights(inputs, results) {
  const { breakdown, percentages, totalMonthlyCO2 } = results;

  // 1. Identify Highest and Lowest contributors
  const categories = Object.keys(breakdown);
  let highestCategory = categories[0];
  let lowestCategory = categories[0];

  categories.forEach(cat => {
    if (breakdown[cat] > breakdown[highestCategory]) {
      highestCategory = cat;
    }
    if (breakdown[cat] < breakdown[lowestCategory]) {
      lowestCategory = cat;
    }
  });

  const categoryDisplayNames = {
    transportation: 'Transportation',
    food: 'Food & Diet',
    energy: 'Home Energy',
    shopping: 'Shopping & Consumerism',
    waste: 'Waste & Recycling'
  };

  const highestContributor = {
    key: highestCategory,
    name: categoryDisplayNames[highestCategory],
    percentage: percentages[highestCategory],
    monthlyCO2: breakdown[highestCategory]
  };

  const lowestContributor = {
    key: lowestCategory,
    name: categoryDisplayNames[lowestCategory],
    percentage: percentages[lowestCategory],
    monthlyCO2: breakdown[lowestCategory]
  };

  // 2. Generate Candidate Actions
  const candidates = [];

  // Action 1: Transportation Shift
  const transportDistance = parseFloat(inputs.transportDistance) || 0;
  const transportType = inputs.transportType || 'gasoline_car';
  if (transportDistance > 0 && transportType !== 'bicycle_walking') {
    const currentFactor = EMISSION_FACTORS.transport[transportType] !== undefined 
      ? EMISSION_FACTORS.transport[transportType] 
      : EMISSION_FACTORS.transport.gasoline_car;

    const publicTransportFactor = EMISSION_FACTORS.transport.public_transport;
    // Simulate replacing 3 days of car/transit travel per week (~40% reduction) with public transport/active transit
    const reductionFactor = currentFactor > publicTransportFactor ? (currentFactor - publicTransportFactor) : currentFactor;
    const annualSaving = Math.round(transportDistance * 30 * reductionFactor * 0.4 * 12);
    
    if (annualSaving > 10) {
      candidates.push({
        id: 'transport_shift',
        name: transportType === 'public_transport' ? 'Walk or Cycle Short Trips' : 'Use Public Transit or Carpool',
        category: 'transportation',
        difficulty: 'Medium',
        annualReduction: annualSaving,
        impactScore: parseFloat((annualSaving / DIFFICULTY_WEIGHTS['Medium']).toFixed(1)),
        description: `Replace 3 days of weekly car trips with public transport, walking, or cycling. Saving is based on your daily travel of ${transportDistance} km.`
      });
    }
  }

  // Action 2: Diet Shift
  const dietType = inputs.dietType || 'mixed';
  if (dietType !== 'vegetarian') {
    const currentDietEmissions = EMISSION_FACTORS.food[dietType] !== undefined 
      ? EMISSION_FACTORS.food[dietType] 
      : EMISSION_FACTORS.food.mixed;
    const vegetarianEmissions = EMISSION_FACTORS.food.vegetarian;
    const saving = (currentDietEmissions - vegetarianEmissions) * 12;

    candidates.push({
      id: 'diet_shift',
      name: 'Adopt a Plant-Based Diet',
      category: 'food',
      difficulty: 'Hard',
      annualReduction: saving,
      impactScore: parseFloat((saving / DIFFICULTY_WEIGHTS['Hard']).toFixed(1)),
      description: `Transition your diet away from high-emission animal products to vegetarian or vegan meals. This is the single most powerful dietary improvement you can make.`
    });
  }

  // Action 3: Optimize AC Use
  const acHours = parseFloat(inputs.acHours) || 0;
  if (acHours > 0) {
    const saving = Math.round(Math.min(acHours, 2) * EMISSION_FACTORS.acHour * 12); // Reduce AC by up to 2 hours daily
    candidates.push({
      id: 'ac_optimize',
      name: 'Optimize Air Conditioning',
      category: 'energy',
      difficulty: 'Easy',
      annualReduction: saving,
      impactScore: parseFloat((saving / DIFFICULTY_WEIGHTS['Easy']).toFixed(1)),
      description: `Reduce daily AC runtime by 2 hours (or set thermostat 2°C higher) to cut grid load during peak summer hours.`
    });
  }

  // Action 4: Energy Efficiency
  const electricity = parseFloat(inputs.electricity) || 0;
  if (electricity > 0) {
    const saving = Math.round(electricity * EMISSION_FACTORS.electricity * 0.20 * 12); // Save 20% of electricity
    candidates.push({
      id: 'electricity_efficient',
      name: 'Upgrade to Energy-Efficient LEDs & Standby Management',
      category: 'energy',
      difficulty: 'Easy',
      annualReduction: saving,
      impactScore: parseFloat((saving / DIFFICULTY_WEIGHTS['Easy']).toFixed(1)),
      description: `Unplug standby appliances, switch to smart power strips, and replace home lights with LED bulbs to save 20% of electricity.`
    });
  }

  // Action 5: Shopping Habit Shift
  const shopping = inputs.shopping || 'moderate';
  if (shopping !== 'infrequent') {
    let saving = 0;
    if (shopping === 'frequent') {
      saving = (EMISSION_FACTORS.shopping.frequent - EMISSION_FACTORS.shopping.moderate) * 12;
    } else if (shopping === 'moderate') {
      saving = (EMISSION_FACTORS.shopping.moderate - EMISSION_FACTORS.shopping.infrequent) * 12;
    }

    candidates.push({
      id: 'shopping_mindful',
      name: 'Shift to Circular & Second-hand Shopping',
      category: 'shopping',
      difficulty: 'Medium',
      annualReduction: saving,
      impactScore: parseFloat((saving / DIFFICULTY_WEIGHTS['Medium']).toFixed(1)),
      description: `Transition to circular consumption: buy second-hand, rent clothing, or implement a 30-day cooling-off period before purchasing new items.`
    });
  }

  // Action 6: Recycling & Composting
  const recycling = inputs.recycling || 'sometimes';
  if (recycling !== 'always') {
    const currentWasteEmissions = EMISSION_FACTORS.waste[recycling] !== undefined 
      ? EMISSION_FACTORS.waste[recycling] 
      : EMISSION_FACTORS.waste.sometimes;
    const alwaysWasteEmissions = EMISSION_FACTORS.waste.always;
    const saving = (currentWasteEmissions - alwaysWasteEmissions) * 12;

    candidates.push({
      id: 'waste_recycle',
      name: 'Strict Waste Sorting & Organic Composting',
      category: 'waste',
      difficulty: 'Easy',
      annualReduction: saving,
      impactScore: parseFloat((saving / DIFFICULTY_WEIGHTS['Easy']).toFixed(1)),
      description: `Adopt a zero-landfill habit. Recycle all paper, plastics, and metals, and set up a home compost system for kitchen scrap waste.`
    });
  }

  // 3. Sort Candidates by Impact Score Descending and pick Top 3
  candidates.sort((a, b) => b.impactScore - a.impactScore);
  const topActions = candidates.slice(0, 3);

  // If there are fewer than 3 actions generated, add fallback standard ones
  if (topActions.length < 3) {
    const fallbacks = [
      {
        id: 'fallback_bottle',
        name: 'Say No to Single-Use Plastics',
        category: 'waste',
        difficulty: 'Easy',
        annualReduction: 50,
        impactScore: 50.0,
        description: 'Carry a reusable water bottle and cloth shopping bags to avoid purchasing single-use packaging.'
      },
      {
        id: 'fallback_vampire_draw',
        name: 'Eliminate Vampire Power Draw',
        category: 'energy',
        difficulty: 'Easy',
        annualReduction: 75,
        impactScore: 75.0,
        description: 'Unplug chargers and electronics when not in use, as they consume small amounts of power continuously.'
      },
      {
        id: 'fallback_transit_one_day',
        name: 'No-Car Commute One Day a Week',
        category: 'transportation',
        difficulty: 'Medium',
        annualReduction: 120,
        impactScore: 80.0,
        description: 'Switch your commute to public transit, biking, or walking just one day per week.'
      }
    ];

    for (const fb of fallbacks) {
      if (topActions.length >= 3) break;
      if (!topActions.some(a => a.id === fb.id || a.name === fb.name)) {
        topActions.push(fb);
      }
    }
  }

  // 4. Generate dynamic 30-60-90 Day Roadmap
  // 30-day: Easy goal. 60-day: Medium goal. 90-day: Hard goal.
  // Find candidates that match these difficulty tiers, or use defaults.
  const easyCandidates = candidates.filter(c => c.difficulty === 'Easy');
  const mediumCandidates = candidates.filter(c => c.difficulty === 'Medium');
  const hardCandidates = candidates.filter(c => c.difficulty === 'Hard');

  // Helper to get or fallback
  const getRoadmapGoal = (tierCandidates, defaultGoal) => {
    if (tierCandidates.length > 0) {
      const best = tierCandidates[0]; // Already sorted by impact score
      return {
        action: best.name,
        benefit: best.description,
        reduction: best.annualReduction,
        difficulty: best.difficulty
      };
    }
    return defaultGoal;
  };

  const roadmap = {
    goal30: getRoadmapGoal(easyCandidates, {
      action: 'Unplug Vampire Power & Recycle Smartly',
      benefit: 'Eliminate standby power draw and separate all plastic/metal containers from household waste streams.',
      reduction: 90,
      difficulty: 'Easy'
    }),
    goal60: getRoadmapGoal(mediumCandidates, {
      action: 'Shift to Carpooling & Buy Second-hand First',
      benefit: 'Switch half of your driving trips to public transport or shared rides, and prioritize pre-owned items for shopping.',
      reduction: 350,
      difficulty: 'Medium'
    }),
    goal90: getRoadmapGoal(hardCandidates, {
      action: 'Adopt a Low-Emission Diet (Plant-Based Weekdays)',
      benefit: 'Transition to a vegetarian/vegan diet on weekdays, cutting down beef and pork purchases significantly.',
      reduction: 750,
      difficulty: 'Hard'
    })
  };

  // 5. Generate descriptive insights paragraph summarizing priorities
  let coachSummary = '';
  if (highestCategory === 'transportation') {
    coachSummary = `Transportation is currently your largest carbon source, making up ${percentages.transportation}% of your emissions. Prioritizing electric transport, public transit, or cycling will yield your greatest footprint reduction.`;
  } else if (highestCategory === 'food') {
    coachSummary = `Your diet is currently your leading source of emissions, accounting for ${percentages.food}% of your carbon footprint. Shifting from heavy meat meals to plant-based days will make a major, immediate dent in your output.`;
  } else if (highestCategory === 'energy') {
    coachSummary = `Household energy usage contributes ${percentages.energy}% of your emissions. Reducing AC operation times, installing LED lighting, and switching off standby appliances is your best starting path.`;
  } else if (highestCategory === 'shopping') {
    coachSummary = `Shopping and consumption represents your highest source at ${percentages.shopping}%. Adopting mindful shopping habits, such as shopping second-hand or renting clothing, will drastically lower your impact.`;
  } else {
    coachSummary = `Waste is your highest emission category at ${percentages.waste}%. Focusing on zero-landfill habits, stricter recycling sorting, and home organic composting is recommended to lower this contributor.`;
  }

  return {
    highestContributor,
    lowestContributor,
    topActions,
    roadmap,
    coachSummary
  };
}

module.exports = {
  generateInsights
};
