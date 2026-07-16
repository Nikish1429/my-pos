const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 1. Read .env.local
const envPath = path.join(__dirname, '.env.local');
if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local file not found!');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');

// Parse environment variables
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('your-project-url-here')) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is missing or contains placeholder.');
  process.exit(1);
}

if (!supabaseAnonKey || supabaseAnonKey.includes('your-anon-key-here')) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_ANON_KEY is missing or contains placeholder.');
  process.exit(1);
}

console.log('🔗 Testing connection to Supabase using @supabase/supabase-js...');
console.log(`URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // We test connection by fetching the session. This verifies the URL and anon key.
    const { error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      throw sessionError;
    }

    // Try fetching products. If table doesn't exist, we get a specific PostgREST error.
    // That still confirms the connection works, just that the table is missing.
    const { data, error } = await supabase.from('products').select('*').limit(1);
    
    console.log('\n======================================');
    console.log('🎉 Your Supabase connection is working!');
    console.log('======================================');
    
    if (error && error.code === 'PGRST205') {
      console.log('📡 Connection status: SUCCESSFUL');
      console.log('📝 Database status: Table "products" does not exist yet.');
      console.log('👉 Next step: Run the SQL script in "supabase/setup.sql" in your Supabase SQL Editor to create it.');
    } else if (error) {
      console.log('📡 Connection status: SUCCESSFUL');
      console.log(`⚠️ Query warning: ${error.message} (${error.code})`);
    } else {
      console.log('📡 Connection status: SUCCESSFUL');
      console.log('📝 Database status: Table "products" exists.');
      console.log(`📦 Sample data:`, data);
    }
  } catch (err) {
    console.error('\n❌ Connection failed!');
    console.error('Details:', err.message || err);
  }
}

testConnection();
