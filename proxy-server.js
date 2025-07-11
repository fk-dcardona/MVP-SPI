const http = require('http');
const httpProxy = require('http-proxy-middleware');
const { spawn } = require('child_process');

console.log('🚀 Starting Next.js with proxy workaround...\n');

// Start Next.js in the background
const nextProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: { ...process.env, PORT: '3001' }
});

// Wait a bit for Next.js to start
setTimeout(() => {
  // Create a simple proxy server
  const proxy = httpProxy.createProxyMiddleware({
    target: 'http://127.0.0.1:3001',
    changeOrigin: true,
    onError: (err, req, res) => {
      console.error('Proxy error:', err.message);
      res.writeHead(502);
      res.end('Proxy error: ' + err.message);
    }
  });

  const server = http.createServer((req, res) => {
    console.log(`${req.method} ${req.url}`);
    
    // Simple test endpoint
    if (req.url === '/test') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Proxy server is working! Next.js should be at /minimal');
      return;
    }
    
    // Proxy all other requests to Next.js
    proxy(req, res);
  });

  server.listen(8080, '0.0.0.0', () => {
    console.log('\n✅ Proxy server running!');
    console.log('🌐 Access your app at:');
    console.log('   http://localhost:8080/test (test endpoint)');
    console.log('   http://localhost:8080/minimal (your app)');
    console.log('   http://127.0.0.1:8080/minimal (alternative)');
    console.log('\nPress Ctrl+C to stop...\n');
  });

  server.on('error', (err) => {
    console.error('Proxy server error:', err);
  });
}, 5000);

// Clean up on exit
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  nextProcess.kill();
  process.exit();
});