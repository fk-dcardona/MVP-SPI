# WhatsApp Testing Setup Guide

## Quick Setup for Testing with Your Numbers

### Your Test Numbers:
- **Number 1**: +573164546589
- **Number 2**: +573164781291

### Step 1: Install Ngrok (for webhook tunnel)
```bash
# macOS
brew install ngrok/ngrok/ngrok

# Or download from: https://ngrok.com/download
```

### Step 2: Start Ngrok Tunnel
```bash
# In a new terminal, run:
ngrok http 3001
```

This will give you a URL like: `https://abc123.ngrok.io`

### Step 3: Configure Twilio WhatsApp Sandbox

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to: Messaging > Try it out > WhatsApp sandbox
3. Join the sandbox by sending the join code to the Twilio WhatsApp number
4. Configure webhook:
   - **When a message comes in**: `https://your-ngrok-url.ngrok.io/api/webhooks/whatsapp`
   - **Method**: POST
   - **Status callback URL**: Leave empty
   - Click "Save"

### Step 4: Test Your Numbers

From your WhatsApp (+573164546589 or +573164781291), send messages to the Twilio sandbox number:

```
# Test Commands:
"check inventory"
"show alerts"
"help"
"what's my stock for widgets?"
"generate sales report"
"analyze supplier performance"
```

### Step 5: Monitor in Real-Time

1. **Terminal 1**: Your dev server logs
2. **Terminal 2**: Ngrok request inspector (http://localhost:4040)
3. **Browser**: Dashboard at http://localhost:3001/dashboard
4. **Database**: Check Supabase for conversation records

### Troubleshooting

If messages aren't being received:
1. Check ngrok is running and URL is correct
2. Verify Twilio webhook configuration
3. Check .env.local has correct Twilio credentials
4. Look for errors in terminal logs

### Test Conversation Flow

```javascript
// In browser console at http://localhost:3001
fetch("/api/test-conversation", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({
    phoneNumber: "+573164546589",
    messages: [
      "Hi, I need to check inventory",
      "Show me stock for electronics",
      "What suppliers have delays?"
    ]
  })
}).then(res => res.json()).then(console.log);
```