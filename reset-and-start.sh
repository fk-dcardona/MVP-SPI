#!/bin/bash

echo "🔄 Resetting Environment..."
echo "========================="

# 1. Kill any existing processes
echo "1. Stopping existing processes..."
pkill -f "next" 2>/dev/null || true
pkill -f "node" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# 2. Clear caches
echo "2. Clearing caches..."
rm -rf .next
rm -rf node_modules/.cache

# 3. Verify environment
echo "3. Checking environment..."
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local not found!"
    echo "Creating from example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your Supabase credentials"
fi

# 4. Install dependencies
echo "4. Installing dependencies..."
npm install

# 5. Generate test data if needed
if [ ! -f "test-data/test_sales.csv" ]; then
    echo "5. Generating test data..."
    node generate-test-data.js
fi

# 6. Start development server
echo ""
echo "✅ Environment reset complete!"
echo ""
echo "📋 Test Credentials:"
echo "   test@finkargo.com / Test123!@#"
echo "   admin@demo.com / demo123"
echo ""
echo "🚀 Starting development server..."
echo "================================"
npm run dev