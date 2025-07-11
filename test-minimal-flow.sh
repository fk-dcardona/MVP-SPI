#!/bin/bash

echo "🌊 Testing Minimal Flow"
echo "====================="

# Kill any existing servers
pkill -f "next" 2>/dev/null || true
sleep 2

echo ""
echo "🚀 Starting minimal server..."
cd "/Users/helpdesk/Cursor/MVP - Supply Chain Intelligence"

# Start the server
npm run dev &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 5

echo ""
echo "✅ Server started with PID: $SERVER_PID"
echo ""
echo "📱 Access the minimal flow at:"
echo "   http://localhost:3000/minimal"
echo ""
echo "🔑 Test credentials:"
echo "   test@finkargo.com / Test123!@#"
echo "   admin@demo.com / demo123"
echo ""
echo "📋 Test flow:"
echo "   1. Login with test credentials"
echo "   2. Upload a CSV file from test-data/"
echo "   3. View the data in the table"
echo ""
echo "This minimal flow has:"
echo "   ✅ No external dependencies"
echo "   ✅ No Supabase"
echo "   ✅ No WhatsApp"
echo "   ✅ No agents"
echo "   ✅ Just login → upload → view"
echo ""
echo "Press Ctrl+C to stop the server..."

# Wait for Ctrl+C
wait $SERVER_PID