/**
 * Carbon Controller
 * Handles incoming HTTP requests, orchestrates schema validation, 
 * coordinates database accesses, and invokes services.
 * Completely asynchronous and modular.
 */

const calculatorService = require('../services/calculatorService');
const insightsService = require('../services/insightsService');
const coachService = require('../services/coachService');
const dbService = require('../services/dbService');
const validation = require('../utils/validation');

/**
 * Login or register a user by username.
 * @param {Object} req Express request object containing body.username
 * @param {Object} res Express response object
 * @returns {Promise<Object>} Express response JSON containing active user profile
 */
exports.login = async (req, res) => {
  try {
    const { username } = req.body;
    
    const valError = validation.validateUsername(username);
    if (valError) {
      return res.status(400).json({ error: valError });
    }

    const cleanUsername = username.trim();
    let profile = dbService.getProfile(cleanUsername);

    if (!profile) {
      profile = dbService.createDefaultProfile(cleanUsername);
      await dbService.saveProfile(cleanUsername, profile);
    }

    return res.status(200).json(profile);
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Submit carbon footprint assessment and update insights.
 * @param {Object} req Express request containing body assessment inputs
 * @param {Object} res Express response object
 * @returns {Promise<Object>} Express response JSON containing computed assessment results
 */
exports.submitAssessment = async (req, res) => {
  try {
    const { username } = req.body;
    if (!username) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const userProfile = dbService.getProfile(username);
    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    // Input Validation
    const validationResult = validation.validateAssessmentInputs(req.body);
    if (validationResult.error) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { parsedInputs } = validationResult;

    // Calculate results
    const results = calculatorService.calculateCarbonFootprint(parsedInputs);
    
    // Generate AI recommendations, Top Actions, and Roadmap
    const insights = insightsService.generateInsights(parsedInputs, results);

    // Save user profile state
    userProfile.assessment = parsedInputs;
    userProfile.results = results;
    userProfile.insights = insights;

    await dbService.saveProfile(username, userProfile);

    return res.status(200).json(userProfile);
  } catch (err) {
    console.error('Submit assessment error:', err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Toggle sustainability challenge completion and recalculate user points and streak.
 * @param {Object} req Express request containing body.challengeId and body.completed
 * @param {Object} res Express response object
 * @returns {Promise<Object>} Express response JSON containing updated profile
 */
exports.toggleChallenge = async (req, res) => {
  try {
    const { username, challengeId, completed } = req.body;

    if (!username || !challengeId) {
      return res.status(400).json({ error: 'Username and challenge ID are required.' });
    }

    const user = dbService.getProfile(username);
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
      } else {
        user.points = Math.max(0, user.points - challenge.points);
        challenge.streak = Math.max(0, challenge.streak - 1);
      }
      user.streak = Math.max(...user.challenges.map(c => c.streak));

      await dbService.saveProfile(username, user);
    }

    return res.status(200).json(user);
  } catch (err) {
    console.error('Toggle challenge error:', err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Handle live impact simulations without modifying the persistent database record.
 * @param {Object} req Express request containing body simulation reductions
 * @param {Object} res Express response object
 * @returns {Promise<Object>} Express response JSON comparing current and simulated output
 */
exports.simulateFootprint = async (req, res) => {
  try {
    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ error: 'Username is required.' });
    }

    const user = dbService.getProfile(username);
    if (!user || !user.assessment || !user.results) {
      return res.status(400).json({ 
        error: 'Please complete your initial Carbon Assessment before using the Simulator.' 
      });
    }

    // Validations
    const validationResult = validation.validateSimulationInputs(req.body, user.assessment.acHours);
    if (validationResult.error) {
      return res.status(400).json({ error: validationResult.error });
    }

    const { transportReduction, acReduction, dietType } = validationResult.parsedInputs;

    // Construct simulated inputs
    const simulatedDistance = user.assessment.transportDistance * (1 - transportReduction / 100);
    const simulatedACHours = Math.max(0, user.assessment.acHours - acReduction);

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
    console.error('Simulate footprint error:', err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Post a chat message to the Decision Coach and get a tailored response.
 * @param {Object} req Express request containing body.message
 * @param {Object} res Express response object
 * @returns {Promise<Object>} Express response JSON with the coach's reply and complete history
 */
exports.postCoachMessage = async (req, res) => {
  try {
    const { username, message } = req.body;

    if (!username || !message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Username and a valid message string are required.' });
    }

    const user = dbService.getProfile(username);
    if (!user) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    const sanitizedMsg = validation.sanitizeInput(message);
    const responseText = coachService.getCoachResponse(sanitizedMsg, user);

    // Save message pair in history (capped at 50 messages to keep DB small)
    user.chatHistory.push({ role: 'user', text: sanitizedMsg, timestamp: new Date() });
    user.chatHistory.push({ role: 'coach', text: responseText, timestamp: new Date() });

    if (user.chatHistory.length > 50) {
      user.chatHistory.splice(0, 2);
    }

    await dbService.saveProfile(username, user);

    return res.status(200).json({
      reply: responseText,
      chatHistory: user.chatHistory
    });
  } catch (err) {
    console.error('Post coach message error:', err);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
