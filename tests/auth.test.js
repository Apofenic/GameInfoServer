// JWT Authentication Test Suite
const axios = require('axios');

const API_URL = process.env.TEST_API_URL || 'http://localhost:3002';

// Test utilities
const makeRequest = async (method, endpoint, data = null, headers = {}) => {
  const config = { headers };

  try {
    let response;
    if (method === 'get') {
      response = await axios.get(`${API_URL}${endpoint}`, config);
    } else if (method === 'post') {
      response = await axios.post(`${API_URL}${endpoint}`, data, config);
    } else if (method === 'put') {
      response = await axios.put(`${API_URL}${endpoint}`, data, config);
    } else if (method === 'delete') {
      response = await axios.delete(`${API_URL}${endpoint}`, config);
    }
    return { status: response.status, data: response.data };
  } catch (error) {
    return {
      status: error.response?.status,
      data: error.response?.data,
      error: error.message,
    };
  }
};

const createTestUser = async (
  email = 'test@example.com',
  password = 'password123',
  name = 'Test User'
) => {
  return await makeRequest('post', '/auth/signup', { email, password, name });
};

const loginUser = async (email = 'test@example.com', password = 'password123') => {
  return await makeRequest('post', '/auth/login', { email, password });
};

const makeAuthenticatedRequest = async (method, endpoint, token, data = null) => {
  return await makeRequest(method, endpoint, data, {
    Authorization: `Bearer ${token}`,
  });
};

const getProtectedResource = async (token, endpoint = '/games') => {
  return await makeAuthenticatedRequest('get', endpoint, token);
};

describe('JWT Authentication System', () => {
  let testUserToken = null;
  const testEmail = 'test@example.com';
  const testPassword = 'password123';

  beforeAll(async () => {
    // Ensure we have a test user to work with
    const signupResult = await createTestUser(testEmail, testPassword, 'Test User');
    // User might already exist, that's okay

    // Login to get a token for tests that need it
    const loginResult = await loginUser(testEmail, testPassword);
    if (loginResult.status === 200 && loginResult.data.token) {
      testUserToken = loginResult.data.token;
    }
  });

  describe('User Registration', () => {
    test('should successfully create a new user', async () => {
      const uniqueEmail = `newuser_${Date.now()}@test.com`;
      const response = await createTestUser(uniqueEmail, 'password123', 'New User');

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('message');
      expect(response.data.message).toContain('successfully');
    });

    test('should reject duplicate email registration', async () => {
      const response = await createTestUser(testEmail, 'password123', 'Duplicate User');

      expect(response.status).toBe(409);
      expect(response.data).toHaveProperty('error');
    });

    test('should reject registration with missing fields', async () => {
      const response = await makeRequest('post', '/auth/signup', {
        email: 'incomplete@test.com',
        // Missing password and name
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });

    test('should reject registration with invalid email format', async () => {
      const response = await createTestUser('invalid-email', 'password123', 'Test User');

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });
  });

  describe('User Login', () => {
    test('should successfully login with valid credentials', async () => {
      const response = await loginUser(testEmail, testPassword);

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user).toHaveProperty('email', testEmail);
    });

    test('should reject login with invalid email', async () => {
      const response = await loginUser('nonexistent@test.com', 'password123');

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error', 'Invalid email or password');
    });

    test('should reject login with invalid password', async () => {
      const response = await loginUser(testEmail, 'wrongpassword');

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error', 'Invalid email or password');
    });

    test('should reject login with missing credentials', async () => {
      const response = await makeRequest('post', '/auth/login', {
        email: testEmail,
        // Missing password
      });

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
    });
  });

  describe('JWT Token Validation', () => {
    test('should allow access to protected routes with valid token', async () => {
      const response = await getProtectedResource(testUserToken);

      expect(response.status).toBe(200);
      expect(response.data).toBeDefined();
    });

    test('should reject requests without Authorization header', async () => {
      const response = await makeRequest('get', '/games');

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });

    test('should reject requests with malformed Authorization header', async () => {
      const response = await makeRequest('get', '/games', null, {
        Authorization: 'InvalidFormat token123',
      });

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });

    test('should reject requests with invalid token', async () => {
      const response = await makeAuthenticatedRequest('get', '/games', 'invalid.jwt.token');

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });

    test('should reject requests with empty token', async () => {
      const response = await makeRequest('get', '/games', null, {
        Authorization: 'Bearer ',
      });

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });

    test('should reject requests with malformed JWT structure', async () => {
      const response = await makeAuthenticatedRequest('get', '/games', 'not.a.valid.jwt.structure');

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
    });
  });

  describe('Rate Limiting', () => {
    test('should allow requests within rate limit', async () => {
      // Make several requests in quick succession
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(loginUser(testEmail, testPassword));
      }

      const responses = await Promise.all(requests);

      // At least one should succeed (not rate limited)
      const successfulResponses = responses.filter((r) => r.status === 200);
      expect(successfulResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Token Persistence and User Context', () => {
    test('should maintain user context across multiple requests', async () => {
      const response1 = await getProtectedResource(testUserToken);
      const response2 = await getProtectedResource(testUserToken);

      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });

    test('should handle concurrent requests with same token', async () => {
      const requests = [
        getProtectedResource(testUserToken),
        getProtectedResource(testUserToken),
        getProtectedResource(testUserToken),
      ];

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Security Headers and Response Format', () => {
    test('should return consistent error response format', async () => {
      const response = await makeRequest('get', '/games');

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');
      expect(typeof response.data.error).toBe('string');
    });

    test('should not expose sensitive information in error responses', async () => {
      const response = await loginUser('nonexistent@test.com', 'wrongpassword');

      expect(response.status).toBe(401);
      expect(response.data).toHaveProperty('error');

      // Should not expose whether email exists or not
      expect(response.data.error).toBe('Invalid email or password');
    });
  });

  describe('Authentication Flow Integration', () => {
    test('should complete full authentication workflow', async () => {
      const uniqueEmail = `integration_${Date.now()}@test.com`;

      // 1. Register new user
      const signupResponse = await createTestUser(
        uniqueEmail,
        'password123',
        'Integration Test User'
      );
      expect(signupResponse.status).toBe(201);

      // 2. Login with new user
      const loginResponse = await loginUser(uniqueEmail, 'password123');
      expect(loginResponse.status).toBe(200);
      expect(loginResponse.data).toHaveProperty('token');

      // 3. Access protected resource
      const protectedResponse = await getProtectedResource(loginResponse.data.token);
      expect(protectedResponse.status).toBe(200);

      // 4. Verify token contains user information
      expect(loginResponse.data).toHaveProperty('user');
      expect(loginResponse.data.user).toHaveProperty('email', uniqueEmail);
    });
  });
});
