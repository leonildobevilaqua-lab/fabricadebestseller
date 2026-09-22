const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  const query = 'mensageirotop';
  
  console.log('Querying projects table...');
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .ilike('email', `%${query}%`);
    
  if (error) {
    console.error(error);
  } else {
    console.log(`Found ${data.length} projects.`);
    data.forEach(p => console.log(p.id, p.email, p.book_title));
  }
}

search();
