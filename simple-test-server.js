const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Simple routing
  if (req.url === '/' || req.url === '/test') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Test Server Working</title>
      </head>
      <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px;">
        <h1>✅ Connection Successful!</h1>
        <p>The simple test server is working on port ${PORT}</p>
        <h2>This proves:</h2>
        <ul>
          <li>✅ Your system can run servers</li>
          <li>✅ Port ${PORT} is accessible</li>
          <li>✅ No firewall blocking</li>
          <li>✅ Localhost works</li>
        </ul>
        <h2>The Next.js issue might be:</h2>
        <ul>
          <li>Next.js specific configuration</li>
          <li>Environmental issue with Next.js</li>
          <li>Port binding conflict</li>
        </ul>
        <hr>
        <p>Test minimal app (static HTML): <a href="/minimal-static">Click here</a></p>
      </body>
      </html>
    `);
  } else if (req.url === '/minimal-static') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Minimal Supply Chain App</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
          input, button { display: block; margin: 10px 0; padding: 10px; width: 100%; }
          button { background: #3B82F6; color: white; border: none; cursor: pointer; }
          button:hover { background: #2563EB; }
          .hidden { display: none; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background: #f5f5f5; }
        </style>
      </head>
      <body>
        <div id="login">
          <h1>Supply Chain Login</h1>
          <input type="email" id="email" placeholder="Email" value="test@finkargo.com">
          <input type="password" id="password" placeholder="Password" value="Test123!@#">
          <button onclick="login()">Login</button>
        </div>
        
        <div id="dashboard" class="hidden">
          <h1>Dashboard</h1>
          <p>Welcome, <span id="userEmail"></span>!</p>
          <input type="file" id="csvFile" accept=".csv">
          <button onclick="processCSV()">Upload CSV</button>
          <div id="dataDisplay"></div>
          <button onclick="logout()">Logout</button>
        </div>

        <script>
          function login() {
            const email = document.getElementById('email').value;
            document.getElementById('userEmail').textContent = email;
            document.getElementById('login').classList.add('hidden');
            document.getElementById('dashboard').classList.remove('hidden');
          }

          function logout() {
            document.getElementById('dashboard').classList.add('hidden');
            document.getElementById('login').classList.remove('hidden');
            document.getElementById('dataDisplay').innerHTML = '';
          }

          function processCSV() {
            const file = document.getElementById('csvFile').files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = function(e) {
              const text = e.target.result;
              const lines = text.trim().split('\\n');
              const headers = lines[0].split(',');
              
              let html = '<table><tr>';
              headers.forEach(h => html += '<th>' + h + '</th>');
              html += '</tr>';
              
              for (let i = 1; i < Math.min(11, lines.length); i++) {
                html += '<tr>';
                lines[i].split(',').forEach(cell => html += '<td>' + cell + '</td>');
                html += '</tr>';
              }
              html += '</table>';
              
              if (lines.length > 11) {
                html += '<p>Showing 10 of ' + (lines.length - 1) + ' rows</p>';
              }
              
              document.getElementById('dataDisplay').innerHTML = html;
            };
            reader.readAsText(file);
          }
        </script>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
✅ Simple test server running!
================================
🌐 Access at:
   http://localhost:${PORT}
   http://127.0.0.1:${PORT}
   http://0.0.0.0:${PORT}

📱 Test pages:
   /          - Connection test
   /minimal-static - Static HTML version of minimal app

This bypasses Next.js entirely to test if the issue is Next.js specific.

Press Ctrl+C to stop...
  `);
});

server.on('error', (err) => {
  console.error('Server error:', err);
});