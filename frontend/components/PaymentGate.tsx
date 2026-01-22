
import React from 'react';

interface PaymentGateProps {
    isOpen: boolean;
    planName: string;
    bookPrice: number;
    subscriptionPrice?: number;
    checkoutUrl: string; // URL for Plan Activation
    onConfirmPayment: () => void;
    userEmail: string;
}

export const PaymentGate: React.FC<PaymentGateProps> = ({
    isOpen,
    planName,
    bookPrice,
    subscriptionPrice = 49.90,
    checkoutUrl,
    onConfirmPayment,
    userEmail
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 animate-fade-in p-4">
            <div className="max-w-xl w-full bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col items-center">

                {/* Yellow Top Bar */}
                <div className="w-full h-2 bg-yellow-400"></div>

                <div className="p-8 w-full flex flex-col items-center">

                    {/* Lock Icon Circle */}
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 border border-slate-600">
                        <svg className="w-10 h-10 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold text-white mb-4 uppercase tracking-wide text-center">
                        Tudo Pronto Para Iniciar
                    </h1>

                    <p className="text-slate-400 text-center mb-8 text-sm max-w-sm">
                        Para liberar a utilização da nossa API OFICIAL e gerar o conteúdo, efetue a taxa única.
                    </p>

                    {/* Warning Box */}
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 w-full mb-4 rounded-r-md">
                        <div className="flex gap-3">
                            <div className="text-yellow-600 mt-0.5">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                            </div>
                            <p className="text-sm text-yellow-800 text-left leading-relaxed">
                                Você selecionou o plano <strong>{planName}</strong> e está desbloqueando um livro best-seller.
                            </p>
                        </div>
                    </div>

                    {/* Pricing Summary */}
                    <div className="w-full bg-slate-800 rounded-lg p-4 mb-8 border border-slate-700">
                        <div className="flex justify-between text-slate-400 text-xs mb-1">
                            <span>Ativação do Plano {planName}:</span>
                            <span className={subscriptionPrice === 0 ? "text-green-500 font-bold" : ""}>
                                {subscriptionPrice === 0 ? "ATIVO ✅" : `R$ ${subscriptionPrice.toFixed(2).replace('.', ',')}`}
                            </span>
                        </div>
                        <div className="flex justify-between text-slate-400 text-xs mb-3">
                            <span>Livro Gerado (Oferta Exclusiva):</span>
                            <span>R$ {bookPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="border-t border-slate-600 pt-2 flex justify-between text-white font-bold">
                            <span>TOTAL DO INVESTIMENTO:</span>
                            <span className="text-green-400">R$ {(subscriptionPrice + bookPrice).toFixed(2).replace('.', ',')}</span>
                        </div>
                    </div>

                    {/* CTA Button 1 - Pay Subscription */}
                    <button
                        onClick={() => window.open(checkoutUrl, '_blank')}
                        className="w-full bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold py-4 rounded-xl text-lg shadow-lg shadow-indigo-500/30 transition-transform active:scale-95 mb-8 uppercase"
                    >
                        1. Ativar Assinatura (R$ {subscriptionPrice.toFixed(2).replace('.', ',')})
                    </button>

                    {/* Simulation / Confirm Box */}
                    <div className="w-full bg-slate-800/50 rounded-xl border border-slate-700 p-6 flex flex-col items-center">
                        <h3 className="text-[#818cf8] font-bold text-sm uppercase mb-2">Ambiente de Testes / Simulação</h3>
                        <p className="text-slate-500 text-xs mb-4">Após efetuar o pagamento na Kiwify (ou para simular), clique abaixo:</p>

                        <button
                            onClick={onConfirmPayment}
                            className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-bold py-3 rounded-lg shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2"
                        >
                            <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                            </div>
                            2. CONFIRMAR QUE JÁ PAGUEI A ASSINATURA
                        </button>
                    </div>

                    <div className="mt-8 flex flex-col items-center gap-2">
                        <div className="text-slate-500 text-xs flex gap-2">
                            <span>Email monitorado:</span>
                            <span className="text-yellow-500 font-mono">{userEmail}</span>
                            <span className="flex items-center gap-1 text-red-400">
                                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" d="M12 4v4m0 4v4m-4-4h8" /></svg>
                                Aguardando
                            </span>
                        </div>
                        <div className="text-slate-600 text-[10px] animate-pulse">Aguardando confirmação...</div>
                        <div className="text-slate-700 text-[10px]">Aguardando confirmação de pagamento...</div>
                    </div>

                </div>
            </div>
        </div>
    );
};
