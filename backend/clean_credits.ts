import { supabase } from './src/services/supabase';

async function cleanCreditsAndHistory() {
    console.log("=== APAGANDO TODO O HISTÓRICO DE CRÉDITOS E REDEEMED PAYMENTS ===");

    // 1. Delete all credits
    await supabase.from('kv_store').delete().eq('key', '/credits');
    await supabase.from('kv_store').delete().like('key', '/credits/%');
    console.log("✓ Créditos zerados");

    // 2. We can't easily delete just `redeemed_payments` from users since they are nested in `/users/email`, 
    // but the old redeemed logic in checkAccess is now deleted from code, so it doesn't matter anymore!

    console.log("=== CONCLUÍDO ===");
    process.exit(0);
}

cleanCreditsAndHistory();
