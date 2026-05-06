
import { supabase } from '../services/supabase';
import { databases, APPWRITE_CONFIG } from '../services/appwrite.service';
import { ID } from 'node-appwrite';

/**
 * MIGRATION SCRIPT: Supabase -> Appwrite
 * Executed to move all historical data before flipping the switch.
 */

async function migrate() {
    console.log("🚀 Starting Migration: Supabase -> Appwrite");

    try {
        // 1. Fetch ALL records from Supabase
        const { data: records, error } = await supabase
            .from('kv_store')
            .select('*');

        if (error) {
            console.error("❌ Error fetching from Supabase:", error.message);
            return;
        }

        console.log(`📦 Found ${records.length} records to migrate.`);

        for (const record of records) {
            try {
                const stringifiedValue = typeof record.value === 'object' ? JSON.stringify(record.value) : String(record.value);
                
                await databases.createDocument(
                    APPWRITE_CONFIG.databaseId,
                    APPWRITE_CONFIG.collectionId,
                    ID.unique(),
                    {
                        key: record.key,
                        value: stringifiedValue
                    }
                );
                console.log(`✅ Migrated: ${record.key}`);
            } catch (err: any) {
                console.warn(`⚠️ Failed to migrate ${record.key}:`, err.message);
            }
        }

        console.log("🏁 Migration Completed Successfully!");
    } catch (e: any) {
        console.error("🔥 Critical Migration Failure:", e.message);
    }
}

migrate();
