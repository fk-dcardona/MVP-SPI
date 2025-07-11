const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('🚀 Setting up test users...\n');

  // Test users data
  const testUsers = [
    {
      email: 'admin@demo.com',
      password: 'demo123',
      full_name: 'John Admin',
      role: 'admin',
      phone_number: '+1234567890'
    },
    {
      email: 'manager@demo.com',
      password: 'demo123',
      full_name: 'Jane Manager',
      role: 'manager',
      phone_number: '+1234567891'
    },
    {
      email: 'analyst@demo.com',
      password: 'demo123',
      full_name: 'Bob Analyst',
      role: 'analyst',
      phone_number: '+1234567892'
    }
  ];

  // First, create the demo company
  console.log('📦 Creating demo company...');
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .upsert({
      id: 'demo-company-001',
      name: 'Demo Trading Company',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        fiscalYearStart: '01-01',
        features: {
          alertsEnabled: true,
          whatsappEnabled: true,
          autoOptimization: true
        }
      }
    })
    .select()
    .single();

  if (companyError) {
    console.error('❌ Error creating company:', companyError.message);
  } else {
    console.log('✅ Demo company created/updated');
  }

  // Create users
  for (const userData of testUsers) {
    console.log(`\n👤 Creating user: ${userData.email}`);
    
    try {
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
          role: userData.role
        }
      });

      if (authError) {
        if (authError.message.includes('already been registered')) {
          console.log(`⚠️  User ${userData.email} already exists - updating profile...`);
          
          // Get existing user
          const { data: { users } } = await supabase.auth.admin.listUsers();
          const existingUser = users.find(u => u.email === userData.email);
          
          if (existingUser) {
            // Update profile
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert({
                id: existingUser.id,
                company_id: 'demo-company-001',
                email: userData.email,
                full_name: userData.full_name,
                role: userData.role,
                phone_number: userData.phone_number
              });

            if (profileError) {
              console.error(`❌ Error updating profile:`, profileError.message);
            } else {
              console.log(`✅ Profile updated for ${userData.email}`);
            }
          }
        } else {
          throw authError;
        }
      } else {
        console.log(`✅ Auth user created: ${userData.email}`);
        
        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: authUser.user.id,
            company_id: 'demo-company-001',
            email: userData.email,
            full_name: userData.full_name,
            role: userData.role,
            phone_number: userData.phone_number
          });

        if (profileError) {
          console.error(`❌ Error creating profile:`, profileError.message);
        } else {
          console.log(`✅ Profile created for ${userData.email}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error setting up ${userData.email}:`, error.message);
    }
  }

  console.log('\n✨ Test users setup complete!\n');
  console.log('📋 Test Credentials:');
  console.log('   Hub User (admin): admin@demo.com / demo123');
  console.log('   Navigator (manager): manager@demo.com / demo123');
  console.log('   Streamliner (analyst): analyst@demo.com / demo123');
  console.log('\n🌐 Access the app at: http://localhost:3000');
}

// Run the setup
createTestUsers()
  .then(() => {
    console.log('\n✅ Setup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error);
    process.exit(1);
  });