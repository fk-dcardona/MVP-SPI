import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
const envPath = join(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('URL:', supabaseUrl ? '✓' : '✗');
  console.error('Service Key:', supabaseServiceKey ? '✓' : '✗');
  process.exit(1);
}

console.log('🔗 Connecting to Supabase...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('\n🚀 Creating test users...\n');

  // Test if we can connect
  const { data: testData, error: testError } = await supabase
    .from('companies')
    .select('id')
    .limit(1);

  if (testError) {
    console.error('❌ Cannot connect to database:', testError.message);
    console.error('\nPlease check:');
    console.error('1. Your Supabase project is active (not paused)');
    console.error('2. The service key in .env.local is correct');
    console.error('3. Your network connection');
    return;
  }

  console.log('✅ Connected to Supabase\n');

  // Create demo company first
  const { error: companyError } = await supabase
    .from('companies')
    .upsert({
      id: 'demo-company-001',
      name: 'Demo Trading Company',
      settings: {
        currency: 'USD',
        timezone: 'America/New_York',
        features: {
          alertsEnabled: true,
          whatsappEnabled: true,
          autoOptimization: true
        }
      }
    });

  if (companyError) {
    console.error('❌ Error with company:', companyError.message);
  } else {
    console.log('✅ Demo company ready');
  }

  // Test users
  const users = [
    { email: 'admin@demo.com', password: 'demo123', name: 'John Admin', role: 'admin' },
    { email: 'manager@demo.com', password: 'demo123', name: 'Jane Manager', role: 'manager' },
    { email: 'analyst@demo.com', password: 'demo123', name: 'Bob Analyst', role: 'analyst' }
  ];

  for (const user of users) {
    console.log(`\n👤 Setting up: ${user.email}`);
    
    try {
      // Try to create user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          full_name: user.name,
          role: user.role
        }
      });

      if (error) {
        if (error.message.includes('already been registered')) {
          console.log('   User already exists - resetting password...');
          
          // Update password for existing user
          const { data: { users: userList } } = await supabase.auth.admin.listUsers();
          const existingUser = userList.find(u => u.email === user.email);
          
          if (existingUser) {
            const { error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              { password: user.password }
            );
            
            if (updateError) {
              console.error('   ❌ Password update failed:', updateError.message);
            } else {
              console.log('   ✅ Password reset to: demo123');
            }

            // Update profile
            await supabase.from('profiles').upsert({
              id: existingUser.id,
              company_id: 'demo-company-001',
              email: user.email,
              full_name: user.name,
              role: user.role
            });
          }
        } else {
          throw error;
        }
      } else {
        console.log('   ✅ User created');
        
        // Create profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          company_id: 'demo-company-001',
          email: user.email,
          full_name: user.name,
          role: user.role
        });
      }
    } catch (err) {
      console.error(`   ❌ Error: ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('✨ Setup Complete!\n');
  console.log('🔐 Test Credentials:');
  console.log('   Hub User: admin@demo.com / demo123');
  console.log('   Navigator: manager@demo.com / demo123'); 
  console.log('   Streamliner: analyst@demo.com / demo123');
  console.log('\n🌐 Login at: http://localhost:3000/login');
  console.log('='.repeat(50));
}

createTestUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });