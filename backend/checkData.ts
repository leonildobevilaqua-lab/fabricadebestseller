import { getVal } from './src/services/db.service';

const checkData = async () => {
    try {
        const users = await getVal('/users') || [];
        const leads = await getVal('/leads') || [];
        const orders = await getVal('/orders') || [];

        console.log("Users count:", users.length);
        console.log("Leads count:", leads.length);
        console.log("Orders count:", orders.length);

        const contato = users.find(u => u.email === 'contato@emaisbusiness.com.br');
        console.log("User contato@emaisbusiness.com.br:", contato);

    } catch (e) {
        console.error(e);
    }
};

checkData();
