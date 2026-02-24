import crypto from 'crypto';
import axios from 'axios';

// --- Configuração via .env ---
const PIXEL_ID = process.env.META_PIXEL_ID || '';
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || '';
const CAPI_URL = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events`;

// --- Helpers ---
const sha256 = (value: string): string =>
    crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');

const normalizePhone = (phone: string): string =>
    phone.replace(/\D/g, '').replace(/^0/, '');

// --- Tipos ---
interface PurchasePayload {
    eventId: string;       // ID da transação Asaas (deduplicação)
    email: string;
    phone?: string;
    value: number;
    currency?: string;
    contentName: string;   // Ex: 'Plano STARTER Mensal' | 'Livro Avulso'
    clientIp?: string;
    clientUserAgent?: string;
    fbc?: string;          // Facebook Click ID (_fbc cookie)
    fbp?: string;          // Facebook Browser ID (_fbp cookie)
}

// --- Envio do evento Purchase via CAPI ---
export const sendPurchaseEvent = async (payload: PurchasePayload): Promise<void> => {
    if (!PIXEL_ID || !ACCESS_TOKEN) {
        console.warn('[META CAPI] META_PIXEL_ID ou META_ACCESS_TOKEN não configurados. Evento NÃO enviado.');
        return;
    }

    const eventTime = Math.floor(Date.now() / 1000);

    // Dados do usuário com hash SHA256 (requisito GDPR/LGPD da Meta)
    const userData: Record<string, any> = {
        em: [sha256(payload.email)],
    };

    if (payload.phone) {
        const cleanPhone = normalizePhone(payload.phone);
        if (cleanPhone.length >= 10) userData.ph = [sha256(cleanPhone)];
    }

    if (payload.clientIp) userData.client_ip_address = payload.clientIp;
    if (payload.clientUserAgent) userData.client_user_agent = payload.clientUserAgent;
    if (payload.fbc) userData.fbc = payload.fbc;
    if (payload.fbp) userData.fbp = payload.fbp;

    const event = {
        event_name: 'Purchase',
        event_time: eventTime,
        event_id: payload.eventId,    // Para deduplicação com o pixel frontend
        action_source: 'website',
        user_data: userData,
        custom_data: {
            value: payload.value,
            currency: payload.currency || 'BRL',
            content_name: payload.contentName,
            content_type: 'product',
        }
    };

    try {
        const response = await axios.post(
            CAPI_URL,
            {
                data: [event],
                test_event_code: process.env.META_TEST_EVENT_CODE || undefined
            },
            {
                params: { access_token: ACCESS_TOKEN },
                timeout: 5000
            }
        );
        console.log(`[META CAPI] ✅ Purchase enviado | ID: ${payload.eventId} | R$ ${payload.value} | ${payload.contentName}`);
        if (response.data?.events_received !== undefined) {
            console.log(`[META CAPI] events_received: ${response.data.events_received}`);
        }
    } catch (err: any) {
        // Falha silenciosa — não deve quebrar o fluxo de pagamento
        console.error('[META CAPI] ❌ Falha ao enviar evento:', err?.response?.data || err.message);
    }
};
