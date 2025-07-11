#!/bin/bash

echo "🚀 Starting Supply Chain Intelligence Platform..."
echo ""

# Change to project directory
cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Kill any existing process on port 3000
echo "🔄 Checking for existing processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Start the development server
echo "✨ Starting development server..."
echo ""
echo "🌐 The application will be available at: http://localhost:3000"
echo ""
echo "📋 Test credentials:"
echo "   Hub User: admin@demo.com / demo123"
echo "   Navigator: manager@demo.com / demo123"
echo "   Streamliner: analyst@demo.com / demo123"
echo ""
echo "🧪 To test Hub Predictive Analytics:"
echo "   1. Login with admin@demo.com"
echo "   2. Click 'Predictive Intelligence' tab"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
npm run dev