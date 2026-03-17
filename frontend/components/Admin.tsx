import React, { useState, useEffect } from 'react';
import { Download, Trash2, Clock, CheckCircle, BookOpen, User, Mail, Calendar } from 'lucide-react';
// Define a base: Se tiver na nuvem (Coolify), usa a variável. Se não, vazio (usa o localhost).
// Define a base: Se tiver na nuvem (Coolify), usa a variável. Se não, vazio (usa o localhost).
const DEFAULT_BASE = (import.meta as any).env.VITE_API_URL || '';
const DEFAULT_API_URL = `${DEFAULT_BASE}/api/admin`;

// Dynamic Helper to override URL at runtime (Fixes 404/Network Errors)
const getApiBase = () => {
    const custom = localStorage.getItem('admin_api_url');
    let raw = custom ? custom.trim() : DEFAULT_BASE;

    // Normalize to Root (remove /api/admin or similar)
    let cleanBase = raw.replace(/\/$/, '');
    if (cleanBase.endsWith('/admin')) cleanBase = cleanBase.slice(0, -6);
    if (cleanBase.endsWith('/api')) cleanBase = cleanBase.slice(0, -4);

    return cleanBase; // Returns http://site.com
};
const getAdminUrl = () => `${getApiBase()}/api/admin`; // Returns http://site.com/api/admin
const getApiUrl = getAdminUrl; // Alias for backward compatibility

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { LeadRow } from './LeadRow';

// --- Dashboard Component ---
// --- Dashboard Component ---
const DashboardCharts = ({ leads = [], orders = [] }: { leads: any[], orders: any[] }) => {
    // Feature flag: Enable charts only when safely validated
    const showCharts = true;

    // Safety check
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeOrders = Array.isArray(orders) ? orders : [];

    // Helper: Calculate Value based on User Rules (Source of Truth 2025)
    // Helper: Calculate Value based on User Rules (Source of Truth 2025)
    const calculateLeadValue = (lead: any) => {
        // 1. If explicit payment info exists (from Webhook), use it.
        if (lead.paymentInfo?.amount) return Number(lead.paymentInfo.amount);

        // 2. If SUBSCRIBER, return the PLAN value (MRR)
        if (lead.status === 'SUBSCRIBER' || (lead.plan && lead.plan.status === 'ACTIVE')) {
            const pName = lead.plan?.name?.toUpperCase();
            const billing = lead.plan?.billing?.toLowerCase(); // 'monthly' or 'annual'
            if (pName === 'STARTER') return billing === 'annual' ? 147.90 : 19.90;
            if (pName === 'PRO') return billing === 'annual' ? 297.90 : 39.90;
            if (pName === 'BLACK') return billing === 'annual' ? 497.90 : 79.90;
        }

        // 3. Fallback to Book prices if just a lead or booking attempt
        if (lead.type === 'BOOK' || lead.type === 'LIVRO') {
            const planName = (lead.plan?.name || "AVULSO").toUpperCase();
            const billing = (lead.plan?.billing || "monthly").toLowerCase();
            const isAnnual = billing === 'annual' || billing === 'anual';

            if (planName === 'STARTER') return isAnnual ? 24.90 : 28.90;
            if (planName === 'PRO') return isAnnual ? 14.90 : 18.90;
            if (planName === 'BLACK') return isAnnual ? 8.90 : 9.90;
            return 89.90; // Avulso
        }

        // 4. Default
        return 89.90;
    };

    // Filter Paid Leads (Include SUBSCRIBERS)
    const getPaidLeads = () => {
        return safeLeads.filter(l =>
            l.status === 'APPROVED' ||
            l.status === 'IN_PROGRESS' ||
            l.status === 'COMPLETED' ||
            l.status === 'LIVRO ENTREGUE' ||
            l.status === 'SUBSCRIBER' ||
            (l.credits || 0) > 0 ||
            (l.plan && l.plan.status === 'ACTIVE')
        );
    };

    // 1. Revenue Calculations - Use ORDERS for real money tracking
    const getRevenue = (filter: 'day' | 'week' | 'month' | 'year') => {
        const now = new Date();
        const safeOrders = Array.isArray(orders) ? orders : [];

        const filtered = safeOrders.filter(o => {
            const status = (o.paymentInfo?.status || o.status || 'PAID').toUpperCase();
            if (status === 'PENDING' || status === 'REFUNDED' || status === 'CANCELLED') return false;

            const dStr = o.date || o.created_at;
            if (!dStr) return false;

            const d = new Date(dStr);
            if (isNaN(d.getTime())) return false;

            const targetStr = d.toLocaleDateString('en-CA');
            const todayStr = now.toLocaleDateString('en-CA');

            if (filter === 'day') return targetStr === todayStr;
            if (filter === 'week') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return d >= oneWeekAgo;
            }
            if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            if (filter === 'year') return d.getFullYear() === now.getFullYear();
            return true;
        });

        return filtered.reduce((acc, curr) => {
            const val = Number(curr.paymentInfo?.amount || curr.amount || 0);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);
    };

    // 2. Prepare Data for Charts
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    const revenueData = last7Days.map(date => {
        const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const targetStr = date.toLocaleDateString('en-CA');

        const dayOrders = (Array.isArray(orders) ? orders : []).filter(o => {
            const status = (o.paymentInfo?.status || o.status || 'PAID').toUpperCase();
            if (status === 'PENDING' || status === 'REFUNDED' || status === 'CANCELLED') return false;

            const dStr = o.date || o.created_at;
            if (!dStr) return false;
            const d = new Date(dStr);
            return !isNaN(d.getTime()) && d.toLocaleDateString('en-CA') === targetStr;
        });

        const total = dayOrders.reduce((acc, curr) => {
            const val = Number(curr.paymentInfo?.amount || curr.amount || 0);
            return acc + (isNaN(val) ? 0 : val);
        }, 0);

        return { name: dayStr, value: total };
    });

    // 3. Top Customers - Based on successful payments
    const customerMap = (Array.isArray(orders) ? orders : []).reduce((acc: any, curr: any) => {
        const status = (curr.paymentInfo?.status || curr.status || 'PAID').toUpperCase();
        if (status === 'PENDING' || status === 'REFUNDED' || status === 'CANCELLED') return acc;

        const email = curr.paymentInfo?.payerEmail || curr.email || 'Desconhecido';
        const val = curr.paymentInfo?.amount || 0;
        acc[email] = (acc[email] || 0) + val;
        return acc;
    }, {});

    const topCustomers = Object.entries(customerMap)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([email, total]) => ({ email, total }));

    // 4. Pending Links
    const pendingLinks = safeLeads.filter(l => l.status === 'PENDING').length;

    // Status Pie Data
    const statusCounts = safeLeads.reduce((acc: any, curr: any) => {
        const s = curr.status || 'PENDING';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const pieData = [
        { name: 'Pagos/Aprovados', value: (statusCounts['APPROVED'] || 0) + (statusCounts['LIVRO ENTREGUE'] || 0) + (statusCounts['COMPLETED'] || 0) + (statusCounts['SUBSCRIBER'] || 0) },
        { name: 'Em Produção', value: statusCounts['IN_PROGRESS'] || 0 },
        { name: 'Pendentes', value: statusCounts['PENDING'] || 0 },
    ].filter(d => d.value > 0);

    if (pieData.length === 0) pieData.push({ name: 'Sem Dados', value: 1 });

    const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#E2E8F0'];

    return (
        <div className="space-y-6 mb-8">
            {/* Top Cards */}
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-500 font-bold uppercase">Faturamento Hoje</div>
                    <div className="text-2xl font-bold text-slate-800">R$ {getRevenue('day').toFixed(2)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-500 font-bold uppercase">Faturamento Semana</div>
                    <div className="text-2xl font-bold text-slate-800">R$ {getRevenue('week').toFixed(2)}</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-500 font-bold uppercase">Faturamento Mês</div>
                    <div className="text-2xl font-bold text-slate-800">R$ {getRevenue('month').toFixed(2)}</div>
                </div>

                {/* SUBSCRIPTION STATS */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 shadow-sm">
                    <div className="text-xs text-indigo-500 font-bold uppercase">Assinaturas (MRR Est.)</div>
                    <div className="text-2xl font-bold text-indigo-800">
                        R$ {getPaidLeads().filter(l => l.plan).reduce((acc, curr) => {
                            // Estimate MRR: If Annual, divide by 12? Or just show total contracted?
                            // User asked for "Faturamento". Let's show Total Collected from Subs.
                            // Actually, let's show Active Subs Count vs Revenue
                            return acc + calculateLeadValue(curr);
                        }, 0).toFixed(2)}
                    </div>
                    <div className="text-xs text-indigo-400">
                        {safeLeads.filter(l => l.status === 'SUBSCRIBER').length} Assinantes Ativos
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-500 font-bold uppercase">Solicitações</div>
                    <div className="text-2xl font-bold text-orange-500">{pendingLinks}</div>
                    <div className="text-xs text-slate-400">Aguardando Ação</div>
                </div>
            </div>

            {/* SUBSCRIPTION DETAILED BREAKDOWN */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
                <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                    <span className="text-xl">📊</span> Detalhamento de Assinaturas Ativas
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    {[
                        { label: 'Starter Mensal', p: 'STARTER', b: 'monthly', color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
                        { label: 'Starter Anual', p: 'STARTER', b: 'annual', color: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
                        { label: 'Pro Mensal', p: 'PRO', b: 'monthly', color: 'bg-blue-50 border-blue-200 text-blue-700' },
                        { label: 'Pro Anual', p: 'PRO', b: 'annual', color: 'bg-blue-100 border-blue-300 text-blue-800' },
                        { label: 'Black Mensal', p: 'BLACK', b: 'monthly', color: 'bg-slate-800 border-slate-600 text-slate-200' },
                        { label: 'Black Anual', p: 'BLACK', b: 'annual', color: 'bg-slate-900 border-slate-700 text-white' },
                    ].map((item, idx) => {
                        const count = safeLeads.filter(l =>
                            l.status === 'SUBSCRIBER' &&
                            l.plan?.name === item.p &&
                            (l.plan?.billing || 'monthly') === item.b
                        ).length;

                        return (
                            <div key={idx} className={`p-4 rounded-xl border ${item.color} flex flex-col items-center justify-center text-center shadow-sm`}>
                                <div className="text-xs font-black uppercase tracking-wider opacity-80 mb-2">{item.label}</div>
                                <div className="text-3xl font-black">{count}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Charts Row */}
            {showCharts && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Revenue Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                        <h3 className="font-bold text-slate-700 mb-6">Faturamento (Últimos 7 Dias)</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={revenueData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `R$${value}`} />
                                    <RechartsTooltip formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Faturamento']} />
                                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Users/Status Chart */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-700 mb-6">Status dos Leads</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="bottom" height={36} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* Top Customers */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-bold text-slate-700 mb-4">Top Clientes</h3>
                <div className="space-y-3">
                    {topCustomers.length === 0 && <p className="text-sm text-slate-400">Nenhum cliente com compras ainda.</p>}
                    {topCustomers.map((c, i) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                                    {i + 1}
                                </div>
                                <span className="text-sm font-medium text-slate-600">{c.email}</span>
                            </div>
                            <span className="text-sm font-bold text-green-600">R$ {Number(c.total).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};




const BackupList = ({ token, apiUrl }: { token: string | null, apiUrl: string }) => {
    const [backups, setBackups] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (token) loadBackups();
    }, [token]);

    const loadBackups = async () => {
        try {
            const res = await fetch(`${apiUrl}/backups`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                setBackups(await res.json());
            }
        } catch (e) { console.error(e); }
    };

    const handleRestore = async (filename: string) => {
        if (!confirm(`ATENÇÃO: Isso irá substituir todos os dados atuais pelos dados deste backup (${filename}). Deseja continuar?`)) return;

        setLoading(true);
        try {
            const res = await fetch(`${apiUrl}/backups/restore`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ filename })
            });
            if (res.ok) {
                alert("Sistema restaurado com sucesso! Os dados foram revertidos.");
                window.location.reload();
            } else {
                alert("Erro ao restaurar.");
            }
        } catch (e) {
            alert("Erro de conexão.");
        }
        setLoading(false);
    };

    return (
        <div className="max-h-60 overflow-y-auto border rounded bg-slate-50">
            {loading && <div className="p-4 text-center text-blue-600">Restaurando dados... aguarde...</div>}

            {!loading && backups.length === 0 && (
                <div className="p-4 text-center text-slate-400 text-sm">Nenhum ponto de restauração encontrado.</div>
            )}

            {!loading && backups.map(file => (
                <div key={file} className="flex justify-between items-center p-3 border-b last:border-0 hover:bg-white text-sm">
                    <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{file}</span>
                        <span className="text-xs text-slate-400">
                            {file.replace('backup_', '').replace('.json', '').replace(/-/g, ':').replace('T', ' ')}
                        </span>
                    </div>
                    <button
                        onClick={() => handleRestore(file)}
                        className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded border border-orange-200 hover:bg-orange-200 font-bold"
                    >
                        Restaurar ↺
                    </button>
                </div>
            ))}
        </div>
    );
};

export const Admin: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));
    const [user, setUser] = useState('');
    const [pass, setPass] = useState('');

    // API URL Override (Fix for Config Issues)
    const [customApiUrl, setCustomApiUrl] = useState(localStorage.getItem('admin_api_url') || '');
    const [showApiOverride, setShowApiOverride] = useState(false);

    const [settings, setSettings] = useState<any>(null);
    const [msg, setMsg] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Auth Mode State
    const [authMode, setAuthMode] = useState<'login' | 'forgot' | 'reset'>('login');
    const [resetToken, setResetToken] = useState('');
    const [newPass, setNewPass] = useState('');

    // UI Navigation State
    const [activeSection, setActiveSection] = useState<'dashboard' | 'setup' | 'integrations' | 'backups' | 'simulator' | 'profile'>('dashboard');

    // Profile State
    const [profileOldPass, setProfileOldPass] = useState('');
    const [profileNewPass, setProfileNewPass] = useState('');

    const [loadingError, setLoadingError] = useState(false);

    // Asaas Configuration State
    const [asaasEnv, setAsaasEnv] = useState<'sandbox' | 'production'>('sandbox');
    const [asaasWalletId, setAsaasWalletId] = useState('');
    const [asaasSaving, setAsaasSaving] = useState(false);
    const [asaasMsg, setAsaasMsg] = useState('');
    const [hasSandboxKey, setHasSandboxKey] = useState(false);
    const [hasProductionKey, setHasProductionKey] = useState(false);

    // Sales Filter State
    const [salesFilter, setSalesFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
    const [salesStartDate, setSalesStartDate] = useState('');
    const [salesEndDate, setSalesEndDate] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const rToken = params.get('resetToken');
        const rEmail = params.get('email');
        if (rToken) {
            setAuthMode('reset');
            setResetToken(rToken);
            if (rEmail) setUser(rEmail);
        }
    }, []);

    // useEffect for initial load handled below with leads

    const loadSettings = async () => {
        setLoadingError(false);
        try {
            const res = await fetch(`${getAdminUrl()}/settings`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setSettings(await res.json());
            } else {
                setToken(null);
            }
        } catch (e) {
            console.error(e);
            setLoadingError(true);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        // 1. Determine Base Domain
        let rawUrl = customApiUrl.trim() || DEFAULT_BASE;
        // Normalize: Remove trailing slash
        let cleanBase = rawUrl.replace(/\/$/, '');

        // Remove known suffixes to find true root (http://site.com)
        if (cleanBase.endsWith('/admin')) cleanBase = cleanBase.slice(0, -6);
        if (cleanBase.endsWith('/api')) cleanBase = cleanBase.slice(0, -4);

        console.log("Base Domain detected:", cleanBase);

        try {
            // STRATEGY 1: Standard POST (Explicit Path: /api/admin/login)
            const targetUrl = `${cleanBase}/api/admin/login`;
            console.log("Strategy 1 Target:", targetUrl);

            try {
                const res = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ user, pass })
                });

                if (res.ok) {
                    const data = await res.json();
                    setToken(data.token);
                    localStorage.setItem('admin_token', data.token);
                    window.history.replaceState({}, '', '/admin');
                    return;
                }

                if (res.status === 401) {
                    const data = await res.json();
                    throw new Error(data.error || "Acesso negado");
                }

                const text = await res.text().catch(() => "");
                console.warn(`STRATEGY 1 Failed (${res.status}): ${text}`);
                throw new Error("Fallback Needed");

            } catch (postError: any) {
                if (postError.message !== "Fallback Needed" && !postError.message.includes("Failed to fetch")) {
                    setMsg("Erro: " + postError.message);
                    return;
                }

                // STRATEGY 2: Emergency GET (Explicit Path: /api/admin-login-get)
                const getUrl = `${cleanBase}/api/admin-login-get?user=${encodeURIComponent(user)}&pass=${encodeURIComponent(pass)}`;

                console.log("Strategy 2 Target:", getUrl);

                try {
                    const resGet = await fetch(getUrl, { method: 'GET' });

                    if (resGet.ok) {
                        const text = await resGet.text().catch(() => "");
                        try {
                            const data = JSON.parse(text);
                            console.log("SUCCESS via Strategy 2 (GET)");
                            setToken(data.token);
                            localStorage.setItem('admin_token', data.token);
                            window.history.replaceState({}, '', '/admin');
                            return;
                        } catch (jsonErr) {
                            console.error("GET JSON Parse Error:", jsonErr);
                            if (text.trim().startsWith("<")) {
                                setShowApiOverride(true);
                                throw new Error(`ERRO FATAL (Rota Inválida): O Backend respondeu com HTML na URL ${getUrl}. Verifique se a URL Base do backend está correta.`);
                            }
                            throw new Error(`Resposta Malformada em ${getUrl}: ${text.substring(0, 50)}...`);
                        }
                    } else {
                        let errorMsg = `Falha GET (${resGet.status})`;
                        const text = await resGet.text().catch(() => "");
                        if (text.trim().startsWith("<")) {
                            setShowApiOverride(true);
                            errorMsg += ` - Servidor retornou HTML (404/502). URL tentada: ${getUrl}`;
                        } else {
                            try {
                                const data = JSON.parse(text);
                                errorMsg = data.error || errorMsg;
                            } catch (e) {
                                errorMsg += `: ${text.substring(0, 40)}...`;
                            }
                        }
                        setMsg("Erro Final: " + errorMsg);
                    }
                } catch (netErr: any) {
                    setMsg(`Erro Conexão GET em ${getUrl}: ${netErr.message}`);
                }
            }
        } catch (e: any) {
            console.error("Login Fatal Error:", e);
            setMsg("Erro Fatal: " + (e.message || "Verifique o backend"));
        }
    };


    const handleForgot = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg("Enviando solicitação...");
        try {
            const res = await fetch(`${getAdminUrl()}/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user })
            });

            let data;
            try {
                data = await res.json();
            } catch (jsonError) {
                // If JSON fails, it might be a raw text error or empty
                console.error("JSON Parse Error", jsonError);
                throw new Error("Resposta inválida do servidor. Verifique os logs.");
            }

            if (res.ok) {
                setMsg("Email de recuperação enviado! Verifique sua caixa de entrada.");
            } else {
                setMsg("Erro: " + (data.error || "Erro desconhecido"));
            }
        } catch (e: any) {
            console.error("Forgot Password Error:", e);
            setMsg("Erro de conexão: " + (e.message || "Falha na requisição"));
        }
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass.length < 6) return setMsg("Senha muito curta.");
        setMsg("Redefinindo senha...");
        try {
            const res = await fetch(`${getAdminUrl()}/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: user, token: resetToken, newPassword: newPass })
            });
            if (res.ok) {
                alert("Senha redefinida com sucesso! Você pode logar agora.");
                setAuthMode('login');
                setPass('');
                setMsg('');
                window.history.replaceState({}, '', '/admin');
            } else {
                const data = await res.json();
                setMsg("Erro: " + data.error);
            }
        } catch (e) {
            setMsg("Erro de conexão.");
        }
    };

    const [leads, setLeads] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [projects, setProjects] = useState<any[]>([]);

    useEffect(() => {
        if (token) {
            loadSettings();
            loadLeads();
            loadOrders();
            loadProjectsHistory();
            // Carrega status do ambiente Asaas
            fetch(`${getAdminUrl()}/asaas-env`, { headers: { Authorization: `Bearer ${token}` } })
                .then(r => r.ok ? r.json() : null)
                .then(data => {
                    if (data) {
                        setAsaasEnv(data.env === 'production' ? 'production' : 'sandbox');
                        setHasSandboxKey(!!data.hasSandboxKey);
                        setHasProductionKey(!!data.hasProductionKey);
                    }
                })
                .catch(() => { });
        }
    }, [token]);

    const loadOrders = async () => {
        try {
            const res = await fetch(`${getAdminUrl()}/orders`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Error loading orders", e);
        }
    };

    const loadProjectsHistory = async () => {
        try {
            const res = await fetch(`${getAdminUrl()}/projects`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setProjects(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Error loading projects", e);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`${getApiBase()}/api/payment/leads/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setLeads(prev => prev.filter(l => l.id !== id));
            } else {
                alert("Erro ao excluir");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão");
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!confirm("Deseja realmente excluir este projeto permanentemente?")) return;
        try {
            const res = await fetch(`${getApiBase()}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                alert("Projeto excluído com sucesso!");
                loadProjectsHistory(); // Refresh the list
            } else {
                alert("Erro ao excluir.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão.");
        }
    };

    const handleEdit = async (id: string, updates: any) => {
        try {
            const res = await fetch(`${getApiBase()}/api/payment/leads`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id, updates })
            });

            if (res.ok) {
                const data = await res.json();
                setLeads(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
                alert("Atualizado com sucesso!");
            } else {
                alert("Erro ao atualizar.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão");
        }
    };

    const handleWipe = async (email: string) => {
        if (!confirm(`TEM CERTEZA ABSOLUTA que deseja ZERAR todo o histórico, créditos e registros de ${email}?\n\nEsta ação apagará projetos e compras relacionadas a este e-mail do painel.`)) return;

        try {
            const res = await fetch(`${getApiBase()}/api/admin/wipe-user/${encodeURIComponent(email)}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                alert(`Histórico de ${email} zerado com sucesso!`);
                refreshAll();
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao zerar histórico.");
        }
    };

    const handleWipeAll = async () => {
        const secret = prompt("ATENÇÃO! Você está prestes a ZERAR TODOS OS REGISTROS DO SISTEMA (Pedidos, Leads, Usuários, etc).\n\nPara confirmar, digite: DESTRUIR");
        if (secret !== "DESTRUIR") {
            alert("Ação cancelada.");
            return;
        }

        try {
            const res = await fetch(`${getApiBase()}/api/admin/wipe-all`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                alert(`Sistema completamente zerado!`);
                refreshAll();
            } else {
                alert(`Erro: ${data.error}`);
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao zerar sistema.");
        }
    };

    const refreshAll = async () => {
        setIsRefreshing(true);
        await Promise.all([loadLeads(false), loadOrders(), loadProjectsHistory()]);
        setIsRefreshing(false);
    };

    const loadLeads = async (manageLoading = true) => {
        if (manageLoading) setIsRefreshing(true);
        try {
            // Fetch from backend using Dynamic Base
            const res = await fetch(`${getApiBase()}/api/payment/leads`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

            // Response might be direct array or object depending on db service
            const data = await res.json();
            // Ensure array
            const leadsArray = Array.isArray(data) ? data : Object.values(data);
            // Sort by date desc
            setLeads(leadsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        } catch (e) {
            console.error("Leads error", e);
            if (manageLoading) alert("Erro ao atualizar lista de leads. Verifique se o servidor backend está online.");
        }
        if (manageLoading) setIsRefreshing(false);
    };


    const handleApproveLead = async (email: string, type?: string): Promise<boolean> => {
        try {
            const cleanEmail = email.toLowerCase().trim();
            console.log("Approving execution for:", cleanEmail, type);
            const res = await fetch(`${getApiBase()}/api/payment/leads/approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: cleanEmail, type })
            });
            if (res.ok) {
                return true;
            } else {
                const errText = await res.text();
                console.error("Approval failed:", res.status, errText);
                alert(`Erro ao liberar: ${res.status} - ${errText}`);
            }
        } catch (e) {
            console.error("Network/Fetch error:", e);
            alert("Erro de conexão ao liberar acesso. Verifique se o backend está rodando.");
        }
        return false;
    };

    const handleSave = async () => {
        try {
            const res = await fetch(`${getAdminUrl()}/settings`, {
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
            } else {
                setMsg("Erro ao salvar");
            }
        } catch (e) {
            console.error(e);
            setMsg("Erro ao salvar");
        }
    };

    const handleDiagram = async (leadId: string) => {
        try {
            const res = await fetch(`${getApiBase()}/api/projects/process-diagram-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId })
            });
            const data = await res.json();
            if (data.success) {
                // COMMAND SENT MUTE - The frontend polling in Generator.tsx will detect the new project and auto-switch
                // For the admin panel itself, we just refresh the list.
                console.log("Comando de geração enviado com sucesso.");
                loadLeads();

                // Poll for updates (capture ProjectId when ready)
                let attempts = 0;
                const interval = setInterval(() => {
                    attempts++;
                    console.log("Polling leads update...", attempts);
                    loadLeads(false); // Silent refresh
                    if (attempts >= 10) clearInterval(interval); // Stop after 50s
                }, 5000);

                return true;
            } else {
                alert("Erro: " + data.error);
                return false;
            }
        } catch (e) {
            console.error(e);
            return false;
        }
    };
    // Filtering Orders logic
    const getFilteredOrders = () => {
        if (!Array.isArray(orders)) return [];
        let filtered = [...orders];

        if (salesFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(o => {
                const dStr = o.date || o.created_at;
                if (!dStr) return false;
                const d = new Date(dStr);
                if (isNaN(d.getTime())) return false;

                if (salesFilter === 'today') {
                    return d.toLocaleDateString() === now.toLocaleDateString();
                } else if (salesFilter === 'week') {
                    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return d >= oneWeekAgo;
                } else if (salesFilter === 'month') {
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                } else if (salesFilter === 'custom') {
                    if (salesStartDate && d < new Date(salesStartDate + 'T00:00:00')) return false;
                    if (salesEndDate && d > new Date(salesEndDate + 'T23:59:59')) return false;
                }
                return true;
            });
        }

        return filtered.sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
    };

    const getFilteredProjects = () => {
        if (!Array.isArray(projects)) return [];
        let filtered = [...projects];

        if (salesFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(p => {
                const dStr = p.date || p.createdAt;
                if (!dStr) return false;
                const d = new Date(dStr);
                if (isNaN(d.getTime())) return false;

                if (salesFilter === 'today') {
                    return d.toLocaleDateString() === now.toLocaleDateString();
                } else if (salesFilter === 'week') {
                    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    return d >= oneWeekAgo;
                } else if (salesFilter === 'month') {
                    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                } else if (salesFilter === 'custom') {
                    if (salesStartDate && d < new Date(salesStartDate + 'T00:00:00')) return false;
                    if (salesEndDate && d > new Date(salesEndDate + 'T23:59:59')) return false;
                }
                return true;
            });
        }

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const isLogged = !!token;

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg("Atualizando senha...");
        try {
            const res = await fetch(`${getAdminUrl()}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ oldPass: profileOldPass, newPass: profileNewPass })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Senha atualizada com sucesso!");
                setMsg("");
                setProfileOldPass("");
                setProfileNewPass("");
            } else {
                setMsg("Erro: " + data.error);
            }
        } catch (e) {
            setMsg("Erro de conexão");
        }
    };

    if (!isLogged) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-xl shadow-lg border border-slate-200">
                <h2 className="text-2xl font-bold mb-6 text-center text-slate-800">
                    {authMode === 'login' && "Acesso Administrativo"}
                    {authMode === 'forgot' && "Recuperar Senha"}
                    {authMode === 'reset' && "Redefinir Senha"}
                </h2>

                {authMode === 'login' && (
                    <form onSubmit={handleLogin}>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usuário</label>
                            <input
                                type="email"
                                value={user}
                                onChange={e => setUser(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                placeholder="admin@exemplo.com"
                                required
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
                                required
                            />
                        </div>

                        {showApiOverride && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <label className="block text-sm font-bold text-yellow-800 mb-1">
                                    Correção Manual de URL da API
                                </label>
                                <p className="text-xs text-yellow-700 mb-2">
                                    O sistema detectou erro de configuração. Digite a URL correta do backend (HTTPS).
                                </p>
                                <input
                                    type="text"
                                    value={customApiUrl}
                                    onChange={e => {
                                        setCustomApiUrl(e.target.value);
                                        localStorage.setItem('admin_api_url', e.target.value);
                                    }}
                                    className="w-full p-2 border border-yellow-400 rounded-lg bg-white"
                                    placeholder="Ex: https://api.fabricadebestseller.com.br"
                                />
                            </div>
                        )}
                        {msg && <p className="text-red-500 text-sm mb-4 text-center">{msg}</p>}
                        <button type="submit" className="w-full bg-slate-900 text-white font-bold py-3 rounded-lg hover:bg-slate-800 transition">
                            Entrar
                        </button>
                        <div className="mt-4 flex flex-col gap-2 text-center">
                            <button type="button" onClick={() => { setAuthMode('forgot'); setMsg(''); }} className="text-sm text-blue-600 hover:underline">
                                Esqueci minha senha
                            </button>
                            <button type="button" onClick={onBack} className="text-sm text-slate-500 hover:underline">
                                Voltar ao App
                            </button>
                        </div>
                    </form>
                )}

                {authMode === 'forgot' && (
                    <form onSubmit={handleForgot}>
                        <div className="mb-4 text-sm text-slate-600 text-center">
                            Digite seu email para receber um link de redefinição de senha.
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email Cadastrado</label>
                            <input
                                type="email"
                                value={user}
                                onChange={e => setUser(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                placeholder="admin@exemplo.com"
                                required
                            />
                        </div>
                        {msg && <p className={`text-sm mb-4 text-center ${msg.includes('enviado') ? 'text-green-600' : 'text-red-500'}`}>{msg}</p>}
                        <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
                            Enviar Link
                        </button>
                        <div className="mt-4 text-center">
                            <button type="button" onClick={() => { setAuthMode('login'); setMsg(''); }} className="text-sm text-slate-500 hover:underline">
                                Voltar ao Login
                            </button>
                        </div>
                    </form>
                )}

                {authMode === 'reset' && (
                    <form onSubmit={handleReset}>
                        <div className="mb-4 text-sm text-slate-600 text-center">
                            Defina sua nova senha de acesso.
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={user}
                                disabled
                                className="w-full p-2 border rounded-lg bg-slate-100 text-slate-500"
                            />
                        </div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nova Senha</label>
                            <input
                                type="password"
                                value={newPass}
                                onChange={e => setNewPass(e.target.value)}
                                className="w-full p-2 border rounded-lg"
                                placeholder="******"
                                required
                                minLength={6}
                            />
                        </div>
                        {msg && <p className="text-red-500 text-sm mb-4 text-center">{msg}</p>}
                        <button type="submit" className="w-full py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition">
                            Salvar Nova Senha
                        </button>
                        <div className="mt-4 text-center">
                            <button type="button" onClick={() => { setAuthMode('login'); setMsg(''); window.history.replaceState({}, '', '/admin'); }} className="text-sm text-slate-500 hover:underline">
                                Cancelar
                            </button>
                        </div>
                    </form>
                )}
            </div>
        );
    }

    if (!settings) {
        if (loadingError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
                    <div className="bg-white p-8 rounded-xl shadow-lg border border-red-200 text-center max-w-md w-full">
                        <div className="text-4xl mb-4">⚠️</div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Erro de Conexão</h3>
                        <p className="text-slate-600 mb-6">Não foi possível carregar as configurações do painel. Verifique se o servidor backend está rodando.</p>

                        <div className="space-y-3">
                            <button
                                onClick={() => { setLoadingError(false); loadSettings(); }}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-all"
                            >
                                🔄 Tentar Novamente
                            </button>
                            <button
                                onClick={() => { setToken(null); localStorage.removeItem('admin_token'); }}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium py-3 rounded-lg transition-all"
                            >
                                Voltar ao Login
                            </button>
                        </div>
                    </div>
                </div>
            );
        }
        return (
            <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p>Carregando painel...</p>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-xl z-20">
                <div className="p-6 border-b border-slate-800">
                    <h2 className="font-bold text-white text-lg tracking-tight">Admin Panel</h2>
                    <div className="text-xs text-slate-500 mt-1">v2.1.0 (Stable)</div>
                </div>

                <nav className="flex-1 overflow-y-auto py-4">
                    <div className="px-4 space-y-1">
                        <button
                            onClick={() => {
                                if (confirm("Abrir a Fábrica de Best Sellers?")) {
                                    localStorage.setItem('bsf_hasAccess', 'true');
                                    if (!localStorage.getItem('bsf_userContact')) {
                                        localStorage.setItem('bsf_userContact', JSON.stringify({ name: 'Admin', email: 'admin@local.com' }));
                                    }
                                    window.location.href = '/factory';
                                }
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-lg transition-colors bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 hover:text-emerald-300 mb-4 border border-emerald-900/50"
                        >
                            <span>🏭</span> ACESSAR FÁBRICA
                        </button>
                        <button
                            onClick={() => setActiveSection('dashboard')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <span>📊</span> Dashboard
                        </button>
                        <button
                            onClick={() => setActiveSection('setup')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'setup' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <span>⚙️</span> Config. IA & Email
                        </button>
                        <button
                            onClick={() => setActiveSection('integrations')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'integrations' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <span>🔗</span> Integrações
                        </button>
                        <button
                            onClick={() => setActiveSection('backups')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'backups' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <span>💾</span> Backups
                        </button>
                        <div className="pt-4 pb-2">
                            <div className="text-xs font-bold text-slate-600 px-4 uppercase tracking-wider">Ferramentas</div>
                        </div>
                        <button
                            onClick={() => setActiveSection('simulator')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'simulator' ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <span>🚀</span> Simulador App
                        </button>
                        <div className="pt-4 pb-2">
                            <div className="text-xs font-bold text-slate-600 px-4 uppercase tracking-wider">Conta</div>
                        </div>
                        <button
                            onClick={() => setActiveSection('profile')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'profile' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <span>👤</span> Meu Perfil
                        </button>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-2">
                    <a href="/?new_session=true" target="_blank" rel="noopener noreferrer" className="block w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-white border border-slate-700 rounded hover:bg-slate-800 transition">
                        Ir para Landing Page ↗
                    </a>
                    <button
                        onClick={() => { setToken(null); localStorage.removeItem('admin_token'); }}
                        className="w-full py-2 text-xs font-bold text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition"
                    >
                        Sair do Painel
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-auto bg-slate-50 relative">
                {/* Header Strip */}
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                    <h1 className="text-xl font-bold text-slate-800 capitalize">
                        {activeSection === 'setup' ? 'Configurações de IA' : activeSection}
                    </h1>
                    <div className="flex items-center gap-4">
                        {msg && <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-pulse border border-emerald-100">{msg}</span>}
                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border border-slate-300">
                            A
                        </div>
                    </div>
                </header>

                <main className="p-8 max-w-6xl mx-auto pb-20">

                    {/* DASHBOARD SECTION */}
                    {activeSection === 'dashboard' && (
                        <div className="space-y-8 animate-fade-in">
                            {/* Actions Header */}
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-700">Visão Geral</h2>
                                    <p className="text-sm text-slate-500">Acompanhe as vendas e solicitações em tempo real.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={refreshAll}
                                        disabled={isRefreshing}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition ${isRefreshing ? 'bg-slate-100 text-slate-400' : 'bg-white text-blue-600 border border-blue-100 hover:bg-blue-50'}`}
                                    >
                                        <span>{isRefreshing ? '⏳' : '🔄'}</span> {isRefreshing ? 'Atualizando...' : 'Atualizar Dados'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            const headers = ["Data", "Nome", "Email", "Telefone", "Tipo", "Status"];
                                            const rows = leads.map(l => [
                                                new Date(l.date).toLocaleDateString() + " " + new Date(l.date).toLocaleTimeString(),
                                                l.name,
                                                l.email,
                                                l.fullPhone,
                                                l.type || "BOOK",
                                                l.status || "PENDING"
                                            ]);
                                            const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
                                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                            const url = URL.createObjectURL(blob);
                                            const link = document.createElement("a");
                                            link.setAttribute("href", url);
                                            link.setAttribute("download", "leads_export.csv");
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }}
                                        className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 transition"
                                    >
                                        <span>📊</span> Exportar Excel
                                    </button>
                                    <button
                                        onClick={handleWipeAll}
                                        className="px-4 py-2 rounded-lg text-sm font-bold shadow-sm bg-red-600 text-white hover:bg-red-700 flex items-center gap-2 transition"
                                    >
                                        <span>⚠️</span> Apagar Tudo
                                    </button>
                                </div>
                            </div>

                            <DashboardCharts leads={leads} orders={orders} />

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                                    <h3 className="font-bold text-slate-700">Solicitações Recentes</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left min-w-[800px]">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                                            <tr>
                                                <th className="p-4 w-32">Data</th>
                                                <th className="p-4">Cliente</th>
                                                <th className="p-4 w-40">Status</th>
                                                <th className="p-4 text-right">Ações</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 bg-white">
                                            {leads.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">Nenhuma solicitação pendente.</td></tr>}
                                            {leads.map((lead: any) => (
                                                <LeadRow
                                                    key={lead.id}
                                                    lead={lead}
                                                    onApprove={handleApproveLead}
                                                    onDelete={handleDelete}
                                                    onEdit={handleEdit}
                                                    onDiagram={handleDiagram}
                                                    onWipe={handleWipe}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-8">
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                        <BookOpen className="text-emerald-500" size={24} />
                                        Histórico de Livros Gerados
                                    </h3>

                                    <div className="flex flex-wrap items-center gap-3 text-sm">
                                        <select
                                            value={salesFilter}
                                            onChange={e => setSalesFilter(e.target.value as any)}
                                            className="p-2 border rounded-md text-slate-700 font-medium"
                                        >
                                            <option value="all">Todo o Período</option>
                                            <option value="today">Hoje</option>
                                            <option value="week">Últimos 7 dias</option>
                                            <option value="month">Este Mês</option>
                                            <option value="custom">Data Personalizada</option>
                                        </select>

                                        {salesFilter === 'custom' && (
                                            <div className="flex items-center gap-2">
                                                <input type="date" value={salesStartDate} onChange={e => setSalesStartDate(e.target.value)} className="p-2 border rounded-md" />
                                                <span className="text-slate-500">até</span>
                                                <input type="date" value={salesEndDate} onChange={e => setSalesEndDate(e.target.value)} className="p-2 border rounded-md" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="divide-y divide-slate-100 bg-white">
                                    {getFilteredProjects().length === 0 && (
                                        <div className="p-12 text-center text-slate-400 font-medium">
                                            Nenhum livro gerado encontrado para o período selecionado.
                                        </div>
                                    )}
                                    {getFilteredProjects().map((order: any, idx: number) => (
                                        <div key={order.id || idx} className="p-6 hover:bg-slate-50 transition flex flex-col lg:flex-row items-center justify-between gap-6">
                                            <div className="flex items-center gap-6 w-full lg:flex-1">
                                                <div className="w-16 h-20 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center text-3xl shadow-sm border border-slate-200">
                                                    📚
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex flex-col mb-2">
                                                        <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest leading-none mb-1">Livro Gerado</span>
                                                        <h4 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight break-words">
                                                            {order.title || "Geração sem Título"}
                                                        </h4>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 mt-4 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                                                <User size={12} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-slate-400 font-black uppercase leading-none mb-0.5">Cliente</span>
                                                                <span className="text-sm font-bold text-slate-700">{order.customerName || "-"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                                                <Mail size={12} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-slate-400 font-black uppercase leading-none mb-0.5">E-mail</span>
                                                                <span className="text-sm text-slate-600">{order.customerEmail}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 bg-emerald-50 text-emerald-600 rounded flex items-center justify-center text-[10px] font-bold">A</div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-slate-400 font-black uppercase leading-none mb-0.5">Autor(a)</span>
                                                                <span className="text-sm font-bold text-slate-700">{order.authorName || "N/A"}</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400">
                                                                <Calendar size={12} />
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[9px] text-slate-400 font-black uppercase leading-none mb-0.5">Data de Geração</span>
                                                                <span className="text-sm text-slate-600">
                                                                    {order.date ? new Date(order.date).toLocaleString('pt-BR') : "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between lg:justify-center gap-4 w-full lg:w-auto h-full border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
                                                <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                                                    ['PAID', 'SUCCESS', 'READY', 'COMPLETED', 'LIVRO ENTREGUE'].includes(order.status.toUpperCase()) 
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                                }`}>
                                                    {order.status === 'READY' || order.status === 'COMPLETED' ? 'Livro Gerado' : order.status}
                                                </span>
                                                
                                                <div className="flex items-center gap-2">
                                                    {order.downloadUrl && (
                                                        <a
                                                            href={order.downloadUrl.startsWith('http') ? order.downloadUrl : `${getApiBase()}${order.downloadUrl}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-xs shadow-lg shadow-indigo-200 uppercase tracking-widest group"
                                                        >
                                                            <Download size={16} className="group-hover:translate-y-0.5 transition-transform" /> 
                                                            <span className="hidden sm:inline">Baixar Kit ZIP</span>
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteProject(order.projectId)}
                                                        className="p-3 text-rose-500 border border-rose-200 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all shadow-sm"
                                                        title="Excluir Projeto Permanentemente"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-slate-50 p-4 border-t border-slate-200 text-right">
                                    <span className="text-slate-600 font-bold uppercase text-[10px] tracking-widest">Total de Gerações: </span>
                                    <span className="text-xl font-black text-slate-800 ml-2">
                                        {getFilteredProjects().length} Livros
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SETUP SECTION */}
                    {activeSection === 'setup' && (
                        <div className="space-y-6 animate-fade-in max-w-3xl">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Seleção de Modelo de IA</h3>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Provedor Ativo</label>
                                    <select
                                        value={settings.activeProvider}
                                        onChange={e => setSettings({ ...settings, activeProvider: e.target.value })}
                                        className="w-full p-2 border rounded-lg text-lg bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="gemini">Google Gemini (Recomendado)</option>
                                        <option value="openai">OpenAI GPT-4</option>
                                        <option value="anthropic">Anthropic Claude 3</option>
                                        <option value="deepseek">DeepSeek Coder</option>
                                        <option value="llama">Meta Llama 3 (Groq)</option>
                                    </select>
                                    <p className="text-xs text-slate-500 mt-2">
                                        O modelo selecionado será usado para gerar todos os livros.
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Chaves de API (Secretas)</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Gemini API Key</label>
                                        <input
                                            type="password"
                                            value={settings.providers.gemini}
                                            onChange={e => setSettings({ ...settings, providers: { ...settings.providers, gemini: e.target.value } })}
                                            className="w-full p-2 border rounded-lg font-mono text-sm bg-slate-50 focus:bg-white transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">OpenAI API Key</label>
                                        <input
                                            type="password"
                                            value={settings.providers.openai}
                                            onChange={e => setSettings({ ...settings, providers: { ...settings.providers, openai: e.target.value } })}
                                            className="w-full p-2 border rounded-lg font-mono text-sm bg-slate-50 focus:bg-white transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Anthropic Key</label>
                                        <input
                                            type="password"
                                            value={settings.providers.anthropic}
                                            onChange={e => setSettings({ ...settings, providers: { ...settings.providers, anthropic: e.target.value } })}
                                            className="w-full p-2 border rounded-lg font-mono text-sm bg-slate-50 focus:bg-white transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">DeepSeek Key</label>
                                        <input
                                            type="password"
                                            value={settings.providers.deepseek}
                                            onChange={e => setSettings({ ...settings, providers: { ...settings.providers, deepseek: e.target.value } })}
                                            className="w-full p-2 border rounded-lg font-mono text-sm bg-slate-50 focus:bg-white transition"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Groq (Llama) Key</label>
                                        <input
                                            type="password"
                                            value={settings.providers.llama}
                                            onChange={e => setSettings({ ...settings, providers: { ...settings.providers, llama: e.target.value } })}
                                            className="w-full p-2 border rounded-lg font-mono text-sm bg-slate-50 focus:bg-white transition"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Configuração SMTP (E-mail)</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Host</label>
                                        <input type="text" value={settings.email?.host || ''} onChange={e => setSettings({ ...settings, email: { ...settings.email, host: e.target.value } })} className="w-full p-2 border rounded-lg text-sm" placeholder="smtp.example.com" />
                                        <label className="text-xs font-bold uppercase text-slate-500 mb-1 block">Senha</label>
                                        <input type="password" value={settings.email?.pass || ''} onChange={e => setSettings({ ...settings, email: { ...settings.email, pass: e.target.value } })} className="w-full p-2 border rounded-lg text-sm" />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition transform active:scale-95">Salvar Configurações</button>
                            </div>
                        </div>
                    )}

                    {/* INTEGRATIONS SECTION */}
                    {activeSection === 'integrations' && (
                        <div className="space-y-6 animate-fade-in max-w-4xl">

                            {/* === ASAAS GATEWAY === */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex items-center justify-between mb-4 border-b pb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Gateway Asaas</h3>
                                        <p className="text-xs text-slate-500 mt-1">Alterne entre Sandbox e Produção. Chaves gerenciadas no Coolify.</p>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${asaasEnv === 'production' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-yellow-100 text-yellow-700 border border-yellow-200'}`}>
                                        {asaasEnv === 'production' ? '🟢 Produção Ativa' : '🟡 Sandbox Ativo'}
                                    </span>
                                </div>

                                {/* Status das Chaves no Servidor */}
                                <div className="mb-5 grid grid-cols-2 gap-3">
                                    <div className={`p-3 rounded-lg border text-sm ${hasSandboxKey ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                        <div className="font-bold text-xs uppercase mb-1">ASAAS_SANDBOX_KEY</div>
                                        <div>{hasSandboxKey ? '✅ Configurada no Coolify' : '❌ Não configurada'}</div>
                                    </div>
                                    <div className={`p-3 rounded-lg border text-sm ${hasProductionKey ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-600'}`}>
                                        <div className="font-bold text-xs uppercase mb-1">ASAAS_PRODUCTION_KEY</div>
                                        <div>{hasProductionKey ? '✅ Configurada no Coolify' : '❌ Não configurada'}</div>
                                    </div>
                                </div>

                                {/* Environment Toggle */}
                                <div className="mb-5">
                                    <label className="text-xs font-bold uppercase text-slate-500 mb-2 block">Selecionar Ambiente</label>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setAsaasEnv('sandbox')}
                                            disabled={!hasSandboxKey}
                                            className={`flex-1 py-3 rounded-lg text-sm font-bold border transition ${asaasEnv === 'sandbox'
                                                ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                        >
                                            🟡 Sandbox (Testes)
                                            {!hasSandboxKey && <span className="block text-xs font-normal mt-0.5">Chave não configurada</span>}
                                        </button>
                                        <button
                                            onClick={() => setAsaasEnv('production')}
                                            disabled={!hasProductionKey}
                                            className={`flex-1 py-3 rounded-lg text-sm font-bold border transition ${asaasEnv === 'production'
                                                ? 'bg-green-50 border-green-500 text-green-800'
                                                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-slate-300'
                                                } disabled:opacity-40 disabled:cursor-not-allowed`}
                                        >
                                            🟢 Produção
                                            {!hasProductionKey && <span className="block text-xs font-normal mt-0.5">Chave não configurada</span>}
                                        </button>
                                    </div>
                                </div>

                                {asaasMsg && (
                                    <p className={`text-sm mb-3 font-medium ${asaasMsg.startsWith('✅') ? 'text-green-600' : 'text-red-600'}`}>
                                        {asaasMsg}
                                    </p>
                                )}

                                <button
                                    disabled={asaasSaving}
                                    onClick={async () => {
                                        setAsaasSaving(true);
                                        setAsaasMsg('');
                                        try {
                                            const res = await fetch(`${getAdminUrl()}/asaas-env`, {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    Authorization: `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ env: asaasEnv })
                                            });
                                            const data = await res.json();
                                            if (res.ok) {
                                                setAsaasMsg(`✅ ${data.message}`);
                                            } else {
                                                setAsaasMsg(`❌ ${data.error}`);
                                            }
                                        } catch (e: any) {
                                            setAsaasMsg(`❌ Erro de rede: ${e.message}`);
                                        } finally {
                                            setAsaasSaving(false);
                                            setTimeout(() => setAsaasMsg(''), 6000);
                                        }
                                    }}
                                    className="w-full py-3 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                                >
                                    {asaasSaving ? 'Alternando...' : `Confirmar: Ativar ${asaasEnv === 'production' ? 'Produção 🟢' : 'Sandbox 🟡'}`}
                                </button>

                                <p className="text-xs text-slate-400 mt-3 text-center">
                                    As chaves ASAAS_SANDBOX_KEY, ASAAS_PRODUCTION_KEY, ASAAS_SANDBOX_WEBHOOK e ASAAS_PRODUCTION_WEBHOOK são gerenciadas exclusivamente pelo Coolify.
                                </p>
                            </div>


                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Webhook de Pagamento</h3>
                                <p className="text-sm text-slate-600 mb-4">A URL abaixo recebe notificações da Kiwify para liberar acesso automaticamente.</p>
                                <div className="flex gap-2">
                                    <input readOnly value={`${window.location.origin}/api/payment/webhook`} className="flex-1 p-2 border rounded bg-slate-50 text-xs font-mono text-slate-600" />
                                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/payment/webhook`)} className="px-4 py-2 bg-slate-200 text-xs font-bold rounded hover:bg-slate-300">Copiar</button>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Links de Produtos (Upsell)</h3>
                                <p className="text-sm text-slate-500 mb-6">Configure os links de checkout para os produtos adicionais oferecidos no App.</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Livro em Inglês</label>
                                        <input type="text" value={settings.products?.english_book || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, english_book: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Livro em Espanhol</label>
                                        <input type="text" value={settings.products?.spanish_book || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, spanish_book: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Capa Impressa</label>
                                        <input type="text" value={settings.products?.cover_printed || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, cover_printed: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Capa Ebook</label>
                                        <input type="text" value={settings.products?.cover_ebook || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, cover_ebook: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Amazon Impresso</label>
                                        <input type="text" value={settings.products?.pub_amazon_printed || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, pub_amazon_printed: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Amazon Digital</label>
                                        <input type="text" value={settings.products?.pub_amazon_digital || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, pub_amazon_digital: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">UICLAP</label>
                                        <input type="text" value={settings.products?.pub_uiclap || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, pub_uiclap: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Ficha Catalográfica</label>
                                        <input type="text" value={settings.products?.catalog_card || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, catalog_card: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">ISBN Impresso</label>
                                        <input type="text" value={settings.products?.isbn_printed || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, isbn_printed: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">ISBN Digital</label>
                                        <input type="text" value={settings.products?.isbn_digital || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, isbn_digital: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-700">PACOTE COMPLETO</label>
                                        <input type="text" value={settings.products?.complete_package || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, complete_package: e.target.value } })} className="w-full p-2 border rounded text-sm border-brand-300 ring-2 ring-brand-100" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Página de Vendas</label>
                                        <input type="text" value={settings.products?.sales_page || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, sales_page: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-500">Hospedagem</label>
                                        <input type="text" value={settings.products?.hosting || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, hosting: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button onClick={handleSave} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-lg hover:bg-blue-700 transition">Salvar Integrações</button>
                            </div>
                        </div>
                    )}

                    {/* BACKUPS SECTION */}
                    {activeSection === 'backups' && (
                        <div className="space-y-6 animate-fade-in max-w-3xl">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-center mb-6 border-b pb-4">
                                    <div>
                                        <h3 className="font-bold text-slate-800">Sistema de Backup</h3>
                                        <p className="text-sm text-slate-500">Crie pontos de restauração antes de grandes mudanças.</p>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (confirm("Criar backup agora?")) {
                                                try {
                                                    const res = await fetch(`${getAdminUrl()}/backups`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                                                    if (res.ok) alert("Backup criado!");
                                                } catch (e) { alert("Erro de conexão"); }
                                            }
                                        }}
                                        className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded hover:bg-slate-700"
                                    >
                                        + Criar Novo Backup
                                    </button>
                                </div>
                                <BackupList token={token} apiUrl={getAdminUrl()} />
                            </div>
                        </div>
                    )}

                    {/* SIMULATOR SECTION */}
                    {activeSection === 'simulator' && (
                        <div className="animate-fade-in max-w-4xl">
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-lg relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <span className="text-9xl">🚀</span>
                                </div>
                                <h3 className="font-bold text-2xl text-slate-800 mb-2 relative z-10">Simulador de Experiência</h3>
                                <p className="text-slate-600 mb-8 max-w-lg relative z-10">
                                    Use esta ferramenta para visualizar o aplicativo como se fosse um cliente, pulando etapas burocráticas para testar o fluxo rapidamente.
                                    <br /><strong className="text-orange-600">Atenção:</strong> Isso abrirá uma nova aba e reiniciará a sessão do navegador.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                                    <button
                                        onClick={() => {
                                            if (!confirm("Iniciar simulação limpa?")) return;
                                            localStorage.clear();
                                            window.open('/?new_session=true', '_blank');
                                        }}
                                        className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition text-left group"
                                    >
                                        <div className="font-bold text-lg text-slate-700 group-hover:text-blue-700 mb-1">1. Novo Visitante</div>
                                        <p className="text-sm text-slate-500">Simula um usuário chegando pela primeira vez. Vai para a Landing Page (Vendas).</p>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (!confirm("Iniciar simulação?")) return;
                                            const dummy = { name: "Admin Simulador", email: `admin.sim.${Date.now()}@test.com`, phone: "11999999999" };
                                            localStorage.setItem('bsf_step', '1');
                                            localStorage.setItem('bsf_userContact', JSON.stringify(dummy));
                                            localStorage.setItem('bsf_hasAccess', 'true'); // Simulate Access Granted
                                            window.open('/', '_blank');
                                        }}
                                        className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition text-left group"
                                    >
                                        <div className="font-bold text-lg text-slate-700 group-hover:text-purple-700 mb-1">2. Cliente com Acesso</div>
                                        <p className="text-sm text-slate-500">Pula a Landing Page e vai direto para o cadastro inicial (Step 1) já autenticado/pago.</p>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (!confirm("Iniciar simulação?")) return;
                                            const dummy = { name: "Admin Simulador", email: `admin.sim.${Date.now()}@test.com`, phone: "11999999999" };
                                            const meta = { authorName: "Admin Author", topic: "Livro sobre Testes Automatizados", dedication: "Ao time de QA" };
                                            localStorage.setItem('bsf_step', '2');
                                            localStorage.setItem('bsf_userContact', JSON.stringify(dummy));
                                            localStorage.setItem('bsf_metadata', JSON.stringify(meta));
                                            localStorage.setItem('bsf_hasAccess', 'true');
                                            window.open('/', '_blank');
                                        }}
                                        className="p-6 bg-slate-50 border-2 border-slate-200 rounded-xl hover:border-emerald-500 hover:bg-emerald-50 transition text-left group"
                                    >
                                        <div className="font-bold text-lg text-slate-700 group-hover:text-emerald-700 mb-1">3. Processo de Criação (Generator)</div>
                                        <p className="text-sm text-slate-500">Pula todo o cadastro. Vai direto para a tela de geração com tópico preenchido.</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PROFILE SECTION */}
                    {activeSection === 'profile' && (
                        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
                            <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-xl text-slate-800 mb-6 flex items-center gap-2">
                                    <span>🔐</span> Alterar Senha de Acesso
                                </h3>

                                <form onSubmit={handleChangePassword} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Senha Atual</label>
                                        <input
                                            type="password"
                                            value={profileOldPass}
                                            onChange={e => setProfileOldPass(e.target.value)}
                                            className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Digite sua senha atual..."
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-2">Nova Senha</label>
                                        <input
                                            type="password"
                                            value={profileNewPass}
                                            onChange={e => setProfileNewPass(e.target.value)}
                                            className="w-full p-3 border rounded-lg bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                                            placeholder="Digite a nova senha..."
                                            required
                                            minLength={6}
                                        />
                                        <p className="text-xs text-slate-500 mt-2">Mínimo de 6 caracteres.</p>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            type="submit"
                                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition shadow-lg"
                                        >
                                            Atualizar Senha
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};
