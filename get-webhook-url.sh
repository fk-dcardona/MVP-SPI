#!/bin/bash

echo "🚀 WhatsApp Webhook Configuration"
echo "================================="
echo ""
echo "Checking ngrok status..."

# Try to get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"[^"]*' | grep -o 'https://[^"]*' | head -1)

if [ -z "$NGROK_URL" ]; then
    echo "❌ Ngrok doesn't seem to be running."
    echo ""
    echo "Start ngrok in a new terminal with:"
    echo "  ngrok http 3001"
    echo ""
else
    echo "✅ Ngrok is running!"
    echo ""
    echo "📱 Your webhook URL for Twilio:"
    echo "   ${NGROK_URL}/api/webhooks/whatsapp"
    echo ""
    echo "🔧 In Twilio WhatsApp Sandbox:"
    echo "   1. Go to: Messaging > Try it out > Send a WhatsApp message"
    echo "   2. In the Sandbox Configuration section:"
    echo "      - When a message comes in: ${NGROK_URL}/api/webhooks/whatsapp"
    echo "      - Method: POST"
    echo "   3. Click Save"
    echo ""
    echo "📲 Your test numbers:"
    echo "   • +573164546589"
    echo "   • +573164781291"
    echo ""
    echo "💬 Test messages to send:"
    echo "   • 'check inventory'"
    echo "   • 'show alerts'"
    echo "   • 'what is my stock for widgets?'"
    echo "   • 'help'"
    echo ""
    echo "🔍 Monitor logs:"
    echo "   • Ngrok Inspector: http://localhost:4040"
    echo "   • Dev server logs: In your terminal running 'npm run dev'"
    echo "   • Dashboard: http://localhost:3001/dashboard"
fi