const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  const query = 'ueslei';
  let hasMore = true;
  let offset = 0;
  const limit = 1000;
  let totalProjects = 0;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('kv_store')
      .select('key, value')
      .like('key', '/projects/%')
      .range(offset, offset + limit - 1);
      
    if (error) {
      console.error(error);
      break;
    }
    
    if (data.length === 0) {
      hasMore = false;
      break;
    }
    
    totalProjects += data.length;
    
    for (const row of data) {
      const strVal = JSON.stringify(row.value).toLowerCase();
      if (strVal.includes(query) || strVal.includes('mensageiro')) {
        console.log(`Match found in project key: ${row.key}`);
        console.log(JSON.stringify({
          id: row.value.id,
          customerEmail: row.value.customerEmail,
          metadata_email: row.value.metadata?.email,
          contact_email: row.value.metadata?.contact?.email,
          title: row.value.title || row.value.metadata?.title
        }, null, 2));
      }
    }
    
    offset += limit;
  }
  console.log(`Total projects searched: ${totalProjects}`);
}

search();
