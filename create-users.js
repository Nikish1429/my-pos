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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function registerUser(email, password, role, name) {
  console.log(`👤 Registering user: ${email} (${role})...`);
  
  // 1. Sign up user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    console.error(`❌ Failed to sign up ${email} in Supabase Auth:`, authError.message);
    return;
  }

  console.log(`✅ Auth user created successfully for ${email}.`);

  // 2. Check if profile already exists in public.users, if not create/update it
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existingUser) {
    const { error: updateError } = await supabase
      .from('users')
      .update({ role, name })
      .eq('email', email);
      
    if (updateError) {
      console.error(`❌ Failed to update role in users table for ${email}:`, updateError.message);
    } else {
      console.log(`✅ Updated profile role to "${role}" for ${email} in users table.`);
    }
  } else {
    const { error: insertError } = await supabase
      .from('users')
      .insert([{ email, role, name }]);

    if (insertError) {
      console.error(`❌ Failed to insert profile in users table for ${email}:`, insertError.message);
    } else {
      console.log(`✅ Created profile with role "${role}" for ${email} in users table.`);
    }
  }
}

// Get arguments from CLI
const args = process.argv.slice(2);
if (args.length < 4) {
  console.log('Usage: node create-users.js <email> <password> <role: admin|cashier> <display_name>');
  process.exit(1);
}

const [email, password, role, name] = args;
registerUser(email, password, role, name);
