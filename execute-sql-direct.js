// Direct SQL execution script for Supply Chain Intelligence Platform
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Environment Check:');
console.log('SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
console.log('SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required Supabase credentials');
  console.error('Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in .env.local');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLDirectly() {
  try {
    console.log('\n🚀 Testing Supabase connection...');
    
    // Test connection with a simple query
    const { data, error } = await supabase
      .from('companies')
      .select('count')
      .limit(1);
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist (expected)
      console.log('⚠️  Connection test result:', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
    }
    
    console.log('\n📄 Reading SQL setup file...');
    const sqlPath = path.join(__dirname, 'temp_setup.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      .map(stmt => stmt + ';'); // Add semicolon back
    
    console.log(`🔧 Found ${statements.length} SQL statements to execute...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim() && statement.trim() !== ';') {
        try {
          console.log(`\n📝 Executing statement ${i + 1}/${statements.length}...`);
          
          // Execute using raw SQL via RPC
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql: statement 
          });
          
          if (error) {
            console.log(`❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
            successCount++;
          }
          
        } catch (err) {
          console.log(`❌ Statement ${i + 1} error:`, err.message);
          errorCount++;
        }
      }
    }
    
    console.log('\n📊 Execution Summary:');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('\n🎉 Database setup completed successfully!');
      console.log('Your Supply Chain Intelligence Platform is ready to use.');
    } else {
      console.log('\n⚠️  Setup completed with some errors. Check the output above.');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup
executeSQLDirectly(); 