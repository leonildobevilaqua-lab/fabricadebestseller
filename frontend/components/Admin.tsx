import React, { useState, useEffect } from 'react';
import { Download, Trash2, Clock, CheckCircle, BookOpen, User, Mail, Calendar, Zap, MessageCircle } from 'lucide-react';
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

// Helper: Calculate Value based on User Rules (Source of Truth 2025)
const calculateLeadValue = (l: any) => {
    if (l.paymentInfo?.amount) return Number(l.paymentInfo.amount);
    if (l.status === 'SUBSCRIBER' || (l.plan && l.plan.status === 'ACTIVE')) {
        const pName = l.plan?.name?.toUpperCase();
        const billing = l.plan?.billing?.toLowerCase(); 
        if (pName === 'STARTER') return billing === 'annual' || billing === 'anual' ? 147.90 : 19.90;
        if (pName === 'PRO') return billing === 'annual' || billing === 'anual' ? 297.90 : 39.90;
        if (pName === 'BLACK') return billing === 'annual' || billing === 'anual' ? 497.90 : 79.90;
    }
    if (l.type === 'BOOK' || l.type === 'LIVRO') {
        const planName = (l.plan?.name || "AVULSO").toUpperCase();
        const billing = (l.plan?.billing || "monthly").toLowerCase();
        const isAnnual = billing === 'annual' || billing === 'anual';
        if (planName === 'STARTER') return isAnnual ? 24.90 : 28.90;
        if (planName === 'PRO') return isAnnual ? 14.90 : 18.90;
        if (planName === 'BLACK') return isAnnual ? 8.90 : 9.90;
        return 89.90;
    }
    return 89.90;
};

const getRevenue = (filter: 'day' | 'week' | 'month' | 'year', dataOrders: any[]) => {
    const now = new Date();
    const filtered = (dataOrders || []).filter(o => {
        const status = (o.paymentInfo?.status || o.status || 'PAID').toUpperCase();
        if (status === 'PENDING' || status === 'REFUNDED' || status === 'CANCELLED') return false;
        const dStr = o.date || o.created_at;
        if (!dStr) return false;
        const d = new Date(dStr);
        if (isNaN(d.getTime())) return false;
        const targetStr = d.toLocaleDateString('en-CA');
        const todayStr = now.toLocaleDateString('en-CA');
        if (filter === 'day') return targetStr === todayStr;
        if (filter === 'week') return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        if (filter === 'year') return d.getFullYear() === now.getFullYear();
        return true;
    });
    return filtered.reduce((acc, curr) => acc + Number(curr.paymentInfo?.amount || curr.amount || 0), 0);
};

// --- Dashboard Component ---
const DashboardCharts = ({ leads = [], orders = [] }: { leads: any[], orders: any[] }) => {
    const showCharts = true;
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeOrders = Array.isArray(orders) ? orders : [];

    // Data for charts
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    const revenueData = last7Days.map(date => {
        const targetStr = date.toLocaleDateString('en-CA');
        const dayOrders = safeOrders.filter(o => {
            const status = (o.paymentInfo?.status || o.status || 'PAID').toUpperCase();
            if (status === 'PENDING' || status === 'REFUNDED' || status === 'CANCELLED') return false;
            const dStr = o.date || o.created_at;
            if (!dStr) return false;
            return new Date(dStr).toLocaleDateString('en-CA') === targetStr;
        });
        return { 
            name: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), 
            value: dayOrders.reduce((acc, curr) => acc + Number(curr.paymentInfo?.amount || curr.amount || 0), 0)
        };
    });

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

    // Top Customers calculation
    const customerMap = safeOrders.reduce((acc: any, curr: any) => {
        const status = (curr.paymentInfo?.status || curr.status || 'PAID').toUpperCase();
        if (status === 'PENDING' || status === 'REFUNDED' || status === 'CANCELLED') return acc;
        const email = curr.paymentInfo?.payerEmail || curr.email || 'Desconhecido';
        acc[email] = (acc[email] || 0) + (curr.paymentInfo?.amount || curr.amount || 0);
        return acc;
    }, {});

    const topCustomers = Object.entries(customerMap)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([email, total]) => ({ email, total }));

    return (
        <div className="space-y-6 mb-8">
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
                                        {pieData.map((_entry, index) => (
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
                    {topCustomers.map((c: any, i: number) => (
                        <div key={i} className="flex justify-between items-center border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600">
                                    {i + 1}
                                </div>
                                <span className="text-sm font-medium text-slate-600 tracking-tight">{c.email}</span>
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
    const [activeSection, setActiveSection] = useState<'dashboard' | 'setup' | 'integrations' | 'backups' | 'simulator' | 'profile' | 'credits'>('dashboard');

    // Profile State
    const [profileOldPass, setProfileOldPass] = useState('');
    const [profileNewPass, setProfileNewPass] = useState('');

    // --- Credits Management State ---
    const [creditSearchEmail, setCreditSearchEmail] = useState('');
    const [foundCredits, setFoundCredits] = useState<number | null>(null);
    const [creditAmount, setCreditAmount] = useState(1);
    const [creditsOpLoading, setCreditsOpLoading] = useState(false);
    const [creditsMsg, setCreditsMsg] = useState('');

    const handleSearchCredits = async () => {
        if (!creditSearchEmail) return;
        setCreditsOpLoading(true);
        setCreditsMsg('');
        try {
            const res = await fetch(`${getAdminUrl()}/credits/${encodeURIComponent(creditSearchEmail.trim())}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setFoundCredits(data.credits);
                if (data.credits === 0 && !creditsMsg) setCreditsMsg('ℹ️ Usuário encontrado, mas sem créditos no momento.');
            } else {
                setCreditsMsg(`❌ ${data.error || 'Usuário não encontrado ou erro na busca.'}`);
                setFoundCredits(null);
            }
        } catch (e: any) {
            setCreditsMsg(`❌ Erro de conexão: ${e.message}`);
        } finally {
            setCreditsOpLoading(false);
        }
    };

    const handleManageCreditsOp = async (amount: number) => {
        if (!creditSearchEmail) return;
        const actionLabel = amount > 0 ? 'adicionar' : 'remover';
        if (!confirm(`Deseja realmente ${actionLabel} ${Math.abs(amount)} crédito(s) para ${creditSearchEmail}?`)) return;

        setCreditsOpLoading(true);
        setCreditsMsg('');
        try {
            const res = await fetch(`${getAdminUrl()}/manage-credits`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ email: creditSearchEmail.trim(), amount })
            });
            const data = await res.json();
            if (res.ok) {
                setFoundCredits(data.newTotal);
                setCreditsMsg(`✅ Sucesso! Novo saldo de ${creditSearchEmail}: ${data.newTotal} créditos.`);
                refreshAll(); // Reload leads to sync UI
            } else {
                setCreditsMsg(`❌ ${data.error || 'Erro ao processar alteração.'}`);
            }
        } catch (e: any) {
            setCreditsMsg(`❌ Erro: ${e.message}`);
        } finally {
            setCreditsOpLoading(false);
        }
    };

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

    const handleImpersonate = async (email: string) => {
        if (!confirm(`Entrar na Área VIP do cliente ${email}?\n\nIsso redirecionará você para a visão do cliente.`)) return;
        
        try {
            const res = await fetch(`${getAdminUrl()}/impersonate`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                // Configura a sessão do usuário
                localStorage.setItem('bsf_token', data.token);
                localStorage.setItem('bsf_userContact', JSON.stringify({
                    name: data.user.name,
                    email: data.user.email,
                    phone: ''
                }));
                localStorage.setItem('bsf_hasAccess', 'true');
                localStorage.setItem('bsf_view', 'dashboard');
                
                // Redireciona para a raiz (limpa o cache do app)
                window.location.href = '/?new_session=true';
            } else {
                alert("Erro ao gerar acesso: " + (data.error || "Usuário não encontrado em /users"));
            }
        } catch (e) {
            console.error(e);
            alert("Falha na comunicação com o servidor.");
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

    const handleManageCredits = async (email: string, amount: number) => {
        try {
            const res = await fetch(`${getApiBase()}/api/admin/manage-credits`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json', 
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ email, amount })
            });
            if (res.ok) {
                alert(amount > 0 ? "Crédito adicionado!" : "Crédito removido!");
                refreshAll();
            } else {
                const data = await res.json();
                alert(data.error || "Erro ao gerenciar créditos.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão.");
        }
    };

    const handleAdminChangePassword = async (email: string) => {
        const newPass = prompt("Digite a nova senha para este cliente:");
        if (!newPass || newPass.length < 6) {
            if (newPass) alert("Senha muito curta (mínimo 6 caracteres).");
            return;
        }

        if (!window.confirm(`Confirmar alteração de senha para ${email}?`)) return;

        try {
            const res = await fetch(`${getApiBase()}/api/admin/update-user-password`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, newPassword: newPass })
            });

            if (res.ok) {
                alert("Senha atualizada com sucesso!");
            } else {
                const data = await res.json();
                alert(data.error || "Erro ao atualizar senha.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão.");
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

    const getCombinedTimeline = () => {
        // [RULE 2025] SOURCE OF TRUTH: ONLY SHOW PROJECTS (COMPLETED BOOKS) IN THIS LIST
        // Leads are filtered out to avoid "bagunça" in the main history view.
        return getFilteredProjects().map(p => ({ ...p, isProject: true }));
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
                            <span>🔗</span> Integrações & Webhooks
                        </button>
                        <button
                            onClick={() => setActiveSection('credits')}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeSection === 'credits' ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                            <Zap size={18} className={activeSection === 'credits' ? 'text-white' : 'text-amber-500'} /> 
                            ADICIONAR / EXCLUIR CRÉDITOS
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
                            <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <div>
                                    <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Visão Geral</h2>
                                    <p className="text-sm text-slate-500 font-medium">Controle de faturamento e solicitações do sistema.</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={refreshAll} className="px-6 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition shadow-sm">
                                        Atualizar Dados
                                    </button>
                                    <button onClick={() => {/* export logic */}} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition shadow-lg shadow-emerald-100">
                                        Exportar Leads
                                    </button>
                                </div>
                            </div>

                            {/* Top Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mb-2">Faturamento Hoje</div>
                                    <div className="text-4xl font-black text-slate-900 leading-none">R$ {getRevenue('day', orders).toFixed(2)}</div>
                                </div>
                                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.2em] mb-2">Faturamento Mês</div>
                                    <div className="text-4xl font-black text-slate-900 leading-none">R$ {getRevenue('month', orders).toFixed(2)}</div>
                                </div>
                                <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-[10px] text-orange-400 font-black uppercase tracking-[0.2em] mb-2">Solicitações</div>
                                            <div className="text-4xl font-black text-white leading-none">{leads.filter(l => l.status === 'PENDING').length}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-2">Assinantes</div>
                                            <div className="text-4xl font-black text-white leading-none">{leads.filter(l => l.status === 'SUBSCRIBER').length}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <DashboardCharts leads={leads} orders={orders} />

                            {/* Project History List (RESTORED & IMPROVED) */}
                            <div className="bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden mt-10">
                                <div className="bg-slate-50/50 px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight flex items-center gap-3">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200"><BookOpen size={20} /></div>
                                        Histórico de Livros Gerados
                                    </h3>
                                    <div className="bg-white px-4 py-2 rounded-full border border-slate-200 text-xs font-black text-slate-500 uppercase tracking-widest shadow-sm">
                                        {getCombinedTimeline().length} REGISTROS ENCONTRADOS
                                    </div>
                                </div>

                                <div className="divide-y divide-slate-100">
                                     {getCombinedTimeline().map((item: any, idx: number) => {
                                         const order = item;
                                         return (
                                             <div key={order.projectId || idx} className="p-6 md:p-8 hover:bg-slate-50/50 transition bg-white group border-b border-slate-100 last:border-0 relative overflow-hidden">
                                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                                                 <div className="flex flex-col xl:flex-row items-start justify-between gap-10">
                                                     
                                                     <div className="flex flex-1 items-start gap-8 w-full">
                                                         <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-50 border-2 border-slate-100 rounded-3xl flex-shrink-0 flex items-center justify-center text-5xl shadow-xl transition-all duration-500">
                                                             📚
                                                         </div>
                                                         
                                                         <div className="flex-1 min-w-0">
                                                             <div className="flex flex-col mb-4">
                                                                 <span className="text-[10px] text-emerald-600 font-black uppercase tracking-[0.4em] leading-none mb-2 bg-emerald-50 w-fit px-3 py-1 rounded-full">
                                                                     LIVRO GERADO
                                                                 </span>
                                                                 <h4 className="font-black text-slate-900 text-xl md:text-2xl leading-tight uppercase tracking-tighter break-words italic group-hover:text-indigo-600 transition-colors">
                                                                     {order.title || "PROJETO SEM TÍTULO"}
                                                                 </h4>
                                                             </div>
                                                             
                                                             <div className="bg-[#f8fafc] p-6 rounded-[32px] border border-slate-200/50 shadow-inner grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                                                 <div className="flex items-center gap-4">
                                                                     <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400"><User size={18} /></div>
                                                                     <div className="flex flex-col">
                                                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">CLIENTE</span>
                                                                         <span className="text-[14px] font-black text-slate-700 tracking-tight truncate max-w-[200px]">{order.customerName || "-"}</span>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex items-center gap-4">
                                                                     <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400"><Mail size={18} /></div>
                                                                     <div className="flex flex-col">
                                                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">E-MAIL</span>
                                                                         <span className="text-[14px] font-black text-slate-500 truncate lowercase max-w-[200px]">{order.customerEmail || "N/A"}</span>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex items-center gap-4">
                                                                     <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400"><MessageCircle size={18} /></div>
                                                                     <div className="flex flex-col">
                                                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">WHATSAPP</span>
                                                                         <span className="text-[14px] font-black text-indigo-500 underline decoration-indigo-100 underline-offset-4 tracking-tight">{order.customerPhone || "N/A"}</span>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex items-center gap-4">
                                                                     <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-emerald-500 font-black text-xs">A</div>
                                                                     <div className="flex flex-col">
                                                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">AUTOR(A)</span>
                                                                         <span className="text-[14px] font-black text-slate-900 tracking-tight truncate max-w-[200px]">{order.authorName || "-"}</span>
                                                                     </div>
                                                                 </div>
                                                                 <div className="flex items-center gap-4 md:col-span-2 pt-4 border-t border-slate-200/50 mt-1">
                                                                     <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 text-slate-400"><Calendar size={18} /></div>
                                                                     <div className="flex flex-col">
                                                                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">DATA DE GERAÇÃO</span>
                                                                         <span className="text-[14px] font-black text-slate-600">
                                                                             {order.date ? new Date(order.date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}
                                                                         </span>
                                                                     </div>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     </div>

                                                     <div className="flex flex-col items-end gap-6 w-full xl:w-auto">
                                                         <div className="flex flex-wrap items-center justify-end gap-4 w-full">
                                                             <span className="text-[10px] font-black px-5 py-2 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-600 uppercase tracking-widest shadow-sm">
                                                                 LIVRO GERADO
                                                             </span>
                                                             
                                                             <div className="flex items-center gap-3 bg-white p-1 px-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
                                                                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">CRÉDITOS:</span>
                                                                 <div className="flex items-center bg-slate-50 rounded-lg border border-slate-100 overflow-hidden">
                                                                     <button onClick={() => handleManageCreditsOp(-1)} className="px-3 py-1 hover:bg-white text-md font-black text-slate-400 hover:text-red-500 transition-all">-</button>
                                                                     <div className="px-3 py-1 text-xs font-black text-slate-900 min-w-[30px] text-center border-x border-slate-100">{order.credits || foundCredits || 0}</div>
                                                                     <button onClick={() => handleManageCreditsOp(1)} className="px-3 py-1 hover:bg-white text-md font-black text-slate-400 hover:text-emerald-500 transition-all">+</button>
                                                                 </div>
                                                             </div>
                                                         </div>

                                                         <div className="flex items-center gap-4 w-full justify-end">
                                                             <button
                                                                 onClick={() => window.open(`${getApiBase()}/api/projects/download-zip/${order.projectId}`, '_blank')}
                                                                 className="flex items-center gap-4 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-indigo-200/50 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden flex-1 md:flex-none justify-center"
                                                             >
                                                                 <Download size={20} className="group-hover:animate-bounce" />
                                                                 <span>BAIXAR KIT ZIP</span>
                                                             </button>
                                                             
                                                             <button
                                                                 onClick={() => handleImpersonate(order.customerEmail)}
                                                                 className="p-5 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                                                 title="Ver Área do Cliente"
                                                             >
                                                                 <User size={24} />
                                                             </button>
                                                             
                                                             <button
                                                                 onClick={() => handleDeleteProject(order.projectId)}
                                                                 className="p-5 bg-white border border-red-100 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                                 title="Excluir"
                                                             >
                                                                 <Trash2 size={24} />
                                                             </button>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>
                                         );
                                     })}

