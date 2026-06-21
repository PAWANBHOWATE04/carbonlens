/**
 * Database Service Layer
 * Uses an in-memory cache and a serialized asynchronous write queue to optimize
 * database load and eliminate event loop blocking disk writes on request pathways.
 */

const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/db.json');

let dbCache = null;
let writeQueue = Promise.resolve();

/**
 * Initializes the in-memory database cache.
 */
function initDb() {
  if (dbCache) return dbCache;
  try {
    if (!fs.existsSync(DB_PATH)) {
      dbCache = { users: {} };
      fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2), 'utf8');
    } else {
      const rawData = fs.readFileSync(DB_PATH, 'utf8');
      dbCache = JSON.parse(rawData);
    }
  } catch (error) {
    console.error('Error initializing JSON database:', error);
    dbCache = { users: {} };
  }
  return dbCache;
}

// Initialize cache on startup
initDb();

/**
 * Retrieves a user profile by username.
 * @param {string} username 
 * @returns {Object|null} User profile or null if not found
 */
function getProfile(username) {
  if (!dbCache || !dbCache.users) return null;
  return dbCache.users[username] || null;
}

/**
 * Creates a default user profile object.
 * @param {string} username 
 * @returns {Object} User profile
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
 * Saves a user profile to the cache and asynchronously queues a write to disk.
 * @param {string} username 
 * @param {Object} profileData 
 * @returns {Promise} Resolves when the write operation completes in the queue
 */
function saveProfile(username, profileData) {
  if (!dbCache) dbCache = { users: {} };
  dbCache.users[username] = profileData;

  // Queue write to disk sequentially to prevent overlapping write corruption
  writeQueue = writeQueue.then(async () => {
    try {
      await fs.promises.writeFile(DB_PATH, JSON.stringify(dbCache, null, 2), 'utf8');
    } catch (error) {
      console.error('Error writing JSON database to disk:', error);
    }
  });

  return writeQueue;
}

module.exports = {
  getProfile,
  createDefaultProfile,
  saveProfile
};
