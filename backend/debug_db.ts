
import { supabase } from './src/services/supabase';

async function test() {
    console.log("Checking Supabase connection...");
    const { data: leads, error: errorLeads } = await supabase.from('kv_store').select('key').like('key', '/leads/%').limit(5);
    console.log("Leads Check:", errorLeads ? "ERROR: " + errorLeads.message : `Found ${leads?.length || 0} leads`);
    if (leads) console.log("Sample Keys:", leads.map(l => l.key));

    const { data: backups, error: errorBackups } = await supabase.from('kv_store').select('key').like('key', 'backup_%');
    console.log("Backups Check:", errorBackups ? "ERROR: " + errorBackups.message : `Found ${backups?.length || 0} backups`);
    
    const { data: admin, error: errorAdmin } = await supabase.from('kv_store').select('key').eq('key', '/users/contato_leonildobevilaqua_com_br').maybeSingle();
    console.log("Admin Check:", errorAdmin ? "ERROR: " + errorAdmin.message : (admin ? "FOUND" : "NOT FOUND"));
}

test().catch(console.error);
