#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up test environment for MVP-SPI${NC}\n"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing dependencies...${NC}"
    npm install
fi

# Generate test data
echo -e "\n${YELLOW}📊 Generating test data...${NC}"
node generate-test-data.js

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo -e "\n${YELLOW}⚠️  No .env.local found. Creating from example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo -e "${GREEN}✅ Created .env.local - Please add your Supabase credentials${NC}"
    else
        echo -e "${YELLOW}Creating basic .env.local file...${NC}"
        cat > .env.local << EOL
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Twilio Configuration (for WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Exchange Rate API
EXCHANGE_RATE_API_KEY=your_api_key_here
EOL
        echo -e "${GREEN}✅ Created .env.local - Please add your credentials${NC}"
    fi
fi

# Create test credentials file
echo -e "\n${YELLOW}📝 Creating test credentials...${NC}"
cat > test-data/test-credentials.txt << EOL
Test User Credentials
====================

Email: test@finkargo.com
Password: Test123!@#
Company: Test Trading Co
Industry: Retail
Phone: +1234567890

Additional Test Users:
---------------------
admin@finkargo.com / Admin123!@#
manager@finkargo.com / Manager123!@#
analyst@finkargo.com / Analyst123!@#

Test CSV Files:
--------------
- test_inventory.csv (100 products)
- test_sales.csv (300 sales records)
- large_inventory.csv (1000 products for performance testing)

All files are in the ./test-data/ directory
EOL

echo -e "${GREEN}✅ Test credentials saved to test-data/test-credentials.txt${NC}"

# Check if port 3000 is in use
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo -e "\n${YELLOW}⚠️  Port 3000 is already in use${NC}"
    echo "Run this to kill the process: lsof -ti:3000 | xargs kill -9"
else
    echo -e "\n${GREEN}✅ Port 3000 is available${NC}"
fi

echo -e "\n${BLUE}📋 Setup complete! Next steps:${NC}"
echo "1. Update .env.local with your Supabase credentials"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Use test credentials from test-data/test-credentials.txt"
echo "5. Upload CSV files from test-data/ directory"
echo -e "\n${GREEN}Happy testing! 🎉${NC}"

# Make the script executable
chmod +x setup-test.sh