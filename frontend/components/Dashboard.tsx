
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
                            if (planName.includes('BLACK')) prices = [14.90, 13.41, 12.67, 11.92];

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
                                        <button
                                            onClick={onNewBook}
                                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg shadow-lg hover:shadow-indigo-500/30 transition-all flex items-center justify-center gap-1"
                                        >
                                            <span className="text-lg">⚡</span> GERAR AGORA
                                        </button>
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
