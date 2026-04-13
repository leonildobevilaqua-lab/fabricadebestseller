
import React, { useEffect, useState } from 'react';
import { PenTool, Download, Star, CheckCircle, Clock, MessageCircle, ExternalLink, User, Mail, Calendar, Trash2 } from 'lucide-react';
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

    const refreshStats = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('bsf_token');
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const [meRes, resPayment] = await Promise.all([
                fetch(`${getApiBase()}/api/user/me?email=${user.email}`, { headers }),
                fetch(`${getApiBase()}/api/payment/access?email=${user.email}`)
            ]);

            if (meRes.ok) {
                const meData = await meRes.json();
                console.log("VIP DASHBOARD FETCH:", meData);
                setStats(meData);
            }

            if (resPayment.ok) {
                const payData = await resPayment.json();
                setHasCredits(payData.credits > 0);
            }
        } catch (e) {
            console.error("Refresh error", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshStats();
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
                    <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex items-center gap-3">
                            <h3 className="font-black text-slate-800 text-xl uppercase tracking-tighter">{(t as any).dashboard.myBooks}</h3>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={refreshStats}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-full text-[10px] font-black text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all uppercase tracking-widest shadow-sm"
                            >
                                🔄 ATUALIZAR LISTA
                            </button>
                            <span className="text-[10px] font-black text-slate-400 uppercase bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                                {displayOrders.length} {(t as any).dashboard.projectsCount}
                            </span>
                        </div>

                        <div className="divide-y divide-slate-100">
                            {displayOrders.length === 0 ? (
                                <div className="p-16 text-center">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                        <Book size={32} />
                                    </div>
                                    <p className="text-slate-400 font-bold">{(t as any).dashboard.noProjects}</p>
                                </div>
                            ) : (
                                displayOrders.map((order: any, idx: number) => {
                                    const isCompleted = order.status === 'COMPLETED' || order.status === 'LIVRO ENTREGUE' || order.status === 'APPROVED';
                                    const isProcessing = order.status === 'IN_PROGRESS' || order.status === 'PROCESSING';
                                    return (
                                        <div key={order.id || order.projectId || idx} className="p-6 md:p-8 hover:bg-slate-50/50 transition bg-white group border-b border-slate-100 last:border-0 relative overflow-hidden">
                                            <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                            <div className="flex flex-col xl:flex-row items-start justify-between gap-10">
                                                <div className="flex flex-1 items-start gap-8 w-full">
                                                    <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 border-2 border-slate-100 rounded-3xl flex-shrink-0 flex items-center justify-center text-5xl shadow-xl transition-all duration-500">
                                                        📚
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col mb-4">
                                                            <span className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.4em] leading-none mb-2 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                                                                {(t as any).dashboard.statusGenerated || 'LIVRO GERADO'}
                                                            </span>
                                                            <h4 className="font-black text-slate-900 text-xl md:text-2xl leading-tight uppercase tracking-tighter break-words italic group-hover:text-indigo-600 transition-colors" translate="no">
                                                                {order.title || (t as any).dashboard.bookTitleFallback}
                                                            </h4>
                                                        </div>
                                                        
                                                        <div className="bg-[#f8fafc] p-6 rounded-[32px] border border-slate-200/50 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 group-hover:text-indigo-500 transition-colors"><User size={18} /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">CLIENTE</span>
                                                                    <span className="text-[14px] font-black text-slate-700 tracking-tight truncate max-w-[200px]">{order.customerName || "-"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 group-hover:text-indigo-500 transition-colors"><Mail size={18} /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">E-MAIL</span>
                                                                    <span className="text-[14px] font-black text-slate-500 truncate lowercase max-w-[200px]">{order.customerEmail || "-"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 group-hover:text-indigo-500 transition-colors"><MessageCircle size={18} /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">WHATSAPP</span>
                                                                    <span className="text-[14px] font-black text-indigo-500 underline decoration-indigo-100 underline-offset-4 tracking-tight">{order.customerPhone || "-"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-emerald-500 font-black text-xs">A</div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">AUTOR(A)</span>
                                                                    <span className="text-[14px] font-black text-slate-900 tracking-tight truncate max-w-[200px]">{order.authorName || "-"}</span>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-4 md:col-span-2 pt-4 border-t border-slate-200/50 mt-1">
                                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400 group-hover:text-indigo-500 transition-colors"><Calendar size={18} /></div>
                                                                <div className="flex flex-col">
                                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">DATA DE GERAÇÃO</span>
                                                                    <span className="text-[14px] font-black text-slate-600">
                                                                        {order.date ? new Date(order.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col items-end gap-6 w-full xl:w-auto">
                                                    <div className="flex items-center gap-3">
                                                       <span className={`text-[10px] font-black px-6 py-2.5 rounded-full border uppercase tracking-[0.2em] shadow-sm ${
                                                           isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                                                           isProcessing ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                                       }`}>
                                                           {isCompleted ? (t as any).dashboard.statusGenerated : (isProcessing ? (t as any).dashboard.statusProcessing : (t as any).dashboard.statusWaiting)}
                                                       </span>
                                                    </div>

                                                    <div className="flex items-center gap-4 w-full justify-end">
                                                        {isCompleted && (
                                                            <button
                                                                onClick={() => window.open(order.downloadUrl?.startsWith('http') ? order.downloadUrl : `${getApiBase()}${order.downloadUrl || `/api/projects/download-zip/${order.id || order.projectId}`}`, '_blank')}
                                                                className="flex items-center gap-4 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-200/50 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden flex-1 md:flex-none justify-center"
                                                            >
                                                                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:translate-x-full transition-transform duration-700 -skew-x-12" />
                                                                <Download size={20} className="group-hover:animate-bounce" />
                                                                <span>{(t as any).dashboard.downloadKit || 'Baixar Kit ZIP'}</span>
                                                            </button>
                                                        )}
                                                        
                                                        <button
                                                            onClick={() => handleDeleteProject(order.id || order.projectId)}
                                                            className="p-5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                                                            title={(t as any).dashboard.deleteProject}
                                                        >
                                                            <Trash2 size={24} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

