const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  const query = 'mensageirotop';
  
  console.log('Fetching projects from Supabase...');
  const { data, error } = await supabase
    .from('kv_store')
    .select('key, value')
    .like('key', '/projects/%');
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} projects in Supabase.`);
  let count = 0;
  for (const row of data) {
    const val = row.value;
    const strVal = JSON.stringify(val).toLowerCase();
    
    if (strVal.includes(query)) {
      console.log(`Match found in project key: ${row.key}`);
      count++;
      // Print some relevant data to see what email is set
      console.log(JSON.stringify({
        id: val.id,
        customerEmail: val.customerEmail,
        metadata_email: val.metadata?.email,
        contact_email: val.metadata?.contact?.email,
        title: val.title || val.metadata?.title
      }, null, 2));
    }
  }
  
  console.log(`Total projects matching '${query}': ${count}`);
}

search();
