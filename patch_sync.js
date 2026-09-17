const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const DB_PATH = path.join(__dirname, 'backend', 'database.json');

async function syncAll() {
    console.log("Starting manual sync of Supabase to database.json...");
    let localDB = {};
    if (fs.existsSync(DB_PATH)) {
        try {
            localDB = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
            console.log("Loaded existing localDB with", Object.keys(localDB).length, "keys.");
        } catch (e) {
            console.error("Error loading existing DB", e);
        }
    }

    const collections = ['/projects', '/leads', '/orders', '/users', '/credits', '/cipCredits', '/qrCredits'];
    
    for (const col of collections) {
        console.log(`Fetching keys for ${col}...`);
        let allKeys = [];
        let from = 0;
        let limit = 1000;
        while (true) {
            const { data: keysData, error } = await supabase
                .from('kv_store')
                .select('key, updated_at')
                .like('key', `${col}/%`)
                .order('key', { ascending: true })
                .range(from, from + limit - 1);
            if (error) {
                console.error(error); break;
            }
            if (!keysData || keysData.length === 0) break;
            allKeys = allKeys.concat(keysData);
            if (keysData.length < limit) break;
            from += limit;
        }

        console.log(`Found ${allKeys.length} keys in ${col}. Checking what needs update...`);
        const keysToFetch = allKeys.filter(k => {
            const local = localDB[k.key];
            if (!local) return true; // Missing
            if (k.updated_at && local.updated_at) {
                return new Date(k.updated_at) > new Date(local.updated_at);
            }
            return false; // Already have it
        }).map(k => k.key);

        console.log(`Need to fetch ${keysToFetch.length} updated/new items for ${col}.`);

        const chunkSize = 100;
        for (let i = 0; i < keysToFetch.length; i += chunkSize) {
            const chunk = keysToFetch.slice(i, i + chunkSize);
            console.log(`Fetching chunk ${i} to ${i + chunk.length}...`);
            const { data: chunkData, error } = await supabase
                .from('kv_store')
                .select('key, value, updated_at')
                .in('key', chunk);

            if (error) {
                console.error(error);
                continue;
            }

            if (chunkData) {
                for (const item of chunkData) {
                    let val = item.value || {};
                    let metadata = item.metadata || val.metadata || {};
                    
                    if (typeof val === 'string' && val.startsWith('{')) try { val = JSON.parse(val); } catch (e) {}
                    if (typeof metadata === 'string' && metadata.startsWith('{')) try { metadata = JSON.parse(metadata); } catch (e) {}
                    
                    const parsed = {
                        ...val,
                        ...metadata,
                        id: item.id || val.id || metadata.id || item.key.split('/').pop(),
                        key: item.key,
                        updated_at: item.updated_at
                    };
                    localDB[item.key] = parsed;
                }
            }
        }
    }

    console.log("Saving to database.json...");
    fs.writeFileSync(DB_PATH, JSON.stringify(localDB, null, 2));
    console.log("Done! database.json updated.");
}

syncAll();
