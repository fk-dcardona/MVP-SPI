#!/bin/bash

echo "🚀 Starting Finkargo Analytics Dev Server..."
echo "=========================================="

# Kill any existing process on port 3000
echo "Checking for existing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the dev server
echo "Starting Next.js development server..."
cd "/Users/helpdesk/Cursor/MVP - Supply Chain Intelligence"

# Run npm dev in background and capture output
npm run dev > dev-server.log 2>&1 &
DEV_PID=$!

echo "Waiting for server to start (PID: $DEV_PID)..."

# Wait for server to be ready
for i in {1..30}; do
  if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Server is running!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Server failed to start after 30 seconds"
    echo "Check dev-server.log for errors"
    cat dev-server.log
    exit 1
  fi
  sleep 1
  echo -n "."
done

echo ""
echo "📱 Testing WhatsApp webhook endpoint..."
curl -X GET http://localhost:3000/api/webhooks/whatsapp-test

echo ""
echo ""
echo "✅ Server is running at: http://localhost:3000"
echo "📋 Ngrok should forward to: http://localhost:3000"
echo "🔍 Check dev-server.log for any errors"
echo ""
echo "Press Ctrl+C to stop the server"

# Keep script running
tail -f dev-server.log