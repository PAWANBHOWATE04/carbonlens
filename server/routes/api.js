/**
 * CarbonLens API Router
 * Maps incoming REST HTTP endpoints to the carbonController actions.
 */

const express = require('express');
const router = express.Router();
const carbonController = require('../controllers/carbonController');

// User Authentication/Session
router.post('/users/login', carbonController.login);

// Carbon Assessment Submit
router.post('/assessment', carbonController.submitAssessment);

// Challenge Completion Tracker Toggle
router.post('/challenges/complete', carbonController.toggleChallenge);

// Live Sustainability Scenario Simulator
router.post('/simulator', carbonController.simulateFootprint);

// AI Climate Consultant Coach Dialogues
router.post('/coach', carbonController.postCoachMessage);

module.exports = router;
