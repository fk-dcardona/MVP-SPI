// WhatsApp Conversational Intelligence Testing Script
// Run: node test-whatsapp-intelligence.js

const testConversationFlow = async () => {
  console.log('🧠 Starting WhatsApp Intelligence Testing...\n');

  // Test messages for different scenarios
  const testScenarios = {
    inventory_check: [
      "check inventory for widgets",
      "how much stock do we have for bolts", 
      "stock levels for screws"
    ],
    alert_management: [
      "show me alerts",
      "what alerts are active",
      "alerts"
    ],
    learning_scenario: [
      "generate sales report",
      "too detailed, make it shorter",
      "generate inventory report"  
    ],
    proactive_testing: [
      "check inventory for widgets",
      "check inventory for widgets", // Repeat to trigger pattern
      "check inventory for widgets",
      "check inventory for widgets",
      "check inventory for widgets"  // Should trigger automation suggestion
    ]
  };

  // Test phone numbers for different personas
  const testUsers = {
    streamliner: '+1234567890',
    navigator: '+1234567891', 
    spring: '+1234567892',
    hub: '+1234567893',
    processor: '+1234567894'
  };

  console.log('📱 Test Users:', testUsers);
  console.log('🎯 Test Scenarios:', Object.keys(testScenarios));
  
  console.log('\n✅ Simulation ready!');
  console.log('🌐 Development server running at: http://localhost:3000');
  console.log('📋 Dashboard URL: http://localhost:3000/dashboard');
  
  console.log('\n🔗 Next Steps:');
  console.log('1. Visit dashboard to monitor agent status');
  console.log('2. Use browser console to run simulation:');
  console.log('   ```javascript');
  console.log('   // Test conversation simulation');
  console.log('   fetch("/api/test-conversation", {');
  console.log('     method: "POST",');
  console.log('     headers: {"Content-Type": "application/json"},');
  console.log('     body: JSON.stringify({');
  console.log('       phoneNumber: "+1234567890",');
  console.log('       messages: ["check inventory for widgets", "show me alerts"]');
  console.log('     })');
  console.log('   })');
  console.log('   ```');

  console.log('\n3. Test webhook endpoint at: http://localhost:3000/api/webhooks/whatsapp');
  console.log('4. Monitor conversation state in database');
  console.log('5. Check proactive insights generation');
  
  console.log('\n🚀 Ready for immediate testing!');
};

testConversationFlow();