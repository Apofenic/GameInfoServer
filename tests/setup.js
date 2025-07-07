// Test setup - runs before each test file
const axios = require('axios');

// Set longer timeout for requests during tests
axios.defaults.timeout = 10000;

// Global test configuration
global.console = {
  ...console,
  // Optionally suppress logs during tests
  log: process.env.JEST_VERBOSE === 'true' ? console.log : () => {},
  debug: process.env.JEST_VERBOSE === 'true' ? console.debug : () => {},
  info: console.info,
  warn: console.warn,
  error: console.error,
};
