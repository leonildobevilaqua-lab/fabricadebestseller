
import React, { useEffect, useState } from 'react';
import { PenTool, Download, Star, CheckCircle, Clock } from 'lucide-react';
import { SocialShare } from './SocialShare'; // Assuming Lucide or similar, else inline SVGs

// Inline Icons fallback
const IconBook = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
const IconStar = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IconDownload = (props: any) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>;

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
            setIsPurchasing(true);

            const getApiBase = () => {
                const host = window.location.hostname;
                if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005';
                return 'https://api.fabricadebestseller.com.br';
            };

            // Calculate active cycle index based on stats (Strict User Request)
            const completedBooks = stats?.stats?.totalBooksGenerated || 0;
            const cycleIndex = (completedBooks) % 4;

            // Determine Plan Param
            const pName = stats?.plan?.name || "FREE";
            const billing = stats?.plan?.billing || 'monthly';
            const isAnnual = billing === 'annual' || billing === 'anual';

            let pKey = 'STARTER';
            if (pName.toUpperCase().includes('PRO')) pKey = 'PRO';
            if (pName.toUpperCase().includes('BLACK')) pKey = 'BLACK';
            const bKey = isAnnual ? 'ANNUAL' : 'MONTHLY';

            // Using endpoint that accepts cycleIndex
            const res = await fetch(`${getApiBase()}/api/payment/purchase/book-generation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    plan: pKey + '_' + bKey, // Send explicit plan key
                    cycleIndex: cycleIndex // Send explicit cycle index (0-3)
                })
            });

            const data = await res.json();
            if (data.url) {
                const win = window.open(data.url, '_blank');
                if (!win) alert("Por favor, permita popups para abrir o pagamento.");
            } else {
                console.error("Payment Error Data:", data);
                const msg = data.error || data.message || "Erro Desconhecido (Ver Console)";
                alert(`Erro ao gerar fatura: ${msg}`);
                setIsPurchasing(false);
            }
        } catch (error: any) {
            console.error("Fetch Error:", error);
            // Verify if it was JSON parse error
            alert(`Erro de conexão com o Checkout.\nDetalhes: ${error.message}`);
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

            // Pergunta ao servidor o status atual
            const res = await fetch(`${getApiBase()}/api/payment/access?email=${user.email}`);
            const data = await res.json();

            // PRIORIDADE 1: Verificar se existe fatura em aberto (O SERVIDOR JÁ ZERA OS CRÉDITOS SE EXISTIR)
            if (data.latestInvoiceStatus === 'PENDING' || data.latestInvoiceStatus === 'OVERDUE') {
                const statusPT = data.latestInvoiceStatus === 'PENDING' ? 'PENDENTE' : 'VENCIDA';
                const invNumber = data.latestInvoiceNumber || 'N/A';
                alert(`🧾 FATURA EM ABERTO DETECTADA\n\nIdentificamos a fatura Nº ${invNumber} aguardando pagamento.\n\nSTATUS: ${statusPT}\n\nPara segurança do processo, o sistema bloqueia o uso de créditos anteriores enquanto houver uma fatura nova gerada.\n\nPOR FAVOR, PAGUE A FATURA OU AGUARDE A COMPENSAÇÃO BANCÁRIA.`);
                return;
            }

            // PRIORIDADE 2: Verificar se o pagamento caiu agora (créditos > 0)
            if (data.credits > 0) {
                alert('✅ PAGAMENTO CONFIRMADO!\n\nSeu crédito foi liberado com sucesso. Iniciando a geração do seu livro...');
                onNewBook();
            } else {
                // Caso créditos seja 0 e não tenha fatura pendente
                alert('⚠️ PAGAMENTO NÃO LOCALIZADO\n\nNão identificamos compensação bancária nem faturas em aberto no momento.\n\n- Se pagou agora via PIX: Tente novamente em 1 minuto.\n- Se pagou via BOLETO: A compensação leva de 24h a 48h.\n- Se você já tinha créditos: O projeto pode estar aguardando a finalização da fatura atual.');
            }
        } catch (error) {
            console.error(error);
            alert("Erro ao verificar status.");
        } finally {
            setLoading(false);
        }
    };

    // FUNCÃO 3: DELETAR PROJETO
    const handleDeleteProject = async (id: string) => {
        if (!confirm("ATENÇÃO: A Exclusão do arquivo é definitiva, você não terá como fazer o download deste arquivo novamente.\n\nDeseja realmente excluir este livro?")) return;

        try {
            setLoading(true);
            const getApiBase = () => {
                const host = window.location.hostname;
                if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
                return ''; // Relative path for production
            };

            const res = await fetch(`${getApiBase()}/api/projects/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                alert("Livro excluído com sucesso.");
                // Reload page to refresh list
                window.location.reload();
            } else {
                alert("Erro ao excluir livro.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão.");
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

    const planName = stats?.plan?.name || "FREE";
    const billing = stats?.plan?.billing || 'monthly';
    const cycleCount = stats?.stats?.purchaseCycleCount || 0;
    const orders = stats?.orders || [];

    // Determine Prices properly for Sidebar and Box based on Plan AND Billing
    // Determine Prices properly for Sidebar and Box based on Plan AND Billing
    const isAnnual = billing === 'annual' || billing === 'anual';

    // Pricing Rules - MUST MATCH BACKEND
    const PRICING: any = {
        'STARTER_MONTHLY': [26.90, 24.21, 22.87, 21.52],
        'STARTER_ANNUAL': [24.90, 22.41, 21.17, 19.92],
        'PRO_MONTHLY': [21.90, 19.71, 18.62, 17.52],
        'PRO_ANNUAL': [19.90, 17.91, 16.92, 15.92],
        'BLACK_MONTHLY': [16.90, 15.21, 14.37, 13.52],
        'BLACK_ANNUAL': [14.90, 13.41, 12.67, 11.92]
    };

    let pKey = 'STARTER';
    if (planName.toUpperCase().includes('PRO')) pKey = 'PRO';
    if (planName.toUpperCase().includes('BLACK')) pKey = 'BLACK';

    const bKey = isAnnual ? 'ANNUAL' : 'MONTHLY';
    let currentCyclePrices = PRICING[`${pKey}_${bKey}`] || PRICING['STARTER_MONTHLY'];

    // Dynamic Price based on PROJECTS GENERATED (Strict User Request)
    const completedBooks = stats?.stats?.totalBooksGenerated || 0;
    const activeIndex = (completedBooks) % 4; // Use generated count to determine current price box
    const nextBookDisplayPrice = currentCyclePrices[activeIndex] || currentCyclePrices[0];

    const displayOrders = orders; // Use real orders

    // Plan benefits mapping
    const PLAN_BENEFITS: any = {
        'STARTER': [
            "Acesso à Plataforma Fábrica de Best Sellers",
            "Geração de Livros (12 Capítulos)",
            "Conteúdo Robusto (+160 Páginas)",
            "Diagramação Automática Profissional",
            "Folha de Rosto & Título Diagramadas",
            "Sumário: Semi-automático",
            "Histórico de livros gerados",
            "NÃO - ⚠️ Pág. Agradecimento, Dedicatória e Sobre o Autor (Manuais)",
            "NÃO - Acesso à Comunidade",
            "NÃO - Kit de Marketing e Vendas"
        ],
        'PRO': [
            "Acesso à Plataforma Fábrica de Best Sellers",
            "Geração de Livros (12 Capítulos)",
            "Conteúdo Robusto (+160 Páginas)",
            "Diagramação Automática Profissional",
            "Folha de Rosto & Título Diagramadas",
            "Sumário Automático",
            "Histórico de livros gerados",
            "Automação: Pág. Agradecimento, Dedicatória, Sobre o Autor (IA)",
            "Kit de Marketing Completo (Sinopse, Orelhas, SEO, YouTube)",
            "Grupo Exclusivo Networking (WhatsApp)",
            "Suporte Prioritário por Email",
            "1 Tradução de Livro Gratuita por Mês 🌎"
        ],
        'BLACK': [
            "Acesso à Plataforma Fábrica de Best Sellers",
            "Geração de Livros (12 Capítulos)",
            "Conteúdo Robusto (+160 Páginas)",
            "Diagramação Automática Profissional",
            "Folha de Rosto & Título Diagramadas",
            "Sumário Automático",
            "Histórico de livros gerados",
            "Automação: Pág. Agradecimento, Dedicatória, Sobre o Autor (IA)",
            "Kit de Marketing Completo (Sinopse, Orelhas, SEO, YouTube)",
            "Grupo Exclusivo Networking (WhatsApp)",
            "Suporte Prioritário por Email",
            "Prioridade Máxima nos Servidores",
            "Comunidade VIP no Discord",
            "Mentoria: Capas Profissionais",
            "Mentoria: Publicação Uiclap",
            "Mentoria: Venda Amazon KDP",
            "Suporte Pessoal Dedicado (Discord)",
            "Acesso Antecipado a Novas Features",
            "2 Traduções de Livro Gratuitas por Mês 🌎"
        ]
    };

    const benefits = PLAN_BENEFITS[pKey] || PLAN_BENEFITS['STARTER'];


    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white p-1.5 rounded-lg">
                            <IconBook className="w-5 h-5" />
                        </div>
                        <span className="font-serif font-bold text-xl text-slate-800 hidden md:block">Fábrica de Best Sellers</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">BEM-VINDO,</span>
                            <span className="text-sm font-bold text-slate-700">{user.name}</span>
                        </div>
                        <div className="bg-yellow-500 text-slate-900 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-yellow-600">
                            {planName}
                        </div>
                        <button
                            onClick={onLogout}
                            className="text-slate-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50"
                            title="Sair"
                        >
                            SAIR
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* WELCOME TITLE AND WHATSAPP BUTTON */}
                <div className="space-y-6">
                    <div className="text-center md:text-left space-y-1">
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                            Seja Bem Vindo (a) à <span className="text-indigo-600">ÁREA VIP DE MEMBROS ASSINANTES</span> da Fábrica de Best Seller.
                        </h1>
                        <p className="text-slate-500 font-medium">Sua central exclusiva para geração e controle dos seus Best Sellers.</p>
                    </div>

                    <a
                        href="https://chat.whatsapp.com/GZrrpmLXD91J5lAjhgv9Jr"
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 md:p-6 bg-gradient-to-r from-emerald-500 to-green-600 rounded-2xl shadow-lg border border-white/20 hover:scale-[1.01] transition-transform group"
                    >
                        <div className="flex items-center gap-4 text-center md:text-left">
                            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-3xl shadow-inner group-hover:rotate-12 transition-transform">
                                💬
                            </div>
                            <div>
                                <p className="text-white font-black text-lg md:text-xl leading-tight">
                                    ACESSE AGORA O GRUPO VIP DA FÁBRICA DE BEST SELLER NO WHATSAPP
                                </p>
                                <p className="text-green-50/80 text-sm font-medium">
                                    Fique atualizado sobre todas as novidades, promoções e suporte.
                                </p>
                            </div>
                        </div>
                        <div className="bg-white text-emerald-600 font-black px-6 py-2.5 rounded-full text-sm uppercase tracking-wider group-hover:bg-green-50 transition-colors shadow-md">
                            Entrar no Grupo
                        </div>
                    </a>
                </div>

                {/* Progressive Credit Unlock System */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-3xl p-8 border border-slate-700 shadow-2xl relative overflow-hidden">
                    {/* Background Ambience */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                    <div className="relative z-10">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">
                                <span className="text-yellow-400">★</span> BENEFÍCIO EXCLUSIVO {planName}
                            </h2>
                            <p className="text-slate-400 max-w-2xl mx-auto">
                                Como assinante, você desbloqueou o <strong className="text-white">Melhor Preço Garantido</strong> para todas as suas gerações de livros.
                            </p>
                        </div>

                        {/* Grid of 4 Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Always render 4 cards for the cycle */}
                            {Array.from({ length: 4 }).map((_, index) => {
                                // Determine Price for this step
                                const price = currentCyclePrices[index] || currentCyclePrices[currentCyclePrices.length - 1];

                                // Calculate Status based on projects generated (Strict User Request)
                                // Only unlock next box if previous project is generated.
                                const completedProjects = stats?.stats?.totalBooksGenerated || 0;
                                const activeIndex = (completedProjects) % 4;

                                let status: 'LOCKED' | 'ACTIVE' | 'USED' = 'LOCKED';

                                // Visual Cycle Logic:
                                // If I have 0 projects: Index 0 is ACTIVE.
                                // If I have 1 project: Index 0 is USED, 1 is ACTIVE.
                                if (index < activeIndex) status = 'USED';
                                else if (index === activeIndex) status = 'ACTIVE';
                                else status = 'LOCKED';

                                // If user has effectively 'completed' a cycle (e.g. 4 orders), 
                                // the logic above sets index 0 to ACTIVE (4 % 4 = 0), which is correct for the start of NEXT cycle.
                                // But visually, if they just finished the 4th, maybe we want to show all USED?
                                // Standard pattern: Always show next available. So 4 orders -> Start of new cycle (Book 1 Active). Correct.

                                return (
                                    <div
                                        key={index}
                                        className={`relative rounded-2xl p-6 border transition-all duration-300 flex flex-col items-center justify-between min-h-[320px]
                                            ${status === 'ACTIVE'
                                                ? 'bg-slate-800/90 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.25)] scale-105 z-20'
                                                : status === 'USED'
                                                    ? 'bg-slate-800 border-slate-700 opacity-80 grayscale blur-[0.5px]'
                                                    : 'bg-slate-900 border-slate-800 opacity-70'
                                            }
                                        `}
                                    >
                                        {/* Header Badge */}
                                        <div className="mb-4">
                                            {status === 'ACTIVE' && (
                                                <span className="bg-yellow-500 text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                                                    Disponível Agora
                                                </span>
                                            )}
                                            {status === 'USED' && (
                                                <span className="bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                    Utilizado
                                                </span>
                                            )}
                                            {status === 'LOCKED' && (
                                                <span className="bg-slate-700 text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                                    Bloqueado
                                                </span>
                                            )}
                                            {/* Discount Badges */}
                                            {index === 1 && (
                                                <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                    -10%
                                                </span>
                                            )}
                                            {index === 2 && (
                                                <span className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                    -15%
                                                </span>
                                            )}
                                            {index === 3 && (
                                                <span className="absolute top-4 right-4 bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                                    -20%
                                                </span>
                                            )}
                                        </div>

                                        {/* Icon */}
                                        <div className="mb-6">
                                            {status === 'LOCKED' ? (
                                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                                    <span className="text-2xl opacity-50">🔒</span>
                                                </div>
                                            ) : (
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center border
                                                    ${status === 'ACTIVE' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-green-500/20 border-green-500 text-green-400'}
                                                `}>
                                                    <IconBook className="w-6 h-6" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="text-center mb-6">
                                            <p className="text-xs text-slate-400 font-bold uppercase mb-1">Livro 0{index + 1}</p>
                                            <p className={`text-3xl font-black ${status === 'ACTIVE' ? 'text-white' : 'text-slate-500'}`}>
                                                R$ {price.toFixed(2).replace('.', ',')}
                                            </p>
                                        </div>

                                        {/* Actions (Only for Active) */}
                                        <div className="w-full mt-auto">
                                            {status === 'ACTIVE' ? (
                                                <div className="space-y-2">
                                                    <button
                                                        onClick={() => handleBuyCredit(price)}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-2 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-lg"
                                                    >
                                                        💳 Comprar
                                                    </button>
                                                    <button
                                                        onClick={handleVerifyAndEnter}
                                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-2 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-lg"
                                                    >
                                                        ✅ Já Paguei
                                                    </button>
                                                </div>
                                            ) : (
                                                <button disabled className="w-full bg-slate-800 text-slate-600 font-bold py-3 rounded-lg text-sm cursor-not-allowed border border-slate-700">
                                                    {status === 'USED' ? 'Resgatado' : 'Aguarde'}
                                                </button>
                                            )}
                                        </div>

                                    </div>
                                );
                            })}
                        </div>
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
                            {stats?.plan?.startDate ? (() => {
                                const start = new Date(stats.plan.startDate);
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
                                                    R$ {stats?.subscriptionPrice ? stats.subscriptionPrice.toFixed(2).replace('.', ',') : (planName === 'BLACK' ? '49,90' : planName === 'PRO' ? '34,90' : '19,90')} <span className="text-xs font-normal text-slate-500">/{isAnnual ? 'ano' : 'mês'}</span>
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
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-indigo-500/30 p-6 rounded-2xl w-full relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-indigo-500/20 transition-all"></div>

                                <p className="text-yellow-400 font-bold text-xs uppercase tracking-wider mb-4 leading-relaxed">
                                    A ATIVAÇÃO DESTE PLANO DESBLOQUEIRA O CUSTO DE GERAÇÃO DO PRIMEIRO LIVRO NO VALOR PROMOCIONAL DE:
                                </p>

                                <div className="flex flex-col gap-1 items-center lg:items-start">
                                    <div className="flex items-center gap-3">
                                        <span className="text-4xl">💰</span>
                                        <div>
                                            <span className="text-4xl md:text-5xl font-black text-white tracking-tight">R$ {nextBookDisplayPrice.toFixed(2).replace('.', ',')}</span>
                                            <span className="text-slate-400 text-sm font-bold ml-2">/geração</span>
                                        </div>
                                    </div>

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
                                    {/* The user's provided snippet for handleVerifyAndEnter logic is placed here,
                                        but it should be inside the handleVerifyAndEnter function definition.
                                        Since the function definition is not in the provided context,
                                        I'm placing the logic as a comment to indicate where it would go
                                        if the function were available, and then continuing with the original content.
                                        The instruction was to update the alert string *in* the function,
                                        not to insert the function's body here.
                                    */}
                                    {/* Benefits List Content */}
                                    <div className="space-y-3">
                                        {benefits.map((item: string, idx: number) => {
                                            const isNegative = item.startsWith('NÃO -');
                                            return (
                                                <div key={idx} className={`flex items-start gap-3 text-sm ${isNegative ? 'text-slate-500 italic' : 'text-slate-300'}`}>
                                                    {isNegative ? (
                                                        <span className="w-4 h-4 flex items-center justify-center text-red-500 font-bold">✕</span>
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                                    )}
                                                    <span className="leading-tight">{item}</span>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Progressive List Column REMOVED */}
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
                            <button onClick={onNewBook} className="text-indigo-600 font-bold hover:underline mt-2">Começar agora</button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {displayOrders.map((order: any, idx: number) => {
                                // Real Projects Only (Backend already filters, but we ensure frontend logic is book-centric)
                                return (
                                    <div key={idx} className="p-6 hover:bg-slate-50 transition border-b border-slate-100 last:border-0">
                                        {/* LAYOUT PARA LIVRO GERADO */}
                                        <div className="flex flex-col md:flex-row gap-6">
                                            {/* Ícone / Capa Placeholder */}
                                            <div className="w-20 h-28 bg-slate-800 rounded shadow-lg flex-shrink-0 hidden md:flex items-center justify-center text-4xl border border-slate-700">
                                                📕
                                            </div>

                                            {/* Informações */}
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded uppercase">Livro Gerado</span>
                                                    {order.pricingTag && (
                                                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-slate-200">
                                                            {order.pricingTag}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${order.status === 'COMPLETED' || order.status === 'LIVRO ENTREGUE' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                        {order.status === 'COMPLETED' || order.status === 'LIVRO ENTREGUE' ? 'Concluído' : 'Processando...'}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4 border-b border-slate-50 pb-1">
                                                        <span className="text-slate-400 uppercase text-[10px] tracking-widest font-bold min-w-[80px]">Autor:</span>
                                                        <span className="text-slate-800 font-bold text-sm tracking-tight">{order.author}</span>
                                                    </div>
                                                    <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4 border-b border-slate-50 pb-1">
                                                        <span className="text-slate-400 uppercase text-[10px] tracking-widest font-bold min-w-[80px]">Título:</span>
                                                        <span className="text-base font-serif font-black text-indigo-900 leading-tight">{order.title}</span>
                                                    </div>
                                                    <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-4">
                                                        <span className="text-slate-400 uppercase text-[10px] tracking-widest font-bold min-w-[80px]">Geração:</span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-slate-500 font-medium">
                                                                {new Date(order.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                            </span>
                                                            {order.valuation && (
                                                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                                                    R$ {order.valuation.toFixed(2).replace('.', ',')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Botões de Ação */}
                                            <div className="flex flex-col gap-4 min-w-[240px] border-l border-slate-100 pl-0 md:pl-6">
                                                {/* Download */}
                                                {(order.status === 'COMPLETED' || order.status === 'LIVRO ENTREGUE') && order.downloadUrl ? (
                                                    <div className="space-y-1">
                                                        <a
                                                            href={order.id ? `${(import.meta as any).env.VITE_API_URL || 'https://api.fabricadebestseller.com.br'}/api/admin/books/download/${order.id}` : '#'}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            download={`kit_completo_${order.id}.zip`}
                                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-lg text-sm flex items-center justify-center gap-2 transition shadow-md"
                                                        >
                                                            <IconDownload className="w-4 h-4" /> Download do Kit (.ZIP)
                                                        </a>
                                                        <p className="text-[10px] text-slate-400 text-center leading-tight px-1">
                                                            Arquivo disponível para download imediato.
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-lg text-sm text-center cursor-not-allowed">
                                                        Processando Geração...
                                                    </div>
                                                )}

                                                {/* Excluir */}
                                                <div className="space-y-1 mt-auto">
                                                    <button
                                                        onClick={() => handleDeleteProject(order.id)}
                                                        className="w-full bg-white border border-red-200 hover:bg-red-50 text-red-500 hover:text-red-600 font-bold py-2 px-4 rounded-lg text-sm transition text-center"
                                                    >
                                                        Excluir Definitivamente
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="pt-8 border-t border-slate-200">
                    <SocialShare
                        text="Estou criando livros incríveis com Inteligência Artificial! Conheça a Fábrica de Best Sellers."
                        className="opacity-70 hover:opacity-100 transition-opacity"
                    />
                </div>

            </main>
        </div >
    );
};
