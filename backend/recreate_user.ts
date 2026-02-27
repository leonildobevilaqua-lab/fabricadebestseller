import { setVal } from './src/services/db.service';
import bcrypt from 'bcrypt';

const recreateUser = async () => {
    const email = 'contato@emaisbusiness.com.br';
    const pwd = await bcrypt.hash('123456', 10);

    const user = {
        profile: {
            name: "Contato EmaisBusiness",
            email: email,
            cpf: "",
            phone: ""
        },
        auth: { passwordHash: pwd },
        plan: {
            name: 'BLACK',
            status: 'ACTIVE',
            billing: 'monthly',
            startDate: new Date().toISOString(),
            lastPayment: new Date().toISOString(),
            subscriptionId: null
        },
        stats: { createdAt: new Date().toISOString(), purchaseCycleCount: 1 },
        orders: []
    };

    // Add 1 credit
    await setVal(`/credits/${email}`, { email, amount: 1 });

    // Update user
    await setVal(`/users/${email}`, user);

    // Create lead as subscriber
    const lead = {
        email,
        name: "Contato EmaisBusiness",
        status: "SUBSCRIBER",
        plan: user.plan
    };
    await setVal(`/leads/${email}`, lead);

    console.log("User re-created successfully!");
};
recreateUser();
