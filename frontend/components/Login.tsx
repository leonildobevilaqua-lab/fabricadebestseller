
import React, { useState } from 'react';

interface LoginProps {
    onLogin: (data: any) => void;
    onBack: () => void;
    onForgotPassword?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin, onBack, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Check API URL override
            const getApiBase = () => {
                const env = (import.meta as any).env.VITE_API_URL;
                if (env) return env;
                const host = window.location.hostname;
                if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005';
                return 'https://api.fabricadebestseller.com.br';
            };

            const baseUrl = getApiBase(); // Remove trailing slash if needed

            const res = await fetch(`${baseUrl}/api/user/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                onLogin(data);
            } else {
                setError(data.error || "Email ou senha incorretos.");
            }

        } catch (err) {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in relative">
                <button
                    onClick={onBack}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
                >
                    ✕
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo de volta!</h2>
                    <p className="text-slate-400 text-sm">Acesse sua área exclusiva de editor.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">E-mail</label>
                        <input
                            type="email"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="seu@email.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Senha</label>
                        <input
                            type="password"
                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={loading}
                    >
                        {loading ? 'Entrando...' : 'ENTRAR'}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm">
                    <button
                        onClick={onForgotPassword}
                        className="text-slate-400 hover:text-white underline"
                    >
                        Esqueci minha senha
                    </button>
                </div>
            </div>
        </div>
    );
};
