
import { setVal, getVal } from './src/services/db.service';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function fixUser() {
    const email = 'emaisbusinesoficial@gmail.com';
    const safeEmail = email.toLowerCase().trim().replace(/[^a-zA-Z0-9]/g, '_');

    console.log(`Fixing user in KV STORE: ${email} -> ${safeEmail}`);

    // 1. Grant Credit in /credits/email
    await setVal(`/credits/${safeEmail}`, 1);
    console.log(`Granted 1 credit to /credits/${safeEmail}`);

    // 2. Also update /users/email/bookCredits for redundancy
    const user = await getVal(`/users/${safeEmail}`);
    if (user) {
        user.bookCredits = 1;
        await setVal(`/users/${safeEmail}`, user);
        console.log(`Updated bookCredits in /users/${safeEmail}`);
    } else {
        console.log(`User profile not found in /users/${safeEmail}, skipping profile update.`);
    }

    process.exit(0);
}

fixUser();
