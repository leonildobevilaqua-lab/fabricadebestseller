const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  const keys = ['/leads[41]', '/leads[68]', '/leads[117]'];
  
  for (const key of keys) {
    const { data, error } = await supabase
      .from('kv_store')
      .select('value')
      .eq('key', key);
      
    if (data && data[0]) {
      console.log(`${key} ->`, data[0].value.projectId, data[0].value.status, data[0].value.topic);
    }
  }
}

search();
