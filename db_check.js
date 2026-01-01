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
      .select('*')
      .eq('id', 'ccae3cbf-b5fc-4c1d-95c4-ef00091dcf05');
    
    console.log(JSON.stringify({ data, error }, null, 2));
    
    // Also check for products with "desconocido" in name
    const { data: unknownProducts } = await supabase
      .from('products')
      .select('id, name')
      .ilike('name', '%desconocido%');
    
    console.log('Products with unknown in name:', unknownProducts);
  }

  run();
} catch (err) {
  console.error(err);
}
