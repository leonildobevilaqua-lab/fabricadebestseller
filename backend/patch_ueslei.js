const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function patchUeslei() {
  const pids = [
    'be0cb606-359c-40ff-a2ab-943e6bed2c77',
    'da3037b1-d6f7-48ce-ba27-9dddbb53b94e'
  ];
  
  for (const id of pids) {
    const { data, error } = await supabase
      .from('kv_store')
      .select('value')
      .eq('key', `/projects/${id}`);
      
    if (data && data[0]) {
      const val = data[0].value;
      if (!val.metadata.email) {
        val.metadata.email = 'mensageirotop@gmail.com';
        val.customerEmail = 'mensageirotop@gmail.com';
        
        const { error: updateError } = await supabase
          .from('kv_store')
          .update({ value: val, updated_at: new Date().toISOString() })
          .eq('key', `/projects/${id}`);
          
        if (updateError) {
          console.error(`Failed to update ${id}:`, updateError);
        } else {
          console.log(`Successfully patched project ${id} for Ueslei!`);
        }
      } else {
        console.log(`Project ${id} already has email: ${val.metadata.email}`);
      }
    }
  }
}

patchUeslei();
