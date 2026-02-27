
import React, { useEffect, useState } from 'react';
import { PenTool, Download, Star, CheckCircle, Clock, MessageCircle, ExternalLink } from 'lucide-react';
import { SocialShare } from './SocialShare';
import { getApiBase } from '../services/api';
import { ExtraServiceCard } from './ExtraServices';

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

    // FUNÇÃO 1: GERA O BOLETO/PIX E ABRE O ASAAS
    const handleBuyCredit = async (price: number) => {
        try {
            setLoading(true);
            setIsPurchasing(true); // Show spinner if needed or just use logic

            const getApiBase = () => {
                const host = window.location.hostname;
                if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005';
                return 'https://api.fabricadebestseller.com.br';
            };

            // Chama o backend para criar a cobrança request
            const res = await fetch(`${getApiBase()}/api/payment/purchase/book-generation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user.email })
            });

            const data = await res.json();

            if (data.invoiceUrl) {
                // OBRIGATÓRIO: Abre em nova aba
                const win = window.open(data.invoiceUrl, '_blank');
                if (!win) alert("Por favor, permita popups para abrir o pagamento.");
                setIsPurchasing(true); // Keep UI in "Waiting" state
            } else {
                alert('Erro ao gerar cobrança.');
                setIsPurchasing(false);
            }
        } catch (error) {
            alert('Erro de conexão com o Checkout.');
            setIsPurchasing(false);
        } finally {
            setLoading(false);
        }
    };

    // FUNÇÃO 2: VERIFICA SE O DINHEIRO CAIU E LIBERA O ACESSO
    const handleVerifyAndEnter = async () => {
        try {
            setLoading(true);

            const getApiBase = () => {
                const host = window.location.hostname;
                if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005';
                return 'https://api.fabricadebestseller.com.br';
            };

            // Pergunta ao servidor: "Eu tenho crédito?"
            // Using /payment/access as it is our specialized credit checker
            const res = await fetch(`${getApiBase()}/api/payment/access?email=${user.email}`);
            const data = await res.json();

            // STRICT CHECK: Only entry if credits are actually confirmed.
            // Ignore 'hasActiveProject' here because this button is specifically for validating a NEW payment.
            // STRICT CHECK: Only entry if credits are actually confirmed.
            if (data.hasAccess && data.credits > 0) {
                // Determine if there is ANY pending invoice (Subscription or Credit)
                const isBlockedByPending = (data.latestInvoiceStatus === 'PENDING' || data.latestInvoiceStatus === 'OVERDUE');

                if (isBlockedByPending) {
                    // Even if has credits, if there is a pending invoice, we block the NEW attempt
                    // to ensure that multiple generation attempts without paying are restricted.
                    alert(`A fatura ${data.latestInvoiceNumber || ''} ainda consta como PENDENTE no banco.\n\nPor favor, realize o pagamento para continuar com esta geração.`);
                    if (data.invoiceUrl) window.open(data.invoiceUrl, '_blank');
                } else {
                    alert('Pagamento Confirmado! Iniciando Geração...');
                    onNewBook();
                }
            } else {
                if (data.latestInvoiceStatus === 'PENDING' || data.latestInvoiceStatus === 'OVERDUE') {
                    alert(`A fatura ${data.latestInvoiceNumber || ''} ainda consta como pendente no banco. Aguarde a compensação ou realize o pagamento.`);
                    if (data.invoiceUrl) window.open(data.invoiceUrl, '_blank');
                } else if (data.hasAccess && data.hasActiveProject) {
                    // Caso ele tenha acesso por projeto ativo mas não tenha créditos (ex: reconectando)
                    onNewBook();
                } else {
                    alert('⚠️ Não identificamos créditos disponíveis. Se você acabou de pagar, aguarde alguns instantes e tente novamente.');
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
    let currentFixedPrice = 89.90; // Default Avulso (Single Purchase)

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
                                            <span>✅</span> JÁ PAGUEI - GERAR AGORA
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
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

                {/* PLAN OVERVIEW SECTION */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden text-center border border-slate-800 shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-purple-500 to-indigo-500"></div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
                        {/* LEFT COLUMN */}
                        <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                            <div className="inline-block bg-yellow-400 p-3 rounded-full mb-6 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                                <Star className="text-slate-900 w-8 h-8 fill-current" />
                            </div>

                            <h2 className="text-3xl font-black mb-2 uppercase leading-tight">
                                PLANO {planName} <br />
                                <span className="text-indigo-400">{billing === 'annual' ? 'ANUAL' : 'MENSAL'}</span>
                            </h2>
                            <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-8">
                                ÁREA VIP DE MEMBROS ASSINANTES
                            </p>

                            {/* Expiration Logic */}
                            {stats?.plan?.status === 'ACTIVE' ? (() => {
                                const start = new Date(stats.plan.startDate || stats.plan.lastPayment || Date.now());
                                const isAnnual = stats.plan.billing === 'annual';
                                const expiration = new Date(start);
                                expiration.setDate(start.getDate() + (isAnnual ? 365 : 30));

                                const now = new Date();
                                const diffTime = expiration.getTime() - now.getTime();
                                const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                                const isAlert = daysRemaining <= 5 && daysRemaining >= 0;

                                return (
                                    <div className={`w-full mb-8 p-6 rounded-2xl border ${isAlert ? 'bg-red-500/10 border-red-500/50 animate-pulse' : 'bg-slate-800/50 border-slate-700'}`}>
                                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-slate-400 mb-1">Seu plano vence em:</p>
                                                <p className={`text-2xl font-black ${isAlert ? 'text-red-400' : 'text-white'}`}>
                                                    {expiration.toLocaleDateString()}
                                                </p>
                                                {isAlert && (
                                                    <p className="text-sm font-bold text-red-400 mt-1">
                                                        ⚠️ Restam {daysRemaining} dias!
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-center md:text-right md:border-l md:border-slate-600 md:pl-6">
                                                <p className="text-xs text-slate-400 font-bold uppercase">Renovação</p>
                                                <p className="text-lg font-bold text-white">
                                                    R$ {stats?.subscriptionPrice ? stats.subscriptionPrice.toFixed(2).replace('.', ',') : (planName === 'BLACK' ? '79,90' : planName === 'PRO' ? '39,90' : '19,90')} <span className="text-xs font-normal text-slate-500">/{isAnnual ? 'ano' : 'mês'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })() : (
                                <div className="w-full mb-8 p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
                                    <p className="text-xs font-bold uppercase text-slate-400 mb-1">Status da Assinatura:</p>
                                    <p className="text-xl font-bold text-white">GRATUITO / INATIVO</p>
                                </div>
                            )}

                            {/* Price Unlock Box */}
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/30 p-6 rounded-2xl w-full relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-emerald-500/20 transition-all"></div>

                                <p className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-4 leading-relaxed">
                                    COM ESTE PLANO ATIVO, SEU CUSTO FIXO POR GERAÇÃO É DE:
                                </p>

                                <div className="flex flex-col gap-1 items-center lg:items-start">
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">💰</span>
                                        <div>
                                            <span className="text-4xl md:text-5xl font-black text-white tracking-tight">R$ {nextBookDisplayPrice.toFixed(2).replace('.', ',')}</span>
                                            <span className="text-slate-400 text-sm font-bold ml-2">/geração</span>
                                        </div>
                                    </div>
                                    <p className="text-emerald-400 text-xs font-bold uppercase mt-2">✅ Valor Fixo Garantido</p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex flex-col gap-8 lg:border-l lg:border-slate-800 lg:pl-8">
                            {/* Benefits List */}
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-6">
                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">O QUE ESTÁ INCLUÍDO:</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6">
                                    <div className="space-y-3">
                                        {[
                                            "Acesso à Plataforma Fábrica de Best Sellers",
                                            "Geração de Livros (14 Capítulos)",
                                            "Conteúdo Robusto (+160 Páginas)",
                                            "Diagramação Automática Profissional",
                                            "Folha de Rosto & Título Diagramadas",
                                            "Sumário Automático",
                                            "Histórico de livros gerados",
                                            "Pág. Agradecimento, Dedicatória e Sobre o Autor",
                                            "Acesso à Comunidade",
                                            "Kit de Marketing e Vendas",
                                            "Suporte Prioritário",
                                            "Mentoria"
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                                                <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                <span className="leading-tight">{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700/50 h-max self-start md:w-64 text-center">
                                        <p className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-4">Seu Benefício</p>
                                        <div className="space-y-4">
                                            <div className="text-3xl font-black text-white">R$ {nextBookDisplayPrice.toFixed(2).replace('.', ',')}</div>
                                            <p className="text-xs text-slate-400 leading-relaxed">
                                                Preço fixo por livro gerado, exclusivo para assinantes do plano <strong>{planName}</strong>.
                                            </p>
                                        </div>
                                        <div className="mt-6 pt-4 border-t border-slate-700/50">
                                            <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest">✅ MELHOR PREÇO GARANTIDO</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History */}
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
                                                title="Baixar Livro"
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

                <div className="pt-8 border-t border-slate-200">
                    <ExtraServiceSection formData={{ email: user?.email, name: user?.name, phone: user?.phone }} />
                </div>

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

const ExtraServiceSection = ({ formData }: { formData: any }) => {
    return (
        <div className="py-8">
            <div className="mb-8">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-wider mb-2">Serviços Extras</h3>
                <p className="text-slate-500 text-sm">Contrate serviços profissionais para levar sua obra ao próximo nível.</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                    { key: 'livro-ingles', icon: '🇺🇸', title: 'Livro em Inglês', subtitle: 'Tradução profissional com IA literária', price: 24.99, color: 'blue' },
                    { key: 'livro-espanhol', icon: '🇪🇸', title: 'Livro em Espanhol', subtitle: 'Tradução profissional com IA literária', price: 24.99, color: 'blue' },
                    { key: 'capa-impressa', icon: '🎨', title: 'Capa — Livro Impresso', subtitle: 'Design para KDP / UICLAP', price: 250.00, color: 'purple' },
                    { key: 'amazon-impresso', icon: '🚀', title: 'Amazon KDP — Impresso', subtitle: 'Publicação do livro físico', price: 69.90, color: 'orange' },
                ].map(svc => (
                    <ExtraServiceCard
                        key={svc.key}
                        serviceId={svc.key}
                        {...svc as any}
                        accentColor={svc.color as any}
                        features={[]} // Simplified for dashboard
                        formData={formData}
                        getApiBase={getApiBase}
                        trackInitiateCheckout={() => { }}
                    />
                ))}
            </div>
        </div>
    );
}
