#!/bin/bash

echo "🔍 Diagnosing Server Issues"
echo "=========================="

echo ""
echo "1. Checking Node.js version:"
node --version

echo ""
echo "2. Checking npm version:"
npm --version

echo ""
echo "3. Checking for port conflicts:"
lsof -i :3000 || echo "Port 3000 is free"
lsof -i :3001 || echo "Port 3001 is free"

echo ""
echo "4. Checking network interfaces:"
ifconfig lo0 | grep -E "inet|status"

echo ""
echo "5. Testing localhost resolution:"
ping -c 1 localhost || echo "Localhost ping failed"

echo ""
echo "6. Checking hosts file:"
grep localhost /etc/hosts

echo ""
echo "7. Checking Next.js installation:"
ls -la node_modules/.bin/next || echo "Next.js not found in node_modules"

echo ""
echo "8. Checking for errors in package.json scripts:"
grep -A 2 '"scripts"' package.json

echo ""
echo "9. Environment check:"
echo "NODE_ENV: $NODE_ENV"
echo "PATH includes node: $(which node)"

echo ""
echo "10. Try starting with explicit host:"
echo "Running: npx next dev -H 0.0.0.0"
npx next dev -H 0.0.0.0