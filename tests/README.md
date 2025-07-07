# JWT Authentication Test Suite

This comprehensive test suite validates the JWT authentication system for the Game Info Server.

## Overview

The test suite covers all aspects of JWT authentication including:

- ✅ **User Registration** - Account creation, validation, duplicate handling
- ✅ **User Login** - Authentication, token generation, credential validation
- ✅ **JWT Token Validation** - Token verification, malformed token handling
- ✅ **Protected Routes** - Authorization middleware functionality
- ✅ **Rate Limiting** - Request throttling per user
- ✅ **Security** - Error handling, information disclosure prevention
- ✅ **Integration Flow** - Complete authentication workflow

## Prerequisites

1. **Server Running**: The test suite requires the server to be running before executing tests

   ```bash
   # Option 1: Using Docker (recommended)
   docker compose up -d

   # Option 2: Local development
   npm run dev
   ```

2. **Dependencies Installed**: Make sure Jest is installed
   ```bash
   npm install
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with detailed output
npm run test:verbose

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### User Registration Tests

- ✅ Successful user creation
- ✅ Duplicate email rejection
- ✅ Missing field validation
- ✅ Invalid email format handling

### User Login Tests

- ✅ Valid credential authentication
- ✅ Invalid email rejection
- ✅ Invalid password rejection
- ✅ Missing credential validation

### JWT Token Validation Tests

- ✅ Valid token acceptance
- ✅ Missing Authorization header rejection
- ✅ Malformed Authorization header rejection
- ✅ Invalid token rejection
- ✅ Empty token rejection
- ✅ Malformed JWT structure rejection

### Rate Limiting Tests

- ✅ Requests within limit acceptance
- 📝 Rate limit exhaustion (for load testing)

### Security Tests

- ✅ Consistent error response format
- ✅ No sensitive information exposure
- ✅ User context maintenance
- ✅ Concurrent request handling

### Integration Tests

- ✅ Complete authentication workflow
- ✅ Multi-request token persistence

## Test Configuration

The test suite uses Jest with the following configuration:

- **Environment**: Node.js
- **Timeout**: 30 seconds per test
- **Test Pattern**: `**/tests/**/*.test.js`
- **Setup**: Global setup and teardown for server readiness

## Environment Variables

```bash
# Optional: Override default API URL
TEST_API_URL=http://localhost:3002

# Enable verbose logging during tests
JEST_VERBOSE=true
```

## Test Data

Tests use dynamically generated test users with timestamps to avoid conflicts:

- Email format: `test-{timestamp}@example.com`
- Password: `password123`
- Name: `Test User` or `Integration Test User`

## Continuous Integration

The test suite is designed to work in CI environments:

1. Start the server (via Docker or npm)
2. Wait for server readiness
3. Run the test suite
4. Clean up resources

## Manual Testing

For manual testing, you can also use the included `test-jwt-client.js`:

```bash
node test-jwt-client.js
```

## Test Results Interpretation

- ✅ **All Green**: JWT authentication is working correctly
- ❌ **Red Tests**: Indicates specific authentication issues
- ⚠️ **Warnings**: Check server logs for detailed error information

## Troubleshooting

### Server Not Ready

```
Error: Server not ready within timeout period
```

**Solution**: Ensure the server is running and accessible at the configured URL

### Database Connection Issues

```
Error: Connection refused
```

**Solution**: Verify PostgreSQL database is running (included in docker-compose)

### Token Validation Failures

```
JWT verification error
```

**Solution**: Check JWT_SECRET environment variable is properly configured

## Adding New Tests

To add new authentication tests:

1. Add test cases to `tests/auth.test.js`
2. Use the provided utility functions (`makeRequest`, `createTestUser`, etc.)
3. Follow the existing test patterns for consistency
4. Ensure cleanup of test data

## Security Considerations

The test suite validates:

- Proper JWT token generation and verification
- Secure password handling (no plain text exposure)
- Rate limiting effectiveness
- Error message security (no information leakage)
- Authorization header format requirements
- Token expiration handling
