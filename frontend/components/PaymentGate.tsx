import React from 'react';

interface PaymentGateProps {
    isOpen: boolean;
    planName: string;
    bookPrice: number;
    subscriptionPrice?: number;
    checkoutUrl: string; // URL for Plan Activation OR Book Payment
    onConfirmPayment: () => void;
    userEmail: string;
}

export const PaymentGate: React.FC<PaymentGateProps> = ({
    isOpen,
    planName,
    bookPrice,
    subscriptionPrice = 0,
    checkoutUrl,
    onConfirmPayment,
    userEmail
}) => {
    if (!isOpen) return null;

    // MODE DETECTION
    // If subscriptionPrice > 0.1, User needs to Subscribe (NO AVULSO ALLOWED)
    // If subscriptionPrice <= 0.1, User is Subscriber getting an Extra Book.
    const isSubscriber = subscriptionPrice <= 0.1;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 animate-fade-in p-4 backdrop-blur-sm">
            <div className="max-w-md w-full bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col items-center relative">

                {/* Top Bar */}
                <div className={`w-full h-2 ${isSubscriber ? 'bg-green-500' : 'bg-red-500'}`}></div>

                <div className="p-8 w-full flex flex-col items-center text-center">

                    {/* Icon */}
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 border-4 ${isSubscriber ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-500'}`}>
                        {isSubscriber ? (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        ) : (
                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        )}
                    </div>

                    {!isSubscriber ? (
                        /* --- NON-SUBSCRIBER VIEW (BLOCKED) --- */
                        <>
                            <h1 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
                                Acesso Exclusivo para Membros
                            </h1>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                A tecnologia de Geração de Best-Sellers é exclusiva para assinantes dos planos <strong>Starter, Pro ou Black</strong>.
                            </p>

                            <div className="bg-slate-800/50 rounded-xl p-4 w-full mb-6 border border-slate-700">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-2">Assinatura Recomendada</div>
                                <div className="text-2xl font-bold text-white flex items-center justify-center gap-2">
                                    {planName}
                                </div>
                                <div className="text-green-400 font-bold text-lg mt-1">
                                    Start: R$ {subscriptionPrice.toFixed(2).replace('.', ',')} <span className="text-xs text-slate-500 font-normal">/mês</span>
                                </div>
                            </div>

                            <button
                                onClick={() => window.open(checkoutUrl, '_blank')}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-red-900/20 transition-transform active:scale-95 mb-4 uppercase"
                            >
                                ASSINAR AGORA
                            </button>

                            <p className="text-[10px] text-slate-600 mt-2">Não vendemos gerações avulsas.</p>
                        </>
                    ) : (
                        /* --- SUBSCRIBER VIEW (EXTRA GENERATION) --- */
                        <>
                            <h1 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
                                Limite do Plano Atingido
                            </h1>
                            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                                Você já usou seus créditos gratuitos. Como membro VIP, você pode gerar um <strong>livro extra</strong> com desconto exclusivo.
                            </p>

                            <div className="bg-slate-800/50 rounded-xl p-4 w-full mb-6 border border-slate-700">
                                <div className="text-xs text-slate-500 uppercase font-bold mb-2">Valor com Desconto de Membro</div>
                                <div className="text-3xl font-bold text-green-400">
                                    R$ {bookPrice.toFixed(2).replace('.', ',')}
                                </div>
                            </div>

                            <button
                                onClick={() => window.open(checkoutUrl, '_blank')}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-green-900/20 transition-transform active:scale-95 mb-4 uppercase"
                            >
                                GERAR LIVRO EXTRA
                            </button>
                        </>
                    )}

                    {/* Simulation Button for Testing (Hidden or subtle) */}
                    <button
                        onClick={onConfirmPayment}
                        className="mt-4 text-xs text-slate-600 hover:text-slate-400 underline"
                    >
                        [Simular Confirmação]
                    </button>

                </div>
            </div>
        </div>
    );
};
