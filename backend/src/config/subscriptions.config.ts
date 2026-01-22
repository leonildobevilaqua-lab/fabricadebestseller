export const PLANS = {
    STARTER: {
        name: 'Starter - Autor Iniciante',
        price: 19.90,
        cycle: 'MONTHLY',
        baseBookPrice: 26.90,
        features: {
            aiFrontMatter: false, // Dedicatória/Agradecimentos via IA
            marketingKit: false,
            communityAccess: false,
            prioritySupport: false,
            freeTranslations: 0,
            mentoring: false
        }
    },
    PRO: {
        name: 'Pro - Autor Best Seller',
        price: 34.90,
        cycle: 'MONTHLY',
        baseBookPrice: 21.90,
        features: {
            aiFrontMatter: true,
            marketingKit: true,
            communityAccess: true, // Grupo Networking WhatsApp
            prioritySupport: true,
            freeTranslations: 1,
            mentoring: false
        }
    },
    BLACK: {
        name: 'Black - Editora VIP',
        price: 49.90,
        cycle: 'MONTHLY',
        baseBookPrice: 16.90,
        features: {
            aiFrontMatter: true,
            marketingKit: true,
            communityAccess: true, // + Discord VIP
            prioritySupport: true, // + Pessoal Dedicado
            freeTranslations: 2,
            mentoring: true // Capas, Uiclap, Amazon
        }
    }
};
