// Global setup for tests
const { execSync } = require('child_process');
const axios = require('axios');

const API_URL = process.env.TEST_API_URL || 'http://localhost:3002';

// Wait for server to be ready
const waitForServer = async (timeout = 60000) => {
  const start = Date.now();
  console.log('Waiting for server to be ready...');

  while (Date.now() - start < timeout) {
    try {
      // Try to make a request to any endpoint - 401 is expected for /games
      const response = await axios.get(`${API_URL}/games`);
      console.log('Server is ready!');
      return true;
    } catch (error) {
      if (error.response && error.response.status === 401) {
        // This is expected - server is running and requires auth
        console.log('Server is ready!');
        return true;
      }
      // Server not ready, continue waiting
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw new Error('Server not ready within timeout period');
};

module.exports = async () => {
  console.log('Setting up test environment...');

  // Check if server is already running
  try {
    const response = await axios.get(`${API_URL}/games`);
    console.log('Server already running, proceeding with tests...');
  } catch (error) {
    if (error.response && error.response.status === 401) {
      // This is expected - server is running but endpoint requires auth
      console.log('Server is running and responding correctly, proceeding with tests...');
    } else {
      console.log('Server not running, please start it with: docker compose up -d');
      console.log('Or run: npm run dev');
      throw new Error('Server must be running before tests can execute');
    }
  }
};
