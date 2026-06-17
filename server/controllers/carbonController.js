/**
 * Carbon Controller
 * Manages database reading/writing, request validation, sanitization,
 * and coordinates service execution.
 */

const fs = require('fs');
const path = require('path');
const calculatorService = require('../services/calculatorService');
const insightsService = require('../services/insightsService');
const coachService = require('../services/coachService');

const DB_PATH = path.join(__dirname, '../data/db.json');

// --- Helper Functions ---

/**
 * Safely reads the JSON database from disk.
 * If file does not exist, returns empty structure.
 */
function readDb() {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return { users: {} };
    }
    const rawData = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading JSON database:', error);
    return { users: {} };
  }
}

/**
 * Safely writes data to the JSON database.
 */
function writeDb(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to JSON database:', error);
    return false;
  }
}

/**
 * Returns a default user profile object.
 */
function createDefaultProfile(username) {
  return {
    username: username,
    assessment: null,
    results: null,
    insights: null,
    challenges: [
      { id: 'no_car_friday', name: 'No-Car Friday', points: 50, completed: false, streak: 0 },
      { id: 'plant_based_monday', name: 'Plant-Based Monday', points: 40, completed: false, streak: 0 },
      { id: 'reusable_bottle', name: 'Reusable Bottle Week', points: 20, completed: false, streak: 0 }
    ],
    points: 0,
    streak: 0,
    chatHistory: []
  };
}

/**
 * Basic text sanitization to prevent script injection.
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

// --- Controller Actions ---

/**
 * Login or register a user by username.
 */
exports.login = (req, res) => {
  try {
    let { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required and must be a string.' });
    }

    // Sanitize username (alphanumeric, 1-30 chars, no spaces)
    username = username.trim();
    const usernameRegex = /^[a-zA-Z0-9_-]{1,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        error: 'Username must be 1-30 characters long and contain only letters, numbers, underscores, or hyphens.' 
      });
    }

    const db = readDb();
    if (!db.users[username]) {
      db.users[username] = createDefaultProfile(username);
      writeDb(db);
    }

    return res.status(200).json(db.users[username]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Submit carbon footprint assessment and update insights.
 */
exports.submitAssessment = (req, res) => {
  try {
    const { 
      username, 
      transportDistance, 
      transportType, 
      dietType, 
      electricity, 
      acHours, 
      shopping, 
      recycling 
    } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const db = readDb();
    if (!db.users[username]) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Input Validation
    const distNum = parseFloat(transportDistance);
    if (isNaN(distNum) || distNum < 0 || distNum > 1000) {
      return res.status(400).json({ error: 'Daily distance must be a positive number between 0 and 1000.' });
    }

    const validTransportTypes = ['gasoline_car', 'diesel_car', 'electric_car', 'public_transport', 'bicycle_walking'];
    if (!validTransportTypes.includes(transportType)) {
      return res.status(400).json({ error: 'Invalid vehicle transport type specified.' });
    }

    const validDietTypes = ['vegetarian', 'mixed', 'heavy_meat'];
    if (!validDietTypes.includes(dietType)) {
      return res.status(400).json({ error: 'Invalid diet type specified.' });
    }

    const electricityNum = parseFloat(electricity);
    if (isNaN(electricityNum) || electricityNum < 0 || electricityNum > 10000) {
      return res.status(400).json({ error: 'Electricity usage must be a positive number between 0 and 10,000 kWh.' });
    }

    const acHoursNum = parseFloat(acHours);
    if (isNaN(acHoursNum) || acHoursNum < 0 || acHoursNum > 24) {
      return res.status(400).json({ error: 'Daily AC usage must be a positive number between 0 and 24 hours.' });
    }

    const validShopping = ['infrequent', 'moderate', 'frequent'];
    if (!validShopping.includes(shopping)) {
      return res.status(400).json({ error: 'Invalid shopping consumption habits specified.' });
    }

    const validRecycling = ['always', 'sometimes', 'never'];
    if (!validRecycling.includes(recycling)) {
      return res.status(400).json({ error: 'Invalid recycling habits specified.' });
    }

    // Package assessment data
    const assessmentInputs = {
      transportDistance: distNum,
      transportType,
      dietType,
      electricity: electricityNum,
      acHours: acHoursNum,
      shopping,
      recycling
    };

    // Calculate results
    const results = calculatorService.calculateCarbonFootprint(assessmentInputs);
    
    // Generate AI recommendations, Top Actions, and Roadmap
    const insights = insightsService.generateInsights(assessmentInputs, results);

    // Save user profile state
    db.users[username].assessment = assessmentInputs;
    db.users[username].results = results;
    db.users[username].insights = insights;

    writeDb(db);

    return res.status(200).json(db.users[username]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Toggle sustainability challenge completion and recalculate user points and streak.
 */
exports.toggleChallenge = (req, res) => {
  try {
    const { username, challengeId, completed } = req.body;

    if (!username || !challengeId) {
      return res.status(400).json({ error: 'Username and challenge ID are required.' });
    }

    const db = readDb();
    const user = db.users[username];
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const challenge = user.challenges.find(c => c.id === challengeId);
    if (!challenge) {
      return res.status(404).json({ error: 'Challenge not found.' });
    }

    const isCompletedCurrently = challenge.completed;
    const targetsCompleted = typeof completed === 'boolean' ? completed : !isCompletedCurrently;

    if (isCompletedCurrently !== targetsCompleted) {
      challenge.completed = targetsCompleted;
      
      // Update points and streak
      if (targetsCompleted) {
        user.points += challenge.points;
        challenge.streak += 1;
        user.streak = Math.max(...user.challenges.map(c => c.streak));
      } else {
        user.points = Math.max(0, user.points - challenge.points);
        challenge.streak = Math.max(0, challenge.streak - 1);
        user.streak = Math.max(...user.challenges.map(c => c.streak));
      }

      writeDb(db);
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Handle live impact simulations without modifying the persistent database record.
 */
exports.simulateFootprint = (req, res) => {
  try {
    const { username, transportReduction, acReduction, dietType } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const db = readDb();
    const user = db.users[username];
    if (!user || !user.assessment || !user.results) {
      return res.status(400).json({ 
        error: 'Please complete your initial Carbon Assessment before using the Simulator.' 
      });
    }

    // Validations
    const transRed = parseFloat(transportReduction);
    if (isNaN(transRed) || transRed < 0 || transRed > 100) {
      return res.status(400).json({ error: 'Transportation reduction must be a percentage between 0 and 100.' });
    }

    const acRed = parseFloat(acReduction);
    if (isNaN(acRed) || acRed < 0 || acRed > user.assessment.acHours) {
      return res.status(400).json({ 
        error: `AC reduction hours must be between 0 and your current daily AC hours (${user.assessment.acHours}).` 
      });
    }

    const validDiets = ['vegetarian', 'mixed', 'heavy_meat'];
    if (!validDiets.includes(dietType)) {
      return res.status(400).json({ error: 'Invalid simulated diet type specified.' });
    }

    // Construct simulated inputs
    // Reduce daily travel distance by simulated %
    const simulatedDistance = user.assessment.transportDistance * (1 - transRed / 100);
    // Reduce daily AC hours by simulated amount
    const simulatedACHours = Math.max(0, user.assessment.acHours - acRed);

    const simulatedInputs = {
      transportDistance: simulatedDistance,
      transportType: user.assessment.transportType,
      dietType: dietType,
      electricity: user.assessment.electricity,
      acHours: simulatedACHours,
      shopping: user.assessment.shopping,
      recycling: user.assessment.recycling
    };

    // Calculate simulated results
    const simulatedResults = calculatorService.calculateCarbonFootprint(simulatedInputs);

    const currentTotal = user.results.totalMonthlyCO2;
    const predictedTotal = simulatedResults.totalMonthlyCO2;
    const reductionAmount = Math.max(0, currentTotal - predictedTotal);
    const reductionPercentage = currentTotal > 0 
      ? parseFloat(((reductionAmount / currentTotal) * 100).toFixed(1)) 
      : 0;

    return res.status(200).json({
      currentFootprint: currentTotal,
      predictedFootprint: predictedTotal,
      reductionAmount,
      reductionPercentage,
      currentBreakdown: user.results.breakdown,
      simulatedBreakdown: simulatedResults.breakdown
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Post a chat message to the Decision Coach and get a tailored response.
 */
exports.postCoachMessage = (req, res) => {
  try {
    const { username, message } = req.body;

    if (!username || !message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Username and a valid message string are required.' });
    }

    const db = readDb();
    const user = db.users[username];
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const sanitizedMsg = sanitizeInput(message);
    const responseText = coachService.getCoachResponse(sanitizedMsg, user);

    // Save message pair in history (capped at 50 messages to keep DB small)
    user.chatHistory.push({ role: 'user', text: sanitizedMsg, timestamp: new Date() });
    user.chatHistory.push({ role: 'coach', text: responseText, timestamp: new Date() });

    if (user.chatHistory.length > 50) {
      user.chatHistory.splice(0, 2);
    }

    writeDb(db);

    return res.status(200).json({
      reply: responseText,
      chatHistory: user.chatHistory
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
