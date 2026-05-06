/**
 * meta-pixel.ts — Utilitário centralizado para Meta Pixel (Facebook Ads)
 *
 * O Pixel base (fbq init + PageView) é injetado via index.html.
 * Este módulo apenas chama fbq() de forma segura para eventos específicos.
 *
 * Deduplicação: use o mesmo eventId no CAPI backend e aqui no frontend.
 */

declare const window: any;

const safeFireEvent = (eventName: string, params: Record<string, any> = {}, eventId?: string) => {
    try {
        if (typeof window !== 'undefined' && window.fbq) {
            if (eventId) {
                window.fbq('track', eventName, params, { eventID: eventId });
            } else {
                window.fbq('track', eventName, params);
            }
        }
    } catch (e) {
        console.warn('[META PIXEL] Erro ao disparar evento:', e);
    }
};

/** Re-inicializa o Pixel com os dados de Correspondência Avançada (Advanced Matching) */
export const setAdvancedMatching = (email?: string, phone?: string) => {
    try {
        if (typeof window !== 'undefined' && window.fbq) {
            const data: any = {};
            if (email) data.em = email.toLowerCase().trim();
            if (phone) data.ph = phone.replace(/\D/g, '');
            if (Object.keys(data).length > 0) {
                window.fbq('init', '3000632083435824', data);
            }
        }
    } catch (e) {
        console.warn('[META PIXEL] Erro ao setar Advanced Matching:', e);
    }
};

/** Dispara PageView — chamar em cada mudança de rota */
export const trackPageView = () => safeFireEvent('PageView');

/** Dispara quando usuário inicia o checkout (clicou em Assinar / Gerar Livro) */
export const trackInitiateCheckout = (contentName: string, value: number, currency = 'BRL') => {
    safeFireEvent('InitiateCheckout', {
        content_name: contentName,
        value,
        currency,
        content_type: 'product'
    });
};

/** Dispara Purchase no frontend (deduplicar com CAPI via eventId da transação Asaas) */
export const trackPurchase = (value: number, currency = 'BRL', contentName = '', eventId?: string) => {
    safeFireEvent('Purchase', {
        value,
        currency,
        content_name: contentName,
        content_type: 'product'
    }, eventId);
};

/** Dispara Lead quando o usuário preenche o formulário inicial */
export const trackLead = (contentName?: string) => {
    safeFireEvent('Lead', contentName ? { content_name: contentName } : {});
};
