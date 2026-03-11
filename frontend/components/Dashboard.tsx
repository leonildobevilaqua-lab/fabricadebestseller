
import React, { useEffect, useState } from 'react';
import { PenTool, Download, Star, CheckCircle, Clock, MessageCircle, ExternalLink } from 'lucide-react';
import { SocialShare } from './SocialShare';
import { getApiBase } from '../services/api';
import { ExtraServiceCard, ExtraServiceBuyButton } from './ExtraServices';

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
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);
    const [hasCredits, setHasCredits] = useState(false);
    const [pendingInvoice, setPendingInvoice] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

    // FUNÇÃO 1: REDIRECIONA PARA CHECKOUT KIWIFY
    const handleBuyCredit = async (price: number) => {
        try {
            setLoading(true);
            setIsPurchasing(true); // Manter UI em "Waiting"

            const kiwifyUrl = `https://pay.kiwify.com.br/QPTslcx?email=${encodeURIComponent(user.email)}`;
            const win = window.open(kiwifyUrl, '_blank');

            if (!win) alert("Por favor, permita popups para abrir o pagamento.");
        } catch (error) {
            alert('Erro ao tentar abrir o checkout.');
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

                // --- CRITICAL FIX: IF USER HAS CREDITS, WE DO NOT BLOCK THEM WITH INVOICE ALERTS ---
                // We only show the invoice alert if they have NO credits and NO active project.
                // Or if they are trying to generate and the BACKEND says they are blocked (but our new backend allows credits).

                if (data.credits > 0 || data.hasActiveProject) {
                    console.log('Confirmed Access via Credits/Project');
                    onNewBook();
                } else {
                    // This part might be reached if hasAccess is true but credits/activeProject are false (unlikely with our logic)
                    alert('Acesso autorizado.');
                    onNewBook();
                }
            } else {
                setHasCredits(false);
                if (data.latestInvoiceStatus === 'PENDING' || data.latestInvoiceStatus === 'OVERDUE') {
                    alert(`A fatura ${data.latestInvoiceNumber || ''} ainda consta como pendente no banco. Aguarde a compensação ou realize o pagamento.`);
                    if (data.invoiceUrl) window.open(data.invoiceUrl, '_blank');
                } else {
                    alert('⚠️ Não identificamos créditos disponíveis. Se você acabou de pagar, aguarde alguns instantes e verifique novamente.');
                }
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao verificar status.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Fetch User Stats AND Payment Status on mount
        const fetchMe = async () => {
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

                // Parallel fetch
                const [resUser, resPayment] = await Promise.all([
                    fetch(`${getApiBase()}/api/user/me?email=${user.email}`, { headers }),
                    fetch(`${getApiBase()}/api/payment/access?email=${user.email}`)
                ]);

                if (resUser.ok) {
                    const data = await resUser.json();
                    setStats(data);
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
        if (!window.confirm('Tem certeza que deseja excluir esse projeto? Isso não pode ser desfeito.')) return;

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

            const res = await fetch(`${getApiBase()}/api/project/${projectId}`, {
                method: 'DELETE',
                headers
            });

            if (res.ok) {
                // Re-fetch stats to update list
                const resUser = await fetch(`${getApiBase()}/api/user/me?email=${user.email}`, { headers });
                const dataUser = await resUser.json();
                setStats(dataUser);
            } else {
                alert('Erro ao excluir projeto.');
            }
        } catch (e) {
            console.error('Delete error', e);
            alert('Falha na comunicação.');
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
                        <span className="font-serif font-bold text-xl text-slate-800 hidden md:block">Fábrica de Best Sellers</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right mr-2 hidden sm:block">
                            <p className="text-xs text-slate-400 font-bold uppercase">Bem-vindo,</p>
                            <p className="text-sm font-bold text-slate-800">{user.name}</p>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase border 
                            ${planName === 'BLACK' ? 'bg-slate-900 text-yellow-500 border-yellow-500' :
                                planName === 'PRO' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                    'bg-gray-100 text-gray-600 border-gray-200'}`}>
                            {planName}
                            {planStatus !== 'ACTIVE' && planName !== 'FREE' && <span className="ml-1 opacity-60">(INATIVO)</span>}
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-widest border border-red-200 hover:border-red-400 px-3 py-1 rounded-full transition"
                        >
                            Sair
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
                                GERADOR DE BEST SELLERS
                            </h2>
                            <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                                {hasCredits ? (
                                    <>Você possui <span className="text-emerald-400 font-black">CRÉDITO DISPONÍVEL</span> para uma nova geração. Clique no botão ao lado para começar agora!</>
                                ) : (
                                    <>
                                        Você está no modo <strong>{planStatus === 'ACTIVE' ? planName : 'AVULSO'}</strong>.
                                        Sua taxa fixa por geração de livro é de
                                        <span className="text-white font-bold mx-1">R$ {nextBookDisplayPrice.toFixed(2).replace('.', ',')}</span>.
                                        Aproveite o poder da IA para criar sua biblioteca agora mesmo.
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
                                        <p className="text-xs text-emerald-400 uppercase font-bold tracking-widest">Acesso Liberado!</p>
                                    </div>
                                    <button
                                        onClick={onNewBook}
                                        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black py-6 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-2xl shadow-emerald-500/40 transform hover:scale-[1.05] active:scale-95 group"
                                    >
                                        <span className="text-2xl group-hover:animate-pulse">🚀 GERAR LIVRO AGORA!</span>
                                        <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Clique para utilizar seu crédito</span>
                                    </button>
                                </div>
                            ) : pendingInvoice ? (
                                <>
                                    <div className="text-center mb-6">
                                        <div className="inline-block p-3 bg-yellow-500/20 text-yellow-500 rounded-full mb-2 animate-pulse">
                                            <Clock size={24} />
                                        </div>
                                        <p className="text-sm font-bold text-yellow-400">AGUARDANDO PAGAMENTO</p>
                                        <p className="text-xs text-slate-400 mt-2">Identificamos uma fatura em aberto.</p>
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={handleVerifyAndEnter}
                                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-600"
                                        >
                                            <CheckCircle size={18} /> ATUALIZAR STATUS
                                        </button>
                                        {invoiceUrl && (
                                            <a
                                                href={invoiceUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full text-center text-xs text-slate-400 hover:text-white underline mt-2"
                                            >
                                                Pagar Agora / Visualizar Fatura
                                            </a>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="text-center mb-6">
                                        <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">Custo da Geração</p>
                                        <div className="text-4xl font-black text-white">R$ {nextBookDisplayPrice.toFixed(2).replace('.', ',')}</div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => handleBuyCredit(nextBookDisplayPrice)}
                                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-lg"
                                        >
                                            <span>🛒</span> ADQUIRIR CRÉDITO
                                        </button>

                                        <button
                                            onClick={handleVerifyAndEnter}
                                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-600"
                                        >
                                            <CheckCircle size={18} /> JÁ PAGUEI - VERIFICAR
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
                                    <h4 className="text-yellow-500 font-bold mb-1">Atenção: Você tem uma Condição Exclusiva Legacy!</h4>
                                    <p className="text-slate-300 text-sm leading-relaxed">
                                        Como assinante fundador, você tem o direito garantido de gerar novos livros pelo valor promocional de <strong>R$ {nextBookDisplayPrice.toFixed(2).replace('.', ',')}</strong> enquanto sua assinatura atual <strong>{planName}</strong> for mantida ativa. Aproveite!
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
                                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Comunidade VIP Exclusiva 🚀</h3>
                                <p className="text-slate-500 max-w-xl leading-relaxed font-semibold">
                                    Não fique de fora! Entre agora no nosso grupo de WhatsApp e receba <span className="text-emerald-600">informações privilegiadas, promoções relâmpago, orientações estratégicas e brindes semanais</span> exclusivos para nossos membros.
                                </p>
                            </div>
                        </div>

                        <a
                            href={planName.includes('BLACK') ? 'https://chat.whatsapp.com/HbXoRWvUgpr9a2gM6AVDEJ' :
                                planName.includes('PRO') ? 'https://chat.whatsapp.com/Ids5VgSl5jX8ogjKbEmewZ' :
                                    'https://chat.whatsapp.com/KIwHj9hc4gr8cvf7dCzP0E'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto bg-[#25D366] hover:bg-[#20bd5a] text-white font-black px-8 py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-sm hover:scale-105 active:scale-95"
                        >
                            <span>Entrar no Grupo</span>
                            <ExternalLink size={18} />
                        </a>
                    </div>
                </div>

                {/* [NEW] VIDEO SECTION */}
                <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl overflow-hidden">
                    <div className="text-center mb-8">
                        <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                            ASSISTA A ESTE VÍDEO E VEJA AS ÚNICAS ALTERAÇÕES QUE VOCÊ PRECISARÁ FAZER NO SEU LIVRO GERADO!
                        </h3>
                    </div>
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-200">
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src="https://www.youtube.com/embed/uBvagSevkaI"
                            title="Vídeo de Instruções"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                </div>

                {/* [NEW] REPRESENTANTE SECTION */}
                <div className="bg-slate-900 rounded-3xl p-6 md:p-10 border border-slate-800 shadow-2xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-2xl md:text-3xl font-black text-white mb-3 uppercase tracking-tight">
                                Torne-se um Representante Autorizado e Lucre com a Nossa Estrutura! 🚀
                            </h3>
                            <p className="text-slate-400 text-lg leading-relaxed mb-6">
                                "Você já viu como é fácil criar livros de alta performance. Agora, que tal ganhar dinheiro vendendo essa solução para o mundo?"
                            </p>
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl inline-block">
                                <p className="text-blue-400 font-bold text-sm">
                                    Destaque: Acesso à <span className="text-white">PASTA SECRETA DE CRIATIVOS</span> (Artes, Vídeos e Copies validadas).
                                </p>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 text-center min-w-[280px]">
                            <div className="mb-4">
                                <span className="text-slate-500 text-xs line-through block font-bold">DE: R$ 297,90</span>
                                <span className="text-4xl font-black text-[#d4af37] text-glow">R$ 99,90</span>
                            </div>
                            <a 
                                href="/afiliacao"
                                className="w-full bg-[#d4af37] hover:bg-yellow-400 text-black font-black py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 uppercase text-xs tracking-widest hover:scale-105 active:scale-95"
                            >
                                QUERO ME TORNAR UM REPRESENTANTE AGORA
                            </a>
                        </div>
                    </div>
                </div>

                {/* History (Meus Livros) */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-800 text-lg">Meus Livros</h3>
                        <span className="text-xs font-bold text-slate-400 uppercase bg-slate-100 px-2 py-1 rounded">
                            {displayOrders.length} Projetos
                        </span>
                    </div>

                    {displayOrders.length === 0 ? (
                        <div className="p-12 text-center text-slate-400">
                            <div className="mb-4 opacity-50"><IconBook /></div>
                            <p>Você ainda não gerou nenhum livro.</p>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-indigo-600 font-bold hover:underline mt-2">Começar agora</button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {displayOrders.map((order: any, idx: number) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 transition flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="w-12 h-16 bg-slate-200 rounded flex-shrink-0 flex items-center justify-center text-2xl shadow-sm">
                                            📚
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800">{order.title || "Livro Sem Título"}</h4>
                                            {order.authorName && <p className="text-xs text-slate-600 font-medium">Autor: {order.authorName}</p>}
                                            <p className="text-xs text-slate-500 uppercase mt-1">{order.date ? new Date(order.date).toLocaleDateString() : 'Data desconhecida'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${(order.status === 'COMPLETED' || order.status === 'LIVRO ENTREGUE') ? 'bg-green-100 text-green-700' :
                                            order.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {(order.status === 'COMPLETED' || order.status === 'LIVRO ENTREGUE') ? 'LIVRO GERADO' :
                                                order.status === 'IN_PROGRESS' ? 'PROCESSANDO...' :
                                                    'Aguardando'}
                                        </span>
                                        {(order.status === 'COMPLETED' || order.status === 'LIVRO ENTREGUE') && order.downloadUrl && (
                                            <a
                                                href={order.downloadUrl.startsWith('http') ? order.downloadUrl : `${getApiBase()}${order.downloadUrl}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title="Baixar Kit Completo (ZIP)"
                                            >
                                                <IconDownload />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleDeleteProject(order.id)}
                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                            title="Excluir Projeto"
                                        >
                                            <IconTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Extra Services Section (Re-implemented with Landing Page Design) */}
                <ExtraServiceSection formData={{ email: user?.email, name: user?.name, phone: user?.phone }} />

                <div className="pt-8 border-t border-slate-200">
                    <SocialShare
                        text="Estou criando livros incríveis com Inteligência Artificial! Conheça a Fábrica de Best Sellers."
                        className="opacity-70 hover:opacity-100 transition-opacity"
                    />
                </div>

            </main>
        </div>
    );
};

// --- [RE-IMPLEMENTED] EXTRA SERVICE SECTION (LANDING PAGE STYLE) ---
const ExtraServiceSection = ({ formData }: { formData: any }) => {
    return (
        <section className="py-12 bg-slate-950 rounded-[40px] relative overflow-hidden shadow-2xl border border-slate-800">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950"></div>
            <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>

            <div className="relative max-w-6xl mx-auto px-6">
                <div className="text-center mb-12">
                    <span className="inline-block bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-widest mb-4">
                        Serviços Extras Profissionais
                    </span>
                    <h2 className="text-3xl md:text-4xl font-black text-white mb-4 uppercase tracking-tight">
                        Transforme Seu Livro em <span className="text-emerald-400">Produto de Mercado</span>
                    </h2>
                    <p className="text-slate-500 text-sm max-w-2xl mx-auto font-medium">
                        Contrate separadamente ou em Pacote Completo com desconto. Atendimento via e-mail pós-pagamento.
                    </p>
                </div>

                {/* ── TRADUÇÃO ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-blue-500/20 border border-blue-500/30 rounded-lg flex items-center justify-center text-sm">🌍</div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Tradução</h3>
                        <div className="flex-1 h-px bg-blue-500/20"></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { key: 'livro-ingles', icon: '🇺🇸', title: 'Livro em Inglês', subtitle: 'Tradução profissional com IA literária', price: 24.99, features: ['Tradução 100% do conteúdo', 'Revisão de naturalidade e estilo', 'Arquivo DOCX pronto'] },
                            { key: 'livro-espanhol', icon: '🇪🇸', title: 'Livro em Espanhol', subtitle: 'Tradução profissional com IA literária', price: 24.99, features: ['Tradução 100% do conteúdo', 'Revisão de naturalidade e estilo', 'Arquivo DOCX pronto'] },
                        ].map(svc => (
                            <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc as any} accentColor="blue" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={() => { }} />
                        ))}
                    </div>
                </div>

                {/* ── DESIGN DE CAPA ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-purple-500/20 border border-purple-500/30 rounded-lg flex items-center justify-center text-sm">🎨</div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Design de Capa</h3>
                        <div className="flex-1 h-px bg-purple-500/20"></div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {[
                            { key: 'capa-impressa', icon: '📗', title: 'Capa — Livro Impresso', subtitle: 'Design profissional para KDP / UICLAP', price: 250.00, features: ['Dimensões exatas para impressão', 'Capa + Lombada + Contra-capa', 'Arquivo PDF Alta Resolução'] },
                            { key: 'capa-digital', icon: '📱', title: 'Capa — Livro Digital', subtitle: 'Design otimizado para Amazon Kindle', price: 149.90, features: ['Formato 1600×2560px', 'JPG e PNG em alta qualidade', 'Otimizado para lojas digitais'] },
                        ].map(svc => (
                            <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc as any} accentColor="purple" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={() => { }} />
                        ))}
                    </div>
                </div>

                {/* ── PUBLICAÇÃO ── */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-orange-500/20 border border-orange-500/30 rounded-lg flex items-center justify-center text-sm">🚀</div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Publicação</h3>
                        <div className="flex-1 h-px bg-orange-500/20"></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {[
                            { key: 'amazon-impresso', icon: '📦', title: 'Amazon KDP — Impresso', subtitle: 'Publicação do livro físico global', price: 69.90, features: ['Upload e configuração KDP', 'Revisão de formato e margens'] },
                            { key: 'amazon-digital', icon: '📲', title: 'Amazon KDP — Digital', subtitle: 'Publicação do ebook Kindle', price: 59.90, features: ['Upload Kindle Direct Publishing', 'Revisão do arquivo mobi/epub'] },
                            { key: 'uiclap-impresso', icon: '🇧🇷', title: 'UICLAP — Impresso', subtitle: 'Publicação na maior plataforma BR', price: 59.90, features: ['Cadastro e upload UICLAP', 'Disponível sob demanda'] },
                        ].map(svc => (
                            <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc as any} accentColor="orange" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={() => { }} />
                        ))}
                    </div>
                </div>

                {/* ── REGISTROS LEGAIS ── */}
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/30 rounded-lg flex items-center justify-center text-sm">📋</div>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Registros Legais</h3>
                        <div className="flex-1 h-px bg-amber-500/20"></div>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        {[
                            { key: 'ficha-catalografica', icon: '🗂️', title: 'Ficha Catalográfica', subtitle: 'Obrigatória para gráficas', price: 59.90, features: ['Padrão AACR2 / RDA', 'Emitida por bibliotecária'] },
                            { key: 'isbn-impresso', icon: '📘', title: 'ISBN — Livro Impresso', subtitle: 'Registro oficial na CBL', price: 49.90, features: ['Número ISBN único', 'Código de barras incluso'] },
                            { key: 'isbn-digital', icon: '📗', title: 'ISBN — Livro Digital', subtitle: 'Registro oficial edição digital', price: 49.90, features: ['Número ISBN único', 'Pronto para E-book'] },
                        ].map(svc => (
                            <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc as any} accentColor="amber" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={() => { }} />
                        ))}
                    </div>
                </div>

                {/* ── PACOTE COMPLETO ── */}
                <div className="relative bg-gradient-to-br from-emerald-900/30 via-slate-800/60 to-slate-900 border border-emerald-500/40 rounded-3xl p-8 shadow-2xl">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-900 text-[10px] font-black px-6 py-1.5 rounded-full uppercase tracking-widest shadow-lg">
                        🔥 MAIOR ECONOMIA
                    </div>

                    <div className="flex flex-col md:flex-row gap-8 items-center justify-between">
                        <div className="flex-1">
                            <h3 className="text-2xl font-black text-white mb-2 uppercase">Pacote Completo</h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-4">
                                Tradução (EN+ES) + Capa Impressa + Publicação Amazon + ISBN + Ficha Catalográfica.
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-2">
                                {['🌍 Tradução', '📗 Capa', '🚀 Amazon', '🔢 ISBN', '🗂️ Ficha'].map((item, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-300 bg-slate-800/50 px-2 py-1 rounded-lg">
                                        <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="text-center md:text-right">
                            <div className="flex items-end justify-center md:justify-end gap-1 mb-4">
                                <span className="text-slate-500 text-sm mb-1">R$</span>
                                <span className="text-5xl font-black text-white tracking-tighter">599,90</span>
                            </div>
                            <button
                                onClick={() => {
                                    // Using standard modal trigger for the button
                                    const btn = document.getElementById('btn-extra-pacote-completo');
                                    if (btn) btn.click();
                                }}
                                className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 uppercase text-xs tracking-widest"
                            >
                                Contratar Pacote Completo
                            </button>
                            {/* Hidden internal button for logic */}
                            <div className="hidden">
                                <ExtraServiceBuyButton
                                    serviceKey="pacote-completo"
                                    serviceName="Pacote Completo de Serviços"
                                    price={599.90}
                                    label="Contratar Pacote Completo"
                                    accentClass="bg-emerald-500"
                                    formData={formData}
                                    getApiBase={getApiBase}
                                    trackInitiateCheckout={() => { }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                        🔒 Pagamento Seguro via Kiwify · Suporte via E-mail
                    </p>
                </div>
            </div>
        </section>
    );
}

const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
const IconZap = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const IconGlobe = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const IconPalette = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5" /><circle cx="17.5" cy="10.5" r=".5" /><circle cx="8.5" cy="7.5" r=".5" /><circle cx="6.5" cy="12.5" r=".5" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.6-.7 1.6-1.6 0-.4-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.9.7-1.6 1.6-1.6H17c2.8 0 5-2.2 5-5 0-5.5-4.5-10-10-10z" /></svg>;
