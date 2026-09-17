const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function testQuery() {
  console.log('Testing GTE / LT query for projects...');
  const start = Date.now();
  
  const { data, error } = await supabase
    .from('kv_store')
    .select('key')
    .gte('key', '/projects/')
    .lt('key', '/projects0')
    .limit(10);
    
  const end = Date.now();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Success! Found ${data.length} items in ${end - start}ms`);
    data.forEach(d => console.log(d.key));
  }
}

testQuery();
