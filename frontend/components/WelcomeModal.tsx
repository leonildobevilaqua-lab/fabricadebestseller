import React, { useEffect, useState } from 'react';

interface WelcomeModalProps {
    onClose: () => void;
    userEmail: string;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose, userEmail }) => {
    const [loading, setLoading] = useState(true);
    const [config, setConfig] = useState<any>(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                // Determine API URL
                const getApiBase = () => {
                    const env = (import.meta as any).env.VITE_API_URL;
                    if (env) return env;
                    const custom = localStorage.getItem('admin_api_url');
                    if (custom) return custom.trim();
                    const host = window.location.hostname;
                    if (host === 'localhost' || host === '127.0.0.1') return '';
                    return window.location.origin;
                };

                let baseUrl = getApiBase();
                if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

                const res = await fetch(`${baseUrl}/api/payment/public-config?email=${userEmail}`);
                const data = await res.json();
                setConfig(data);
            } catch (error) {
                console.error("Error fetching config:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchConfig();
    }, [userEmail]);

    if (loading) return null;

    if (!config || !config.plan) return null; // Should not happen if flow is correct

    const planName = config.plan.name || 'STARTER';
    const bookPrice = config.bookPrice || 26.90;
    const checkoutUrl = config.checkoutUrl || '#';

    return (
        <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full p-8 relative shadow-2xl overflow-hidden">

                {/* Background Glow */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/20 blur-3xl rounded-full"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 blur-3xl rounded-full"></div>

                <div className="relative z-10 text-center">
                    <div className="mb-6 animate-bounce">
                        <span className="text-5xl">🎉</span>
                    </div>

                    <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-2 uppercase tracking-wide">
                        Conquista Desbloqueada!
                    </h2>

                    <p className="text-slate-300 mb-6 font-medium">
                        Parabéns pela ativação do seu plano <span className="text-white font-bold">{planName}</span>.
                    </p>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-indigo-500/20 mb-8">
                        <p className="text-sm text-slate-400 mb-2">Você acaba de desbloquear o valor exclusivo:</p>
                        <div className="flex items-end justify-center gap-2">
                            <span className="text-slate-500 text-lg line-through">R$ 97,90</span>
                            <span className="text-4xl font-bold text-green-400">R$ {bookPrice.toFixed(2).replace('.', ',')}</span>
                        </div>
                        <p className="text-xs text-indigo-300 mt-2 font-semibold tracking-wide uppercase">
                            Preço garantido para o 1º Livro da Geração
                        </p>
                    </div>

                    <a
                        href={checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={onClose}
                        className="block w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black py-4 rounded-xl text-lg shadow-lg shadow-green-900/50 transition-all transform hover:-translate-y-1 hover:shadow-green-500/30 uppercase tracking-widest"
                    >
                        Gerar Livro Agora! 🚀
                    </a>

                    <button
                        onClick={onClose}
                        className="mt-4 text-xs text-slate-500 hover:text-slate-300 underline transition-colors"
                    >
                        Fechar e gerar depois
                    </button>
                </div>
            </div>
        </div>
    );
};
