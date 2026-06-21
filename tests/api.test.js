/**
 * CarbonLens API Endpoints Integration Tests
 * Uses supertest to verify HTTP routes, payload validation, and controller flows.
 */

process.env.NODE_ENV = 'test';

const request = require('supertest');
const fs = require('fs');
const path = require('path');
const app = require('../server/server');

const DB_PATH = path.join(__dirname, '../server/data/db.json');

describe('CarbonLens API Routes Integration Tests', () => {
  let originalDbContent = null;

  beforeAll(() => {
    // Back up existing database
    if (fs.existsSync(DB_PATH)) {
      originalDbContent = fs.readFileSync(DB_PATH, 'utf8');
    }
  });

  afterAll(() => {
    // Restore database
    if (originalDbContent !== null) {
      fs.writeFileSync(DB_PATH, originalDbContent, 'utf8');
    } else if (fs.existsSync(DB_PATH)) {
      fs.unlinkSync(DB_PATH);
    }
  });

  describe('POST /api/users/login', () => {
    test('should reject invalid username', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'invalid user space' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });

    test('should register and return a default profile for a new valid user', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'integration_test_user' });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('integration_test_user');
      expect(res.body.points).toBe(0);
      expect(res.body.streak).toBe(0);
      expect(res.body.assessment).toBeNull();
      expect(res.body.challenges.length).toBe(3);
    });

    test('should return existing profile if user is already registered', async () => {
      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'integration_test_user' });

      expect(res.status).toBe(200);
      expect(res.body.username).toBe('integration_test_user');
    });
  });

  describe('POST /api/assessment', () => {
    test('should return 404 for unregistered user', async () => {
      const res = await request(app)
        .post('/api/assessment')
        .send({ username: 'ghost_user', transportDistance: 10 });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User profile not found.');
    });

    test('should return 400 for invalid assessment values', async () => {
      const res = await request(app)
        .post('/api/assessment')
        .send({
          username: 'integration_test_user',
          transportDistance: -10, // Invalid
          transportType: 'gasoline_car',
          dietType: 'mixed',
          electricity: 200,
          acHours: 4,
          shopping: 'moderate',
          recycling: 'sometimes'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('distance');
    });

    test('should save valid assessment and return calculated footprint results', async () => {
      const res = await request(app)
        .post('/api/assessment')
        .send({
          username: 'integration_test_user',
          transportDistance: 20,
          transportType: 'gasoline_car',
          dietType: 'mixed',
          electricity: 200,
          acHours: 4,
          shopping: 'moderate',
          recycling: 'sometimes'
        });

      expect(res.status).toBe(200);
      expect(res.body.assessment).toBeDefined();
      expect(res.body.assessment.transportDistance).toBe(20);
      expect(res.body.results).toBeDefined();
      expect(res.body.results.totalMonthlyCO2).toBeGreaterThan(0);
      expect(res.body.insights).toBeDefined();
      expect(res.body.insights.topActions.length).toBe(3);
    });
  });

  describe('POST /api/challenges/complete', () => {
    test('should return 404 if challenge does not exist', async () => {
      const res = await request(app)
        .post('/api/challenges/complete')
        .send({
          username: 'integration_test_user',
          challengeId: 'non_existent_id',
          completed: true
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Challenge not found.');
    });

    test('should toggle challenge completion, updating points and streak', async () => {
      // Completed = true
      const res1 = await request(app)
        .post('/api/challenges/complete')
        .send({
          username: 'integration_test_user',
          challengeId: 'no_car_friday',
          completed: true
        });

      expect(res1.status).toBe(200);
      expect(res1.body.points).toBe(50);
      expect(res1.body.streak).toBe(1);
      expect(res1.body.challenges.find(c => c.id === 'no_car_friday').completed).toBe(true);

      // Completed = false (toggle off)
      const res2 = await request(app)
        .post('/api/challenges/complete')
        .send({
          username: 'integration_test_user',
          challengeId: 'no_car_friday',
          completed: false
        });

      expect(res2.status).toBe(200);
      expect(res2.body.points).toBe(0);
      expect(res2.body.challenges.find(c => c.id === 'no_car_friday').completed).toBe(false);
    });
  });

  describe('POST /api/simulator', () => {
    test('should return 400 if user has no assessment baseline yet', async () => {
      // Create user with no assessment
      await request(app)
        .post('/api/users/login')
        .send({ username: 'no_assessment_user' });

      const res = await request(app)
        .post('/api/simulator')
        .send({
          username: 'no_assessment_user',
          transportReduction: 20,
          acReduction: 1,
          dietType: 'vegetarian'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Carbon Assessment');
    });

    test('should calculate and return forecast comparisons for user with baseline', async () => {
      const res = await request(app)
        .post('/api/simulator')
        .send({
          username: 'integration_test_user',
          transportReduction: 50,
          acReduction: 2,
          dietType: 'vegetarian'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('currentFootprint');
      expect(res.body).toHaveProperty('predictedFootprint');
      expect(res.body).toHaveProperty('reductionAmount');
      expect(res.body).toHaveProperty('reductionPercentage');
    });
  });

  describe('POST /api/coach', () => {
    test('should post message and receive coach dialog advice', async () => {
      const res = await request(app)
        .post('/api/coach')
        .send({
          username: 'integration_test_user',
          message: 'How can I optimize my energy use?'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reply');
      expect(res.body.chatHistory.length).toBe(2); // User + Coach message
      expect(res.body.chatHistory[0].text).toContain('energy');
    });
  });
});
