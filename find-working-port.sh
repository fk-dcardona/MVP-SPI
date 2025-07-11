#!/bin/bash

echo "🔍 Finding a Working Port for Next.js"
echo "===================================="

# Kill any existing Next.js processes
echo "Cleaning up existing processes..."
pkill -f "next" 2>/dev/null || true

# Array of ports to try
PORTS=(3000 3001 3002 8080 8081 8082 5000 5001 4000 4001)

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is in use
    else
        return 0  # Port is free
    fi
}

# Function to test if server is accessible
test_server() {
    local port=$1
    local attempts=0
    local max_attempts=30
    
    echo "Waiting for server to start on port $port..."
    
    while [ $attempts -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:$port 2>/dev/null | grep -q "200\|302\|307"; then
            return 0  # Server is responding
        fi
        sleep 1
        attempts=$((attempts + 1))
        echo -n "."
    done
    
    echo ""
    return 1  # Server didn't respond
}

# Try each port
for PORT in "${PORTS[@]}"; do
    echo ""
    echo "🚀 Trying port $PORT..."
    
    if ! check_port $PORT; then
        echo "❌ Port $PORT is already in use, skipping..."
        continue
    fi
    
    echo "✅ Port $PORT is available"
    
    # Start Next.js in background
    echo "Starting Next.js on port $PORT..."
    cd "/Users/helpdesk/Cursor/MVP - Supply Chain Intelligence"
    PORT=$PORT npm run dev > /tmp/nextjs-$PORT.log 2>&1 &
    SERVER_PID=$!
    
    # Test if server is accessible
    if test_server $PORT; then
        echo ""
        echo "🎉 SUCCESS! Server is running and accessible!"
        echo "=================================="
        echo "✅ URL: http://localhost:$PORT"
        echo "✅ Alternative: http://127.0.0.1:$PORT"
        echo "✅ Process ID: $SERVER_PID"
        echo ""
        echo "📋 Test Credentials:"
        echo "   test@finkargo.com / Test123!@#"
        echo "   admin@demo.com / demo123"
        echo ""
        echo "To stop the server: kill $SERVER_PID"
        echo "Or press Ctrl+C"
        echo ""
        echo "Logs are at: /tmp/nextjs-$PORT.log"
        
        # Keep the script running
        echo ""
        echo "Press Ctrl+C to stop the server..."
        wait $SERVER_PID
        exit 0
    else
        echo "❌ Server started but not accessible on port $PORT"
        kill $SERVER_PID 2>/dev/null || true
        
        # Show last few lines of log for debugging
        echo "Last few lines of log:"
        tail -10 /tmp/nextjs-$PORT.log 2>/dev/null || echo "No log available"
    fi
done

echo ""
echo "❌ Could not find a working port!"
echo ""
echo "Possible issues:"
echo "1. Firewall blocking connections"
echo "2. Network configuration issues"
echo "3. Node.js/npm installation problems"
echo ""
echo "Try these commands manually:"
echo "  curl -v http://127.0.0.1:3000"
echo "  telnet localhost 3000"
echo "  nc -zv localhost 3000"
echo ""
echo "You may need to:"
echo "- Disable firewall temporarily"
echo "- Check antivirus software"
echo "- Restart your computer"