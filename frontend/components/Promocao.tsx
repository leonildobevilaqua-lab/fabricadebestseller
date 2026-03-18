import React, { useState, useEffect } from 'react';
import { registerPromoLead } from '../services/api';

const Promocao: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValid, setIsValid] = useState(false);

    // KIWIFY CHECKOUT LINK
    const CHECKOUT_URL = 'https://pay.kiwify.com.br/ZMGu0vr';

    useEffect(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const isFormValid = name.trim().length >= 3 && emailRegex.test(email) && phone.trim().length >= 10;
        setIsValid(isFormValid);
    }, [name, email, phone]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValid || isLoading) return;

        setIsLoading(true);
        try {
            await registerPromoLead(name, email, phone);
            // Redireciona para o checkout após salvar o lead
            window.location.href = CHECKOUT_URL;
        } catch (error) {
            console.error('Erro ao registrar lead:', error);
            // Mesmo com erro no lead, vamos tentar redirecionar para não perder a venda
            window.location.href = CHECKOUT_URL;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-3xl opacity-60 animate-pulse" />
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-3xl opacity-60" />
            </div>

            <main className="relative z-10 max-w-lg mx-auto px-6 pt-12 pb-24 md:pt-20">
                {/* Hero Section */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 border border-red-200 text-red-700 text-xs font-bold uppercase tracking-wider mb-6 animate-bounce">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        Oferta Relâmpago
                    </div>
                    
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.15]">
                        OFERTA RELÂMPAGO: <br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">
                            Seu Primeiro Livro Profissional
                        </span> Gerado por apenas R$ 5,99
                    </h1>

                    <p className="text-lg text-slate-600 mb-8 max-w-sm mx-auto">
                        Crie o seu livro profissional de forma instantânea com a nossa inteligência artificial de elite.
                    </p>

                    {/* Image Placeholder */}
                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-2xl shadow-indigo-200/50 mb-10 border border-slate-100 bg-slate-50 flex items-center justify-center group">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600/5 to-transparent z-10" />
                        <div className="text-center p-8 z-20">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4 mx-auto border border-slate-100 transform group-hover:scale-110 transition-transform duration-300">
                                <span className="text-3xl">📚</span>
                            </div>
                            <p className="text-sm font-semibold text-slate-400 italic">Arte da Oferta sendo preparada...</p>
                        </div>
                    </div>
                </div>

                {/* Benefits Section */}
                <div className="grid grid-cols-1 gap-4 mb-12">
                    {[
                        { icon: '⚡', text: 'Geração em 30 minutos' },
                        { icon: '📄', text: 'Mais de 170 páginas de conteúdo' },
                        { icon: '📊', text: 'Pesquisa real de mercado integrada' },
                        { icon: '✍️', text: 'Sem precisar escrever uma única linha' }
                    ].map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white transition-all duration-200">
                            <span className="text-xl">{benefit.icon}</span>
                            <span className="font-semibold text-slate-700">{benefit.text}</span>
                        </div>
                    ))}
                </div>

                {/* Form Section */}
                <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full whitespace-nowrap">
                        🔒 Checkout Seguro
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                Nome Completo
                            </label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Seu nome"
                                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                Melhor E-mail
                            </label>
                            <input
                                id="email"
                                type="email"
                                placeholder="seu@email.com"
                                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">
                                WhatsApp
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                placeholder="(00) 00000-0000"
                                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={!isValid || isLoading}
                                className={`w-full py-5 rounded-2xl font-bold text-lg shadow-lg transition-all duration-300 transform ${
                                    isValid && !isLoading
                                        ? 'bg-gradient-to-br from-indigo-600 to-blue-600 text-white hover:shadow-indigo-500/40 hover:-translate-y-1 active:scale-95'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {isLoading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Processando...
                                    </span>
                                ) : 'IR PARA O CHECKOUT'}
                            </button>
                            <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
                                Ao clicar você concorda que poderemos entrar em contato para enviar o acesso ao seu livro e outras ofertas.
                            </p>
                        </div>
                    </form>
                </div>

                {/* Footer Section */}
                <footer className="mt-16 pt-8 border-t border-slate-100 text-center">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Editora 360 Express
                    </p>
                    <p className="text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                        Todos os direitos reservados. CNPJ 38.081.569/0001-38 <br/> 
                        Fabricação instantânea de Bestsellers sob demanda.
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default Promocao;
