import React, { useState, useEffect } from 'react';
import { getApiBase } from '../services/api';

// Icons (mock, assuming they were used inline or I can use emoji)
const Edit = ({ className }: { className?: string }) => <span>✏️</span>;
const Trash = ({ className }: { className?: string }) => <span>🗑️</span>;

export const LeadRow = ({ lead, onApprove, onDelete, onEdit, onDiagram }: {
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

    // --- DETECT TYPE ---
    const isSubscription = lead.status === 'SUBSCRIBER' || (lead.plan && lead.plan.name && lead.type !== 'BOOK' && !lead.isVoucher);
    const isBook = !isSubscription;

    // --- ACTIONS ---
    const handleAction = async (actionType: 'CREDIT' | 'SUBSCRIPTION' | 'FREEZE' | 'BLOCK') => {
        if (loading) return;
        setLoading(true);

        try {
            if (actionType === 'SUBSCRIPTION') {
                const success = await onApprove(lead.email);
                if (success) {
                    setStatus('SUBSCRIBER');
                    if (lead.plan) await onEdit(lead.id, { plan: { ...lead.plan, status: 'ACTIVE' } });
                }
            } else if (actionType === 'CREDIT') {
                // For Book Generation release
                const success = await onApprove(lead.email, 'CREDIT');
                if (success) {
                    setLiberado(true);
                    setStatus('APPROVED');
                }
            } else if (actionType === 'FREEZE' || actionType === 'BLOCK') {
                if (lead.plan) {
                    await onEdit(lead.id, { plan: { ...lead.plan, status: actionType === 'FREEZE' ? 'FROZEN' : 'BLOCKED' } });
                    alert(`Plano alterado para ${actionType === 'FREEZE' ? 'Congelado' : 'Bloqueado'}`);
                } else {
                    alert("Apenas para usuários com plano.");
                }
            }
        } catch (e) {
            console.error(e);
            alert("Erro ao processar ação.");
        }
        setLoading(false);
    };

    const handleRegenerate = async () => {
        if (!confirm("Regerar o arquivo DOCX deste livro?")) return;
        setLoading(true);
        try {
            if (!lead.details?.projectId && !lead.projectId) {
                alert("ID do Projeto não encontrado neste Lead.");
                setLoading(false);
                return;
            }
            const pid = lead.projectId || lead.details?.projectId;
            const res = await fetch(`${getApiBase()}/api/projects/${pid}/regenerate-docx`, { method: 'POST' });
            const d = await res.json();
            if (res.ok) alert(`Regerado com sucesso!\n${d.path || ''}`);
            else alert("Erro: " + d.error);
        } catch (e) { console.error(e); alert("Erro de conexão"); }
        setLoading(false);
    };

    const handleEditFields = async () => {
        const newName = prompt("Editar Nome:", lead.name);
        if (newName === null) return;
        const newEmail = prompt("Editar Email:", lead.email);
        if (newEmail === null) return;
        await onEdit(lead.id, { name: newName, email: newEmail });
    };

    // --- RENDER HELPERS ---
    const formatMoney = (val: number) => `R$ ${val?.toFixed(2).replace('.', ',')}`;
    const amount = lead.paymentInfo?.amount
        ? formatMoney(lead.paymentInfo.amount)
        : lead.plan ? 'N/A' : 'R$ 0,00';

    // Infer context for Book
    const planContext = lead.tag || (lead.plan?.name ? `Plano ${lead.plan.name}` : 'Avulso');

    return (
        <tr className={`hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-100 ${isSubscription ? 'bg-indigo-50/20' : ''}`}>
            {/* DATE & TYPE */}
            <td className="p-4 align-top w-32">
                <div className="font-bold text-slate-700">{new Date(lead.date).toLocaleDateString()}</div>
                <div className="text-xs text-slate-400">{new Date(lead.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>

                {isSubscription ? (
                    <div className="mt-2 text-[10px] font-bold text-white bg-indigo-500 px-2 py-0.5 rounded w-fit text-center shadow-sm">
                        ASSINATURA
                    </div>
                ) : (
                    <div className="mt-2 text-[10px] font-bold text-white bg-emerald-500 px-2 py-0.5 rounded w-fit text-center shadow-sm">
                        LIVRO
                    </div>
                )}
            </td>

            {/* MAIN INFO */}
            <td className="p-4 align-top">
                <div className="flex flex-col gap-2">
                    {/* User */}
                    <div>
                        <div className="font-bold text-slate-800 text-base">{lead.name}</div>
                        <div className="text-sm text-slate-500 flex items-center gap-2">
                            <span>📧 {lead.email}</span>
                            <span>📱 {lead.fullPhone || lead.phone || '-'}</span>
                        </div>
                    </div>

                    {/* SUBSCRIPTION DISPLAY */}
                    {isSubscription && lead.plan && (
                        <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg max-w-md animate-fade-in relative overflow-hidden">
                            <div className="absolute right-0 top-0 p-2 opacity-10">💎</div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Plano Assinado</div>
                                    <div className="text-lg font-bold text-indigo-900 leading-tight">
                                        {lead.plan.name} <span className="text-sm font-normal text-indigo-700">({lead.plan.billing === 'annual' ? 'Anual' : 'Mensal'})</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Valor</div>
                                    <div className="text-lg font-bold text-emerald-600">{amount}</div>
                                </div>
                            </div>
                            <div className="mt-2 pt-2 border-t border-indigo-200/50 flex items-center gap-2 text-xs">
                                <span className="font-bold text-indigo-800">Situação:</span>
                                <span className={`px-2 py-0.5 rounded font-bold ${status === 'SUBSCRIBER' || lead.plan.status === 'ACTIVE' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'}`}>
                                    {status === 'SUBSCRIBER' || lead.plan.status === 'ACTIVE' ? 'ATIVO' : lead.plan.status || 'AGUARDANDO'}
                                </span>
                            </div>
                        </div>
                    )}

                    {/* BOOK DISPLAY */}
                    {isBook && (
                        <div className="space-y-2 max-w-xl">
                            {/* Topic Card */}
                            {(lead.bookTitle || lead.topic || lead.details?.originalName) && (
                                <div className="p-2 bg-slate-100 rounded border border-slate-200 text-sm border-l-4 border-l-emerald-400">
                                    <span className="text-slate-500 font-bold block text-[10px] uppercase">Tema / Assunto</span>
                                    <span className="text-slate-800 font-medium">{lead.bookTitle || lead.topic || lead.details?.originalName}</span>
                                </div>
                            )}

                            {/* Level & Context */}
                            <div className="flex items-center gap-3 text-sm">
                                <div className="px-3 py-1 rounded bg-slate-800 text-white font-bold text-xs flex items-center gap-2">
                                    <span>Nível 1</span> {/* Logic to detect level could be added here if backend provides it */}
                                    <span className="w-px h-3 bg-slate-600"></span>
                                    <span className="font-normal text-slate-300">{planContext}</span>
                                </div>
                                <div className="font-bold text-emerald-600">{amount}</div>
                            </div>
                        </div>
                    )}
                </div>
            </td>

            {/* STATUS BADGE */}
            <td className="p-4 align-top">
                <div className={`text-xs font-bold px-3 py-1 rounded-full w-fit flex items-center gap-1 ${status === 'COMPLETED' || status === 'LIVRO ENTREGUE' ? 'bg-green-100 text-green-700' :
                        status === 'APPROVED' || status === 'SUBSCRIBER' ? 'bg-blue-100 text-blue-700' :
                            status === 'IN_PROGRESS' || prodStatus ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-500'
                    }`}>
                    {(status === 'IN_PROGRESS' || prodStatus) && <span className="animate-spin text-[10px]">⏳</span>}
                    {displayStatus || status}
                </div>
            </td>

            {/* ACTIONS */}
            <td className="p-4 align-top text-right w-48">
                <div className="flex flex-col gap-2">

                    {/* SUBSCRIPTION ACTIONS */}
                    {isSubscription && (
                        <>
                            {(status !== 'SUBSCRIBER' && lead.plan?.status !== 'ACTIVE') && (
                                <button onClick={() => handleAction('SUBSCRIPTION')} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded shadow transition">
                                    ✅ ATIVAR PLANO
                                </button>
                            )}
                            <div className="grid grid-cols-2 gap-1">
                                <button onClick={() => handleAction('FREEZE')} className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold py-1 rounded">
                                    ❄️ CONGELAR
                                </button>
                                <button onClick={() => handleAction('BLOCK')} className="bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold py-1 rounded">
                                    🚫 BLOQUEAR
                                </button>
                            </div>
                        </>
                    )}

                    {/* BOOK ACTIONS */}
                    {isBook && (
                        <>
                            {/* Release / Unlock */}
                            {!liberado && status !== 'COMPLETED' && status !== 'APPROVED' && status !== 'LIVRO ENTREGUE' && (
                                <button onClick={() => handleAction('CREDIT')} disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded shadow transition shadow-emerald-200">
                                    🔓 LIBERAR GERAÇÃO
                                </button>
                            )}

                            {/* Diagram (IA) */}
                            {(liberado || status === 'APPROVED') && status !== 'COMPLETED' && status !== 'LIVRO ENTREGUE' && !prodStatus && (
                                <button onClick={() => onDiagram(lead.id)} className="w-full bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 rounded shadow transition flex items-center justify-center gap-1">
                                    ⚡ DIAGRAMAR
                                </button>
                            )}

                            {/* Regenerate */}
                            {(status === 'COMPLETED' || status === 'LIVRO ENTREGUE' || prodStatus) && (
                                <button onClick={handleRegenerate} disabled={loading} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold py-2 rounded border border-slate-200">
                                    🔄 REGERAR
                                </button>
                            )}
                        </>
                    )}

                    {/* Common CRUD */}
                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-2 mt-1">
                        <button onClick={handleEditFields} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded" title="Editar">
                            ✏️
                        </button>
                        <button onClick={() => onDelete(lead.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
};
