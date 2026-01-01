const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

try {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

  const supabase = createClient(url, key);

  async function run() {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, image_url')
      .ilike('image_url', '%miscellaneousbycaff.com.ar%');
    
    console.log('Products with problematic domain:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('First 5:', data.slice(0, 5));
    }
  }

  run();
} catch (err) {
  console.error(err);
}
