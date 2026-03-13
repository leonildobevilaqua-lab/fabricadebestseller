
/**
 * ExtraServices.tsx
 * Componentes para a seção de Serviços Extras da Landing Page.
 * Lógica de pagamento via Kiwify (POST /api/payment/extra-service).
 * Após pagamento, equipe contata o cliente por e-mail com detalhes.
 */
import React, { useState } from 'react';
import { useLanguage } from '../i18n/context';

// ─── TIPOS ────────────────────────────────────────────────────────────────────
interface ExtraServiceData {
    serviceId: string;
    icon: string;
    title: string;
    subtitle: string;
    price: number;
    features: readonly string[];
    accentColor: 'blue' | 'purple' | 'orange' | 'amber' | 'emerald';
}

interface BuyButtonProps {
    serviceKey: string;
    serviceName: string;
    price: number;
    label: string;
    accentClass: string;
    formData: { email: string; name: string; phone?: string };
    getApiBase: () => string;
    trackInitiateCheckout: (name: string, value: number) => void;
    href?: string;
}

// ─── MAPA DE CORES POR TEMA ───────────────────────────────────────────────────
const ACCENT_CLASSES = {
    blue: { border: 'border-blue-500/30 hover:border-blue-400/50', bg: 'from-blue-900/40', icon: 'bg-blue-500/20 border-blue-500/30', sub: 'text-blue-300', btn: 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/25' },
    purple: { border: 'border-purple-500/30 hover:border-purple-400/50', bg: 'from-purple-900/40', icon: 'bg-purple-500/20 border-purple-500/30', sub: 'text-purple-300', btn: 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/25' },
    orange: { border: 'border-orange-500/30 hover:border-orange-400/50', bg: 'from-orange-900/40', icon: 'bg-orange-500/20 border-orange-500/30', sub: 'text-orange-300', btn: 'bg-orange-500 hover:bg-orange-400 text-white shadow-orange-500/25' },
    amber: { border: 'border-amber-500/30 hover:border-amber-400/50', bg: 'from-amber-900/40', icon: 'bg-amber-500/20 border-amber-500/30', sub: 'text-amber-300', btn: 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-amber-500/25' },
    emerald: { border: 'border-emerald-500/30 hover:border-emerald-400/50', bg: 'from-emerald-900/40', icon: 'bg-emerald-500/20 border-emerald-500/30', sub: 'text-emerald-300', btn: 'bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/25' },
};

const formatCurrency = (value: number, lang: string) =>
    lang === 'en' 
        ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ─── MODAL DE COMPRA ──────────────────────────────────────────────────────────
const ExtraBuyModal: React.FC<{
    isOpen: boolean;
    serviceKey: string;
    serviceName: string;
    price: number;
    formData: { email: string; name: string; phone?: string };
    getApiBase: () => string;
    onClose: () => void;
    onTrack: (name: string, price: number) => void;
}> = ({ isOpen, serviceKey, serviceName, price, formData, getApiBase, onClose, onTrack }) => {
    const { t, lang } = useLanguage();
    const [email, setEmail] = useState(formData.email || '');
    const [name, setName] = useState(formData.name || '');
    const [phone, setPhone] = useState(formData.phone || '');
    const [loading, setLoading] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState('');
    const [error, setError] = useState('');

    const handleBuy = async () => {
        if (!email || !email.includes('@')) { setError((t as any).dashboard.extraServices.modal.emailError); return; }
        if (!name.trim()) { setError((t as any).dashboard.extraServices.modal.nameError); return; }

        setLoading(true);
        setError('');
        try {
            onTrack(serviceName, price);
            const base = getApiBase().replace(/\/$/, '');
            const res = await fetch(`${base}/api/payment/extra-service`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), name: name.trim(), phone: phone.trim(), serviceKey, lang }),
            });
            const data = await res.json();
            if (data.invoiceUrl) {
                setInvoiceUrl(data.invoiceUrl);
                window.open(data.invoiceUrl, '_blank');
            } else {
                setError(data.error || (t as any).dashboard.extraServices.modal.genError);
            }
        } catch (e) {
            setError((t as any).dashboard.extraServices.modal.connError);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
            <div
                className="bg-slate-800 border border-slate-600 rounded-3xl p-8 max-w-md w-full shadow-2xl"
                onClick={e => e.stopPropagation()}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl">✕</button>

                {!invoiceUrl ? (
                    <>
                        <div className="mb-6">
                            <p className="text-xs text-emerald-400 font-black uppercase tracking-widest mb-1">{(t as any).dashboard.extraServices.modal.selectedService}</p>
                            <h3 className="text-xl font-black text-white">{serviceName}</h3>
                            <p className="text-3xl font-black text-white mt-2">
                                {lang === 'en' ? '$' : 'R$'} <span className="text-emerald-400">{formatCurrency(price, lang)}</span>
                            </p>
                        </div>

                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                            <p className="text-emerald-300 text-sm font-semibold flex items-center gap-2">
                                {(t as any).dashboard.extraServices.modal.instruction}
                            </p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">{(t as any).dashboard.extraServices.modal.nameLabel}</label>
                                <input
                                    type="text"
                                    id={`extra-name-${serviceKey}`}
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder={(t as any).dashboard.extraServices.modal.namePlaceholder}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">{(t as any).dashboard.extraServices.modal.emailLabel}</label>
                                <input
                                    type="email"
                                    id={`extra-email-${serviceKey}`}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder={(t as any).dashboard.extraServices.modal.emailPlaceholder}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                            <div>
                                <label className="block text-slate-400 text-xs uppercase tracking-widest mb-1 font-bold">{(t as any).dashboard.extraServices.modal.phoneLabel}</label>
                                <input
                                    type="tel"
                                    id={`extra-phone-${serviceKey}`}
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="(11) 99999-9999"
                                    className="w-full bg-slate-900 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-900/30 border border-red-500/30 rounded-xl p-3 mb-4">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <button
                            id={`btn-comprar-${serviceKey}`}
                            onClick={handleBuy}
                            disabled={loading}
                            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-600 text-slate-900 font-black py-4 rounded-xl text-lg transition-all shadow-lg shadow-emerald-500/25 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            {loading ? (t as any).dashboard.extraServices.modal.genInvoice : (t as any).dashboard.extraServices.modal.payButton.replace('{price}', formatCurrency(price, lang))}
                        </button>
                        <p className="text-center text-xs text-slate-500 mt-3">{(t as any).dashboard.extraServices.modal.securePayment}</p>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">✅</div>
                        <h3 className="text-2xl font-black text-white mb-3">{(t as any).dashboard.extraServices.modal.invoiceGenTitle}</h3>
                        <p className="text-slate-400 mb-6 leading-relaxed" 
                           dangerouslySetInnerHTML={{ __html: (t as any).dashboard.extraServices.modal.invoiceGenDesc.replace('{email}', email) }} />
                        <a
                            href={invoiceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full block bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-xl text-lg transition-all mb-3"
                        >
                            {(t as any).dashboard.extraServices.modal.accessLink}
                        </a>
                        <button onClick={onClose} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all">
                            {(t as any).dashboard.extraServices.modal.close}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── BOTÃO DE COMPRA (com modal embutido) ─────────────────────────────────────
export const ExtraServiceBuyButton: React.FC<BuyButtonProps> = ({
    serviceKey, serviceName, price, label, accentClass, formData, getApiBase, trackInitiateCheckout, href
}) => {
    const [modalOpen, setModalOpen] = useState(false);

    return (
        <>
            {href ? (
                <a
                    id={`link-extra-${serviceKey}`}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className={`w-full font-black py-4 rounded-xl text-lg transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] text-center flex items-center justify-center ${accentClass}`}
                >
                    {label}
                </a>
            ) : (
                <button
                    id={`btn-extra-${serviceKey}`}
                    onClick={() => setModalOpen(true)}
                    className={`w-full font-black py-4 rounded-xl text-lg transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] ${accentClass}`}
                >
                    {label}
                </button>
            )}

            <ExtraBuyModal
                isOpen={modalOpen}
                serviceKey={serviceKey}
                serviceName={serviceName}
                price={price}
                formData={formData}
                getApiBase={getApiBase}
                onClose={() => setModalOpen(false)}
                onTrack={trackInitiateCheckout}
            />
        </>
    );
};

// ─── CARD DE SERVIÇO ──────────────────────────────────────────────────────────
export const ExtraServiceCard: React.FC<ExtraServiceData & {
    formData: { email: string; name: string; phone?: string };
    getApiBase: () => string;
    trackInitiateCheckout: (name: string, value: number) => void;
    href?: string;
}> = ({ serviceId, icon, title, subtitle, price, features, accentColor, formData, getApiBase, trackInitiateCheckout, href }) => {
    const { t, lang } = useLanguage();
    const [modalOpen, setModalOpen] = useState(false);
    const acc = ACCENT_CLASSES[accentColor] || ACCENT_CLASSES.blue;

    return (
        <>
            <div className={`relative bg-gradient-to-br ${acc.bg} to-slate-800/60 border ${acc.border} rounded-2xl p-6 flex flex-col transition-all h-full`}>
                <div className="flex items-start gap-4 mb-5">
                    <div className={`w-14 h-14 ${acc.icon} border rounded-xl flex items-center justify-center text-2xl flex-shrink-0`}>
                        {icon}
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-white leading-tight">{title}</h4>
                        <p className={`text-xs font-medium leading-relaxed mt-0.5 ${acc.sub}`}>{subtitle}</p>
                    </div>
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                    {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-slate-300 text-xs leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0 mt-1.5"></span>
                            {f}
                        </li>
                    ))}
                </ul>

                <div className="bg-slate-950/60 rounded-xl p-4 mb-4 border border-white/5">
                    <div className="flex items-baseline gap-1">
                        <span className="text-slate-500 text-sm">{lang === 'en' ? '$' : 'R$'}</span>
                        <span className="text-3xl font-black text-white">{formatCurrency(price, lang)}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{(t as any).dashboard.extraServices.card.oneTime}</p>
                </div>

                {href ? (
                    <a
                        id={`link-card-${serviceId}`}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className={`w-full font-black py-4 rounded-xl text-center text-sm transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center ${acc.btn}`}
                    >
                        {(t as any).dashboard.extraServices.card.hire.replace('{price}', formatCurrency(price, lang))}
                    </a>
                ) : (
                    <button
                        id={`btn-card-${serviceId}`}
                        onClick={() => setModalOpen(true)}
                        className={`w-full font-black py-4 rounded-xl text-sm transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] ${acc.btn}`}
                    >
                        {(t as any).dashboard.extraServices.card.hire.replace('{price}', formatCurrency(price, lang))}
                    </button>
                )}
            </div>

            <ExtraBuyModal
                isOpen={modalOpen}
                serviceKey={serviceId}
                serviceName={title}
                price={price}
                formData={formData}
                getApiBase={getApiBase}
                onClose={() => setModalOpen(false)}
                onTrack={trackInitiateCheckout}
            />
        </>
    );
};
