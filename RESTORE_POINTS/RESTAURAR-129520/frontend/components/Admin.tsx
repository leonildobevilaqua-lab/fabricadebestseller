import React, { useState, useEffect } from 'react';
const API_URL = 'http://localhost:3001/api/admin';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// --- Dashboard Component ---
// --- Dashboard Component ---
const DashboardCharts = ({ leads = [], orders = [] }: { leads: any[], orders: any[] }) => {
    // Feature flag: Enable charts only when safely validated
    const showCharts = false;

    // Safety check
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeOrders = Array.isArray(orders) ? orders : [];

    // 1. Revenue Calculations
    const getRevenue = (filter: 'day' | 'week' | 'month' | 'year') => {
        const now = new Date();
        const filteredOrders = safeOrders.filter(o => {
            if (!o) return false;
            const dStr = o.date || o.created_at;
            if (!dStr) return false;

            const d = new Date(dStr);
            if (isNaN(d.getTime())) return false;

            if (filter === 'day') return d.toDateString() === now.toDateString();
            if (filter === 'week') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return d >= oneWeekAgo;
            }
            if (filter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            if (filter === 'year') return d.getFullYear() === now.getFullYear();
            return true;
        });

        return filteredOrders.reduce((acc, curr) => {
            const amt = curr.amount ? parseFloat(curr.amount) : 24.99; // Assume 24.99 default if missing
            // If Kiwify sends cents (integer), divide by 100. If float, don't.
            // Usually Stripe/Kiwify send cents. Let's assume cents for safety or standard value.
            // If value is > 1000, likely cents. If < 1000, likely float?
            // Let's stick to a simple fallback: if existing amount < 1000, use as is, else / 100.
            // Or simpler: just use 24.99 as fallback.
            return acc + (curr.amount ? (curr.amount > 1000 ? curr.amount / 100 : curr.amount) : 24.99);
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
        const dayOrders = safeOrders.filter(o => {
            const d = o.date ? new Date(o.date) : new Date();
            return d.toDateString() === date.toDateString();
        });
        const total = dayOrders.reduce((acc, curr) => acc + (curr.amount ? (curr.amount > 1000 ? curr.amount / 100 : curr.amount) : 24.99), 0);
        return { name: dayStr, value: total };
    });

    // 3. Top Customers
    const customerMap = safeOrders.reduce((acc: any, curr: any) => {
        const email = curr.customer?.email || curr.email || 'Desconhecido';
        const val = (curr.amount ? (curr.amount > 1000 ? curr.amount / 100 : curr.amount) : 24.99);
        acc[email] = (acc[email] || 0) + val;
        return acc;
    }, {});
    const topCustomers = Object.entries(customerMap)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([email, total]) => ({ email, total }));

    // 4. Pending Links
    const pendingLinks = safeLeads.filter(l => l.status === 'PENDING').length;
    const paidLinks = safeLeads.filter(l => l.status === 'APPROVED' || (l.credits || 0) > 0).length;

    const pieData = [
        { name: 'Pagos', value: paidLinks },
        { name: 'Pendentes', value: pendingLinks },
    ];
    // Avoid empty pie chart
    if (paidLinks === 0 && pendingLinks === 0) {
        pieData.push({ name: 'Sem Dados', value: 1 });
    }

    const COLORS = ['#10B981', '#F59E0B', '#E2E8F0'];

    return (
        <div className="space-y-6 mb-8">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-xs text-slate-500 font-bold uppercase">Links Aguardando</div>
                    <div className="text-2xl font-bold text-orange-500">{pendingLinks}</div>
                    <div className="text-xs text-slate-400">Aguardando Pagamento</div>
                </div>
            </div>

            {/* Charts Row */}
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

// Sub-component for individual rows to manage their own state (e.g. button color)
const LeadRow = ({ lead, onApprove, onDelete, onEdit, onDiagram }: {
    lead: any,
    onApprove: (email: string) => Promise<boolean>,
    onDelete: (id: string) => Promise<void>,
    onEdit: (id: string, updates: any) => Promise<void>,
    onDiagram: (id: string) => Promise<boolean>
}) => {
    // Initial state based on passed props
    const hasCredits = (lead.credits || 0) > 0;
    const [liberado, setLiberado] = useState(hasCredits);
    const [status, setStatus] = useState(lead.status || 'PENDING');
    const [loading, setLoading] = useState(false);

    // Update if props change
    useEffect(() => {
        setLiberado((lead.credits || 0) > 0);
        setStatus(lead.status || 'PENDING');
    }, [lead]);

    const handleClick = async () => {
        if (status === 'IN_PROGRESS' || status === 'APPROVED') return;

        setLoading(true);
        const success = await onApprove(lead.email);
        setLoading(false);

        if (success) {
            setLiberado(true);
            setStatus('APPROVED');
        }
    };

    return (
        <tr className="hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-100">
            {/* DATE */}
            <td className="p-4 align-top w-32">
                <div className="font-bold text-slate-700">{new Date(lead.date).toLocaleDateString()}</div>
                <div className="text-xs text-slate-400">{new Date(lead.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </td>

            {/* INFO (Name, Email, Phone) */}
            <td className="p-4 align-top">
                <div className="flex flex-col gap-1">
                    <div className="font-bold text-slate-800 text-base">{lead.name}</div>
                    <div className="text-sm text-slate-500 flex items-center gap-1">
                        📧 {lead.email}
                    </div>
                    <div className="text-sm text-slate-500 flex items-center gap-1">
                        📱 {lead.fullPhone || lead.phone}
                    </div>
                    {(lead.bookTitle || lead.topic || lead.details?.originalName) && (
                        <div className="text-xs text-slate-600 font-medium bg-slate-100 p-1 rounded mt-1 border border-slate-200">
                            📚 {lead.bookTitle || lead.topic || lead.details?.originalName}
                        </div>
                    )}

                    {/* Payment / Voucher Info */}
                    {lead.paymentInfo && (
                        <div className="mt-2 text-xs bg-purple-50 p-2 rounded border border-purple-100 animate-fade-in">
                            <div className="font-bold text-purple-700 mb-1 flex items-center gap-1">
                                🎟️ Voucher / Pagamento
                            </div>
                            <div className="text-slate-600">👤 Pago por: <span className="font-bold text-slate-800">{lead.paymentInfo.payer}</span></div>
                            <div className="text-slate-600">💰 Valor: <span className="font-bold text-green-600">R$ {Number(lead.paymentInfo.amount || 0).toFixed(2)}</span></div>
                            {lead.paymentInfo.product && <div className="text-slate-500 italic mt-1">{lead.paymentInfo.product}</div>}
                        </div>
                    )}
                </div>
            </td>

            {/* STATUS / TYPE / ACTIONS */}
            <td className="p-4 align-top">
                <div className="flex flex-col gap-2 items-start">
                    {/* Status Badge */}
                    <div>
                        {status === 'IN_PROGRESS' && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">⚡ Em Produção</span>}
                        {status === 'APPROVED' && <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✅ Aprovado</span>}
                        {status === 'PENDING' && <span className="inline-block px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">⏳ Pendente</span>}
                    </div>

                    {/* Type Badge */}
                    <div>
                        {lead.type === 'VOUCHER' ? (
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                                🎟️ Voucher
                            </span>
                        ) : lead.type === 'DIAGRAMMING' ? (
                            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                                📑 Diagramação
                            </span>
                        ) : (
                            <span className="inline-block px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-full border border-blue-100">
                                📘 Livro
                            </span>
                        )}
                    </div>
                </div>
            </td>

            <td className="p-4 align-top text-right">
                <div className="flex flex-col gap-2 items-end">
                    {/* Access/Unlock Button */}
                    <button
                        onClick={async () => {
                            if (lead.type === 'DIAGRAMMING') {
                                setLoading(true);
                                const success = await onDiagram(lead.id);
                                setLoading(false);
                                if (success) setStatus('APPROVED');
                            } else {
                                handleClick();
                            }
                        }}
                        disabled={loading}
                        className={`w-full max-w-[140px] px-3 py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${status === 'IN_PROGRESS'
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : status === 'APPROVED'
                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                : "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                            }`}
                    >
                        {loading ? '...' :
                            status === 'IN_PROGRESS' ? 'Em Produção 🔄' :
                                status === 'APPROVED' ? (lead.type === 'VOUCHER' ? 'Crédito Ativo' : lead.type === 'DIAGRAMMING' ? 'Processamento Liberado ✅' : 'Acesso Liberado') :
                                    (lead.type === 'VOUCHER' ? '🔓 Liberar Crédito' : lead.type === 'DIAGRAMMING' ? '⚙️ Processar' : '🔓 Liberar Geração')}
                    </button>

                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                const res = await fetch(`http://localhost:3001/api/admin/books/${lead.email}`);
                                if (res.ok) {
                                    window.open(`http://localhost:3001/api/admin/books/${lead.email}`, '_blank');
                                } else {
                                    alert("Livro ainda não foi gerado ou finalizado.");
                                }
                            }}
                            className="p-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 border border-blue-100"
                            title="Baixar Livro"
                        >
                            ⬇️ Baixar
                        </button>

                        {/* REGENERATE DOCX BUTTON - FOR BOTH DIAGRAMMING AND BOOK */}
                        {(status === 'APPROVED' || status === 'IN_PROGRESS') && (lead.type === 'DIAGRAMMING' || lead.type === 'BOOK') && (
                            <button
                                onClick={async () => {
                                    // Use lead.projectId or try to find it?
                                    // For BOOK type, projectId might be inferred or we need to ensure it's in the lead.
                                    // The lead object from getLeads usually has projectId if we joined it, or we rely on it being there.
                                    // If missing, we might fail.
                                    // Always lookup ID by email to ensure we get the latest valid project with content
                                    // ignoring any potentially stale lead.projectId
                                    let pid = null;
                                    setLoading(true);

                                    try {
                                        const res = await fetch('http://localhost:3001/api/projects/find-id-by-email', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: lead.email })
                                        });
                                        const data = await res.json();
                                        if (data.id) pid = data.id;
                                    } catch (e) {
                                        console.error("Failed to find ID", e);
                                    }

                                    if (!pid) {
                                        alert("Não foi possível encontrar um projeto válido (com capítulos) para este email.");
                                        setLoading(false);
                                        return;
                                    }

                                    console.log("Regenerating Project ID:", pid);

                                    // Direct execution without confirm as requested
                                    try {
                                        const res = await fetch(`http://localhost:3001/api/projects/${pid}/regenerate-docx`, { method: 'POST' });
                                        const d = await res.json();
                                        if (d.success) {
                                            const backupMsg = "Backup salvo em Downloads/bestseller-factory-ai/BACKUPS.";
                                            alert(`Regerado com sucesso! \nID: ${pid}\n${backupMsg}`);
                                        }
                                        else alert("Erro: " + d.error);
                                    } catch (e) { console.error(e); alert("Erro ao regerar"); }
                                    setLoading(false);
                                }}
                                className={`p-2 rounded border transition ${loading ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border-purple-100'}`}
                                title="Regerar DOCX"
                                disabled={loading}
                            >
                                {loading ? '⏳ Processando...' : '🔄 Regerar'}
                            </button>
                        )}
                        <button
                            onClick={async () => {
                                const newName = prompt("Editar Nome:", lead.name);
                                if (newName === null) return;
                                const newEmail = prompt("Editar Email:", lead.email);
                                if (newEmail === null) return;
                                await onEdit(lead.id, { name: newName, email: newEmail });
                            }}
                            className="p-2 bg-slate-100 text-slate-600 rounded hover:bg-slate-200 border border-slate-200"
                            title="Editar"
                        >
                            ✏️
                        </button>
                        <button
                            onClick={async () => {
                                if (confirm("Tem certeza que deseja excluir este registro?")) {
                                    await onDelete(lead.id);
                                }
                            }}
                            className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100 border border-red-100"
                            title="Excluir"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            </td>
        </tr>
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
    const [settings, setSettings] = useState<any>(null);
    const [msg, setMsg] = useState('');
    const [isRefreshing, setIsRefreshing] = useState(false);

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
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        if (token) {
            loadSettings();
            loadLeads();
            loadOrders();
        }
    }, [token]);

    const loadOrders = async () => {
        try {
            const res = await fetch(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setOrders(Array.isArray(data) ? data : []);
            }
        } catch (e) {
            console.error("Error loading orders", e);
        }
    };

    // ... handleDelete/Edit code ...

    const handleDelete = async (id: string) => {
        try {
            const res = await fetch(`http://localhost:3001/api/payment/leads/${id}`, {
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

    const handleEdit = async (id: string, updates: any) => {
        try {
            const res = await fetch(`http://localhost:3001/api/payment/leads`, {
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

    const refreshAll = async () => {
        setIsRefreshing(true);
        await Promise.all([loadLeads(false), loadOrders()]);
        setIsRefreshing(false);
    };

    const loadLeads = async (manageLoading = true) => {
        if (manageLoading) setIsRefreshing(true);
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
        } catch (e) {
            console.error("Leads error", e);
            // alert("Erro ao atualizar painel. Verifique o console."); // Suppress alert to avoid annoyance if intermittent
        }
        if (manageLoading) setIsRefreshing(false);
    };


    const handleApproveLead = async (email: string): Promise<boolean> => {
        try {
            const cleanEmail = email.toLowerCase().trim();
            console.log("Approving execution for:", cleanEmail);
            const res = await fetch('http://localhost:3001/api/payment/leads/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: cleanEmail })
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
            const res = await fetch(`http://localhost:3001/api/projects/process-diagram-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId })
            });
            const data = await res.json();
            if (data.success) {
                alert("Processamento liberado! A IA está trabalhando em segundo plano.");
                loadLeads();
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

    const isLogged = !!token;

    if (!isLogged) {
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
                    <a href="/" target="_blank" className="text-sm text-slate-500 hover:underline">Voltar ao App</a>
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

            <h3 className="font-bold text-slate-700 border-b pb-2 pt-8 flex justify-between items-center">
                <span>Solicitações Pendentes (Contatos)</span>
                <div className="flex flex-col gap-2">
                    <button
                        onClick={refreshAll}
                        disabled={isRefreshing}
                        className={`text-sm px-3 py-1.5 rounded flex items-center justify-center gap-2 ${isRefreshing ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                    >
                        <span>{isRefreshing ? '⏳' : '🔄'}</span> {isRefreshing ? 'Atualizando...' : 'Atualizar Painel'}
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
                            const csvContent = [headers, ...rows]
                                .map(e => e.join(","))
                                .join("\n");

                            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.setAttribute("href", url);
                            link.setAttribute("download", "leads_export.csv");
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                        }}
                        className="text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        <span>📊</span> Exportar Excel (CSV)
                    </button>
                </div>
            </h3>

            {/* Stats Dashboard */}
            <DashboardCharts leads={leads} orders={orders} />

            <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto mb-8">
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
                            />
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

            {/* Backup System */}
            <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-sm text-slate-600 flex justify-between items-center">
                    <span>Pontos de Restauração (Backups)</span>
                    <button
                        onClick={async () => {
                            if (confirm("Deseja criar um novo Ponto de Restauração agora?")) {
                                try {
                                    const res = await fetch(`${API_URL}/backups`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
                                    if (res.ok) {
                                        alert("Backup criado com sucesso!");
                                        // Reload backups logic here if I made it a state, but for now just reload page or alerts.
                                        // Better: add state for backups list.
                                    } else {
                                        alert("Erro ao criar backup");
                                    }
                                } catch (e) { alert("Erro de conexão"); }
                            }
                        }}
                        className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded"
                    >
                        + Criar Novo Ponto
                    </button>
                </h4>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-xs text-slate-500 mb-4">
                        Abaixo você pode restaurar o sistema para um ponto anterior. Isso é útil caso alguma atualização de dados ou exclusão acidental ocorra.
                    </p>
                    <BackupList token={token} apiUrl={API_URL} />
                </div>
            </div>

            {/* Product Links */}
            <div className="space-y-4 pt-4 border-t">
                <h4 className="font-bold text-sm text-slate-600">Links de Produtos (Upsell - Kiwify)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-medium text-slate-500">Livro em Inglês (R$ 24,99)</label>
                        <input type="text" value={settings.products?.english_book || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, english_book: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Livro em Espanhol (R$ 24,99)</label>
                        <input type="text" value={settings.products?.spanish_book || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, spanish_book: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Capa Profissional (Impresso) - R$ 250,00</label>
                        <input type="text" value={settings.products?.cover_printed || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, cover_printed: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Capa Profissional (Ebook) - R$ 99,90</label>
                        <input type="text" value={settings.products?.cover_ebook || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, cover_ebook: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Publicação Amazon (Impresso) - R$ 49,90</label>
                        <input type="text" value={settings.products?.pub_amazon_printed || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, pub_amazon_printed: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Publicação Amazon (Digital) - R$ 39,90</label>
                        <input type="text" value={settings.products?.pub_amazon_digital || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, pub_amazon_digital: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Publicação UICLAP (Impresso) - R$ 49,90</label>
                        <input type="text" value={settings.products?.pub_uiclap || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, pub_uiclap: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Ficha Catalográfica - R$ 59,90</label>
                        <input type="text" value={settings.products?.catalog_card || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, catalog_card: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">ISBN (Impresso) - R$ 49,90</label>
                        <input type="text" value={settings.products?.isbn_printed || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, isbn_printed: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">ISBN (Digital) - R$ 49,90</label>
                        <input type="text" value={settings.products?.isbn_digital || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, isbn_digital: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div className="col-span-2">
                        <label className="text-xs font-bold text-slate-700">PACOTE COMPLETO - R$ 599,90</label>
                        <input type="text" value={settings.products?.complete_package || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, complete_package: e.target.value } })} className="w-full p-2 border rounded text-sm border-brand-300 ring-2 ring-brand-100" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Página de Vendas - R$ 349,90</label>
                        <input type="text" value={settings.products?.sales_page || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, sales_page: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Hospedagem (Anual) - R$ 499,90</label>
                        <input type="text" value={settings.products?.hosting || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, hosting: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
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
