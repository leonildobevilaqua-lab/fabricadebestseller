
import React, { useEffect, useState } from 'react';
import { PenTool, Download, Star, CheckCircle, Clock, MessageCircle, ExternalLink } from 'lucide-react';
import { SocialShare } from './SocialShare';
import { getApiBase } from '../services/api';
import { ExtraServiceCard, ExtraServiceBuyButton } from './ExtraServices';
import Disclaimer from './Disclaimer';
import { useLanguage } from '../i18n/context';

// Inline Icons fallback
const IconBook = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
const IconStar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>;

interface DashboardProps {
    user: any;
    onNewBook: () => void;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNewBook, onLogout }) => {
    const { t, lang } = useLanguage();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [hasCredits, setHasCredits] = useState(false);
    const [pendingInvoice, setPendingInvoice] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
    const [products, setProducts] = useState<any>({});
    
    // Password Change States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg] = useState({ type: '', text: '' });

    // FUNÇÃO 1: REDIRECIONA PARA CHECKOUT TICTO
    const handleBuyCredit = async (price: number) => {
        try {
            setLoading(true);
            setIsPurchasing(true); // Manter UI em "Waiting"

            let checkoutUrl = `https://payment.ticto.app/O6CE296D4?email=${encodeURIComponent(user.email)}`;
            
            // International checkout link provided in prompt
            if (lang === 'en' && Math.abs(price - 39.90) < 0.1) {
                checkoutUrl = `https://pay.kiwify.com/DdposAY?email=${encodeURIComponent(user.email)}`;
            }

            const win = window.open(checkoutUrl, '_blank');

            if (!win) alert(lang === 'en' ? "Please allow popups to open the payment page." : "Por favor, permita popups para abrir o pagamento.");
        } catch (error) {
            alert(lang === 'en' ? 'Error trying to open checkout.' : 'Erro ao tentar abrir o checkout.');
            setIsPurchasing(false);
        } finally {
            setLoading(false);
        }
    };

    // FUNÇÃO 2: VERIFICA SE O DINHEIRO CAIU E LIBERA O ACESSO
    const handleVerifyAndEnter = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${getApiBase()}/api/payment/access?email=${user.email}`);
            const data = await res.json();

            if (data.latestInvoiceStatus === 'PENDING' || data.latestInvoiceStatus === 'OVERDUE') {
                setPendingInvoice(true);
                setInvoiceUrl(data.invoiceUrl);
            } else {
                setPendingInvoice(false);
            }

            if (data.hasAccess && (data.credits > 0 || data.hasActiveProject)) {
                setHasCredits(data.credits > 0);
                if (data.credits > 0 || data.hasActiveProject) {
                    onNewBook();
                } else {
                    onNewBook();
                }
            } else {
                setHasCredits(false);
                if (data.latestInvoiceStatus === 'PENDING' || data.latestInvoiceStatus === 'OVERDUE') {
                    const msg = lang === 'en' 
                        ? `Invoice ${data.latestInvoiceNumber || ''} is still pending at the bank. Please wait for processing or complete the payment.` 
                        : `A fatura ${data.latestInvoiceNumber || ''} ainda consta como pendente no banco. Aguarde a compensação ou realize o pagamento.`;
                    alert(msg);
                    if (data.invoiceUrl) window.open(data.invoiceUrl, '_blank');
                } else {
                    alert(lang === 'en' 
                        ? '⚠️ No available credits found. If you just paid, please wait a moment and check again.' 
                        : '⚠️ Não identificamos créditos disponíveis. Se você acabou de pagar, aguarde alguns instantes e verifique novamente.');
                }
            }
        } catch (error) {
            console.error(error);
            alert(lang === 'en' ? "Error verifying status." : "Erro ao verificar status.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setPassMsg({ type: '', text: '' });

        if (newPass !== confirmPass) {
            return setPassMsg({ type: 'error', text: lang === 'en' ? "Passwords do not match." : "As senhas não coincidem." });
        }
        if (newPass.length < 6) {
            return setPassMsg({ type: 'error', text: lang === 'en' ? "New password must be at least 6 characters." : "A nova senha deve ter pelo menos 6 caracteres." });
        }

        setPassLoading(true);
        try {
            const token = localStorage.getItem('bsf_token');
            const res = await fetch(`${getApiBase()}/api/user/update-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
            });

            const data = await res.json();
            if (res.ok) {
                setPassMsg({ type: 'success', text: lang === 'en' ? "Password changed successfully!" : "Senha alterada com sucesso!" });
                setTimeout(() => {
                    setShowPasswordModal(false);
                    setCurrentPass('');
                    setNewPass('');
                    setConfirmPass('');
                    setPassMsg({ type: '', text: '' });
                }, 2000);
            } else {
                setPassMsg({ type: 'error', text: data.error || (lang === 'en' ? "Error updating password." : "Erro ao atualizar senha.") });
            }
        } catch (e) {
            console.error("Update Pass Error", e);
            setPassMsg({ type: 'error', text: lang === 'en' ? "Connection error." : "Erro de conexão." });
        } finally {
            setPassLoading(false);
        }
    };

    useEffect(() => {
        // Fetch User Stats AND Payment Status on mount
        const fetchMe = async () => {
            try {

                const token = localStorage.getItem('bsf_token');
                const headers: any = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                // Parallel fetch
                const [meRes, resPayment] = await Promise.all([
                    fetch(`${getApiBase()}/api/user/me?email=${user.email}`, { headers }),
                    fetch(`${getApiBase()}/api/payment/access?email=${user.email}`)
                ]);

                if (meRes.ok) {
                    const meData = await meRes.json();
                    if (meData.profile || meData.orders) {
                        setStats(meData);
                    }
                }

                // --- FETCH PUBLIC CONFIG (Kiwify Links) ---
                const configRes = await fetch(`${getApiBase()}/api/payment/public-config`);
                const configData = await configRes.json();
                if (configData.productLinks) {
                    setProducts(configData.productLinks);
                }

                if (resPayment.ok) {
                    const payData = await resPayment.json();
                    if (payData.credits > 0) setHasCredits(true);
                    else setHasCredits(false);

                    if (payData.latestInvoiceStatus === 'PENDING' || payData.latestInvoiceStatus === 'OVERDUE') {
                        setPendingInvoice(true);
                        setInvoiceUrl(payData.invoiceUrl);
                    } else {
                        setPendingInvoice(false);
                    }
                }
            } catch (e) {
                console.error("Failed to fetch dashboard stats", e);
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, [user.email]);

    // Auto-Polling DISABLED for strict manual validation
    /*
    useEffect(() => {
        let interval: any = null;
    
        if (isPurchasing) {
             // ... polling logic removed ...
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isPurchasing, user?.email, onNewBook]);
    */

    const handleDeleteProject = async (projectId: string) => {
        if (!window.confirm((t as any).dashboard.confirmDelete)) return;

        try {
            const getApiBase = () => {
                const env = (import.meta as any).env.VITE_API_URL;
                if (env) return env;
                const host = window.location.hostname;
                if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005';
                return 'https://api.fabricadebestseller.com.br';
            };

            const token = localStorage.getItem('bsf_token');
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${getApiBase()}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                // Re-fetch stats to update list
                const resUser = await fetch(`${getApiBase()}/api/user/me?email=${user.email}`, { headers });
                const dataUser = await resUser.json();
                setStats(dataUser);
            } else {
                alert(lang === 'en' ? 'Error deleting project.' : 'Erro ao excluir projeto.');
            }
        } catch (e) {
            console.error('Delete error', e);
            alert(lang === 'en' ? 'Communication failure.' : 'Falha na comunicação.');
        }
    };

    const planName = stats?.plan?.name || "FREE";
    const planStatus = stats?.plan?.status || "INACTIVE";
    const billing = stats?.plan?.billing || 'monthly';
    const cycleCount = stats?.stats?.purchaseCycleCount || 0;
    const orders = stats?.orders || [];

    // --- PRICING REFORMULADO (FIXED PRICE PER PLAN) ---
    let currentFixedPrice = 39.90; // Default Avulso (Single Purchase)

    // ONLY APPLY DISCOUNTS IF PLAN IS ACTIVE
    if (planStatus === 'ACTIVE') {
        if (planName.includes('STARTER')) {
            currentFixedPrice = (billing === 'annual' || billing === 'anual') ? 24.90 : 28.90;
        } else if (planName.includes('PRO')) {
            currentFixedPrice = (billing === 'annual' || billing === 'anual') ? 14.90 : 18.90;
        } else if (planName.includes('BLACK')) {
            currentFixedPrice = (billing === 'annual' || billing === 'anual') ? 8.90 : 9.90;
        }
    }

    const nextBookDisplayPrice = stats?.stats?.nextBookPrice || currentFixedPrice;

    // Filter out CREDIT_AVAILABLE entries (they are purchased credits, not generated books)
    // These are placeholders created by the payment reconciliation system and must NOT appear as "books"
    const displayOrders = orders.filter((o: any) => o.status !== 'CREDIT_AVAILABLE');

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                            <IconBook />
                        </div>
                        <span className="font-serif font-bold text-xl text-slate-800 hidden md:block">{(t as any).dashboard.factoryName}</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-2 hidden sm:block">
                            <p className="text-xs text-slate-400 font-bold uppercase">{(t as any).dashboard.welcome}</p>
                            <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border 
                            ${planName === 'BLACK' ? 'bg-slate-900 text-yellow-500 border-yellow-500' :
                                planName === 'PRO' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                    'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {planName}
                            {planStatus !== 'ACTIVE' && planName !== 'FREE' && <span className="ml-1 opacity-60">{(t as any).dashboard.statusInactive}</span>}
                        </div>
                        <button
                            onClick={() => setShowPasswordModal(true)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition"
                            title={lang === 'en' ? "Change Password" : "Alterar Senha"}
                        >
                            <span className="text-xl">⚙️</span>
                        </button>
                        <button
                            onClick={onLogout}
                            className="text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-widest border border-red-200 hover:border-red-400 px-3 py-1 rounded-full transition"
                        >
                            {(t as any).dashboard.logout}
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Action Card - Fixed Price */}
                <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl md:text-3xl font-black mb-4 flex items-center justify-center md:justify-start gap-3">
                                <span className="text-emerald-400"><IconBook /></span>
                                {(t as any).dashboard.generatorTitle}
                            </h2>
                            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                                {hasCredits ? (
                                    (t as any).dashboard.creditAvailable
                                ) : (
                                    <>
                                        {(t as any).dashboard.currentMode} <strong>{planStatus === 'ACTIVE' ? planName : (t as any).dashboard.modeAvulso}</strong>.
                                        {(t as any).dashboard.feeLabel}
                                        <span className="text-white font-bold mx-1">
                                            {lang === 'en' ? '$' : 'R$'} {lang === 'en' ? nextBookDisplayPrice.toFixed(2) : nextBookDisplayPrice.toFixed(2).replace('.', ',')}
                                        </span>
                                        {lang === 'en' ? 'Leverage the power of AI to create your library right now.' : 'Aproveite o poder da IA para criar sua biblioteca agora mesmo.'}
                                    </>
                                )}
                            </p>
                        </div>

                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 w-full md:w-auto min-w-[300px]">
                            {hasCredits ? (
                                <div className="flex flex-col gap-4">
                                    <div className="text-center mb-2">
                                        <div className="inline-block p-3 bg-emerald-500/20 rounded-full mb-2 animate-bounce">
                                            <span className="text-2xl">✨</span>
                                        </div>
                                        <p className="text-xs text-emerald-400 uppercase font-bold tracking-widest">{(t as any).dashboard.accessReleased}</p>
                                    </div>
                                    <button
                                        onClick={onNewBook}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black py-6 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-2xl shadow-emerald-500/40 transform hover:scale-[1.05] active:scale-95 group"
                                    >
                                        <span className="text-2xl group-hover:animate-pulse">{(t as any).dashboard.generateButton}</span>
                                        <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">{(t as any).dashboard.clickToUseCredit}</span>
                                    </button>
                                </div>
                            ) : pendingInvoice ? (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="inline-block p-3 bg-yellow-500/20 text-yellow-500 rounded-full mb-2 animate-pulse">
                                            <Clock size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-yellow-400">{(t as any).dashboard.waitingPayment}</p>
                                        <p className="text-xs text-slate-400 mt-2">{(t as any).dashboard.waitInvoice}</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleVerifyAndEnter}
                                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-600"
                                        >
                                            <CheckCircle size={18} /> {(t as any).dashboard.refreshStatus}
                                        </button>
                                        {invoiceUrl && (
                                            <a
                                                href={invoiceUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full text-center text-xs text-slate-400 hover:text-white underline mt-2"
                                            >
                                                {(t as any).dashboard.payNow}
                                            </a>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{lang === 'en' ? 'Generation Cost' : 'Custo da Geração'}</p>
                                        <div className="text-4xl font-black text-white">{lang === 'en' ? '$' : 'R$'} {lang === 'en' ? nextBookDisplayPrice.toFixed(2) : nextBookDisplayPrice.toFixed(2).replace('.', ',')}</div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => handleBuyCredit(nextBookDisplayPrice)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-lg"
                                        >
                                            <span>🛒</span> {(t as any).dashboard.buyCredit}
                                        </button>

                                        <button
                                            onClick={handleVerifyAndEnter}
                                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-600"
                                        >
                                            <CheckCircle size={18} /> {(t as any).dashboard.alreadyPaid}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {/* LEGACY BANNER: For users who are still active subscribers */}
                    {planStatus === 'ACTIVE' && planName !== 'FREE' && (
                        <div className="mt-8 pt-6 border-t border-slate-700/50">
                            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-start md:items-center gap-4">
                                <span className="text-3xl">⚠️</span>
                                <div>
                                    <h4 className="text-yellow-500 font-bold mb-1">{(t as any).dashboard.legacyWarning}</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        {lang === 'en' ? `As a founding subscriber, you have the guaranteed right to generate new books at the promotional price of <strong>$ ${nextBookDisplayPrice.toFixed(2)}</strong> while your current <strong>${planName}</strong> subscription is kept active. Enjoy!` : `Como assinante fundador, você tem o direito garantido de gerar novos livros pelo valor promocional de <strong>R$ ${nextBookDisplayPrice.toFixed(2).replace('.', ',')}</strong> enquanto sua assinatura atual <strong>${planName}</strong> for mantida ativa. Aproveite!` }
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* WHATSAPP VIP GROUP INVITATION */}
                <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6 text-center md:text-left flex-col md:flex-row flex-1">
                            <div className="bg-[#25D366] text-white p-5 rounded-3xl shadow-lg shadow-emerald-500/30 transform group-hover:rotate-6 transition-transform">
                                <MessageCircle size={36} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">{(t as any).dashboard.communityTitle}</h3>
                                <p className="text-slate-500 max-w-xl leading-relaxed font-semibold">
                                    {lang === 'en' ? "Don't be left out! Join our WhatsApp group now and receive privileged information, lightning deals, strategic guidance and weekly freebies exclusive to our members." : "Não fique de fora! Entre agora no nosso grupo de WhatsApp e receba informações privilegiadas, promoções relâmpago, orientações estratégicas e brindes semanais exclusivos para nossos membros."}
                                </p>
                            </div>
                        </div>

                        <a
                            href="https://chat.whatsapp.com/GZrrpmLXD91J5lAjhgv9Jr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-black px-8 py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm hover:scale-105 active:scale-95"
                        >
                            <span>{(t as any).dashboard.joinGroup}</span>
                            <ExternalLink size={18} />
                        </a>
                    </div>
                </div>

                {/* [NEW] VIDEO SECTION */}
                <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl overflow-hidden">
                    <div className="text-center mb-8">
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                            {(t as any).dashboard.videoTitle}
                        </h3>
                    </div>
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-200">
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src="https://www.youtube.com/embed/uBvagSevkaI"
                            title={lang === 'en' ? "Instructional Video" : "Vídeo de Instruções"}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>



                {/* History (Meus Livros) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">{(t as any).dashboard.myBooks}</h3>
                        <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                            {displayOrders.length} {(t as any).dashboard.projectsCount}
                        </span>
                    </div>

                    {displayOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="mb-4 opacity-50"><IconBook /></div>
                            <p>{(t as any).dashboard.noBooks}</p>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-indigo-600 font-bold hover:underline mt-2">{(t as any).dashboard.startNow}</button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {displayOrders.map((order: any, idx: number) => (
                                <div key={order.id || `book-${idx}`} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-16 bg-slate-200 rounded flex-shrink-0 flex items-center justify-center text-2xl shadow-sm">
                                            📚
                                        </div>
                                        <div translate="no">
                                            <h4 className="font-bold text-slate-800">
                                                <span className="text-xs text-slate-500 font-normal block mb-1">{(t as any).dashboard.bookTitleLabel}</span>
                                                {order.title || (t as any).dashboard.bookTitleFallback}
                                            </h4>
                                            <p className="text-sm text-slate-600 font-medium mt-1">
                                                <span className="text-slate-400 font-normal">{(t as any).dashboard.authorLabel}</span> {order.authorName || 'Autor'}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-1">
                                                <span className="text-slate-400 font-normal">{(t as any).dashboard.creationDate}:</span> {order.date ? new Date(order.date).toLocaleDateString() : (t as any).dashboard.dateUnknown}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY'].includes(order.status)) ? 'bg-green-100 text-green-700' :
                                            (order.status === 'IN_PROGRESS' || order.status === 'WRITING_CHAPTERS') ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY'].includes(order.status)) ? (t as any).dashboard.statusGenerated :
                                                (order.status === 'IN_PROGRESS' || order.status === 'WRITING_CHAPTERS') ? (t as any).dashboard.statusProcessing :
                                                    (t as any).dashboard.statusWaiting}
                                        </span>
                                        {(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY'].includes(order.status)) && order.downloadUrl && (
                                            <a
                                                href={order.downloadUrl.startsWith('http') ? order.downloadUrl : `${getApiBase()}${order.downloadUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-medium text-sm shadow-lg shadow-indigo-200"
                                                title={(t as any).dashboard.downloadKit}
                                            >
                                                <IconDownload />
                                                <span className="hidden sm:inline">{(t as any).dashboard.downloadKit}</span>
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleDeleteProject(order.id)}
                                            className="flex items-center gap-2 px-4 py-2 text-rose-600 border border-rose-200 rounded-xl hover:bg-rose-50 transition-all font-medium text-sm"
                                            title={(t as any).dashboard.deleteProject}
                                        >
                                            <IconTrash />
                                            <span className="hidden sm:inline">{(t as any).dashboard.deleteProject}</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* AFILIADOS - PASTA SECRETA (COPIE E COLE) */}
                <div className="mb-12 bg-[#050b1a] border-2 border-blue-500/30 rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
                        <div>
                            <span className="inline-block bg-blue-600/10 text-blue-400 text-[10px] font-black px-4 py-2 rounded-full border border-blue-500/20 uppercase tracking-widest mb-4">
                                {(t as any).dashboard.affiliate.tag}
                            </span>
                            <h2 className="text-3xl font-black text-white mb-4 uppercase tracking-tighter leading-tight italic">
                                <span className="text-blue-500">{(t as any).dashboard.affiliate.title}</span> <br />
                                {(t as any).dashboard.affiliate.subtitle}
                            </h2>
                            <p className="text-slate-400 text-lg mb-8 leading-relaxed font-medium">
                                {(t as any).dashboard.affiliate.desc}
                            </p>
                            <a
                                href={lang === 'en' ? "https://pay.kiwify.com/DdposAY" : "https://pay.kiwify.com.br/eAZIvMi"}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-3 bg-[#d4af37] hover:bg-yellow-400 text-black font-black uppercase py-4 px-8 rounded-xl shadow-lg shadow-yellow-500/20 transition-all transform hover:scale-105 active:scale-98"
                            >
                                {(t as any).dashboard.affiliate.button} <ExternalLink size={20} />
                            </a>
                        </div>
                        <div className="aspect-video bg-black rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl">
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/qyZ5F1oZJyg"
                                title={(t as any).dashboard.affiliate.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>

                {/* Extra Services Section (Re-implemented with Landing Page Design) */}
                <ExtraServiceSection formData={{ email: user?.email, name: user?.name, phone: user?.phone }} products={products} />

                <div className="pt-8 border-t border-slate-200">
                    <SocialShare
                        text={lang === 'en' ? "I'm creating amazing books with AI! Check out Best Seller Factory." : "Estou criando livros incríveis com Inteligência Artificial! Conheça a Fábrica de Best Sellers."}
                        className="opacity-70 hover:opacity-100 transition-opacity"
                    />
                </div>

            </main>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600"></div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900 uppercase">{(lang === 'en' ? "Security Settings" : "Segurança")}</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'en' ? "Current Password" : "Senha Atual"}</label>
                                <input 
                                    type="password" 
                                    value={currentPass}
                                    onChange={e => setCurrentPass(e.target.value)}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'en' ? "New Password" : "Nova Senha"}</label>
                                <input 
                                    type="password" 
                                    value={newPass}
                                    onChange={e => setNewPass(e.target.value)}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{lang === 'en' ? "Confirm New Password" : "Confirmar Nova Senha"}</label>
                                <input 
                                    type="password" 
                                    value={confirmPass}
                                    onChange={e => setConfirmPass(e.target.value)}
                                    required
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                                />
                            </div>

                            {passMsg.text && (
                                <div className={`p-4 rounded-xl text-sm font-bold ${passMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {passMsg.text}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                disabled={passLoading}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl transition shadow-lg shadow-indigo-100 disabled:opacity-50"
                            >
                                {passLoading ? (lang === 'en' ? "Updating..." : "Atualizando...") : (lang === 'en' ? "Update Password" : "Alterar Senha")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- [RE-IMPLEMENTED] EXTRA SERVICE SECTION (LANDING PAGE STYLE) ---
const ExtraServiceSection = ({ formData, products }: { formData: any, products: any }) => {
    const { t, lang } = useLanguage();
    return (
        <section className="py-12 bg-slate-950 rounded-[40px] relative overflow-hidden shadow-2xl border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

            <div className="relative max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                    <span className="inline-block bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-widest mb-4">
                        {(t as any).dashboard.extraServices.title}
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tight">
                        {(t as any).dashboard.extraServices.subtitle}
                    </h2>
                    <p className="text-slate-500 text-sm max-w-2xl mx-auto font-medium">
                        {(t as any).dashboard.extraServices.desc}
                    </p>
                </div>

                {/* ── TRADUÇÃO ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center text-sm">🌍</div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{(t as any).dashboard.extraServices.translation}</h3>
                        <div className="flex-1 h-px bg-blue-500/20"></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { key: 'livro-ingles', icon: '🇺🇸', title: (t as any).dashboard.extraServices.items.engBook.title, subtitle: (t as any).dashboard.extraServices.items.engBook.subtitle, price: lang === 'en' ? 4.90 : 24.99, features: (t as any).dashboard.extraServices.items.engBook.features, href: products.trans_en },
                            { key: 'livro-espanhol', icon: '🇪🇸', title: (t as any).dashboard.extraServices.items.espBook.title, subtitle: (t as any).dashboard.extraServices.items.espBook.subtitle, price: lang === 'en' ? 4.90 : 24.99, features: (t as any).dashboard.extraServices.items.espBook.features, href: products.trans_es },
                        ].map(svc => (
                            <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc as any} accentColor="blue" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={() => { }} />
                        ))}
                    </div>
                </div>

                {/* ── DESIGN DE CAPA ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center text-sm">🎨</div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{(t as any).dashboard.extraServices.coverDesign}</h3>
                        <div className="flex-1 h-px bg-purple-500/20"></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { key: 'capa-impressa', icon: '📗', title: (t as any).dashboard.extraServices.items.printCover.title, subtitle: (t as any).dashboard.extraServices.items.printCover.subtitle, price: lang === 'en' ? 49.90 : 250.00, features: (t as any).dashboard.extraServices.items.printCover.features, href: products.cover_card },
                            { key: 'capa-digital', icon: '📱', title: (t as any).dashboard.extraServices.items.digitalCover.title, subtitle: (t as any).dashboard.extraServices.items.digitalCover.subtitle, price: lang === 'en' ? 29.90 : 149.90, features: (t as any).dashboard.extraServices.items.digitalCover.features, href: products.cover_ebook },
                        ].map(svc => (
                            <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc as any} accentColor="purple" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={() => { }} />
                        ))}
                    </div>
                </div>

                {/* ── PUBLICAÇÃO ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center text-sm">🚀</div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{(t as any).dashboard.extraServices.publication}</h3>
                        <div className="flex-1 h-px bg-orange-500/20"></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {[
                            { key: 'amazon-impresso', icon: '📦', title: (t as any).dashboard.extraServices.items.amazonPub.title + ' — ' + (lang === 'en' ? 'Print' : 'Impresso'), subtitle: (t as any).dashboard.extraServices.items.amazonPub.subtitle, price: lang === 'en' ? 14.90 : 69.90, features: (t as any).dashboard.extraServices.items.amazonPub.features, href: products.pub_amazon_printed },
                            { key: 'amazon-digital', icon: '📲', title: (t as any).dashboard.extraServices.items.amazonPub.title + ' — ' + (lang === 'en' ? 'Digital' : 'Digital'), subtitle: (t as any).dashboard.extraServices.items.amazonPub.subtitle, price: lang === 'en' ? 12.90 : 59.90, features: (t as any).dashboard.extraServices.items.amazonPub.features, href: products.pub_amazon_digital },
                            { key: 'uiclap-impresso', icon: '🇧🇷', title: (t as any).dashboard.extraServices.items.shelfPub.title + ' — ' + (lang === 'en' ? 'Print' : 'Impresso'), subtitle: (t as any).dashboard.extraServices.items.shelfPub.subtitle, price: lang === 'en' ? 12.90 : 59.90, features: (t as any).dashboard.extraServices.items.shelfPub.features, href: products.pub_uiclap },
                        ].map(svc => (
                            <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc as any} accentColor="orange" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={() => { }} />
                        ))}
                    </div>
                </div>

                {/* ── REGISTROS LEGAIS ── */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center text-sm">📋</div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">{(t as any).dashboard.extraServices.legal}</h3>
                        <div className="flex-1 h-px bg-amber-500/20"></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {[
                            { key: 'ficha-catalografica', icon: '🗂️', title: (t as any).dashboard.extraServices.items.cataloging.title, subtitle: (t as any).dashboard.extraServices.items.cataloging.subtitle, price: lang === 'en' ? 12.90 : 59.90, features: (t as any).dashboard.extraServices.items.cataloging.features, href: products.catalog_card },
                            { key: 'isbn-impresso', icon: '📘', title: (t as any).dashboard.extraServices.items.isbn.title + ' — ' + (lang === 'en' ? 'Print' : 'Impresso'), subtitle: (t as any).dashboard.extraServices.items.isbn.subtitle, price: lang === 'en' ? 9.90 : 49.90, features: (t as any).dashboard.extraServices.items.isbn.features, href: products.isbn_printed },
                            { key: 'isbn-digital', icon: '📗', title: (t as any).dashboard.extraServices.items.isbn.title + ' — ' + (lang === 'en' ? 'Digital' : 'Digital'), subtitle: (t as any).dashboard.extraServices.items.isbn.subtitle, price: lang === 'en' ? 9.90 : 49.90, features: (t as any).dashboard.extraServices.items.isbn.features, href: products.isbn_digital },
                        ].map(svc => (
                            <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc as any} accentColor="amber" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={() => { }} />
                        ))}
                    </div>
                </div>

                {/* ── PACOTE COMPLETO ── */}
                <div className="relative bg-gradient-to-br from-emerald-900/30 via-slate-800/60 to-slate-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-900 text-[10px] font-black px-6 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                        {(t as any).dashboard.extraServices.bestValue}
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-white mb-2 uppercase">{(t as any).dashboard.extraServices.completePackage}</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                {(t as any).dashboard.extraServices.packageDesc}
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {[(t as any).dashboard.extraServices.items.engBook.title, (t as any).dashboard.extraServices.items.printCover.title, (t as any).dashboard.extraServices.items.amazonPub.title, (t as any).dashboard.extraServices.items.isbn.title, (t as any).dashboard.extraServices.items.cataloging.title].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-300 bg-slate-800/50 px-2 py-1 rounded-lg">
                                        <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center md:text-right">
                            <div className="flex items-end justify-center md:justify-end gap-1 mb-4">
                                <span className="text-slate-500 text-sm mb-1">{lang === 'en' ? '$' : 'R$'}</span>
                                <span className="text-5xl font-black text-white tracking-tighter">{lang === 'en' ? '119.90' : '599,90'}</span>
                            </div>
                            <a
                                href="https://pay.kiwify.com.br/IHk1tZd"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 uppercase text-xs tracking-widest inline-block"
                            >
                                {(t as any).dashboard.extraServices.hirePackage}
                            </a>
                            {/* Hidden internal button for logic */}
                            <div className="hidden">
                                <ExtraServiceBuyButton
                                    serviceKey="pacote-completo"
                                    serviceName="Pacote Completo de Serviços"
                                    price={lang === 'en' ? 119.90 : 599.90}
                                    label={(t as any).dashboard.extraServices.hirePackage}
                                    accentClass="bg-emerald-500"
                                    formData={formData}
                                    getApiBase={getApiBase}
                                    trackInitiateCheckout={() => { }}
                                    href="https://pay.kiwify.com.br/IHk1tZd"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center pb-12">
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-4">
                        {lang === 'en' ? '🔒 Secure Payment via Kiwify · Email Support' : '🔒 Pagamento Seguro via Kiwify · Suporte via E-mail'}
                    </p>
                    <Disclaimer />
                </div>
            </div>
        </section>
    );
}

const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconZap = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const IconGlobe = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const IconPalette = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.9.7-1.6 1.6-1.6H17c2.8 0 5-2.2 5-5 0-5.5-4.5-10-10-10z" /></svg>;
