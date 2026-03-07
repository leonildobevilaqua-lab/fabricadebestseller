import { getVal } from './src/services/db.service';

async function checkJota() {
    const orders = await getVal('/orders');
    for (const o of Object.values(orders || {})) {
        if (JSON.stringify(o).includes('jota-erre')) {
            console.log(o);
        }
    }
}
checkJota().then(() => process.exit(0)).catch(console.error);
