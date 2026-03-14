import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Award, Clock, ChevronRight, CheckCircle2 } from 'lucide-react';

export const RegistrationUpsell: React.FC = () => {
    const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds

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

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500/30 pb-20 md:pb-0">
            {/* STICKY TOP TIMER */}
            <div className="bg-[#b20000] border-b-2 border-[#d4af37] py-4 sticky top-0 z-[60] shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
                <div className="max-w-5xl mx-auto px-4 flex flex-col items-center justify-center gap-2">
                    <div className="flex items-center gap-3">
                        <Clock size={24} className="text-white animate-pulse" />
                        <span className="text-sm md:text-base font-black uppercase tracking-[0.2em] text-white">OFERTA EXPIRA EM:</span>
                    </div>
                    <span className="font-mono text-4xl md:text-5xl font-black text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">{formatTime(timeLeft)}</span>
                </div>
            </div>

            {/* ALERT HEADER */}
            <motion.header 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-[#b20000] py-8 px-4 text-center border-b-4 border-[#d4af37] relative z-50 shadow-2xl"
            >
                <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-white drop-shadow-lg italic">
                    ⚠️ ATENÇÃO: NÃO FECHE ESTA PÁGINA AINDA.
                </h1>
                <p className="mt-3 text-sm md:text-lg font-bold text-yellow-200 max-w-3xl mx-auto uppercase tracking-wide">
                    Garanta a legalização e o design profissional do seu livro com valores subsidiados pela Editora 360 Express.
                </p>
            </motion.header>

            <main className="max-w-5xl mx-auto px-6 py-12 space-y-20">
                {/* SALES VIDEO */}
                <motion.section 
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="aspect-video w-full max-w-4xl mx-auto ring-1 ring-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black overflow-hidden relative"
                >
                    <iframe 
                        className="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/5SvWFaneisc?autoplay=1"
                        title="Vendas Upsell"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                </motion.section>

                {/* COMPARISON TABLE */}
                <section className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tight text-glow">
                            CBL vs FÁBRICA DE BEST SELLER
                        </h2>
                        <p className="text-gray-400 mt-2 font-medium">Veja por que é inteligente garantir agora:</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse bg-[#111] ring-1 ring-white/10">
                            <thead>
                                <tr className="bg-[#1a1a1a] text-[#d4af37] border-b border-white/10">
                                    <th className="py-6 px-4 md:px-6 text-left font-black uppercase italic">Serviço</th>
                                    <th className="py-6 px-4 md:px-6 text-center font-black uppercase">CBL (Oficial)</th>
                                    <th className="py-6 px-4 md:px-6 text-right font-black uppercase italic">Fábrica de BS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="py-6 px-4 md:px-6 font-bold text-sm md:text-base">ISBN (Registro Único)</td>
                                    <td className="py-6 px-4 md:px-6 text-center text-gray-500 line-through text-sm">R$ 28,60</td>
                                    <td className="py-6 px-4 md:px-6 text-right font-black text-green-400 text-sm md:text-base">
                                        R$ 28,60 <span className="block text-[10px] text-gray-400 font-normal mt-1">Nós fazemos por você</span>
                                    </td>
                                </tr>
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="py-6 px-4 md:px-6 font-bold text-sm md:text-base">Código de Barras</td>
                                    <td className="py-6 px-4 md:px-6 text-center text-gray-500 line-through text-sm">R$ 41,20</td>
                                    <td className="py-6 px-4 md:px-6 text-right font-black text-green-400 text-sm md:text-base">R$ 29,90</td>
                                </tr>
                                <tr className="hover:bg-white/5 transition-colors">
                                    <td className="py-6 px-4 md:px-6 font-bold text-sm md:text-base">Ficha Catalográfica</td>
                                    <td className="py-6 px-4 md:px-6 text-center text-gray-500 line-through text-sm">R$ 68,60</td>
                                    <td className="py-6 px-4 md:px-6 text-right font-black text-green-400 text-sm md:text-base">R$ 49,90</td>
                                </tr>
                                <tr className="bg-[#d4af37]/10">
                                    <td className="py-8 px-4 md:px-6 font-black text-lg md:text-xl uppercase italic">VALOR TOTAL</td>
                                    <td className="py-8 px-4 md:px-6 text-center font-bold text-red-500 text-sm md:text-lg">R$ 138,40</td>
                                    <td className="py-8 px-4 md:px-6 text-right flex flex-col items-end">
                                        <div className="text-gray-400 text-xs md:text-sm line-through decoration-[#b20000] decoration-2 font-bold mb-1">R$ 108,40</div>
                                        <div className="font-black text-2xl md:text-4xl text-[#d4af37] text-glow leading-none">R$ 99,90</div>
                                        <div className="text-[10px] text-yellow-500 uppercase font-bold mt-2 animate-pulse">Desconto Extra Aplicado!</div>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* OFFER CARDS */}
                <div className="grid md:grid-cols-2 gap-8 pt-10">
                    {/* OFFER 01 */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-[#111] p-8 ring-1 ring-white/10 hover:ring-[#d4af37]/50 transition-all group flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="text-xl font-black uppercase text-gray-400 mb-2">Opção 01</h3>
                            <h4 className="text-3xl font-black uppercase italic mb-4">Pacote de Legalização Editorial</h4>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="text-green-500 w-5 h-5" /> 
                                    <span>ISBN Registrado</span>
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="text-green-500 w-5 h-5" /> 
                                    <span>Ficha Catalográfica Profissional</span>
                                </li>
                                <li className="flex items-center gap-2 text-gray-300">
                                    <CheckCircle2 className="text-green-500 w-5 h-5" /> 
                                    <span>Código de Barras EAN-13</span>
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-sm line-through decoration-red-500 font-bold mb-1">Soma R$ 108,40</span>
                                <div className="text-4xl font-black underline underline-offset-8 decoration-[#d4af37]">R$ 99,90</div>
                            </div>
                            <a 
                                href="https://pay.kiwify.com.br/HNBPplQ"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-5 bg-[#d4af37] text-black font-black uppercase text-center hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95 duration-200"
                            >
                                GARANTIR REGISTROS
                                <ChevronRight />
                            </a>
                        </div>
                    </motion.div>

                    {/* OFFER 02 */}
                    <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="bg-[#1a1a1a] p-8 ring-4 ring-[#d4af37] animate-pulse-gold relative group flex flex-col justify-between"
                    >
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#d4af37] text-black text-[10px] font-black px-4 py-1 uppercase tracking-widest whitespace-nowrap">
                            RECOMENDADO PELO LEONILDO
                        </div>
                        <div>
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-black uppercase text-[#d4af37]">Opção 02</h3>
                                <Award className="text-[#d4af37]" />
                            </div>
                            <h4 className="text-3xl font-black uppercase italic mb-4">Combo Best Seller</h4>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-2 text-white font-bold">
                                    <CheckCircle2 className="text-[#d4af37] w-5 h-5" /> 
                                    <span>Todos os Registros da Opção 01</span>
                                </li>
                                <li className="flex items-center gap-2 text-white font-bold">
                                    <CheckCircle2 className="text-[#d4af37] w-5 h-5" /> 
                                    <span>Capa Digital de Alta Performance</span>
                                </li>
                                <li className="flex items-center gap-2 text-gray-400 text-sm ml-7">
                                    (Frente, Verso, Orelhas e Lombada)
                                </li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <div className="text-5xl font-black text-glow">R$ 349,90</div>
                            <a 
                                href="https://pay.kiwify.com.br/At2Y6VS"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-5 bg-[#d4af37] text-black font-black uppercase text-center hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2 group-hover:scale-[1.02] active:scale-95 duration-200"
                            >
                                GARANTIR COMBO COMPLETO
                                <ChevronRight />
                            </a>
                        </div>
                    </motion.div>
                </div>

                {/* TRUST BADGES */}
                <section className="grid grid-cols-2 gap-8 pt-12 border-t border-white/5">
                    <div className="flex flex-col items-center text-center space-y-2 group">
                        <div className="p-4 bg-white/5 rounded-full group-hover:bg-green-500/20 transition-colors">
                            <ShieldCheck className="w-8 h-8 text-green-500" />
                        </div>
                        <h5 className="font-black uppercase text-xs tracking-widest">Compra Segura</h5>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tight">Tecnologia SSL & Kiwify</p>
                    </div>
                    <div className="flex flex-col items-center text-center space-y-2 group">
                        <div className="p-4 bg-white/5 rounded-full group-hover:bg-[#d4af37]/20 transition-colors">
                            <Award className="w-8 h-8 text-[#d4af37]" />
                        </div>
                        <h5 className="font-black uppercase text-xs tracking-widest">Garantia Satisfação</h5>
                        <p className="text-[10px] text-gray-500 uppercase tracking-tight">Qualidade Editorial 360 Express</p>
                    </div>
                </section>
            </main>

            {/* DISCRETE FOOTER */}
            <footer className="py-24 px-6 text-center bg-black/50 border-t border-white/5">
                <a 
                    href="/login"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block px-10 py-6 bg-[#ADFF2F] hover:bg-[#7CFC00] text-black text-lg font-black uppercase tracking-tighter transition-all transform hover:scale-105 active:scale-95 rounded-xl shadow-[0_10px_40px_rgba(173,255,47,0.3)]"
                >
                    NÃO QUERO PROTEGER MEU LIVRO AGORA, IR PARA ÁREA DE MEMBROS
                </a>
                <p className="mt-12 text-[10px] text-gray-700 uppercase tracking-widest font-black mb-6">
                    © 2026 Fábrica de Best Seller - Todos os direitos reservados
                </p>
            </footer>
        </div>
    );
};
