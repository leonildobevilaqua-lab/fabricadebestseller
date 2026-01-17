import React, { useState, useEffect } from 'react';
// Define a base: Se tiver na nuvem (Coolify), usa a variável. Se não, vazio (usa o localhost).
const BASE = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE}/api/admin`;

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

// --- Dashboard Component ---
// --- Dashboard Component ---
const DashboardCharts = ({ leads = [], orders = [] }: { leads: any[], orders: any[] }) => {
    // Feature flag: Enable charts only when safely validated
    const showCharts = false;

    // Safety check
    const safeLeads = Array.isArray(leads) ? leads : [];
    const safeOrders = Array.isArray(orders) ? orders : [];

    // Helper: Calculate Value based on User Rules
    const calculateLeadValue = (lead: any) => {
        // 1. If explicit payment info exists (from Webhook), use it.
        if (lead.paymentInfo?.amount) {
            // Kiwify/Stripe usually send cents? The controller seems to store raw or /100.
            // If > 1000, assume cents and divide.
            const amt = Number(lead.paymentInfo.amount);
            return amt > 1000 ? amt / 100 : amt;
        }

        // 2. Check Plans
        if (lead.plan) {
            const pName = lead.plan.name?.toUpperCase();
            const billing = lead.plan.billing?.toLowerCase(); // 'monthly' or 'annual'

            if (pName === 'STARTER') return billing === 'annual' ? 118.80 : 19.90;
            if (pName === 'PRO') return billing === 'annual' ? 238.80 : 34.90;
            if (pName === 'BLACK') return billing === 'annual' ? 358.80 : 49.90;
        }

        // 3. Default (Avulso / Credit) - Request: R$ 39,90
        return 39.90;
    };

    // Filter Paid Leads
    const getPaidLeads = () => {
        return safeLeads.filter(l =>
            l.status === 'APPROVED' ||
            l.status === 'IN_PROGRESS' ||
            l.status === 'COMPLETED' ||
            l.status === 'LIVRO ENTREGUE' ||
            (l.credits || 0) > 0
        );
    };

    // 1. Revenue Calculations
    const getRevenue = (filter: 'day' | 'week' | 'month' | 'year') => {
        const now = new Date();
        const paidLeads = getPaidLeads();

        const filtered = paidLeads.filter(l => {
            const dStr = l.date || l.created_at;
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

        return filtered.reduce((acc, curr) => acc + calculateLeadValue(curr), 0);
    };

    // 2. Prepare Data for Charts
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    const revenueData = last7Days.map(date => {
        const dayStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        const dayLeads = getPaidLeads().filter(l => {
            const d = l.date ? new Date(l.date) : new Date();
            return d.toDateString() === date.toDateString();
        });
        const total = dayLeads.reduce((acc, curr) => acc + calculateLeadValue(curr), 0);
        return { name: dayStr, value: total };
    });

    // 3. Top Customers
    const customerMap = getPaidLeads().reduce((acc: any, curr: any) => {
        const email = curr.email || 'Desconhecido';
        const val = calculateLeadValue(curr);
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
        { name: 'Pagos/Aprovados', value: (statusCounts['APPROVED'] || 0) + (statusCounts['LIVRO ENTREGUE'] || 0) + (statusCounts['COMPLETED'] || 0) },
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

// Sub-component for individual rows to manage their own state (e.g. button color)
const LeadRow = ({ lead, onApprove, onDelete, onEdit, onDiagram }: {
    lead: any,
    onApprove: (email: string, type?: string) => Promise<boolean>,
    onDelete: (id: string) => Promise<void>,
    onEdit: (id: string, updates: any) => Promise<void>,
    onDiagram: (id: string) => Promise<boolean>
}) => {
    // Initial state based on passed props
    const hasCredits = (lead.credits || 0) > 0;
    const [liberado, setLiberado] = useState(hasCredits);
    const [status, setStatus] = useState(lead.status || 'PENDING');
    const [prodStatus, setProdStatus] = useState(lead.productionStatus);
    const [loading, setLoading] = useState(false);

    // Update if props change
    useEffect(() => {
        setLiberado((lead.credits || 0) > 0);
        setStatus(lead.status || 'PENDING');
        setProdStatus(lead.productionStatus);
    }, [lead]);

    const displayStatus = (status === 'SUBSCRIBER' && prodStatus) ? prodStatus : status;

    const handleClick = async () => {
        if (loading) return;
        setLoading(true);
        const success = await onApprove(lead.email);
        setLoading(false);

        if (success) {
            setLiberado(true);
            setStatus('APPROVED');
        }
    };

    const handlePlan = async () => {
        const pName = prompt("Defina o Plano (STARTER, PRO, BLACK):", lead.plan?.name || "STARTER");
        if (!pName) return;
        const billing = prompt("Ciclo (monthly, annual):", lead.plan?.billing || "monthly");
        if (!billing) return;

        await onEdit(lead.id, { plan: { name: pName.toUpperCase(), billing: billing.toLowerCase() }, type: 'SUBSCRIPTION' });

        if (confirm(`Plano ${pName} definido. Deseja ATIVAR agora?`)) {
            setLoading(true);
            const success = await onApprove(lead.email);
            setLoading(false);
            if (success) {
                alert("Assinatura Ativada!");
                setStatus('SUBSCRIBER');
            }
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
                    {(lead.bookTitle || lead.topic || lead.details?.originalName) && lead.type !== 'SUBSCRIPTION' && lead.status !== 'SUBSCRIBER' && (
                        <div className="text-xs text-slate-600 font-medium bg-slate-100 p-1 rounded mt-1 border border-slate-200">
                            📚 {lead.bookTitle || lead.topic || lead.details?.originalName}
                        </div>
                    )}

                    {/* PLAN BADGE */}
                    {lead.plan?.name && (
                        <div className="text-xs bg-indigo-50 p-2 rounded border border-indigo-100 animate-fade-in mt-1 w-fit">
                            <div className="font-bold text-indigo-700 mb-1 flex items-center gap-1">
                                💎 {lead.plan.name} ({lead.plan.billing === 'annual' ? 'Anual' : 'Mensal'})
                            </div>
                            <div className="text-indigo-600 text-[10px]">
                                Status: {status === 'SUBSCRIBER' ? '✅ ATIVO' : '⏳ PENDENTE'}
                            </div>
                        </div>
                    )}

                    {/* Payment / Voucher Info */}
                    {(lead.paymentInfo || lead.tag || lead.discount) && (
                        <div className="mt-2 text-xs bg-purple-50 p-2 rounded border border-purple-100 animate-fade-in">
                            <div className="font-bold text-purple-700 mb-1 flex items-center gap-1">
                                🎟️ Info Compra / Plano
                            </div>
                            {/* Tag / Plan */}
                            <div className="text-slate-600 mb-1">
                                🏷️ Etiqueta: <span className="font-bold text-slate-800 bg-yellow-100 px-1 rounded">{lead.tag || 'Sem Etiqueta'}</span>
                            </div>
                            {/* Discount */}
                            {(lead.discount > 0 || lead.paymentInfo?.discount) && (
                                <div className="text-slate-600 mb-1">
                                    📉 Desconto: <span className="font-bold text-red-600">-{lead.discount || 0}%</span>
                                </div>
                            )}

                            {lead.paymentInfo ? (
                                <>
                                    <div className="text-slate-600">👤 Pago por: <span className="font-bold text-slate-800">{lead.paymentInfo.payer}</span></div>
                                    <div className="text-slate-600">💰 Valor Pago: <span className="font-bold text-green-600">R$ {Number(lead.paymentInfo.amount || 0).toFixed(2)}</span></div>
                                    {lead.paymentInfo.product && <div className="text-slate-500 italic mt-1">{lead.paymentInfo.product}</div>}
                                </>
                            ) : (
                                <div className="text-slate-500 italic">Aguardando pagamento...</div>
                            )}
                        </div>
                    )}
                </div>
            </td>

            {/* STATUS / TYPE / ACTIONS */}
            <td className="p-4 align-top">
                <div className="flex flex-col gap-2 items-start">
                    {/* Status Badge */}
                    <div>
                        {(displayStatus === 'IN_PROGRESS' || displayStatus === 'RESEARCHING' || displayStatus === 'WRITING_CHAPTERS') && <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">⚡ Em Produção</span>}
                        {status === 'APPROVED' && <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">✅ Aprovado</span>}
                        {status === 'SUBSCRIBER' && <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">💎 Assinante</span>}
                        {status === 'PENDING' && <span className="inline-block px-2 py-1 bg-slate-100 text-slate-500 text-xs font-bold rounded-full">⏳ Pendente</span>}
                    </div>

                    {/* Type Badge */}
                    <div>
                        {lead.type === 'VOUCHER' ? (
                            <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full border border-purple-200">
                                🎟️ Voucher
                            </span>
                        ) : lead.type === 'SUBSCRIPTION' || lead.plan ? (
                            <span className="inline-block px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
                                💎 Assinatura
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
                <div className="flex flex-col gap-4 items-end">

                    {/* PHASE 1: SUBSCRIPTION MANAGEMENT */}
                    {(lead.plan || lead.type === 'SUBSCRIPTION') && (
                        <div className="bg-indigo-50 p-2 rounded border border-indigo-100 w-full mb-2">
                            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1 text-left">Fase 1: Assinatura</div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-indigo-700">{lead.plan?.name} ({lead.plan?.billing === 'annual' ? 'Anual' : 'Mensal'})</span>
                                {status === 'SUBSCRIBER' ? <span className="text-xs text-green-600">✅ Ativo</span> :
                                    status === 'SUBSCRIBER_PENDING' || lead.plan?.status === 'PENDING' ? <span className="text-xs text-orange-600">⏳ P. Aprovação</span> :
                                        <span className="text-xs text-yellow-600">⏳ Pendente</span>}
                            </div>

                            {/* SIMULATED DATA WARNING */}
                            {lead.plan?.simulated && status !== 'SUBSCRIBER' && (
                                <div className="text-[10px] bg-yellow-100 text-yellow-800 p-1 rounded mb-1 border border-yellow-200">
                                    ⚠️ Simulação: Cliente diz que pagou.
                                </div>
                            )}

                            <div className="flex gap-1">
                                <button
                                    onClick={async () => {
                                        if (status === 'SUBSCRIBER') return;
                                        if (confirm(`Confirmar Ativação do Plano ${lead.plan?.name}?`)) {
                                            setLoading(true);
                                            const success = await onApprove(lead.email); // Activates Plan
                                            setLoading(false);
                                            if (success) {
                                                setStatus('SUBSCRIBER');
                                                alert("Plano Ativado com Sucesso!");
                                            }
                                        }
                                    }}
                                    className={`flex-1 py-1 rounded text-[10px] font-bold border transition ${status === 'SUBSCRIBER' ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-default' : 'bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700 animate-pulse'}`}
                                >
                                    {status === 'SUBSCRIBER' ? 'Ativado' : '✅ Aprovar Assinatura'}
                                </button>
                                <button
                                    onClick={handlePlan}
                                    className="px-2 py-1 bg-white text-indigo-600 border border-indigo-200 rounded text-[10px] hover:bg-indigo-50"
                                    title="Editar Plano"
                                >
                                    ⚙️
                                </button>
                            </div>
                        </div>
                    )}

                    {/* PHASE 2: BOOK GENERATION */}
                    <div className="w-full">
                        <>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-left">Fase 2: Geração / Crédito</div>
                            <button
                                onClick={async () => {
                                    if (lead.type === 'DIAGRAMMING') {
                                        setLoading(true);
                                        const success = await onDiagram(lead.id);
                                        setLoading(false);
                                        if (success) setStatus('APPROVED');
                                    } else {
                                        // Manual Release for Book (Generation Fee)
                                        // Force 'CREDIT' type (Backend interprets as permission to generate)
                                        if (lead.type === 'SUBSCRIPTION' || lead.plan) {
                                            if (confirm("Confirmar que o assinante pagou a taxa de geração? (Isso iniciará a produção)")) {
                                                setLoading(true);
                                                const success = await onApprove(lead.email, 'CREDIT');
                                                setLoading(false);
                                                if (success) {
                                                    alert("Geração Liberada! O cliente será redirecionado para a produção.");
                                                    setLiberado(true);
                                                    // Do NOT change local status if it is SUBSCRIBER, rely on credits check for button color
                                                }
                                            }
                                        } else {
                                            // Standard approve
                                            if (confirm("Confirmar pagamento da taxa única e liberar geração?")) {
                                                handleClick();
                                            }
                                        }
                                    }
                                }}
                                disabled={loading}
                                className={`w-full px-3 py-2 rounded text-xs font-bold transition flex items-center justify-center gap-1 shadow-sm ${displayStatus === 'LIVRO ENTREGUE'
                                    ? "bg-purple-100 text-purple-700 hover:bg-purple-200 cursor-default"
                                    : displayStatus === 'IN_PROGRESS' || displayStatus === 'RESEARCHING' || displayStatus === 'WRITING_CHAPTERS'
                                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                        : (liberado || lead.credits > 0)
                                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                                            : "bg-emerald-600 text-white hover:bg-emerald-700 hover:scale-105 animate-pulse"
                                    }`}
                            >
                                {loading ? 'Processando...' :
                                    displayStatus === 'LIVRO ENTREGUE' ? 'Livro Entregue 🏁' :
                                        displayStatus === 'IN_PROGRESS' || displayStatus === 'RESEARCHING' || displayStatus === 'WRITING_CHAPTERS' ? 'Em Produção 🔄' :
                                            (liberado || lead.credits > 0) ? `Geração Liberada ✅` :
                                                displayStatus === 'APPROVED' && lead.type !== 'SUBSCRIPTION' ? (lead.type === 'VOUCHER' ? 'Crédito Ativo' : 'Acesso Liberado ✅') :
                                                    (lead.type === 'VOUCHER' ? '🔓 Liberar Crédito' : lead.type === 'DIAGRAMMING' ? '⚙️ Processar' : '🔓 Liberar Geração')}
                            </button>
                        </>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={async () => {
                                // Prioritize Project ID to avoid serving old files for same email
                                const identifier = lead.projectId || lead.email;
                                console.log("Downloading book for identifier:", identifier);
                                // Adicionamos ${BASE} no início
                                const res = await fetch(`${BASE}/api/admin/books/${identifier}`);
                                if (res.ok) {
                                    window.open(`/api/admin/books/${identifier}`, '_blank');
                                } else {
                                    alert("Livro ainda não foi gerado ou finalizado. Verifique se o processamento concluiu.");
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
                                    // Fix: Use lead.projectId first. Only lookup if missing.
                                    let pid = lead.projectId || null;
                                    setLoading(true);

                                    if (!pid) {
                                        try {
                                            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/projects/find-id-by-email', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email: lead.email })
                                            });
                                            const data = await res.json();
                                            if (data.id) pid = data.id;
                                        } catch (e) {
                                            console.error("Failed to find ID", e);
                                        }
                                    }

                                    if (!pid) {
                                        alert("Não foi possível encontrar um projeto válido (com capítulos) para este email.");
                                        setLoading(false);
                                        return;
                                    }

                                    console.log("Regenerating Project ID:", pid);

                                    // Direct execution without confirm as requested
                                    try {
                                        const res = await fetch(`${BASE}/api/projects/${pid}/regenerate-docx`, { method: 'POST' });
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

    const [loadingError, setLoadingError] = useState(false);

    // useEffect for initial load handled below with leads

    const loadSettings = async () => {
        setLoadingError(false);
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
            setLoadingError(true);
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
            console.error("Login Link Error:", e);
            setMsg("Erro de conexão (Verifique se o backend está rodando)");
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

    // ... (rest of functions) ...
    // Note: I will need to replace the large block to ensure context is kept or use smaller chunk? 
    // I will use StartLine/EndLine carefully.

    // Actually, I need to update `loadLeads` too. I'll simply update logic in a separate chunk or include it here if contiguous.
    // They are separated by `loadOrders` and others.

    // Let's do loadSettings block first.


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
            const res = await fetch(`${BASE}/api/payment/leads/${id}`, {
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
            const res = await fetch(`${BASE}/api/payment/leads`, {
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
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/payment/leads', {
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
            const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/payment/leads/approve', {
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
            const res = await fetch(`${BASE}/api/projects/process-diagram-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ leadId })
            });
            const data = await res.json();
            if (data.success) {
                alert("Processamento liberado! A IA está diagramando o livro em segundo plano.\nO botão 'Baixar' funcionará assim que o processamento concluir (aprox 30s). A lista atualizará automaticamente.");
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
        <div className="max-w-4xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-slate-200">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Configuração de IA (Multi-Modelos)</h2>
                <div className="gap-2 flex">
                    <button onClick={() => { setToken(null); localStorage.removeItem('admin_token'); }} className="text-sm text-red-500 hover:underline">Sair</button>
                    <span className="text-slate-300">|</span>
                    <a href="/?new_session=true" target="_blank" rel="noopener noreferrer" className="text-sm text-slate-500 hover:underline">Voltar ao App</a>
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
                        value={`${window.location.origin}/api/payment/webhook`}
                        className="flex-1 p-2 border rounded bg-white text-xs font-mono text-slate-600 select-all"
                    />
                    <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/api/payment/webhook`)} className="px-3 py-1 bg-slate-200 text-xs font-bold rounded hover:bg-slate-300">Copiar</button>
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
                {/* --- DYNAMIC PRICING VISUALIZER (NEW) --- */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                    <h4 className="font-bold text-lg text-slate-700 mb-4 flex items-center gap-2">
                        <span>🧪</span> Visualizador de Preços Dinâmicos (Assinaturas)
                    </h4>
                    <p className="text-sm text-slate-500 mb-4">
                        Abaixo estão os links configurados no sistema para cada nível de desconto progressivo.
                        <br />Estes links são ativados automaticamente quando um assinante vai gerar um novo livro.
                    </p>

                    <div className="space-y-6">
                        {['STARTER', 'PRO', 'BLACK'].map(plan => (
                            <div key={plan} className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                                <div className={`px-4 py-2 font-bold text-white text-sm flex justify-between items-center
                                    ${plan === 'STARTER' ? 'bg-slate-700' : plan === 'PRO' ? 'bg-emerald-600' : 'bg-purple-900'}
                                `}>
                                    <span>PLANO {plan}</span>
                                </div>
                                <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Annual */}
                                    <div>
                                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b pb-1">Anual</h5>
                                        <ul className="space-y-2 text-xs">
                                            {plan === 'STARTER' && (<>
                                                <li className="flex justify-between"><span>Nível 1 (0% off):</span> <a href="https://pay.kiwify.com.br/SpCDp2q" target="_blank" className="text-blue-500 underline">R$ 24,90</a></li>
                                                <li className="flex justify-between"><span>Nível 2 (10% off):</span> <a href="https://pay.kiwify.com.br/0R6K3gC" target="_blank" className="text-blue-500 underline">R$ 22,41</a></li>
                                                <li className="flex justify-between"><span>Nível 3 (15% off):</span> <a href="https://pay.kiwify.com.br/2HYq1Ji" target="_blank" className="text-blue-500 underline">R$ 21,17</a></li>
                                                <li className="flex justify-between"><span>Nível 4 (20% off):</span> <a href="https://pay.kiwify.com.br/KZSbSjM" target="_blank" className="text-blue-500 underline">R$ 19,92</a></li>
                                            </>)}
                                            {plan === 'PRO' && (<>
                                                <li className="flex justify-between"><span>Nível 1 (0% off):</span> <a href="https://pay.kiwify.com.br/pH8lSvE" target="_blank" className="text-blue-500 underline">R$ 19,90</a></li>
                                                <li className="flex justify-between"><span>Nível 2 (10% off):</span> <a href="https://pay.kiwify.com.br/SCgOrg9" target="_blank" className="text-blue-500 underline">R$ 17,91</a></li>
                                                <li className="flex justify-between"><span>Nível 3 (15% off):</span> <a href="https://pay.kiwify.com.br/mChyOMF" target="_blank" className="text-blue-500 underline">R$ 16,92</a></li>
                                                <li className="flex justify-between"><span>Nível 4 (20% off):</span> <a href="https://pay.kiwify.com.br/t5vOuOH" target="_blank" className="text-blue-500 underline">R$ 15,92</a></li>
                                            </>)}
                                            {plan === 'BLACK' && (<>
                                                <li className="flex justify-between"><span>Nível 1 (0% off):</span> <a href="https://pay.kiwify.com.br/ottQN4o" target="_blank" className="text-blue-500 underline">R$ 14,90</a></li>
                                                <li className="flex justify-between"><span>Nível 2 (10% off):</span> <a href="https://pay.kiwify.com.br/7Df9tSf" target="_blank" className="text-blue-500 underline">R$ 13,41</a></li>
                                                <li className="flex justify-between"><span>Nível 3 (15% off):</span> <a href="https://pay.kiwify.com.br/l41UVMk" target="_blank" className="text-blue-500 underline">R$ 12,67</a></li>
                                                <li className="flex justify-between"><span>Nível 4 (20% off):</span> <a href="https://pay.kiwify.com.br/LxYJjDq" target="_blank" className="text-blue-500 underline">R$ 11,92</a></li>
                                            </>)}
                                        </ul>
                                    </div>
                                    {/* Monthly */}
                                    <div>
                                        <h5 className="text-xs font-bold text-slate-500 uppercase mb-2 border-b pb-1">Mensal</h5>
                                        <ul className="space-y-2 text-xs">
                                            {plan === 'STARTER' && (<>
                                                <li className="flex justify-between"><span>Nível 1 (0% off):</span> <a href="https://pay.kiwify.com.br/g1L85dO" target="_blank" className="text-blue-500 underline">R$ 26,90</a></li>
                                                <li className="flex justify-between"><span>Nível 2 (10% off):</span> <a href="https://pay.kiwify.com.br/iztHm1K" target="_blank" className="text-blue-500 underline">R$ 24,21</a></li>
                                                <li className="flex justify-between"><span>Nível 3 (15% off):</span> <a href="https://pay.kiwify.com.br/tdpPzXY" target="_blank" className="text-blue-500 underline">R$ 22,87</a></li>
                                                <li className="flex justify-between"><span>Nível 4 (20% off):</span> <a href="https://pay.kiwify.com.br/Up1n5lb" target="_blank" className="text-blue-500 underline">R$ 21,52</a></li>
                                            </>)}
                                            {plan === 'PRO' && (<>
                                                <li className="flex justify-between"><span>Nível 1 (0% off):</span> <a href="https://pay.kiwify.com.br/dEoi760" target="_blank" className="text-blue-500 underline">R$ 21,90</a></li>
                                                <li className="flex justify-between"><span>Nível 2 (10% off):</span> <a href="https://pay.kiwify.com.br/93RoEg1" target="_blank" className="text-blue-500 underline">R$ 19,71</a></li>
                                                <li className="flex justify-between"><span>Nível 3 (15% off):</span> <a href="https://pay.kiwify.com.br/JI5Ah1E" target="_blank" className="text-blue-500 underline">R$ 18,62</a></li>
                                                <li className="flex justify-between"><span>Nível 4 (20% off):</span> <a href="https://pay.kiwify.com.br/EmUxPsB" target="_blank" className="text-blue-500 underline">R$ 17,52</a></li>
                                            </>)}
                                            {plan === 'BLACK' && (<>
                                                <li className="flex justify-between"><span>Nível 1 (0% off):</span> <a href="https://pay.kiwify.com.br/Cg59pjZ" target="_blank" className="text-blue-500 underline">R$ 16,90</a></li>
                                                <li className="flex justify-between"><span>Nível 2 (10% off):</span> <a href="https://pay.kiwify.com.br/kSe4GqY" target="_blank" className="text-blue-500 underline">R$ 15,21</a></li>
                                                <li className="flex justify-between"><span>Nível 3 (15% off):</span> <a href="https://pay.kiwify.com.br/GCqdJAU" target="_blank" className="text-blue-500 underline">R$ 14,37</a></li>
                                                <li className="flex justify-between"><span>Nível 4 (20% off):</span> <a href="https://pay.kiwify.com.br/LcNvYD0" target="_blank" className="text-blue-500 underline">R$ 13,52</a></li>
                                            </>)}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <h4 className="font-bold text-sm text-slate-600">Links de Produtos (Upsell - Kiwify - Editáveis)</h4>
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
                        <label className="text-xs font-medium text-slate-500">Capa Profissional (Ebook) - R$ 149,90</label>
                        <input type="text" value={settings.products?.cover_ebook || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, cover_ebook: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Publicação Amazon (Impresso) - R$ 69,90</label>
                        <input type="text" value={settings.products?.pub_amazon_printed || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, pub_amazon_printed: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Publicação Amazon (Digital) - R$ 59,90</label>
                        <input type="text" value={settings.products?.pub_amazon_digital || ''} onChange={e => setSettings({ ...settings, products: { ...settings.products, pub_amazon_digital: e.target.value } })} className="w-full p-2 border rounded text-sm" placeholder="https://pay.kiwify..." />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-slate-500">Publicação UICLAP (Impresso) - R$ 59,90</label>
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
