import React, { useState, useEffect } from 'react';
import { Disclaimer } from './Disclaimer';
import { BookOpen, ShieldCheck } from 'lucide-react';

interface LandingProps {
    onStart: (userData: any) => void;
    onLoginClick: () => void;
}

const LandingPage: React.FC<LandingProps> = ({ onStart, onLoginClick }) => {
    const [showOffer, setShowOffer] = useState(false);

    // 3 minutes and 25 seconds = 205 seconds
    const DELAY_SECONDS = 205;

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowOffer(true);
        }, DELAY_SECONDS * 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0f1d] text-white font-sans flex flex-col items-center selection:bg-yellow-500 selection:text-slate-900">
            {/* --- VSL SECTION --- */}
            <main className="w-full max-w-4xl px-4 pt-10 md:pt-20 flex-grow">
                {/* Responsive 16:9 Container */}
                <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/7iQ5BdT6R3k?autoplay=1&modestbranding=1&rel=0"
                        title="Fábrica de Best Sellers VSL"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>

                {/* --- DELAYED OFFER SECTION --- */}
                <div 
                    id="offer-section"
                    className={`mt-10 mb-20 transition-all duration-1000 transform ${
                        showOffer ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                    }`}
                >
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-12 border border-slate-700 shadow-2xl text-center max-w-2xl mx-auto">
                        <span className="bg-yellow-500/10 text-yellow-500 text-xs font-black px-4 py-2 rounded-full border border-yellow-500/20 uppercase tracking-widest mb-6 inline-block">
                            Acesso Vitalício - Pagamento Único
                        </span>
                        <h2 className="text-3xl md:text-4xl font-black mb-6">Gere Seu Futuro Best Seller AGORA</h2>
                        <div className="flex items-center justify-center gap-4 mb-8">
                            <span className="text-6xl font-black">R$ 39,90</span>
                        </div>
                        
                        <button 
                            onClick={() => window.open('https://payment.ticto.app/O6CE296D4', '_blank')}
                            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-5 rounded-2xl text-xl shadow-xl transition-all transform hover:scale-105"
                        >
                            QUERO MEU LIVRO POR R$ 39,90
                        </button>
                        
                        <p className="mt-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Pagamento Seguro via Ticto
                        </p>
                    </div>
                </div>
            </main>

            {/* --- FOOTER --- */}
            <footer className="w-full py-12 border-t border-white/5 bg-black/20">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-6 opacity-50">
                        <BookOpen className="text-yellow-400 w-5 h-5" />
                        <span className="font-bold text-sm tracking-tight">Fábrica de Best Sellers</span>
                    </div>
                    
                    <div className="text-slate-500 text-[10px] md:text-xs space-y-4">
                        <p>© 2026 Todos os direitos reservados.</p>
                        <Disclaimer />
                    </div>
                </div>
            </footer>

            {/* Hidden button for those who already know (opcional, mas comum em VSLs) */}
            <button 
                onClick={onLoginClick} 
                className="fixed top-4 right-4 bg-white/5 hover:bg-white/10 text-white/30 hover:text-white/60 px-3 py-1 rounded text-[10px] transition"
            >
                JÁ SOU ALUNO
            </button>
        </div>
    );
};

export default LandingPage;
