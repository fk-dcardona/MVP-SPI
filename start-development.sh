#!/bin/bash

# Finkargo Analytics MVP - Development Starter
# This script launches the Cursor agents and development environment

echo "🚀 Finkargo Analytics MVP - Starting Development Environment"
echo "=========================================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in the mvp-spi directory!"
    echo "Please run from: /Users/helpdesk/Cursor/MVP - Supply Chain Intelligence/mvp-spi"
    exit 1
fi

# Check environment file
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env.local not found${NC}"
    echo "Copying from .env.example..."
    cp .env.example .env.local
    echo -e "${GREEN}✅ Created .env.local${NC}"
    echo ""
    echo "⚠️  IMPORTANT: Please update .env.local with your credentials:"
    echo "   1. Supabase URL and keys"
    echo "   2. Twilio credentials for WhatsApp"
    echo "   3. ExchangeRate API key"
    echo ""
    echo "See SUPABASE_SETUP.md for detailed instructions."
    echo ""
    read -p "Press Enter to continue once you've updated the credentials..."
fi

echo ""
echo -e "${BLUE}Starting Cursor Agent System...${NC}"
echo ""

# Create tmux session for multiple processes
if command -v tmux &> /dev/null; then
    echo "Using tmux for process management..."
    
    # Kill existing session if it exists
    tmux kill-session -t finkargo 2>/dev/null
    
    # Create new session
    tmux new-session -d -s finkargo -n agents
    
    # Split window for agents
    tmux send-keys -t finkargo:agents "node .cursor/agent-launcher.js" C-m
    
    # Create new window for dev server
    tmux new-window -t finkargo -n nextjs
    tmux send-keys -t finkargo:nextjs "npm run dev" C-m
    
    # Create window for logs
    tmux new-window -t finkargo -n logs
    tmux send-keys -t finkargo:logs "tail -f .cursor/logs/agent.log" C-m
    
    echo ""
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo ""
    echo "📺 View sessions:"
    echo "   tmux attach -t finkargo"
    echo ""
    echo "🔄 Switch windows:"
    echo "   Ctrl+B then 0 = Agents"
    echo "   Ctrl+B then 1 = Next.js"
    echo "   Ctrl+B then 2 = Logs"
    echo ""
    echo "⏹  Stop everything:"
    echo "   tmux kill-session -t finkargo"
    
else
    # Fallback without tmux
    echo "Starting in simple mode (install tmux for better experience)..."
    echo ""
    echo "🤖 Starting Cursor Agents..."
    node .cursor/agent-launcher.js &
    AGENT_PID=$!
    
    echo ""
    echo "🌐 Starting Next.js development server..."
    npm run dev &
    DEV_PID=$!
    
    echo ""
    echo -e "${GREEN}✅ Development environment started!${NC}"
    echo ""
    echo "📊 Agent Dashboard: Check the terminal for agent status"
    echo "🌐 Web Application: http://localhost:3000"
    echo ""
    echo "⏹  To stop: Press Ctrl+C"
    
    # Wait for Ctrl+C
    trap "kill $AGENT_PID $DEV_PID 2>/dev/null; exit" INT
    wait
fi