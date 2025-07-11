// The absolute simplest server possible
const http = require('http');

console.log('Starting server...');

try {
  const server = http.createServer((req, res) => {
    console.log('Request received:', req.url);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('IT WORKS!\n');
  });

  // Try different binding approaches
  server.listen(9999, () => {
    console.log('Server started successfully on port 9999');
    console.log('Try: curl http://localhost:9999');
  });

  server.on('error', (e) => {
    console.error('Server error:', e);
  });

} catch (e) {
  console.error('Failed to create server:', e);
}