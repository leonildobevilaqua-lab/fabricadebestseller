
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
                        <p className="text-slate-300 text-center mb-8 text-lg font-medium">
                            Parabéns pela ativação do seu plano <strong className="text-white">{offer?.planName || "PREMIUM"}</strong>.
                        </p>

                        {/* Progress Bar Visual - Keep as visual flair or hide? User screenshot didn't imply it, but user image 2 shows something? 
                            User Image 2 shows just the modal content. No progress bar visible in the text provided description but let's keep it subtle or hide if not needed.
                            Actually, the user screenshot does NOT show the progress bar. It shows just the text.
                            I will hide the progress bar if it's a "Unlock" event (presence of planName).
                        */}

                        {!offer?.planName && (
                            <div className="mb-8">
                                {/* ... existing progress bar code ... */}
                                {/* Trying to preserve existing logic for other use cases, so I'll just conditionally render it */}
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-bold text-green-400">NÍVEL 1</span>
                                    <span className="text-xs font-bold text-slate-500">NÍVEL 4</span>
                                </div>
                                <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-green-400 to-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-1000"
                                        style={{ width: `${(level / 4) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}

                        {/* Offer Box */}
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-cyan-500/30 text-center relative overflow-hidden">
                            <p className="text-slate-400 text-sm mb-2">
                                Você acaba de desbloquear o valor exclusivo:
                            </p>
                            {price && (
                                <div className="text-4xl font-black text-green-400 mb-2 drop-shadow-lg">
                                    {price}
                                </div>
                            )}
                            <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                PREÇO GARANTIDO PARA O 1º LIVRO DA GERAÇÃO
                            </p>
                        </div>

                    </div>

                    {/* Footer / Actions */}
                    <div className="bg-slate-950 p-6 flex flex-col gap-3">
                        <button
                            onClick={onClaim}
                            className="w-full relative overflow-hidden group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-500/20 transform hover:scale-[1.02]"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2 text-lg">
                                GERAR LIVRO AGORA! 🚀
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
