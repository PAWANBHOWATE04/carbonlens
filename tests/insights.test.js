/**
 * Insights Service tests
 */

const { generateInsights } = require('../server/services/insightsService');
const { calculateCarbonFootprint } = require('../server/services/calculatorService');

describe('Insights Service Tests', () => {
  test('should generate and rank recommendations and roadmap based on profile data', () => {
    const inputs = {
      transportDistance: 60,
      transportType: 'gasoline_car', // high transport
      dietType: 'mixed',
      electricity: 100,
      acHours: 0,
      shopping: 'infrequent',
      recycling: 'always' // low waste
    };

    const results = calculateCarbonFootprint(inputs);
    const insights = generateInsights(inputs, results);

    // Assert highest/lowest contributors
    expect(insights.highestContributor.key).toBe('transportation');
    expect(insights.lowestContributor.key).toBe('waste');

    // Assert actions list exists and is sorted by impactScore descending
    expect(insights.topActions.length).toBe(3);
    expect(insights.topActions[0].impactScore).toBeGreaterThanOrEqual(insights.topActions[1].impactScore);
    expect(insights.topActions[1].impactScore).toBeGreaterThanOrEqual(insights.topActions[2].impactScore);

    // Assert roadmap has 30, 60, 90 day goals
    expect(insights.roadmap).toHaveProperty('goal30');
    expect(insights.roadmap).toHaveProperty('goal60');
    expect(insights.roadmap).toHaveProperty('goal90');

    // Easy goal should be 30-day, medium 60-day, hard 90-day
    expect(insights.roadmap.goal30.difficulty).toBe('Easy');
    expect(insights.roadmap.goal60.difficulty).toBe('Medium');
    expect(insights.roadmap.goal90.difficulty).toBe('Hard');
  });

  test('should provide transportation action savings based on driving metric', () => {
    const inputs = {
      transportDistance: 100,
      transportType: 'gasoline_car',
      dietType: 'vegetarian',
      electricity: 0,
      acHours: 0,
      shopping: 'infrequent',
      recycling: 'always'
    };

    const results = calculateCarbonFootprint(inputs);
    const insights = generateInsights(inputs, results);

    // Find the transport action
    const transportAction = insights.topActions.find(a => a.category === 'transportation');
    expect(transportAction).toBeDefined();
    // Saving: 100 * 30 * (0.18 - 0.04) * 0.4 * 12 = 3000 * 0.14 * 4.8 = 2016 kg/year
    expect(transportAction.annualReduction).toBe(2016);
    expect(transportAction.impactScore).toBe(1344); // 2016 / 1.5 = 1344
  });
});
