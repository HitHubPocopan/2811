const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkProduct() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', 'ccae3cbf-b5fc-4c1d-95c4-ef00091dcf05');
  
  console.log(JSON.stringify({ data, error }, null, 2));
}

checkProduct();
