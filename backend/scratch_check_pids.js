const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  const pids = [
    'be0cb606-359c-40ff-a2ab-943e6bed2c77',
    'da3037b1-d6f7-48ce-ba27-9dddbb53b94e',
    'fa7fa313-e59d-4a3b-b272-be6f61759da5'
  ];
  
  for (const id of pids) {
    const { data, error } = await supabase
      .from('kv_store')
      .select('value')
      .eq('key', `/projects/${id}`);
      
    if (data && data[0]) {
      console.log(`Found project: ${id}`);
      console.log(data[0].value.metadata?.email, data[0].value.metadata?.authorName, data[0].value.metadata?.title);
    } else {
      console.log(`Not found project: ${id}`);
    }
  }
}

search();
