import React, { useState, useEffect } from 'react';
import { registerPromoLead } from '../services/api';
import { setAdvancedMatching } from '../services/meta-pixel';

const Promocao: React.FC = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isValid, setIsValid] = useState(false);

    const CHECKOUT_URL = 'https://checkout.ticto.app/O01C5F91D';

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
            // Atualiza Correspondência Avançada do Meta Pixel instantaneamente
            setAdvancedMatching(email, phone);
            
            await registerPromoLead(name, email, phone);
            window.location.href = CHECKOUT_URL;
        } catch (error) {
            console.error('Lead log error:', error);
            window.location.href = CHECKOUT_URL;
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 font-sans md:h-screen md:overflow-hidden flex flex-col items-center">
            {/* Main Content Area - Full Fold */}
            <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-4 flex flex-col h-full justify-between">
                
                {/* Header */}
                <header className="text-center md:mb-2 pt-2">
                    <div className="inline-block bg-red-100 text-red-600 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-red-200">
                        ● Oferta Relâmpago
                    </div>
                    
                    <h1 className="text-3xl md:text-5xl font-[900] text-slate-900 leading-[1.1] mb-2">
                        OFERTA RELÂMPAGO: <br/> 
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600">
                            Seu Primeiro Livro Profissional
                        </span> Gerado por <br/> apenas R$ 9,99
                    </h1>

                    <p className="text-lg md:text-xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed px-4">
                        Crie o seu livro profissional de forma instantânea com a nossa inteligência artificial de elite
                    </p>
                </header>

                {/* Main Action Section (Form + Image) */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 flex-grow mt-6 mb-6">
                    
                    {/* Form Component */}
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl shadow-slate-200/60 border border-slate-100 flex flex-col justify-center relative transform transition-transform duration-300 hover:scale-[1.01]">
                        {/* Secure Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-full shadow-lg z-20">
                            <span className="text-yellow-400">🔒</span> CHECKOUT SEGURO
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    placeholder="Seu nome"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">
                                    Melhor E-mail
                                </label>
                                <input
                                    type="email"
                                    placeholder="seu@email.com"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="block text-[11px] font-extrabold text-slate-400 uppercase tracking-widest ml-1">
                                    WhatsApp
                                </label>
                                <input
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={!isValid || isLoading}
                                className={`w-full py-5 rounded-[1.8rem] font-black text-lg transition-all duration-300 shadow-xl tracking-wide ${
                                    isValid && !isLoading
                                        ? 'bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 text-white hover:shadow-blue-500/40 hover:-translate-y-1 active:scale-95'
                                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                            >
                                {isLoading ? 'PROCESSANDO...' : 'IR PARA O CHECKOUT'}
                            </button>
                            
                            <p className="text-[10px] text-center text-slate-400 font-medium px-4 leading-relaxed">
                                Ao clicar você concorda que poderemos entrar em contato para enviar o acesso ao seu livro e outras ofertas.
                            </p>
                        </form>
                    </div>

                    {/* Artwork Container - Styled to be LARGER than Form */}
                    <div className="w-full max-w-lg bg-white rounded-[2.5rem] p-4 md:p-6 shadow-2xl shadow-slate-200/60 border border-slate-100 flex flex-col items-center justify-center relative transform transition-transform duration-300 hover:scale-[1.01]">
                        <img 
                            src="/assets/promocao-arte-v2.png" 
                            alt="Oferta Relâmpago Arte"
                            className="w-full h-auto object-contain rounded-2xl transform rotate-1 hover:rotate-0 transition-transform duration-500"
                            onError={(e) => {
                                // Fallback if image not uploaded yet
                                e.currentTarget.src = "https://placehold.co/800x600/f8fafc/6366f1?text=Arte+da+Oferta";
                            }}
                        />
                    </div>
                </div>

                {/* Benefits Footer row - Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-8 md:pb-4">
                    {[
                        { icon: '⚡', text: 'Geração em 30 minutos' },
                        { icon: '📄', text: 'Mais de 170 páginas de conteúdo' },
                        { icon: '📊', text: 'Pesquisa real de mercado integrada' },
                        { icon: '✍️', text: 'Sem precisar escrever uma única linha' }
                    ].map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-4 rounded-[1.2rem] bg-white border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <span className="text-xl bg-slate-50 w-10 h-10 flex items-center justify-center rounded-full shrink-0">
                                {benefit.icon}
                            </span>
                            <span className="text-sm font-bold text-slate-700 leading-tight">
                                {benefit.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Absolute Bottom Footer (Legal) */}
            <div className="hidden md:block absolute bottom-1 right-4 opacity-50">
               <p className="text-[9px] font-bold text-slate-400 uppercase">Editora 360 Express • CNPJ 38.081.569/0001-38</p>
            </div>
        </div>
    );
};

export default Promocao;
