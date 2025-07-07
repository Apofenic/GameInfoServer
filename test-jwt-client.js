// Test client for JWT authentication
const axios = require('axios');

const API_URL = 'http://localhost:3002';
let token = null;

// Helper for making authenticated requests
const authenticatedRequest = async (method, endpoint, data = null) => {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const config = { headers };

  try {
    let response;
    if (method === 'get') {
      response = await axios.get(`${API_URL}${endpoint}`, config);
    } else if (method === 'post') {
      response = await axios.post(`${API_URL}${endpoint}`, data, config);
    }
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.response?.data || error.message);
    return null;
  }
};

// Test functions
const signUp = async (email, password, name) => {
  console.log('Signing up...');
  const result = await authenticatedRequest('post', '/auth/signup', {
    email,
    password,
    name,
  });
  console.log('Sign-up result:', result);
  return result;
};

const login = async (email, password) => {
  console.log('Logging in...');
  const result = await authenticatedRequest('post', '/auth/login', {
    email,
    password,
  });

  if (result && result.token) {
    token = result.token;
    console.log('Login successful, token received');
  }

  return result;
};

const getGames = async () => {
  console.log('Fetching games...');
  const result = await authenticatedRequest('get', '/games');
  console.log('Games:', result);
  return result;
};

// Test the flow
const runTests = async () => {
  // 1. Create a test user (uncomment first time only)
  // await signUp('test@example.com', 'password123', 'Test User');

  // 2. Login to get token
  await login('test@example.com', 'password123');

  // 3. Try accessing protected endpoint
  if (token) {
    await getGames();
  } else {
    console.log('No token received, skipping protected endpoints');
  }
};

runTests().catch(console.error);
