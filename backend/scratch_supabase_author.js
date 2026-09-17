const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  console.log('Searching Supabase by authorName...');
  
  const { data: d1, error: e1 } = await supabase
    .from('kv_store')
    .select('key, value')
    .ilike('value->>authorName', '%Ueslei%');
    
  if (e1) console.error(e1);
  else {
    console.log(`Found ${d1.length} by authorName directly`);
    d1.forEach(r => console.log(r.key, r.value?.customerEmail, r.value?.authorName));
  }
  
  const { data: d2, error: e2 } = await supabase
    .from('kv_store')
    .select('key, value')
    .ilike('value->metadata->>authorName', '%Ueslei%');
    
  if (e2) console.error(e2);
  else {
    console.log(`Found ${d2.length} by metadata->authorName`);
    d2.forEach(r => console.log(r.key, r.value?.metadata?.email, r.value?.metadata?.authorName));
  }
}

search();
