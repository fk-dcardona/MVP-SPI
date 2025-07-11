#!/bin/bash

echo "🔍 Diagnosing Connection Issues"
echo "=============================="

echo ""
echo "1. Checking localhost resolution:"
ping -c 1 localhost 2>&1 | head -5

echo ""
echo "2. Checking 127.0.0.1:"
ping -c 1 127.0.0.1 2>&1 | head -5

echo ""
echo "3. Checking /etc/hosts file:"
grep -E "localhost|127.0.0.1" /etc/hosts

echo ""
echo "4. Checking network interfaces:"
ifconfig lo0 2>&1 | grep -A 4 "lo0:"

echo ""
echo "5. Checking if Node can bind to ports:"
node -e "
const http = require('http');
const server = http.createServer((req, res) => {
  res.end('Test server works!');
});
server.listen(9999, '127.0.0.1', () => {
  console.log('✅ Node can bind to 127.0.0.1:9999');
  server.close();
});
server.on('error', (err) => {
  console.log('❌ Node binding error:', err.message);
});
"

echo ""
echo "6. Checking firewall status:"
sudo pfctl -s info 2>&1 | head -5 || echo "Cannot check firewall (needs sudo)"

echo ""
echo "7. Testing with Python simple server:"
python3 -c "
import http.server
import socketserver
import threading
import time
import urllib.request

def start_server():
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(('127.0.0.1', 8888), handler) as httpd:
        httpd.timeout = 2
        httpd.handle_request()

# Start server in thread
thread = threading.Thread(target=start_server)
thread.daemon = True
thread.start()
time.sleep(1)

# Try to connect
try:
    response = urllib.request.urlopen('http://127.0.0.1:8888', timeout=2)
    print('✅ Python server test successful')
except Exception as e:
    print(f'❌ Python server test failed: {e}')
"

echo ""
echo "8. System proxy settings:"
networksetup -getwebproxy Wi-Fi 2>/dev/null || echo "No proxy configured"

echo ""
echo "9. DNS resolution:"
nslookup localhost

echo ""
echo "10. Any security software blocking?"
echo "Check for:"
echo "- VPN software (disconnect if active)"
echo "- Antivirus with firewall features"
echo "- Corporate security tools"
echo "- Little Snitch or similar"