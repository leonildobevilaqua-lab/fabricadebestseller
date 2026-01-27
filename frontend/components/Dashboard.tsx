
import React, { useEffect, useState } from 'react';
import { PenTool, Download, Star, CheckCircle, Clock } from 'lucide-react';
import { SocialShare } from './SocialShare'; // Assuming Lucide or similar, else inline SVGs

// Inline Icons fallback
const IconBook = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
const IconStar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const IconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>;

interface DashboardProps {
    user: any;
    onNewBook: () => void;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNewBook, onLogout }) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isPurchasing, setIsPurchasing] = useState(false);

    const handleGenerateClick = async () => {
        if (!user?.email) return;
        setIsPurchasing(true);
        try {
            // 1. Check Access Status (Corrected Endpoint)
            // Use Helper if available, else hardcode for now as per previous pattern
            const getApiBase = () => {
                const host = window.location.hostname;
                if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005'; // Dev Backend Port
                return 'https://api.fabricadebestseller.com.br';
            };

            const res = await fetch(`${getApiBase()}/api/payment/access?email=${user.email}`);

            // Handle if check-access fails (e.g. 404 or 500)
            if (!res.ok) {
                // Fallback: If we can't check access, assume we need to buy? 
                // Or better, show error.
                // But sticking to flow: let's try to proceed to purchase if check fails?
                // No, that's risky. Let's throw.
                throw new Error("Falha ao verificar créditos.");
            }

            const access = await res.json();

            if (access.credits > 0) {
                // Already has credit -> Proceed to Factory
                onNewBook();
            } else {
                // 2. Need to Pay -> Create Charge
                const purchaseRes = await fetch(`${getApiBase()}/api/purchase-direct`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email })
                });

                if (!purchaseRes.ok) {
                    const err = await purchaseRes.json().catch(() => ({ error: purchaseRes.statusText }));
                    throw new Error(err.error || "Erro na criação da cobrança");
                }

                const purchaseData = await purchaseRes.json();

                if (purchaseData.invoiceUrl) {
                    // Redirect to Asaas
                    // Redirect to Asaas (New Tab)
                    window.open(purchaseData.invoiceUrl, '_blank');
                    // Alert user to use the check button
                    alert("A página de pagamento foi aberta em uma nova aba. Após o pagamento, clique em 'PAGAMENTO EFETUADO - GERAR LIVRO AGORA'.");
                    setIsPurchasing(false);
                } else {
                    alert("Erro: URL de fatura não retornada.");
                    setIsPurchasing(false);
                }
            }
        } catch (e: any) {
            console.error(e);
            alert('Erro: ' + (e.message || "Erro de conexão"));
            setIsPurchasing(false);
        }
    };

    useEffect(() => {
        // Fetch User Stats
        const fetchMe = async () => {
            try {
                const getApiBase = () => {
                    const env = (import.meta as any).env.VITE_API_URL;
                    if (env) return env;
                    const host = window.location.hostname;
                    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005';
                    return 'https://api.fabricadebestseller.com.br';
                };

                // Get Token from somewhere? Or just use Email for MVP if backend supports it
                // For secure impl we would use token. For now let's use the email stored in user object
                const token = localStorage.getItem('bsf_token');
                const headers: any = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`${getApiBase()}/api/user/me?email=${user.email}`, {
                    headers
                });

                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (e) {
                console.error("Failed to fetch dashboard stats", e);
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, [user.email]);

    const planName = stats?.plan?.name || "FREE";
    const cycleCount = stats?.stats?.purchaseCycleCount || 0;
    const nextBookPrice = stats?.stats?.nextBookPrice || 16.90;
    const orders = stats?.orders || [];

    // Mock Orders if empty for demo
    const displayOrders = orders.length > 0 ? orders : [
        // { id: '1', title: 'A Arte de Vencer', date: '20/01/2026', status: 'COMPLETED' }
    ];

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

                {/* Gamification Card - 4 Button Cycle */}
                <div className="bg-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-slate-800">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                    <div className="relative z-10 mb-8 text-center md:text-left">
                        <h2 className="text-2xl font-black mb-2 flex items-center justify-center md:justify-start gap-2">
                            <span className="text-yellow-400"><IconStar /></span>
                            CICLO DE BENEFÍCIOS PROGRESSIVOS
                        </h2>
                        <p className="text-slate-400 text-sm max-w-2xl">
                            Como assinante <strong>{planName}</strong>, cada livro gerado desbloqueia um desconto maior para o próximo. Complete o ciclo de 4 livros para reiniciar os benefícios!
                        </p>
                    </div>

                    {/* Cycle Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                        {[0, 1, 2, 3].map((step) => {
                            // Define Prices based on Plan (Mirroring Backend)
                            let prices = [24.90, 22.41, 21.17, 19.92]; // STARTER
                            if (planName.includes('PRO')) prices = [19.90, 17.91, 16.92, 15.92];
                            if (planName.includes('BLACK')) prices = [16.90, 15.21, 14.37, 13.52];

                            const price = prices[step];
                            const isDone = step < cycleCount;
                            const isActive = step === cycleCount;
                            const isLocked = step > cycleCount;

                            return (
                                <div key={step} className={`relative rounded-2xl p-4 border transition-all duration-300 flex flex-col items-center justify-center text-center group
                                    ${isActive ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20 scale-105 z-20' :
                                        isDone ? 'bg-emerald-900/10 border-emerald-500/30 opacity-70' :
                                            'bg-slate-800/50 border-slate-700 opacity-50 grayscale'}`}>

                                    {/* Badge */}
                                    <div className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap
                                        ${isActive ? 'bg-indigo-500 text-white shadow-lg' :
                                            isDone ? 'bg-emerald-600 text-white' :
                                                'bg-slate-700 text-slate-400'}`}>
                                        {isActive ? 'PRÓXIMO LIVRO' : isDone ? 'COMPLETO' : `LIVRO 0${step + 1}`}
                                    </div>

                                    {/* Icon */}
                                    <div className="mb-3 mt-2">
                                        {isDone ? (
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                        ) : isLocked ? (
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                            </div>
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-white text-indigo-600 flex items-center justify-center shadow-indigo-500/50 shadow-lg animate-pulse">
                                                <IconBook />
                                            </div>
                                        )}
                                    </div>

                                    {/* Price */}
                                    <div className="mb-3">
                                        <p className="text-xs text-slate-400 font-bold uppercase">Valor Unitário</p>
                                        <p className={`text-xl md:text-2xl font-black ${isActive ? 'text-white' : 'text-slate-500'}`}>
                                            R$ {price.toFixed(2).replace('.', ',')}
                                        </p>
                                    </div>

                                    {/* Button */}
                                    {isActive ? (
                                        <div className="flex flex-col gap-2 w-full">
                                            <button
                                                onClick={handleGenerateClick}
                                                disabled={isPurchasing}
                                                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isPurchasing ? (
                                                    <span className="animate-spin">⌛</span>
                                                ) : (
                                                    <>
                                                        <span className="text-lg">⚡</span> GERAR AGORA
                                                    </>
                                                )}
                                            </button>

                                            {/* Manual Payment Check Button */}
                                            <button
                                                onClick={async () => {
                                                    const getApiBase = () => {
                                                        const host = window.location.hostname;
                                                        if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005';
                                                        return 'https://api.fabricadebestseller.com.br';
                                                    };

                                                    if (isPurchasing) return;
                                                    setIsPurchasing(true);

                                                    try {
                                                        // Add timestamp to prevent caching
                                                        const res = await fetch(`${getApiBase()}/api/payment/access?email=${user.email}&_t=${Date.now()}`);
                                                        const data = await res.json();

                                                        if (data.credits > 0) {
                                                            alert("Pagamento Confirmado! Iniciando geração...");
                                                            onNewBook();
                                                        } else {
                                                            alert("O banco ainda não confirmou o pagamento. Isso pode levar de 10 a 60 segundos. Por favor, aguarde um momento e clique novamente.");
                                                        }
                                                    } catch (e) {
                                                        alert("Erro ao verificar conexão com o servidor.");
                                                    } finally {
                                                        setIsPurchasing(false);
                                                    }
                                                }}
                                                disabled={isPurchasing}
                                                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 uppercase tracking-wider"
                                            >
                                                {isPurchasing ? "Verificando..." : "JÁ PAGUEI - LIBERAR AGORA"}
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-8 flex items-center justify-center">
                                            {isDone ? <span className="text-xs text-emerald-500 font-bold">Já Gerado</span> : <span className="text-xs text-slate-600 font-bold">Bloqueado</span>}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
                                <span className="text-indigo-400">{stats?.plan?.billing === 'annual' ? 'ANUAL' : 'MENSAL'}</span>
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
                                                    R$ {stats?.subscriptionPrice ? stats.subscriptionPrice.toFixed(2).replace('.', ',') : (planName === 'BLACK' ? '49,90' : planName === 'PRO' ? '34,90' : '29,90')} <span className="text-xs font-normal text-slate-500">/{isAnnual ? 'ano' : 'mês'}</span>
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
                                            <span className="text-4xl md:text-5xl font-black text-white tracking-tight">R$ {Number(nextBookPrice).toFixed(2).replace('.', ',')}</span>
                                            <span className="text-slate-400 text-sm font-bold ml-2">/geração</span>
                                        </div>
                                    </div>
                                    <p className="text-emerald-400 text-xs font-bold uppercase mt-2 shadow-emerald-500/50">+ Descontos Progressivos 🎁</p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN */}
                        <div className="flex flex-col gap-8 lg:border-l lg:border-slate-800 lg:pl-8">
                            {/* Benefits List */}
                            <div className="flex-1 space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-800 pb-2 mb-6">
                                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">O QUE ESTÁ INCLUÍDO:</p>
                                    <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest hidden md:block">TABELA PROGRESSIVA</p>
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

                                    {/* Progressive List Column */}
                                    <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 h-max self-start md:w-48">
                                        <p className="text-indigo-400 font-bold text-[10px] uppercase tracking-widest mb-4 text-center md:hidden">Valores Progressivos</p>
                                        <div className="space-y-3">
                                            {(planName.includes('BLACK') ? [16.90, 15.21, 14.37, 13.52] : planName.includes('PRO') ? [19.90, 17.91, 16.92, 15.92] : [24.90, 22.41, 21.17, 19.92]).map((p, i) => (
                                                <div key={i} className={`flex justify-between items-center ${i === cycleCount ? 'bg-indigo-600/20 -mx-2 px-2 py-1.5 rounded border border-indigo-500/30' : 'opacity-60'}`}>
                                                    <span className="text-[10px] uppercase font-bold text-slate-400">Livro {i + 1}</span>
                                                    <span className="text-sm font-black text-white">R$ {p.toFixed(2).replace('.', ',')}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
                                            <p className="text-[10px] text-slate-500 uppercase font-bold">Reinicia a cada 4 livros</p>
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
                            <button onClick={onNewBook} className="text-indigo-600 font-bold hover:underline mt-2">Começar agora</button>
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
                                            <p className="text-xs text-slate-500 uppercase">{order.date ? new Date(order.date).toLocaleDateString() : 'Data desconhecida'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                            ${order.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                            {order.status === 'COMPLETED' ? 'Concluído' : 'Processando'}
                                        </span>
                                        {order.status === 'COMPLETED' && order.downloadUrl && (
                                            <a
                                                href={order.downloadUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                                title="Baixar Livro"
                                            >
                                                <IconDownload />
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
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
        </div>
    );
};
