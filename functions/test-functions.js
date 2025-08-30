const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5001/orion-sdp/us-central1'; // Your actual project ID

// Test the getTrails function
async function testGetTrails() {
  try {
    console.log('Testing getTrails function...');
    
    // Test 1: Get all trails
    const response1 = await axios.get(`${BASE_URL}/getTrails`);
    console.log('✅ All trails response:', response1.data);
    
    // Test 2: Filter by difficulty
    const response2 = await axios.get(`${BASE_URL}/getTrails?difficulty=easy`);
    console.log('✅ Easy trails response:', response2.data);
    
    // Test 3: Filter by location
    const response3 = await axios.get(`${BASE_URL}/getTrails?location=Yosemite`);
    console.log('✅ Yosemite trails response:', response3.data);
    
  } catch (error) {
    console.error('❌ Error testing getTrails:', error.response?.data || error.message);
  }
}

// Test the helloWorld function
async function testHelloWorld() {
  try {
    console.log('Testing helloWorld function...');
    const response = await axios.get(`${BASE_URL}/helloWorld`);
    console.log('✅ HelloWorld response:', response.data);
  } catch (error) {
    console.error('❌ Error testing helloWorld:', error.response?.data || error.message);
  }
}



// Run all tests
async function runAllTests() {
  console.log('🚀 Starting Firebase Functions Tests...\n');
  
  await testHelloWorld();
  console.log('');
  
  await testGetTrails();
  console.log('');
  
  console.log('✨ All tests completed!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testGetTrails,
  testHelloWorld,
  runAllTests
};
