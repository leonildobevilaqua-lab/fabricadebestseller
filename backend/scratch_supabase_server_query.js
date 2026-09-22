const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  console.log('Querying projects from Supabase like the server does...');
  
  const { data, error } = await supabase
    .from('kv_store')
    .select('key, updated_at, metadata:value->metadata')
    .like('key', '/projects/%')
    .limit(5000);
    
  if (error) {
    console.error('Supabase Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} projects.`);
  let count = 0;
  
  for (const item of data) {
    const metaStr = JSON.stringify(item.metadata || {}).toLowerCase();
    if (metaStr.includes('ueslei') || metaStr.includes('mensageirotop')) {
      console.log('Found match:', item.key);
      console.log(item.metadata);
      count++;
    }
  }
  
  console.log(`Total matches: ${count}`);
}

search();
