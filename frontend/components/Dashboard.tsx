
import React, { useEffect, useState } from 'react';
import { PenTool, Download, Star, CheckCircle, Clock } from 'lucide-react'; // Assuming Lucide or similar, else inline SVGs

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

                {/* Gamification Card */}
                <div className="bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-black mb-2 flex items-center justify-center md:justify-start gap-2">
                                <span className="text-yellow-400"><IconStar /></span>
                                CICLO DE BENEFÍCIOS
                            </h2>
                            <p className="text-indigo-200 text-sm max-w-md">
                                Como assinante <strong>{planName}</strong>, você tem acesso a preços exclusivos. Continue gerando para desbloquear mais vantagens!
                            </p>
                        </div>

                        <div className="flex-1 w-full max-w-md bg-indigo-950/50 rounded-xl p-4 border border-indigo-500/30">
                            <div className="flex justify-between text-xs font-bold text-indigo-300 uppercase mb-2">
                                <span>Progresso do Ciclo</span>
                                <span>{cycleCount}/5 Livros</span>
                            </div>
                            <div className="w-full bg-slate-900 rounded-full h-3 mb-2 border border-slate-700">
                                <div
                                    className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full rounded-full transition-all duration-1000"
                                    style={{ width: `${(cycleCount / 5) * 100}%` }}
                                ></div>
                            </div>
                            <p className="text-center text-xs text-yellow-400 font-bold">
                                🚀 Próximo livro por apenas R$ {Number(nextBookPrice).toFixed(2).replace('.', ',')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* PLAN OVERVIEW SECTION (CONFORME TELA 9) */}
                <div className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden text-center border border-slate-800 shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 via-purple-500 to-indigo-500"></div>

                    <div className="inline-block bg-yellow-400 p-3 rounded-full mb-4 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                        <Star className="text-slate-900 w-8 h-8 fill-current" />
                    </div>

                    <h2 className="text-3xl font-black mb-1">{planName}</h2>
                    <p className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-8">
                        {planName === 'STARTER' ? 'AUTOR INICIANTE' : planName === 'PRO' ? 'AUTOR PROFISSIONAL' : 'AUTOR BEST-SELLER'}
                    </p>

                    <div className="bg-slate-800/50 rounded-2xl p-6 max-w-sm mx-auto border border-slate-700 mb-8 backdrop-blur-sm">
                        <div className="text-center">
                            <p className="text-slate-400 text-xs font-bold uppercase mb-2">Preço Assinatura</p>
                            <p className="text-4xl font-black text-white">
                                R$ {stats?.subscriptionPrice?.toFixed(2).replace('.', ',') || '0,00'} <span className="text-sm font-normal text-slate-500">/{stats?.plan?.billing === 'annual' ? 'ano' : 'mês'}</span>
                            </p>
                        </div>
                    </div>

                    <div className="bg-yellow-500 text-slate-900 font-bold p-3 rounded-lg uppercase text-xs inline-block mb-6 shadow-lg shadow-yellow-500/20">
                        A ESCOLHA DESTE PLANO DESBLOQUEIA <br /> O CUSTO POR LIVRO NO VALOR DE:
                    </div>

                    <div className="flex items-center justify-center gap-2 mb-2">
                        <span className="text-3xl">💰</span>
                        <span className="text-3xl font-bold text-white">R$ {Number(nextBookPrice).toFixed(2).replace('.', ',')}</span>
                        <span className="text-slate-400 text-sm">/geração</span>
                    </div>
                    <p className="text-emerald-400 text-xs font-bold uppercase mb-8">+ Descontos Progressivos 🎁</p>

                    <div className="text-left max-w-md mx-auto space-y-3">
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mb-4 text-center">O QUE ESTÁ INCLUÍDO:</p>
                        {[
                            { text: "Acesso à Plataforma Fábrica de Best Sellers", included: true },
                            { text: "Geração de Livros (14 Capítulos)", included: true },
                            { text: "Conteúdo Robusto (+160 Páginas)", included: true },
                            { text: "Diagramação Automática Profissional", included: true },
                            { text: "Folha de Rosto & Título Diagramadas", included: true },
                            { text: "Sumário Automático", included: true },
                            { text: "Histórico de livros gerados", included: true },
                            // Variations based on Plan (using simplified logic for demo, could be props)
                            { text: "Pág. Agradecimento, Dedicatória e Sobre o Autor (Auto)", included: planName !== 'STARTER' },
                            { text: "Acesso à Comunidade", included: planName !== 'STARTER' },
                            { text: "Kit de Marketing e Vendas", included: planName === 'PRO' || planName === 'BLACK' },
                            { text: "Suporte Prioritário", included: planName === 'BLACK' },
                            { text: "Mentoria", included: planName === 'BLACK' },
                        ].map((item, idx) => (
                            <div key={idx} className={`flex items-start gap-3 text-sm ${item.included ? 'text-slate-300' : 'text-red-400 opacity-60 line-through'}`}>
                                <div className="mt-0.5">{item.included ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <span className="text-red-500 font-bold text-xs">✕</span>}</div>
                                <span>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Main Action */}
                <div className="text-center py-8">
                    <button
                        onClick={onNewBook}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-6 px-12 rounded-2xl text-2xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4 mx-auto"
                    >
                        <span className="bg-white/20 p-2 rounded-lg"><IconBook /></span>
                        GERAR NOVO LIVRO
                    </button>
                    <p className="text-slate-500 text-sm mt-4">
                        Clique para iniciar a criação de um novo best-seller com IA.
                    </p>
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

            </main>
        </div>
    );
};
