const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

try {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/)[1].trim();

  const supabase = createClient(url, key);

  async function run() {
    const { count, error } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    console.log('Total products in DB:', count);
    
    const { data: allProducts } = await supabase
      .from('products')
      .select('id, name')
      .order('name');
      
    console.log('Fetched products count:', allProducts.length);
    
    const targetId = 'ccae3cbf-b5fc-4c1d-95c4-ef00091dcf05';
    const found = allProducts.find(p => p.id === targetId);
    console.log('Is target product in fetched list?', !!found);
  }

  run();
} catch (err) {
  console.error(err);
}
