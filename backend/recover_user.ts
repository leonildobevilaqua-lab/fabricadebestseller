import { AsaasProvider } from './src/services/asaas.provider';
import { setVal } from './src/services/db.service';

const recoverUser = async () => {
    try {
        const email = 'contato@emaisbusiness.com.br';
        console.log(`Buscando cliente no Asaas com email: ${email}`);

        const customers = await AsaasProvider.getCustomerByEmail(email);
        if (!customers || customers.length === 0) {
            console.log("Cliente não encontrado no Asaas.");
            return;
        }

        const customer = customers[0];
        console.log("Cliente encontrado no Asaas:", customer.id, customer.name);

        console.log("Buscando pagamentos do cliente...");
        const payments = await AsaasProvider.getPayments({ customer: customer.id, limit: 100 });

        console.log(`Encontrados ${payments.data?.length || 0} pagamentos.`);

        if (payments.data) {
            for (const p of payments.data) {
                console.log(`- Pagamento ${p.id} | Valor: ${p.value} | Status: ${p.status} | Data: ${p.dateCreated}`);
            }
        }

    } catch (e: any) {
        console.error("Erro:", e?.response?.data || e.message);
    }
};

recoverUser();
