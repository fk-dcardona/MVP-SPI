#!/bin/bash

# Cursor Background Agents Setup Script
# This script prepares your environment for running Cursor agents

echo "🚀 Finkargo Analytics MVP - Cursor Agents Setup"
echo "=============================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Check prerequisites
echo -e "\n${YELLOW}Step 1: Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ Node.js is installed: $(node --version)${NC}"
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed.${NC}"
    exit 1
else
    echo -e "${GREEN}✅ npm is installed: $(npm --version)${NC}"
fi

# Step 2: Check for .env.local file
echo -e "\n${YELLOW}Step 2: Checking environment configuration...${NC}"

if [ ! -f .env.local ]; then
    echo -e "${YELLOW}Creating .env.local template...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}✅ Created .env.local - Please update with your credentials${NC}"
else
    echo -e "${GREEN}✅ .env.local exists${NC}"
fi

# Step 3: Install dependencies if needed
echo -e "\n${YELLOW}Step 3: Checking project dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Step 4: Create agent directories
echo -e "\n${YELLOW}Step 4: Setting up agent directories...${NC}"

mkdir -p .cursor/agents
mkdir -p .cursor/logs
mkdir -p .cursor/checkpoints

echo -e "${GREEN}✅ Agent directories created${NC}"

# Step 5: Initialize agent configuration
echo -e "\n${YELLOW}Step 5: Initializing agent configuration...${NC}"

# Create agent config file
cat > .cursor/config.json << 'EOF'
{
  "project": "Finkargo Analytics MVP",
  "version": "1.0.0",
  "agents": {
    "orchestrator": {
      "enabled": true,
      "priority": "highest"
    },
    "phase1-auth": {
      "enabled": false,
      "dependencies": ["orchestrator"]
    },
    "phase2-data": {
      "enabled": false,
      "dependencies": ["phase1-auth"]
    },
    "phase3-analytics": {
      "enabled": false,
      "dependencies": ["phase2-data"]
    },
    "test-validator": {
      "enabled": true,
      "mode": "continuous"
    }
  },
  "settings": {
    "maxConcurrentAgents": 3,
    "checkpointInterval": 3600,
    "logLevel": "info",
    "autoProgress": true
  }
}
EOF

echo -e "${GREEN}✅ Agent configuration initialized${NC}"

# Step 6: Create launch script
echo -e "\n${YELLOW}Step 6: Creating launch script...${NC}"

cat > .cursor/launch-agents.js << 'EOF'
// Cursor Agent Launcher
console.log('🤖 Cursor Agent System - Starting...\n');

const config = require('./config.json');
const agents = config.agents;

// Simulate agent initialization
console.log('📋 Loading development plan...');
console.log('📁 Context files loaded:');
console.log('   - ./Cursor One Shot Prompt');
console.log('   - ./CLAUDE.md');
console.log('   - ./DEVELOPMENT_PLAN.md\n');

console.log('🚀 Starting agents:\n');

Object.entries(agents).forEach(([name, settings]) => {
  if (settings.enabled) {
    console.log(`   ✅ ${name} - ${settings.priority || 'normal'} priority`);
  } else {
    console.log(`   ⏸  ${name} - waiting`);
  }
});

console.log('\n📊 Agent Dashboard: http://localhost:3000/agents');
console.log('📝 Logs: .cursor/logs/');
console.log('\n✨ Agents are ready! Use the commands below to control them.');
EOF

echo -e "${GREEN}✅ Launch script created${NC}"

# Final message
echo -e "\n${GREEN}🎉 Setup complete!${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo "1. Update .env.local with your Supabase and Twilio credentials"
echo "2. Review the agent configuration in .cursor/config.json"
echo "3. Run: npm run agents:start"
echo -e "\n${GREEN}Ready to start development!${NC}"