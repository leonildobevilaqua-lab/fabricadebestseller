
import React, { useEffect, useState } from 'react';

interface UpsellModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: () => void;
    onDownload: () => void; // New prop for downloading the file
    currentDiscount: number; // 0, 10, 15, 20
}

export const UpsellModal: React.FC<UpsellModalProps> = ({ isOpen, onClose, onAccept, onDownload, currentDiscount }) => {
    const [step, setStep] = useState(1); // 1 = Offer, 2 = Waiting Payment confirmation logic (manual)
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes

    useEffect(() => {
        if (!isOpen) return;
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [isOpen]);

    if (!isOpen) return null;

    const getNextDiscount = () => {
        if (currentDiscount === 0) return 10;
        if (currentDiscount === 10) return 15;
        if (currentDiscount === 15) return 20;
        if (currentDiscount === 20) return 0; // Reset
        return 10;
    };

    const nextDiscount = getNextDiscount();
    const basePrice = 24.90;
    const discountedPrice = (basePrice * (1 - nextDiscount / 100)).toFixed(2).replace('.', ',');

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (currentDiscount === 20 && nextDiscount === 0) {
        // Thank you state
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden border-4 border-purple-500">
                    <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>

                    <div className="mb-6 flex justify-center">
                        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl">👑</span>
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-gray-800 mb-2">Uau! Você é Incrível!</h2>
                    <p className="text-gray-600 mb-6">
                        Muito obrigado por gerar tantos livros conosco! Esperamos que eles sejam um sucesso absoluto.
                    </p>

                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 mb-6">
                        <p className="text-sm text-purple-800 font-medium">
                            A partir da próxima geração, o valor voltará ao normal (R$ 24,90), mas você poderá desbloquear novos descontos nas próximas sequências!
                        </p>
                    </div>

                    <button
                        onClick={onAccept}
                        className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-lg transform hover:scale-[1.02]"
                    >
                        Criar Mais um Livro
                    </button>

                    <button onClick={onClose} className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline">
                        Não, obrigado. Voltar ao início.
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-0 relative overflow-hidden">
                {/* Header */}
                <div className="bg-brand-600 p-6 text-white text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
                    <h3 className="text-xl font-medium opacity-90 mb-1">Oferta Exclusiva Limitada</h3>
                    <h2 className="text-4xl font-black tracking-tight">{nextDiscount}% DE DESCONTO</h2>
                    <div className="mt-4 inline-block bg-white/20 px-4 py-1 rounded-full text-sm font-bold border border-white/30">
                        ⏱️ Expira em {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="p-8 text-center">
                    <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                        Parabéns pela sua nova obra! 🎉 <br />
                        Aproveite o embalo e crie seu próximo best-seller agora mesmo com um desconto especial.
                    </p>

                    <div className="flex justify-center items-center gap-4 mb-8">
                        <div className="text-gray-400 line-through text-xl">R$ 24,90</div>
                        <div className="text-brand-600 text-4xl font-black">R$ {discountedPrice}</div>
                    </div>

                    <div className="space-y-4">
                        {step === 1 ? (
                            <>
                                <button
                                    onClick={() => {
                                        // Open Payment Page
                                        const url = nextDiscount > 0
                                            ? `https://pay.kiwify.com.br/SpCDp2q?discount=${nextDiscount}`
                                            : 'https://pay.kiwify.com.br/SpCDp2q';
                                        window.open(url, '_blank');
                                        setStep(2); // Move to "Ready to Start" view
                                    }}
                                    className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-xl hover:bg-green-600 transition shadow-xl shadow-green-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    <span>QUERO APROVEITAR!</span>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                </button>

                                <button
                                    onClick={() => {
                                        onDownload();
                                        // Optional: Close or stay? User might want to do both.
                                        // User said "Não efetue ... deixe que o cliente clique... popup".
                                        // Maybe close after download?
                                        // Let's keep it open or just close.
                                        // If they just download, they might miss the offer.
                                        // I'll leave it open but trigger download.
                                    }}
                                    className="block w-full text-slate-500 font-medium hover:text-slate-800 underline py-2"
                                >
                                    Apenas Baixar Meu Livro (Sem Oferta)
                                </button>
                            </>
                        ) : (
                            <div className="animate-fade-in space-y-4">
                                <div className="p-4 bg-green-50 rounded-lg text-green-800 text-sm mb-4">
                                    Excelente! Se você já realizou o pagamento, clique abaixo para iniciar a criação do seu novo livro.
                                </div>

                                <button
                                    onClick={onAccept} // This triggers onReset in Generator to start over
                                    className="w-full bg-brand-600 text-white py-4 rounded-xl font-bold text-xl hover:bg-brand-700 transition shadow-lg flex items-center justify-center gap-2"
                                >
                                    🚀 INICIAR NOVO LIVRO
                                </button>

                                <button
                                    onClick={() => {
                                        onDownload();
                                    }}
                                    className="block w-full text-slate-400 font-medium hover:text-slate-600 text-sm"
                                >
                                    (Clique aqui se o download do anterior não iniciou)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
