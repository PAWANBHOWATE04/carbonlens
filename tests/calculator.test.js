/**
 * Calculator Service tests
 */

const { calculateCarbonFootprint } = require('../server/services/calculatorService');

describe('Calculator Service Tests', () => {
  test('should correctly compute emissions and rating for high-impact habits', () => {
    const inputs = {
      transportDistance: 80, // 80km * 30 days * 0.18 kg CO2/km = 432 kg CO2
      transportType: 'gasoline_car',
      dietType: 'heavy_meat', // 250 kg CO2
      electricity: 500, // 500kWh * 0.4 kg CO2 = 200 kg CO2
      acHours: 8, // 8hrs * 18 kg CO2 = 144 kg CO2
      shopping: 'frequent', // 250 kg CO2
      recycling: 'never' // 50 kg CO2
    };

    // Total: 432 + 250 + (200 + 144) + 250 + 50 = 1326 kg CO2/month
    // Score: Math.max(0, 100 - Math.round(1326 / 15)) = 100 - 88 = 12
    // Rating: High Impact (Score < 45)

    const results = calculateCarbonFootprint(inputs);

    expect(results.totalMonthlyCO2).toBe(1326);
    expect(results.carbonScore).toBe(12);
    expect(results.rating).toBe('High Impact');
    expect(results.breakdown.transportation).toBe(432);
    expect(results.breakdown.food).toBe(250);
    expect(results.breakdown.energy).toBe(344);
    expect(results.breakdown.shopping).toBe(250);
    expect(results.breakdown.waste).toBe(50);
  });

  test('should correctly compute emissions and rating for moderate-impact habits', () => {
    const inputs = {
      transportDistance: 20, // 20km * 30 days * 0.17 kg CO2/km = 102 kg CO2
      transportType: 'diesel_car',
      dietType: 'mixed', // 150 kg CO2
      electricity: 200, // 200kWh * 0.4 = 80 kg CO2
      acHours: 2, // 2hrs * 18 = 36 kg CO2
      shopping: 'moderate', // 100 kg CO2
      recycling: 'sometimes' // 25 kg CO2
    };

    // Total: 102 + 150 + 116 + 100 + 25 = 493 kg CO2/month
    // Score: Math.max(0, 100 - Math.round(493 / 15)) = 100 - 33 = 67
    // Rating: Improving (Score 45 - 74)

    const results = calculateCarbonFootprint(inputs);

    expect(results.totalMonthlyCO2).toBe(493);
    expect(results.carbonScore).toBe(67);
    expect(results.rating).toBe('Improving');
  });

  test('should correctly compute emissions and rating for low-impact habits', () => {
    const inputs = {
      transportDistance: 10, // 10km * 30 days * 0.0 kg CO2/km = 0 kg CO2
      transportType: 'bicycle_walking',
      dietType: 'vegetarian', // 80 kg CO2
      electricity: 80, // 80kWh * 0.4 = 32 kg CO2
      acHours: 0, // 0 kg CO2
      shopping: 'infrequent', // 30 kg CO2
      recycling: 'always' // 10 kg CO2
    };

    // Total: 0 + 80 + 32 + 30 + 10 = 152 kg CO2/month
    // Score: Math.max(0, 100 - Math.round(152 / 15)) = 100 - 10 = 90
    // Rating: Green (Score >= 75)

    const results = calculateCarbonFootprint(inputs);

    expect(results.totalMonthlyCO2).toBe(152);
    expect(results.carbonScore).toBe(90);
    expect(results.rating).toBe('Green');
  });
});
