#!/bin/bash

echo "🔧 Fixing WhatsApp Webhook Setup"
echo "================================"

# 1. Kill any existing processes
echo "1. Cleaning up existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
killall node 2>/dev/null || true

# 2. Clear Next.js cache
echo "2. Clearing Next.js cache..."
rm -rf .next

# 3. Start fresh dev server
echo "3. Starting fresh development server..."
echo "   This will take a moment..."

# Start dev server and wait for it to be ready
npm run dev &
DEV_PID=$!

echo "   Waiting for server to be ready..."
sleep 10

# 4. Test the webhook endpoint
echo "4. Testing webhook endpoint..."
echo ""

# Test the simple endpoint
echo "Testing GET /api/webhooks/test:"
curl -s http://localhost:3000/api/webhooks/test || echo "Failed to connect"

echo ""
echo "Testing POST /api/webhooks/test:"
curl -s -X POST http://localhost:3000/api/webhooks/test || echo "Failed to connect"

echo ""
echo "================================"
echo "📱 WhatsApp Webhook Instructions:"
echo ""
echo "1. Make sure ngrok is running on port 3000:"
echo "   ngrok http 3000"
echo ""
echo "2. Update Twilio webhook to:"
echo "   https://YOUR-NGROK-URL.ngrok-free.app/api/webhooks/test"
echo ""
echo "3. Send a test message from WhatsApp"
echo ""
echo "4. Check the terminal for logs"
echo ""
echo "Server PID: $DEV_PID"
echo "Press Ctrl+C to stop the server"

# Keep the script running
wait $DEV_PID