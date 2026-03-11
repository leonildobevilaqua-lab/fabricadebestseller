import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Clock, ChevronRight, CheckCircle2, Rocket, Download, Target, Briefcase } from 'lucide-react';
import { trackInitiateCheckout, trackPurchase } from '../services/meta-pixel';

export const AffiliationUpsell: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

    useEffect(() => {
        if (timeLeft <= 0) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCTAClick = () => {
        trackInitiateCheckout('Afiliacao - Pasta Secreta', 99.90);
        trackPurchase(99.90, 'BRL', 'Afiliacao - Pasta Secreta');
        window.open('https://pay.kiwify.com.br/eAZIvMi', '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="min-h-screen bg-[#050b1a] text-white font-sans selection:bg-blue-500/30 pb-20 md:pb-0 overflow-x-hidden">
            {/* STICKY TOP TIMER */}
            <div className="bg-[#0a1529] border-b border-[#d4af37] py-2 sticky top-0 z-[60] shadow-[0_0_20px_rgba(212,175,55,0.2)]">
                <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2">
                        <Clock size={18} className="text-[#d4af37] animate-pulse" />
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#d4af37]">Oportunidade limitada expira em:</span>
                    </div>
                    <span className="font-mono text-2xl md:text-3xl font-black text-[#d4af37] leading-none">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* HEADER AREA */}
            <motion.header 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative py-16 px-6 text-center overflow-hidden"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent"></div>
                <div className="relative z-10 max-w-4xl mx-auto space-y-6">
                    <motion.div 
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="inline-block px-4 py-1.5 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-[10px] font-black uppercase tracking-widest mb-4"
                    >
                        Oferta Única de Upsell
                    </motion.div>
                    <h1 className="text-3xl md:text-6xl font-black uppercase tracking-tighter leading-[0.9] italic text-glow-blue">
                        <span className="text-blue-500">A Chave do Cofre:</span> <br />
                        Copie e Cole meus Criativos que Vendem R$ 1.000,00 por Dia!
                    </h1>
                    <p className="text-lg md:text-2xl font-bold text-gray-300 max-w-2xl mx-auto leading-tight italic">
                        Não tente inventar a roda. Utilize o arsenal de marketing profissional da Fábrica de Best Seller e lucre alto como nosso Representante Autorizado.
                    </p>
                </div>
            </motion.header>

            <main className="max-w-5xl mx-auto px-6 py-6 space-y-20 relative z-10">
                
                <section className="grid lg:grid-cols-12 gap-12 items-center">
                    {/* VIDEO CONTAINER */}
                    <motion.div 
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-8 aspect-video w-full bg-black ring-1 ring-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] overflow-hidden relative"
                    >
                        <iframe 
                            className="absolute inset-0 w-full h-full"
                            src="https://www.youtube.com/embed/qyZ5F1oZJyg?autoplay=1"
                            title="A Chave do Cofre"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                        ></iframe>
                    </motion.div>

                    {/* SIDE PANEL / CALL TO ACTION */}
                    <motion.div 
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-4 space-y-8"
                    >
                        <div className="bg-blue-900/20 border border-blue-500/20 p-8 rounded-sm backdrop-blur-sm relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            
                            <div className="space-y-2 mb-6">
                                <div className="text-gray-400 text-sm line-through decoration-red-500 font-bold">DE: R$ 297,90</div>
                                <div className="text-sm font-black text-blue-400 uppercase tracking-widest">Apenas hoje:</div>
                                <div className="text-6xl font-black text-[#d4af37] text-glow">R$ 99,90</div>
                            </div>

                            <button 
                                onClick={handleCTAClick}
                                className="w-full py-6 bg-[#d4af37] text-black font-black uppercase text-center hover:bg-yellow-400 transition-all flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(212,175,55,0.3)] transform hover:scale-[1.03] active:scale-95 duration-200 text-sm tracking-tighter"
                            >
                                SIM! QUERO ACESSO À PASTA SECRETA E ME AFILIAR
                                <ChevronRight size={20} />
                            </button>

                            <a 
                                href="/login"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full mt-4 py-4 border border-blue-500/30 text-blue-400 font-bold uppercase text-center hover:bg-blue-500/10 transition-all text-[10px] tracking-widest"
                            >
                                Já sou membro? Ir para o Login
                            </a>
                            
                            <p className="mt-4 text-[10px] text-gray-500 text-center font-bold uppercase tracking-widest">
                                🔒 Acesso imediato à área VIP de criativos
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 group">
                                <div className="p-3 bg-blue-600/10 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                                    <ShieldCheck className="text-blue-500" />
                                </div>
                                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Representante Autorizado</p>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* VISUAL BREAK / PERSONAS */}
                <section className="grid md:grid-cols-2 gap-12 items-center py-10">
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="order-2 md:order-1"
                    >
                        <h2 className="text-3xl font-black uppercase italic mb-6 text-glow-blue tracking-tight">O Sucesso Deixa Rastros</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4 p-4 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 rounded-sm">
                                <Rocket className="text-blue-500 shrink-0" size={24} />
                                <div>
                                    <h4 className="font-black uppercase text-sm mb-1 tracking-widest">Marketing Pronto</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">Acesso total a vídeos, artes e copies profissionais.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 rounded-sm">
                                <Download className="text-blue-500 shrink-0" size={24} />
                                <div>
                                    <h4 className="font-black uppercase text-sm mb-1 tracking-widest">Acesso imediato</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">Acesso imediato a todo o material de marketing validado que me fizeram lucrar mais de R$ 1.000,00 por dia.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 rounded-sm">
                                <Target className="text-blue-500 shrink-0" size={24} />
                                <div>
                                    <h4 className="font-black uppercase text-sm mb-1 tracking-widest">Produto de Alta Conversão</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">Venda o serviço de criação de livros por R$ 39,90.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 p-4 hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 rounded-sm">
                                <Briefcase className="text-blue-500 shrink-0" size={24} />
                                <div>
                                    <h4 className="font-black uppercase text-sm mb-1 tracking-widest">Foco em Não Ficção</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">Tecnologia de IA para livros técnicos com padrão Amazon KDP.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="order-1 md:order-2 grid grid-cols-2 gap-4 h-[400px]"
                    >
                        <div className="relative overflow-hidden rounded-sm ring-1 ring-white/10 shadow-2xl">
                            <img src="/assets/persona1.png" alt="Success Persona" className="w-full h-full object-cover grayscale-0 hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                        </div>
                        <div className="relative overflow-hidden rounded-sm ring-1 ring-white/10 shadow-2xl mt-12 mb-[-3rem]">
                            <img src="/assets/persona2.png" alt="Success Persona" className="w-full h-full object-cover grayscale-0 hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                        </div>
                    </motion.div>
                </section>

                {/* FINAL STICKY CTA ON MOBILE */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-md border-t border-white/10 z-[70]">
                    <button 
                        onClick={handleCTAClick}
                        className="w-full py-4 bg-[#d4af37] text-black font-black uppercase text-center rounded-sm text-xs"
                    >
                        SIM! QUERO ACESSO À PASTA SECRETA
                    </button>
                </div>
            </main>

            {/* TRUST AREA */}
            <footer className="py-24 px-6 text-center bg-[#03060f] border-t border-white/5">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-center gap-12 opacity-50 mb-12">
                    <div className="flex items-center gap-2 uppercase text-[10px] font-black tracking-[0.3em]">
                        <ShieldCheck className="text-blue-500" /> Compra 100% Segura
                    </div>
                    <div className="flex items-center gap-2 uppercase text-[10px] font-black tracking-[0.3em]">
                        <Award className="text-[#d4af37]" /> Suporte VIP
                    </div>
                    <div className="flex items-center gap-2 uppercase text-[10px] font-black tracking-[0.3em]">
                        <CheckCircle2 className="text-green-500" /> Acesso Imediato
                    </div>
                </div>
                <p className="mt-12 text-[10px] text-gray-700 uppercase tracking-widest font-black">
                    © 2026 Fábrica de Best Seller - Todos os direitos reservados
                </p>
            </footer>
            
            {/* Custom Styles for text glow */}
            <style dangerouslySetInnerHTML={{ __html: `
                .text-glow-blue {
                    text-shadow: 0 0 20px rgba(59, 130, 246, 0.4);
                }
            ` }} />
        </div>
    );
};
