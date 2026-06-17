/**
 * Impact Simulator Logic tests
 */

const { calculateCarbonFootprint } = require('../server/services/calculatorService');

// Mimic the controller's simulator math to test it thoroughly
function simulateHabits(currentAssessment, currentResults, simulationParams) {
  const { transportReduction, acReduction, dietType } = simulationParams;

  // Reduce daily travel distance by simulated %
  const simulatedDistance = currentAssessment.transportDistance * (1 - transportReduction / 100);
  // Reduce daily AC hours by simulated amount
  const simulatedACHours = Math.max(0, currentAssessment.acHours - acReduction);

  const simulatedInputs = {
    transportDistance: simulatedDistance,
    transportType: currentAssessment.transportType,
    dietType: dietType,
    electricity: currentAssessment.electricity,
    acHours: simulatedACHours,
    shopping: currentAssessment.shopping,
    recycling: currentAssessment.recycling
  };

  const simulatedResults = calculateCarbonFootprint(simulatedInputs);

  const currentTotal = currentResults.totalMonthlyCO2;
  const predictedTotal = simulatedResults.totalMonthlyCO2;
  const reductionAmount = Math.max(0, currentTotal - predictedTotal);
  const reductionPercentage = currentTotal > 0 
    ? parseFloat(((reductionAmount / currentTotal) * 100).toFixed(1)) 
    : 0;

  return {
    currentFootprint: currentTotal,
    predictedFootprint: predictedTotal,
    reductionAmount,
    reductionPercentage
  };
}

describe('Impact Simulator Logic Tests', () => {
  test('should accurately calculate savings when user simulates positive changes', () => {
    const currentAssessment = {
      transportDistance: 50, // 50km * 30 * 0.18 = 270 kg
      transportType: 'gasoline_car',
      dietType: 'heavy_meat', // 250 kg
      electricity: 250, // 250 * 0.4 = 100 kg
      acHours: 6, // 6 * 18 = 108 kg
      shopping: 'moderate', // 100 kg
      recycling: 'sometimes' // 25 kg
    };
    // Total: 270 + 250 + 100 + 108 + 100 + 25 = 853 kg CO2/month

    const currentResults = calculateCarbonFootprint(currentAssessment);
    expect(currentResults.totalMonthlyCO2).toBe(853);

    // Simulate: 
    // 1. Reduce transportation by 50% (travel becomes 25km/day -> 135 kg emissions, saving 135 kg)
    // 2. Reduce AC by 4 hours (AC becomes 2 hours/day -> 36 kg emissions, saving 72 kg)
    // 3. Switch diet from heavy_meat to vegetarian (diet becomes vegetarian -> 80 kg, saving 170 kg)
    // Total expected simulated footprint: 135 + 80 + 100 + 36 + 100 + 25 = 476 kg CO2/month
    // Expected saving: 853 - 476 = 377 kg CO2
    // Percentage: (377 / 853) * 100 = 44.197% -> 44.2%

    const simulationParams = {
      transportReduction: 50,
      acReduction: 4,
      dietType: 'vegetarian'
    };

    const simResults = simulateHabits(currentAssessment, currentResults, simulationParams);

    expect(simResults.currentFootprint).toBe(853);
    expect(simResults.predictedFootprint).toBe(476);
    expect(simResults.reductionAmount).toBe(377);
    expect(simResults.reductionPercentage).toBe(44.2);
  });
});
