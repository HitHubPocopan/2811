const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually read .env.local
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

async function testWithKey(name, key) {
  console.log(`\n--- Testing with ${name} ---`);
  const supabase = createClient(supabaseUrl, key);
  
  const { data: sales, error: salesError, count } = await supabase
    .from('sales')
    .select('*', { count: 'exact', head: true });
  
  if (salesError) {
    console.error(`Error connecting to sales table with ${name}:`, salesError.message);
  } else {
    console.log(`Successfully connected to sales with ${name}. Count:`, count);
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id')
    .limit(1);
  
  if (productsError) {
    console.error(`Error connecting to products table with ${name}:`, productsError.message);
  } else {
    console.log(`Successfully connected to products with ${name}.`);
  }
}

async function runTests() {
  await testWithKey('SERVICE_ROLE_KEY', serviceKey);
  await testWithKey('ANON_KEY', anonKey);
}

runTests();
