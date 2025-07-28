const fetch = require('node-fetch');

async function testRandomEndpoint() {
  const baseUrl = 'http://localhost:3002';

  // You'll need a valid JWT token for testing
  // Replace this with a real token from your auth system
  const token = 'your-jwt-token-here';

  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  console.log('Testing random game endpoint...\n');

  try {
    // Test 1: Get random game (no filters)
    console.log('1. Random game (no filters):');
    const response1 = await fetch(`${baseUrl}/games/random`, { headers });
    const game1 = await response1.json();
    console.log(JSON.stringify(game1, null, 2));
    console.log('\n');

    // Test 2: Random game filtered by platform
    console.log('2. Random game filtered by platform "Nintendo Switch":');
    const response2 = await fetch(`${baseUrl}/games/random?platform=Nintendo Switch`, { headers });
    const game2 = await response2.json();
    console.log(JSON.stringify(game2, null, 2));
    console.log('\n');

    // Test 3: Random game filtered by release year
    console.log('3. Random game filtered by release year 2020:');
    const response3 = await fetch(`${baseUrl}/games/random?releaseYear=2020`, { headers });
    const game3 = await response3.json();
    console.log(JSON.stringify(game3, null, 2));
    console.log('\n');

    // Test 4: Random game with both filters
    console.log('4. Random game filtered by platform and year:');
    const response4 = await fetch(
      `${baseUrl}/games/random?platform=PlayStation 5&releaseYear=2021`,
      { headers }
    );
    const game4 = await response4.json();
    console.log(JSON.stringify(game4, null, 2));
    console.log('\n');

    // Test 5: Get all platforms
    console.log('5. All available platforms:');
    const response5 = await fetch(`${baseUrl}/platforms`, { headers });
    const platforms = await response5.json();
    console.log(JSON.stringify(platforms, null, 2));
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

// Uncomment and add a valid token to test
// testRandomEndpoint();

console.log('Random Game Endpoint Test Script');
console.log('==================================');
console.log('');
console.log('Before running this test:');
console.log('1. Make sure your server is running on port 3002');
console.log('2. Get a valid JWT token by calling /auth/login');
console.log('3. Replace "your-jwt-token-here" with your actual token');
console.log('4. Uncomment the testRandomEndpoint() call at the bottom');
console.log('5. Run: node test-random-endpoint.js');
