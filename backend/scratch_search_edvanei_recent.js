const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function search() {
  console.log('Querying recent projects from Supabase...');
  
  const { data, error } = await supabase
    .from('kv_store')
    .select('key, updated_at, value')
    .gte('key', '/projects/')
    .lt('key', '/projects0')
    .order('updated_at', { ascending: false })
    .limit(1000);
    
  if (error) {
    console.error('Supabase Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} recent projects.`);
  let count = 0;
  
  for (const item of data) {
    let val = item.value;
    if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch(e) {}
    }
    
    const metaStr = JSON.stringify(val || {}).toLowerCase();
    
    if (metaStr.includes('edvanei') || 
        metaStr.includes('medina') || 
        metaStr.includes('astronomia')) {
      
      const title = val?.metadata?.title || val?.title || 'Unknown';
      const author = val?.metadata?.authorName || val?.authorName || val?.metadata?.author || val?.author || 'Unknown';
      
      if (!title.toLowerCase().includes('medina') && 
          !title.toLowerCase().includes('astronomia') && 
          !metaStr.includes('edvanei') &&
          !author.toLowerCase().includes('edvanei')) {
          continue;
      }
        
      console.log('--------------------------------------------------');
      console.log('Found match:', item.key);
      const status = val?.status || val?.metadata?.status || 'Unknown';
      const email = val?.email || val?.metadata?.email || val?.metadata?.contact?.email || 'Unknown';
      
      console.log('Title:', title);
      console.log('Author:', author);
      console.log('Email:', email);
      console.log('Status:', status);
      console.log('Updated At:', item.updated_at);
      console.log('Has PDF?', !!val?.pdfUrl || !!val?.metadata?.pdfUrl);
      console.log('Has EPUB?', !!val?.epubUrl || !!val?.metadata?.epubUrl);
      console.log('Has Kit (complete kit)?', !!val?.completeKitUrl || !!val?.metadata?.completeKitUrl);
      
      if (val?.metadata?.error) console.log('Metadata Error:', val.metadata.error);
      if (val?.error) console.log('Project Error:', val.error);
      if (val?.errorDetails) console.log('Project Error Details:', val.errorDetails);
      
      count++;
    }
  }
  
  console.log(`\nTotal matches: ${count}`);
}

search();
