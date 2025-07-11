#!/bin/bash

echo "🚀 Ngrok Setup for WhatsApp Testing"
echo "=================================="
echo ""
echo "Step 1: Get your authtoken"
echo "1. Go to: https://dashboard.ngrok.com/get-started/your-authtoken"
echo "2. Sign up/login to get your authtoken"
echo "3. Copy the authtoken"
echo ""
read -p "Paste your ngrok authtoken here: " NGROK_TOKEN

if [ -z "$NGROK_TOKEN" ]; then
    echo "❌ No authtoken provided. Exiting."
    exit 1
fi

echo ""
echo "✅ Configuring ngrok..."
ngrok config add-authtoken $NGROK_TOKEN

echo ""
echo "✅ Starting ngrok tunnel on port 3001..."
echo ""
echo "📱 Once ngrok starts, you'll see a URL like:"
echo "   https://abc123.ngrok-free.app"
echo ""
echo "🔧 In your Twilio WhatsApp Sandbox settings:"
echo "   1. Set the webhook URL to: https://YOUR-NGROK-URL.ngrok-free.app/api/webhooks/whatsapp"
echo "   2. Set method to: POST"
echo "   3. Save the configuration"
echo ""
echo "Starting ngrok now..."
echo ""

ngrok http 3001