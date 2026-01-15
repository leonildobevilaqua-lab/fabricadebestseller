import React, { useState, useEffect } from 'react';

const API_URL = 'http://localhost:3001/api/admin';

export const Admin: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');
    const [settings, setSettings] = useState<any>(null);
    const [msg, setMsg] = useState('');

    // useEffect for initial load handled below with leads


    const loadSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setSettings(await res.json());
            } else {
                setToken(null); // Invalid token
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user, pass })
            });
            if (res.ok) {
                const data = await res.json();
                setToken(data.token);
                localStorage.setItem('admin_token', data.token);
            } else {
                setMsg("Credenciais Inválidas");
            }
        } catch (e) {
            setMsg("Erro de conexão");
        }
    };

    const [leads, setLeads] = useState<any[]>([]);

    useEffect(() => {
        if (token) {
            loadSettings();
            loadLeads();
        }
    }, [token]);

    const loadLeads = async () => {
        try {
            // Fetch from backend
            const res = await fetch('http://localhost:3001/api/payment/leads', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Response might be direct array or object depending on db service
            const data = await res.json();
            // Ensure array
            const leadsArray = Array.isArray(data) ? data : Object.values(data);
            // Sort by date desc
            setLeads(leadsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (e) { console.error("Leads error", e) }
    };

    const handleApproveLead = async (email: string) => {
        if (!confirm(`Liberar acesso gratuito para ${email}?`)) return;
        try {
            const res = await fetch('http://localhost:3001/api/payment/leads/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email })
            });
            if (res.ok) {
                alert("Acesso liberado com sucesso!");
                loadLeads();
            }
        } catch (e) {
            alert("Erro ao liberar acesso");
        }
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`${API_URL}/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                setMsg("Configurações salvas!");
                setTimeout(() => setMsg(''), 3000);
            }
        } catch (e) {
            setMsg("Erro ao salvar");
        }
    };

    if (!token) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-slate-200">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">Acesso Administrativo</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
                        <input
                            type="email"
                            value={user}
                            onChange={e => setUser(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            placeholder="admin@exemplo.com"
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
                        <input
                            type="password"
                            value={pass}
                            onChange={e => setPass(e.target.value)}
                            className="w-full p-2 border rounded-lg"
                            placeholder="******"
                        />
                    </div>
                    {msg && <p className="text-red-500 text-sm mb-4 text-center">{msg}</p>}
                    <button type="submit" className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 transition">
                        Entrar
                    </button>
                    <button onClick={onBack} type="button" className="w-full mt-2 text-slate-500 text-sm hover:underline">
                        Voltar ao App
                    </button>
                </form>
            </div>
        );
    }

    if (!settings) return <div className="text-center mt-20">Carregando painel...</div>;

    return (
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Configuração de IA (Multi-Modelos)</h2>
                <div className="gap-2 flex">
                    <button onClick={() => { setToken(null); localStorage.removeItem('admin_token'); }} className="text-sm text-red-500 hover:underline">Sair</button>
                    <span className="text-slate-300">|</span>
                    <button onClick={onBack} className="text-sm text-slate-500 hover:underline">Voltar ao App</button>
                </div>
            </div>

            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-bold text-blue-800 mb-2">Modelo Ativo</h3>
                <select
                    value={settings.activeProvider}
                    onChange={e => setSettings({ ...settings, activeProvider: e.target.value })}
                    className="w-full p-2 border rounded-lg text-lg bg-white"
                >
                    <option value="gemini">Google Gemini (Rápido & Gratuito/Barato)</option>
                    <option value="openai">OpenAI GPT-4 (Padrão Ouro)</option>
                    <option value="anthropic">Anthropic Claude 3 Opus (Melhor Texto)</option>
                    <option value="deepseek">DeepSeek Coder (Custo-Benefício)</option>
                    <option value="llama">Meta Llama 3 - via Groq (Ultra Rápido)</option>
                </select>
                <p className="text-xs text-blue-600 mt-2">
                    O sistema usará este modelo para gerar todo o conteúdo do livro. Certifique-se de que a chave da API correspondente esteja preenchida abaixo.
                </p>
            </div>

            <div className="space-y-4">
                <h3 className="font-bold text-slate-700 border-b pb-2">Chaves de API (API Keys)</h3>

                {/* Gemini */}
                <div className="flex items-center gap-4">
                    <div className="w-32 font-medium text-slate-600">Gemini Key</div>
                    <input
                        type="password"
                        value={settings.providers.gemini}
                        onChange={e => setSettings({ ...settings, providers: { ...settings.providers, gemini: e.target.value } })}
                        className="flex-1 p-2 border rounded-lg font-mono text-sm"
                        placeholder="AIza..."
                    />
                </div>

                {/* OpenAI */}
                <div className="flex items-center gap-4">
                    <div className="w-32 font-medium text-slate-600">OpenAI Key</div>
                    <input
                        type="password"
                        value={settings.providers.openai}
                        onChange={e => setSettings({ ...settings, providers: { ...settings.providers, openai: e.target.value } })}
                        className="flex-1 p-2 border rounded-lg font-mono text-sm"
                        placeholder="sk-..."
                    />
                </div>

                {/* Anthropic */}
                <div className="flex items-center gap-4">
                    <div className="w-32 font-medium text-slate-600">Claude Key</div>
                    <input
                        type="password"
                        value={settings.providers.anthropic}
                        onChange={e => setSettings({ ...settings, providers: { ...settings.providers, anthropic: e.target.value } })}
                        className="flex-1 p-2 border rounded-lg font-mono text-sm"
                        placeholder="sk-ant-..."
                    />
                </div>

                {/* DeepSeek */}
                <div className="flex items-center gap-4">
                    <div className="w-32 font-medium text-slate-600">DeepSeek Key</div>
                    <input
                        type="password"
                        value={settings.providers.deepseek}
                        onChange={e => setSettings({ ...settings, providers: { ...settings.providers, deepseek: e.target.value } })}
                        className="flex-1 p-2 border rounded-lg font-mono text-sm"
                        placeholder="sk-..."
                    />
                </div>

                {/* Llama */}
                <div className="flex items-center gap-4">
                    <div className="w-32 font-medium text-slate-600">Groq Key (Llama)</div>
                    <input
                        type="password"
                        value={settings.providers.llama}
                        onChange={e => setSettings({ ...settings, providers: { ...settings.providers, llama: e.target.value } })}
                        className="flex-1 p-2 border rounded-lg font-mono text-sm"
                        placeholder="gsk_..."
                    />
                </div>
            </div>

            <h3 className="font-bold text-slate-700 border-b pb-2 pt-8">Solicitações Pendentes (Contatos)</h3>

            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden mb-8">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium">
                        <tr>
                            <th className="p-3">Data</th>
                            <th className="p-3">Nome</th>
                            <th className="p-3">E-mail</th>
                            <th className="p-3">WhatsApp</th>
                            <th className="p-3 text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {leads.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-slate-400">Nenhuma solicitação pendente.</td></tr>}
                        {leads.map((lead: any) => (
                            <tr key={lead.id} className="hover:bg-slate-50">
                                <td className="p-3 text-slate-400">{new Date(lead.date).toLocaleDateString()}</td>
                                <td className="p-3 font-medium">{lead.name}</td>
                                <td className="p-3">{lead.email}</td>
                                <td className="p-3">{lead.fullPhone || lead.phone}</td>
                                <td className="p-3 text-right">
                                    <button
                                        onClick={() => handleApproveLead(lead.email)}
                                        className="px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded text-xs font-bold transition"
                                    >
                                        Liberar Geração do Livro
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <h3 className="font-bold text-slate-700 border-b pb-2 pt-8">Integrações & Sistema</h3>

            {/* Kiwify Webhook */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                <h4 className="font-bold text-sm text-slate-600 mb-2">Webhook Kiwify</h4>
                <p className="text-xs text-slate-500 mb-2">Copie esta URL e configure na Kiwify para liberar acesso automático após pagamento.</p>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={`${window.location.protocol}//${window.location.hostname}:3001/api/payment/webhook`}
                        className="flex-1 p-2 border rounded bg-white text-xs font-mono text-slate-600 select-all"
                    />
                    <button onClick={() => navigator.clipboard.writeText(`${window.location.protocol}//${window.location.hostname}:3001/api/payment/webhook`)} className="px-3 py-1 bg-slate-200 text-xs font-bold rounded hover:bg-slate-300">Copiar</button>
                </div>
                <div className="mt-2 p-2 bg-yellow-50 text-yellow-800 text-xs rounded border border-yellow-200 flex gap-2 items-start">
                    <span className="text-lg">⚠️</span>
                    <div>
                        <strong>Aviso Importante:</strong> URLs com "localhost" só funcionam no seu computador.
                        A Kiwify não consegue enviar dados para este endereço. <br />
                        Para testar automações reais, você precisa de um túnel (ex: Ngrok) ou hospedar o backend.
                        <br />
                        <em>Se quiser apenas salvar o formulário na Kiwify sem testar o webhook agora, use uma URL fictícia válida como: <u>https://google.com</u></em>
                    </div>
                </div>
            </div>

            {/* Email Settings */}
            <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-sm text-slate-600">Configuração de E-mail (SMTP)</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-slate-500">Host (Ex: smtp.gmail.com)</label>
                        <input
                            type="text"
                            value={settings.email?.host || ''}
                            onChange={e => setSettings({ ...settings, email: { ...settings.email, host: e.target.value } })}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Porta (Ex: 587)</label>
                        <input
                            type="text"
                            value={settings.email?.port || ''}
                            onChange={e => setSettings({ ...settings, email: { ...settings.email, port: e.target.value } })}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Usuário</label>
                        <input
                            type="text"
                            value={settings.email?.user || ''}
                            onChange={e => setSettings({ ...settings, email: { ...settings.email, user: e.target.value } })}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Senha</label>
                        <input
                            type="password"
                            value={settings.email?.pass || ''}
                            onChange={e => setSettings({ ...settings, email: { ...settings.email, pass: e.target.value } })}
                            className="w-full p-2 border rounded text-sm"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t flex justify-end items-center gap-4">
                {msg && <span className="text-green-600 font-medium animate-pulse">{msg}</span>}
                <button
                    onClick={handleSave}
                    className="px-6 py-3 bg-brand-600 text-white font-bold rounded-lg shadow hover:bg-brand-700 transition"
                >
                    Salvar Configurações
                </button>
            </div>
        </div>
    );
};
