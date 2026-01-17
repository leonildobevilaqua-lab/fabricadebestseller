import { setVal } from '../services/db.service';

const run = async () => {
    try {
        console.log("Setting Payment Bypass to FALSE...");
        await setVal('/settings/payment_bypass', false);
        console.log("Bypass Disabled Successfully.");
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
};

run();
