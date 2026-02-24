// FONTE DA VERDADE — Preços fixos tabelados 2025
// NÃO use diretamente no checkout de livros: use PRICING_RULES em payment.controller.ts
export const PLANS = {
    STARTER: {
        name: 'Starter - Autor Iniciante',
        monthly: { price: 19.90 },
        annual: { price: 147.90, pricePerMonth: 12.33 },
        bookPrice: {
            monthly: 28.90,
            annual: 24.90
        },
        features: {
            aiFrontMatter: false,
            marketingKit: false,
            communityAccess: false,
            prioritySupport: false,
            freeTranslations: 0,
            mentoring: false
        }
    },
    PRO: {
        name: 'Pro - Autor Best Seller',
        monthly: { price: 39.90 },
        annual: { price: 297.90, pricePerMonth: 24.83 },
        bookPrice: {
            monthly: 18.90,
            annual: 14.90
        },
        features: {
            aiFrontMatter: true,
            marketingKit: true,
            communityAccess: true,
            prioritySupport: true,
            freeTranslations: 1,
            mentoring: false
        }
    },
    BLACK: {
        name: 'Black - Editora VIP',
        monthly: { price: 79.90 },
        annual: { price: 497.90, pricePerMonth: 41.49 },
        bookPrice: {
            monthly: 9.90,
            annual: 8.90
        },
        features: {
            aiFrontMatter: true,
            marketingKit: true,
            communityAccess: true,
            prioritySupport: true,
            freeTranslations: 2,
            mentoring: true
        }
    }
};
