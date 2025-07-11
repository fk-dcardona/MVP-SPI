#!/usr/bin/env node

/**
 * Custom WhatsApp Testing Script for User Numbers
 */

const testPhoneNumbers = {
  number1: '+573164546589',
  number2: '+573164781291'  // Normalized format
};

console.log('📱 WhatsApp Testing Configuration');
console.log('================================');
console.log(`Test Number 1: ${testPhoneNumbers.number1}`);
console.log(`Test Number 2: ${testPhoneNumbers.number2}`);
console.log('');
console.log('🚀 Testing Instructions:');
console.log('');
console.log('1. Make sure your dev server is running on http://localhost:3001');
console.log('');
console.log('2. Configure Twilio WhatsApp Sandbox:');
console.log('   - Go to Twilio Console > Messaging > Try it out > WhatsApp');
console.log('   - Set webhook URL to your ngrok URL + /api/webhooks/whatsapp');
console.log('   - Example: https://your-ngrok-id.ngrok.io/api/webhooks/whatsapp');
console.log('');
console.log('3. Send WhatsApp messages from your test numbers to test:');
console.log('   - "check inventory" - Test inventory queries');
console.log('   - "show alerts" - Test alert management');
console.log('   - "help" - Test help system');
console.log('   - "report sales" - Test report generation');
console.log('');
console.log('4. Test conversation simulation (run in browser console):');
console.log(`
fetch("http://localhost:3001/api/test-conversation", {
  method: "POST",
  headers: {"Content-Type": "application/json"},
  body: JSON.stringify({
    phoneNumber: "${testPhoneNumbers.number1}",
    messages: [
      "Hello, I need help with inventory",
      "Show me current stock levels",
      "What are my alerts?"
    ]
  })
}).then(res => res.json()).then(console.log);
`);
console.log('');
console.log('5. Monitor conversation state:');
console.log('   - Check dashboard at http://localhost:3001/dashboard');
console.log('   - View conversation logs in Supabase dashboard');
console.log('   - Monitor webhook logs in terminal');
console.log('');
console.log('📌 Note: For production testing, you\'ll need:');
console.log('   - Ngrok or similar tunnel for webhook URL');
console.log('   - Twilio WhatsApp sandbox configured');
console.log('   - Valid Twilio credentials in .env.local');