import { supabase } from './src/services/supabase';
import fs from 'fs';
import path from 'path';

async function cleanAll() {
    console.log("=== INICIANDO LIMPEZA REAL DO BANCO DE DADOS ===");

    const collections = ['/projects', '/leads', '/users', '/settings', '/admin', '/credits', '/orders', '/extra_orders'];

    console.log("1. Apagando as chaves monolíticas legadas do Supabase...");
    for (const coll of collections) {
        // Apaga a chave monolítica exata que causa o "reviver" dos dados
        const { error: err1 } = await supabase.from('kv_store').delete().eq('key', coll);
        if (err1) console.error(`Erro ao apagar ${coll} monolítico:`, err1.message);
        else console.log(`✓ Chave monolítica ${coll} apagada.`);

        // Apaga TODOS os filhos dessa coleção (Limpeza Total dos registros)
        const { error: err2 } = await supabase.from('kv_store').delete().like('key', `${coll}/%`);
        if (err2) console.error(`Erro ao esvaziar a coleção ${coll}:`, err2.message);
        else console.log(`✓ Todos os itens da coleção ${coll} apagados.`);
    }

    console.log("\n2. Apagando o arquivo local fallback (database.json)...");
    const DB_PATH = path.resolve(process.cwd(), 'database.json');
    if (fs.existsSync(DB_PATH)) {
        try {
            fs.unlinkSync(DB_PATH);
            console.log("✓ database.json apagado com sucesso.");
        } catch (e) {
            console.error("Erro ao apagar database.json:", e);
        }
    } else {
        console.log("- database.json não encontrado (já está limpo).");
    }

    console.log("\n=== LIMPEZA CONCLUÍDA ===");
    console.log("Todos os leads, orders e usuários de teste foram zerados!");
    process.exit(0);
}

cleanAll();
