/**
 * CarbonLens Server entry point
 * Configures Express, mounts public assets, registers APIs, and listens on port 3000.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend flexibility
app.use(cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend assets from 'public' folder
app.use(express.static(path.join(__dirname, '../public')));

// Register API routes
app.use('/api', apiRoutes);

// Single page app routing: fallback all non-API paths to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start listening if not running on Vercel and not in test environment
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🌲 CarbonLens Server is running on port ${PORT}`);
    console.log(`🔗 Access locally at: http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
}

module.exports = app;
