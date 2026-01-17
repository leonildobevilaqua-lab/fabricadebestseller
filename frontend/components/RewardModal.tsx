
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface RewardModalProps {
    isOpen: boolean;
    onClose: () => void;
    onClaim: () => void;
    offer?: any;
}

export const RewardModal: React.FC<RewardModalProps> = ({ isOpen, onClose, onClaim, offer }) => {

    useEffect(() => {
        if (isOpen) {
            // Trigger Confetti
            const duration = 3000;
            const animationEnd = Date.now() + duration;
            const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 }; // High z-index for modal

            const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

            const interval: any = setInterval(function () {
                const timeLeft = animationEnd - Date.now();

                if (timeLeft <= 0) {
                    return clearInterval(interval);
                }

                const particleCount = 50 * (timeLeft / duration);

                // since particles fall down, start a bit higher than random
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
                confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
            }, 250);

            return () => clearInterval(interval);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const level = offer?.level || 2;
    const discount = level === 1 ? 0 : level === 2 ? 10 : level === 3 ? 15 : 20;
    const price = offer?.price ? `R$ ${offer.price.toFixed(2)}` : null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
            <div className="relative w-full max-w-lg mx-4">
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-400 to-purple-600 rounded-2xl blur opacity-30 animate-pulse"></div>

                <div className="relative bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl shadow-cyan-500/20 overflow-hidden">

                    {/* Header */}
                    <div className="bg-slate-950/50 p-6 text-center border-b border-slate-800">
                        <div className="inline-block animate-bounce mb-2">
                            <span className="text-4xl">🎉</span>
                        </div>
                        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-wider uppercase">
                            Conquista Desbloqueada!
                        </h2>
                    </div>

                    {/* Body */}
                    <div className="p-8">
                        <p className="text-slate-300 text-center mb-8 text-sm leading-relaxed">
                            Enquanto você baixa seu livro, liberamos um presente para manter seu fluxo criativo.
                        </p>

                        {/* Progress Bar Visual */}
                        <div className="mb-8">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold text-green-400">NÍVEL 1</span>
                                <span className="text-xs font-bold text-slate-500">NÍVEL 4</span>
                            </div>

                            {/* Track */}
                            <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                                {/* Fill based on Level */}
                                <div
                                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000"
                                    style={{ width: `${(level / 4) * 100}%` }}
                                ></div>
                            </div>

                            {/* Steps Icons */}
                            <div className="flex justify-between mt-3 text-center">
                                {/* Levels Render */}
                                {[1, 2, 3, 4].map(l => {
                                    const isDone = l < level;
                                    const isCurrent = l === level;
                                    const isLocked = l > level;

                                    const disc = l === 1 ? '0%' : l === 2 ? '10%' : l === 3 ? '15%' : '20%';

                                    if (isCurrent) {
                                        return (
                                            <div key={l} className="flex flex-col items-center gap-1 relative">
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping"></div>
                                                <div className="w-10 h-10 -mt-1 rounded-full bg-cyan-950 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.6)] animate-pulse">
                                                    <span className="text-xs font-black">{disc}</span>
                                                </div>
                                                <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wide">Atual</span>
                                            </div>
                                        );
                                    } else if (isDone) {
                                        return (
                                            <div key={l} className="flex flex-col items-center gap-1">
                                                <div className="w-8 h-8 rounded-full bg-green-900 border border-green-500 flex items-center justify-center text-green-400 shadow-[0_0_10px_rgba(74,222,128,0.3)]">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                                </div>
                                                <span className="text-[10px] text-green-500 font-bold">FEITO</span>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div key={l} className="flex flex-col items-center gap-1 opacity-50 grayscale">
                                                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400">
                                                    <span className="text-[10px] font-bold">{disc}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-bold">BLOQ</span>
                                            </div>
                                        );
                                    }
                                })}
                            </div>
                        </div>

                        {/* Offer Box */}
                        <div className="bg-slate-800/50 rounded-xl p-5 border border-cyan-500/30 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-1">
                                <span className="bg-cyan-500 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded-bl-lg uppercase">Novo!</span>
                            </div>
                            <p className="text-slate-300 text-sm">
                                Você acaba de desbloquear o <span className="text-cyan-400 font-bold">NÍVEL {level}</span>. <br />
                                Gere seu próximo Best Seller com <span className="text-cyan-300 font-black text-lg">{discount}% DE DESCONTO</span> agora mesmo.
                            </p>
                            {price && <div className="mt-2 text-xl font-bold text-white">{price}</div>}
                        </div>

                    </div>

                    {/* Footer / Actions */}
                    <div className="bg-slate-950 p-6 flex flex-col gap-3">
                        <button
                            onClick={onClaim}
                            className="w-full relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20 transform hover:scale-[1.02]"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                🚀 QUERO GANHAR ESTE DESCONTO
                            </span>
                            {/* Shine effect */}
                            <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shine"></div>
                        </button>

                        <button
                            onClick={onClose}
                            className="text-xs text-slate-500 hover:text-slate-300 transition underline decoration-slate-700 hover:decoration-slate-500"
                        >
                            Fechar e aproveitar depois
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
