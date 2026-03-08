
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUser() {
    const email = 'emaisbusinesoficial@gmail.com';
    console.log(`Fixing user: ${email}`);

    // 1. Give Credit
    const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (userError || !user) {
        console.log("User not found in DB, creating user record...");
        const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
                email,
                name: 'Cliente Kiwify',
                credits: 1,
                plan_status: 'ACTIVE',
                plan_type: 'BLACK', // Giving a high plan to ensure R$ 39.90 logic applies if needed
                provider: 'KIWIFY'
            }])
            .select()
            .single();

        if (createError) console.error("Error creating user:", createError);
        else console.log("User created with 1 credit.");
    } else {
        const { error: updateError } = await supabase
            .from('users')
            .update({
                credits: (user.credits || 0) + 1,
                plan_status: 'ACTIVE',
                plan_type: 'BLACK'
            })
            .eq('email', email);

        if (updateError) console.error("Error updating user:", updateError);
        else console.log("User updated with +1 credit and ACTIVE status.");
    }
}

fixUser();
