const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  const query = 'Ueslei';
  
  console.log('Querying Supabase by text Ueslei...');
  const { data: d1, error: e1 } = await supabase
    .from('kv_store')
    .select('key, value')
    .ilike('value::text', `%Ueslei%`);
    
  if (e1) console.error(e1);
  else {
    console.log(`Found ${d1.length} rows`);
    d1.forEach(row => console.log(row.key));
  }
}

search();
