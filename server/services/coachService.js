/**
 * Coach Service
 * Analyzes chat messages from the user and returns context-aware,
 * data-backed consulting responses based on their current assessment profile.
 */

/**
 * Generates a tailored response from the AI Decision Coach.
 * 
 * @param {string} message User's text message
 * @param {Object} userProfile User's stored profile object
 * @returns {string} Tailored consulting advice
 */
function getCoachResponse(message, userProfile) {
  const text = (message || '').toLowerCase().trim();

  // Case 1: User has not completed the assessment yet
  if (!userProfile || !userProfile.assessment || !userProfile.results) {
    return `Hello! I am your CarbonLens Sustainability Coach. I see you haven't completed your Carbon Assessment yet. 

To help you effectively, I need to understand your current habits. Please navigate to the **Carbon Assessment** tab and complete the quick form. Once you submit, I'll be able to analyze your footprint, identify your highest emission categories, and give you a personalized roadmap!`;
  }

  const { assessment, results, insights, points, streak } = userProfile;
  const { totalMonthlyCO2, carbonScore, rating, percentages, breakdown } = results;
  const { highestContributor, lowestContributor, topActions } = insights;

  // Formatting helpers
  const formatCategory = (cat) => cat === 'public_transport' ? 'public transport' : cat.replace('_', ' ');

  // Case 2: User asks about transport / travel / car
  if (text.includes('transport') || text.includes('car') || text.includes('drive') || text.includes('vehicle') || text.includes('travel') || text.includes('commute') || text.includes('distance')) {
    const dist = assessment.transportDistance;
    const type = formatCategory(assessment.transportType);
    const co2 = breakdown.transportation;
    const pct = percentages.transportation;

    if (dist === 0) {
      return `Fantastic job! According to your profile, you do not travel by fossil-fuel vehicles (0 daily distance). Your transportation footprint is 0 kg CO₂. Keeping travel emissions to a minimum is one of the best choices for the planet. Let's make sure we keep other categories low as well!`;
    }

    const rec = topActions.find(a => a.category === 'transportation');
    const recText = rec 
      ? `I recommend taking action: **${rec.name}**. By doing this, you could reduce your annual emissions by approximately **${rec.annualReduction} kg CO₂**!`
      : 'Try carpooling or combining trips to optimize your current vehicle usage.';

    return `I see you currently travel **${dist} km daily** using a **${type}**. This transportation habit produces **${co2} kg CO₂** per month, representing **${pct}%** of your total footprint. 

Since transportation is a significant factor in your lifestyle, ${recText} Shifting just 2 days of weekly travel to active transit (walking or cycling) or public transport is an excellent next step. You could also try joining our **No-Car Friday** challenge to build the habit.`;
  }

  // Case 3: User asks about food / diet / meat / eating
  if (text.includes('food') || text.includes('diet') || text.includes('meat') || text.includes('vegetarian') || text.includes('vegan') || text.includes('eat') || text.includes('eating')) {
    const diet = formatCategory(assessment.dietType);
    const co2 = breakdown.food;
    const pct = percentages.food;

    if (diet === 'vegetarian') {
      return `Outstanding! You have adopted a **vegetarian** diet, which keeps your food footprint at a low **${co2} kg CO₂** per month (**${pct}%** of your total). Plant-based eating has a massive reduction effect. If you want to challenge yourself further, try replacing dairy or shopping for locally sourced produce to minimize transport emissions related to food distribution.`;
    }

    const savings = diet === 'heavy_meat' ? (250 - 80) * 12 : (150 - 80) * 12;

    return `Your diet is currently set as **${diet}**, which contributes **${co2} kg CO₂** per month (**${pct}%** of your total emissions).

Animal-based agriculture is resource-intensive. Switching to a plant-based or vegetarian diet can save up to **${savings} kg CO₂ annually**! You don't have to change overnight: starting with our **Plant-Based Monday** challenge is a simple, low-pressure way to make a measurable difference.`;
  }

  // Case 4: User asks about energy / electricity / AC / air conditioning / power
  if (text.includes('energy') || text.includes('electricity') || text.includes('ac') || text.includes('air conditioning') || text.includes('power') || text.includes('utility') || text.includes('home')) {
    const ele = assessment.electricity;
    const ac = assessment.acHours;
    const co2 = breakdown.energy;
    const pct = percentages.energy;

    let advice = '';
    if (ac > 0) {
      advice += `Your daily AC usage of **${ac} hours** contributes significantly to this. Reducing AC usage by just 2 hours daily could cut your annual emissions by **${Math.round(Math.min(ac, 2) * 18 * 12)} kg CO₂**! `;
    }
    advice += `Additionally, turning off standby appliances and switching to LED lightbulbs can shave off 20% of your electricity consumption (${ele} kWh/month).`;

    return `Your home energy usage accounts for **${co2} kg CO₂** per month (**${pct}%** of your total). This includes your **${ele} kWh** monthly electricity usage and **${ac} hours** of daily AC.

${advice} Energy-saving settings on refrigerators and washing in cold water are also quick wins to reduce your utility bills while helping the environment.`;
  }

  // Case 5: User asks about shopping / buy / purchases / clothes / consumption
  if (text.includes('shopping') || text.includes('buy') || text.includes('purchase') || text.includes('spending') || text.includes('clothes') || text.includes('consumer')) {
    const shop = assessment.shopping;
    const co2 = breakdown.shopping;
    const pct = percentages.shopping;

    if (shop === 'infrequent') {
      return `Great work! Your shopping habit is categorized as **infrequent**, keeping your consumption emissions at **${co2} kg CO₂** per month (**${pct}%** of your total). Limiting new purchases, buying high-quality items that last, and prioritizing second-hand items is key to maintaining a circular lifestyle.`;
    }

    const savings = shop === 'frequent' ? (250 - 100) * 12 : (100 - 30) * 12;

    return `Your consumption habits are categorized as **${shop}**, which generates **${co2} kg CO₂** per month (**${pct}%** of your footprint). 

Manufacturing, packaging, and shipping new products represent a large amount of upstream emissions. Shifting your buying habits (e.g., buying second-hand, renting clothes, or repairing items instead of buying new) can reduce your emissions by **${savings} kg CO₂ annually**. Try introducing a '30-day rule' where you wait 30 days before buying any non-essential item.`;
  }

  // Case 6: User asks about waste / recycling / recycle / trash / compost
  if (text.includes('waste') || text.includes('recycle') || text.includes('recycling') || text.includes('trash') || text.includes('garbage') || text.includes('compost')) {
    const rec = assessment.recycling;
    const co2 = breakdown.waste;
    const pct = percentages.waste;

    if (rec === 'always') {
      return `Awesome! You **always** recycle, which reduces your waste footprint to just **${co2} kg CO₂** per month (**${pct}%** of your total). Composting organic food waste is another high-value step. Organic waste in landfills releases methane, a potent greenhouse gas, whereas home composting turns it into rich soil!`;
    }

    const savings = rec === 'never' ? (50 - 10) * 12 : (25 - 10) * 12;

    return `Your recycling habit is **${rec}**, which contributes **${co2} kg CO₂** per month (**${pct}%** of your total footprint). 

Waste management affects methane emissions in landfills. By committing to sorting recyclables (paper, plastic, glass, metal) and adopting composting, you can save up to **${savings} kg CO₂ annually**. Carrying reusable bottles and bags is also a powerful way to reduce single-use plastic waste! Try our **Reusable Bottle Week** challenge.`;
  }

  // Case 7: User asks about their score / rating / footprint / summary
  if (text.includes('score') || text.includes('rating') || text.includes('footprint') || text.includes('summary') || text.includes('how am i') || text.includes('status')) {
    return `Here is a summary of your carbon analysis:
- **Carbon Score**: **${carbonScore}/100**
- **Sustainability Rating**: **${rating}**
- **Monthly Footprint**: **${totalMonthlyCO2} kg CO₂**

Your highest source of emissions is **${highestContributor.name}** at **${highestContributor.percentage}%** of your total. 
Your lowest source of emissions is **${lowestContributor.name}** at **${lowestContributor.percentage}%** of your total.

Your top priority recommendation is to **${topActions[0].name}**, which will save an estimated **${topActions[0].annualReduction} kg CO₂ per year**. Let's try to focus on this area first!`;
  }

  // Case 8: User asks about challenges / points / streak / progress
  if (text.includes('challenge') || text.includes('point') || text.includes('streak') || text.includes('scorecard') || text.includes('game')) {
    return `You currently have **${points} points** and an active streak of **${streak} days**. 

Completing challenges is a fantastic way to turn carbon reduction into an engaging habit. We currently offer three main challenges:
1. **No-Car Friday** (50 points) - Reduces transportation emissions.
2. **Plant-Based Monday** (40 points) - Reduces food emissions.
3. **Reusable Bottle Week** (20 points) - Reduces plastic waste.

You can toggle their completion status directly in the **Challenges** panel of your dashboard to claim your points and build your streak.`;
  }

  // Case 9: General/Consultant response
  return `As your Climate Coach, I've analyzed your monthly emissions of **${totalMonthlyCO2} kg CO₂** (Carbon Score: **${carbonScore}/100**, Rating: **${rating}**). 

Your biggest contributor is **${highestContributor.name}** (**${highestContributor.percentage}%** of total). Because of this, your highest-impact action is:
👉 **${topActions[0].name}**
*   Annual Reduction: **${topActions[0].annualReduction} kg CO₂**
*   Difficulty Level: **${topActions[0].difficulty}**

You can also consult your **Personal Carbon Roadmap** on the dashboard for a custom 30, 60, and 90-day action plan. What specific category would you like advice on? Ask me about *transportation*, *diet*, *energy*, *shopping*, or *recycling*!`;
}

module.exports = {
  getCoachResponse
};
