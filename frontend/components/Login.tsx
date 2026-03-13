
import React, { useState } from 'react';
import Disclaimer from './Disclaimer';

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
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [registerSuccess, setRegisterSuccess] = useState('');

    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const emailParam = params.get('email');
        const nameParam = params.get('name');
        const mode = params.get('mode');

        // Prevent literal placeholders like {{email}} or {{full_name}} from being filled
        if (emailParam && !emailParam.includes('{') && !emailParam.includes('}')) setEmail(emailParam);
        if (nameParam && !nameParam.includes('{') && !nameParam.includes('}')) setName(nameParam);
        if (mode === 'register') setIsRegistering(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setRegisterSuccess('');
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

            const baseUrl = getApiBase();

            if (isRegistering) {
                const res = await fetch(`${baseUrl}/api/user/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password, name })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    setRegisterSuccess("Acesso criado com sucesso! Agora você pode fazer o login.");
                    setIsRegistering(false);
                    setPassword('');
                } else {
                    setError(data.error || "Erro ao criar acesso.");
                }
            } else {
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
            }
        } catch (err) {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-fade-in relative z-50 mt-10">
                <button
                    onClick={onBack}
                    className="absolute top-4 right-4 text-slate-500 hover:text-white transition"
                >
                    ✕
                </button>

                <div className="text-center mb-8">
                    <h2 className="text-xl font-bold text-white mb-2 uppercase tracking-wide">
                        {isRegistering ? '🔥 CRIE SUA SENHA' : 'BEM VINDO (A)! ÁREA VIP DE MEMBROS'}
                    </h2>
                    <p className="text-slate-400 text-sm">
                        {isRegistering
                            ? 'Usou a Kiwify? Crie sua senha com o mesmo e-mail usado lá!'
                            : 'Faça login e acesse agora!'}
                    </p>
                </div>

                <div className="flex bg-slate-900 rounded-lg p-1 mb-6">
                    <button
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition ${!isRegistering ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        onClick={() => { setIsRegistering(false); setError(''); setRegisterSuccess(''); }}
                    >
                        Entrar
                    </button>
                    <button
                        className={`flex-1 py-2 text-sm font-bold rounded-md transition ${isRegistering ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        onClick={() => { setIsRegistering(true); setError(''); setRegisterSuccess(''); }}
                    >
                        1º Acesso
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Seu Nome Completo</label>
                            <input
                                type="text"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                placeholder="João da Silva"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required={isRegistering}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                            {isRegistering ? 'E-mail (O mesmo usado na Kiwify)' : 'E-mail'}
                        </label>
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
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                            {isRegistering ? 'Crie uma Senha' : 'Senha'}
                        </label>
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

                    {registerSuccess && (
                        <div className="bg-green-500/10 border border-green-500/50 text-green-500 p-3 rounded-lg text-sm text-center">
                            {registerSuccess}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase"
                        disabled={loading}
                    >
                        {loading ? 'Aguarde...' : (isRegistering ? 'Criar Acesso' : 'Entrar')}
                    </button>
                </form>

                {!isRegistering && (
                    <div className="mt-6 text-center text-sm">
                        <button
                            onClick={onForgotPassword}
                            className="text-slate-400 hover:text-white underline"
                        >
                            Esqueci minha senha
                        </button>
                    </div>
                )}
            </div>
            <div className="w-full max-w-md mt-12 bg-slate-900/50 p-6 rounded-2xl">
                <Disclaimer />
            </div>
        </div>
    );
};
