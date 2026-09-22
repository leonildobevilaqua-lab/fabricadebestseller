const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  const query = 'mensageirotop@gmail.com';
  
  console.log('Querying Supabase by customerEmail...');
  const { data: d1, error: e1 } = await supabase
    .from('kv_store')
    .select('key, value')
    .ilike('value->>customerEmail', `%mensageirotop%`);
    
  if (e1) console.error(e1);
  else console.log('Found with customerEmail:', d1.length);
  d1?.forEach(r => console.log(r.key));
  
  console.log('Querying Supabase by email...');
  const { data: d2, error: e2 } = await supabase
    .from('kv_store')
    .select('key, value')
    .ilike('value->>email', `%mensageirotop%`);
    
  if (e2) console.error(e2);
  else console.log('Found with email:', d2.length);
  d2?.forEach(r => console.log(r.key));

  console.log('Querying by userEmail...');
  const { data: d3, error: e3 } = await supabase
    .from('kv_store')
    .select('key, value')
    .ilike('value->>userEmail', `%mensageirotop%`);
    
  if (e3) console.error(e3);
  else console.log('Found with userEmail:', d3.length);
  d3?.forEach(r => console.log(r.key));

  console.log('Querying by payerEmail...');
  const { data: d4, error: e4 } = await supabase
    .from('kv_store')
    .select('key, value')
    .ilike('value->paymentInfo->>payerEmail', `%mensageirotop%`);
    
  if (e4) console.error(e4);
  else console.log('Found with payerEmail:', d4.length);
  d4?.forEach(r => console.log(r.key));
}

search();
