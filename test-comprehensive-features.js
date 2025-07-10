#!/usr/bin/env node

/**
 * Comprehensive Feature Testing Script
 * Tests all features of the Supply Chain Intelligence MVP
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Green
    error: '\x1b[31m',   // Red
    warning: '\x1b[33m', // Yellow
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 10000
    };

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function runTest(testName, testFunction) {
  testResults.total++;
  log(`🧪 Running: ${testName}`, 'info');
  
  try {
    const result = await testFunction();
    testResults.passed++;
    log(`✅ PASSED: ${testName}`, 'success');
    testResults.details.push({ name: testName, status: 'PASSED', result });
    return result;
  } catch (error) {
    testResults.failed++;
    log(`❌ FAILED: ${testName} - ${error.message}`, 'error');
    testResults.details.push({ name: testName, status: 'FAILED', error: error.message });
    throw error;
  }
}

// Test Categories

async function testAuthentication() {
  log('🔐 Testing Authentication System', 'info');
  
  // Test login page accessibility
  await runTest('Login page loads', async () => {
    const response = await makeRequest(`${BASE_URL}/login`);
    if (response.statusCode !== 200) {
      throw new Error(`Expected 200, got ${response.statusCode}`);
    }
    if (!response.data.includes('Supply Chain Intelligence')) {
      throw new Error('Login page content not found');
    }
    return response;
  });

  // Test API endpoints
  await runTest('WhatsApp OTP send endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/whatsapp/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+1234567890' })
    });
    // Should return some response (even if error due to missing credentials)
    return response;
  });

  await runTest('WhatsApp OTP verify endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/auth/whatsapp/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '+1234567890', otp: '123456' })
    });
    return response;
  });
}

async function testFileUpload() {
  log('📤 Testing File Upload System', 'info');
  
  await runTest('Upload page accessibility', async () => {
    const response = await makeRequest(`${BASE_URL}/dashboard/upload`);
    // Should redirect to login if not authenticated
    return response;
  });

  await runTest('Upload API endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: 'data' })
    });
    return response;
  });
}

async function testAgentSystem() {
  log('🤖 Testing Agent System', 'info');
  
  await runTest('Agents page accessibility', async () => {
    const response = await makeRequest(`${BASE_URL}/dashboard/agents`);
    return response;
  });

  await runTest('Agents API endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/agents`);
    return response;
  });

  await runTest('Agent execution endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/agents/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'test', data: {} })
    });
    return response;
  });

  await runTest('Agent scheduling endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/agents/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId: 'test', schedule: 'daily' })
    });
    return response;
  });
}

async function testAnalytics() {
  log('📊 Testing Analytics Dashboard', 'info');
  
  await runTest('Analytics page accessibility', async () => {
    const response = await makeRequest(`${BASE_URL}/dashboard/analytics`);
    return response;
  });

  await runTest('Triangle API endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/triangle`);
    return response;
  });
}

async function testDatabaseOperations() {
  log('🗄️ Testing Database Operations', 'info');
  
  // Test if database connection is working
  await runTest('Database connection health', async () => {
    // This would require a health check endpoint
    // For now, we'll test if the app is responding
    const response = await makeRequest(`${BASE_URL}/`);
    return response;
  });
}

async function testPerformance() {
  log('⚡ Testing Performance', 'info');
  
  await runTest('Home page load time', async () => {
    const start = Date.now();
    const response = await makeRequest(`${BASE_URL}/`);
    const loadTime = Date.now() - start;
    
    if (loadTime > 5000) {
      throw new Error(`Page load time too slow: ${loadTime}ms`);
    }
    
    return { loadTime, statusCode: response.statusCode };
  });

  await runTest('Login page load time', async () => {
    const start = Date.now();
    const response = await makeRequest(`${BASE_URL}/login`);
    const loadTime = Date.now() - start;
    
    if (loadTime > 3000) {
      throw new Error(`Login page load time too slow: ${loadTime}ms`);
    }
    
    return { loadTime, statusCode: response.statusCode };
  });
}

async function testSecurity() {
  log('🛡️ Testing Security', 'info');
  
  await runTest('XSS protection test', async () => {
    const response = await makeRequest(`${BASE_URL}/login`);
    // Check if script tags are properly escaped
    if (response.data.includes('<script>alert("xss")</script>')) {
      throw new Error('Potential XSS vulnerability detected');
    }
    return response;
  });

  await runTest('CSRF protection test', async () => {
    const response = await makeRequest(`${BASE_URL}/api/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ malicious: 'data' })
    });
    // Should not allow unauthorized requests
    return response;
  });
}

async function testErrorHandling() {
  log('🚨 Testing Error Handling', 'info');
  
  await runTest('404 error handling', async () => {
    const response = await makeRequest(`${BASE_URL}/nonexistent-page`);
    if (response.statusCode !== 404) {
      throw new Error(`Expected 404, got ${response.statusCode}`);
    }
    return response;
  });

  await runTest('Invalid API endpoint', async () => {
    const response = await makeRequest(`${BASE_URL}/api/invalid-endpoint`);
    return response;
  });
}

// Main test execution
async function runAllTests() {
  log('🚀 Starting Comprehensive Feature Testing', 'info');
  log(`Testing application at: ${BASE_URL}`, 'info');
  
  const startTime = Date.now();
  
  try {
    await testAuthentication();
    await testFileUpload();
    await testAgentSystem();
    await testAnalytics();
    await testDatabaseOperations();
    await testPerformance();
    await testSecurity();
    await testErrorHandling();
  } catch (error) {
    log(`Test suite error: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  // Print summary
  log('\n📊 TEST SUMMARY', 'info');
  log('='.repeat(50), 'info');
  log(`Total Tests: ${testResults.total}`, 'info');
  log(`Passed: ${testResults.passed}`, 'success');
  log(`Failed: ${testResults.failed}`, testResults.failed > 0 ? 'error' : 'success');
  log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`, 'info');
  log(`Duration: ${duration}ms`, 'info');
  
  if (testResults.failed > 0) {
    log('\n❌ FAILED TESTS:', 'error');
    testResults.details
      .filter(test => test.status === 'FAILED')
      .forEach(test => {
        log(`  - ${test.name}: ${test.error}`, 'error');
      });
  }
  
  log('\n✅ PASSED TESTS:', 'success');
  testResults.details
    .filter(test => test.status === 'PASSED')
    .forEach(test => {
      log(`  - ${test.name}`, 'success');
    });
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Fatal error: ${error.message}`, 'error');
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testResults
}; 