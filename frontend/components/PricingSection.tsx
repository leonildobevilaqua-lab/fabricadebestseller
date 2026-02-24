
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { pt, en, es } from '../i18n/locales';

const translations = { pt, en, es };

const Check = () => <svg className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
const Cross = () => <svg className="w-5 h-5 text-red-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

interface PricingProps {
    onSelectPlan?: (plan: string, billing: string) => void;
    lang: 'pt' | 'en' | 'es';
    onLoginClick: () => void;
}

// ─── TABELA DE PREÇOS FIXA ─────────────────────────────────────────────────────
const PLANS_DATA = [
    {
        name: "STARTER",
        subtitle: "Autor Iniciante",
        icon: "🥉",
        color: "border-slate-700 bg-slate-800/50",
        monthly: { sub: "19,90", book: "28,90" },
        annual: { sub: "147,90", book: "24,90", perMonth: "12,33" },
        features: [
            { text: "Acesso à plataforma", included: true },
            { text: "IA para geração de livros", included: true },
            { text: "Conteúdo com 10–12 capítulos", included: true },
            { text: "Diagrama de estrutura", included: true },
            { text: "Folha de rosto automática", included: true },
            { text: "Sumário formatado", included: true },
            { text: "Histórico de projetos", included: true },
            { text: "Páginas extras automáticas (IA)", included: false, warning: true },
            { text: "Acesso à comunidade", included: false },
            { text: "Kit de marketing", included: false },
        ]
    },
    {
        name: "PRO",
        subtitle: "Autor Best Seller",
        icon: "🥈",
        badge: "MAIS POPULAR",
        color: "border-emerald-500/50 bg-emerald-900/10 shadow-2xl shadow-emerald-900/20 scale-105 z-10",
        monthly: { sub: "39,90", book: "18,90" },
        annual: { sub: "297,90", book: "14,90", perMonth: "24,83" },
        features: [
            { text: "Acesso à plataforma", included: true },
            { text: "IA para geração de livros", included: true },
            { text: "Conteúdo com 10–12 capítulos", included: true },
            { text: "Diagrama de estrutura", included: true },
            { text: "Folha de rosto automática", included: true },
            { text: "Sumário formatado", included: true },
            { text: "Histórico de projetos", included: true },
            { text: "Pág. Agradecimento, Dedicatória, Sobre o Autor (IA)", included: true },
            { text: "Kit de marketing completo", included: true },
            { text: "Grupo Networking WhatsApp", included: true },
            { text: "Suporte via E-mail", included: true },
            { text: "1 tradução gratuita/mês", included: true },
        ]
    },
    {
        name: "BLACK",
        subtitle: "Editora VIP",
        icon: "🥇",
        iconSuffix: "👑",
        color: "border-amber-500/50 bg-amber-900/10",
        monthly: { sub: "79,90", book: "9,90" },
        annual: { sub: "497,90", book: "8,90", perMonth: "41,49" },
        features: [
            { text: "Acesso à plataforma", included: true },
            { text: "IA para geração de livros", included: true },
            { text: "Conteúdo com 10–12 capítulos", included: true },
            { text: "Diagrama de estrutura", included: true },
            { text: "Folha de rosto automática", included: true },
            { text: "Sumário formatado", included: true },
            { text: "Histórico de projetos", included: true },
            { text: "Pág. Agradecimento, Dedicatória, Sobre o Autor (IA)", included: true },
            { text: "Kit de marketing completo", included: true },
            { text: "Discord VIP + Grupo WhatsApp", included: true },
            { text: "Suporte Prioritário", included: true },
            { text: "Acesso antecipado a novidades", included: true },
            { text: "Mentoria: Capas, Uiclap, Amazon", included: true },
            { text: "2 traduções gratuitas/mês", included: true },
        ]
    }
];

// Dispara InitiateCheckout pixel
const fireInitiateCheckout = (planName: string, value: number) => {
    try {
        const w = window as any;
        if (w.fbq) {
            w.fbq('track', 'InitiateCheckout', {
                content_name: planName,
                value,
                currency: 'BRL'
            });
        }
    } catch (_) { }
};

export const PricingSection: React.FC<PricingProps> = ({ onSelectPlan, lang, onLoginClick }) => {
    const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
    const t = translations[lang].pricing;

    return (
        <section className="py-24 relative overflow-hidden" id="planos">
            <div className="absolute inset-0 bg-slate-950"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 to-slate-950"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

            <div className="relative max-w-7xl mx-auto px-6">

                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                        {t.title} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{t.titleHighlight}</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10 whitespace-pre-line">{t.subtitle}</p>

                    {/* Toggle Mensal/Anual */}
                    <div className="inline-flex bg-slate-900 p-1 rounded-full border border-slate-700 relative">
                        <div className={`absolute top-1 bottom-1 w-[50%] bg-emerald-600 rounded-full transition-all duration-300 ${billing === 'monthly' ? 'left-1' : 'left-[49%]'}`}></div>
                        <button onClick={() => setBilling('monthly')} className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors ${billing === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                            Mensal
                        </button>
                        <button onClick={() => setBilling('annual')} className={`relative z-10 px-8 py-3 rounded-full text-sm font-bold transition-colors flex items-center gap-2 ${billing === 'annual' ? 'text-white' : 'text-slate-400 hover:text-white'}`}>
                            Anual
                            <span className="bg-emerald-400 text-emerald-950 text-[10px] px-2 py-0.5 rounded-full">ECONÔMICO</span>
                        </button>
                    </div>
                </div>

                {/* Cards */}
                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
                    {PLANS_DATA.map((plan, i) => {
                        const prices = billing === 'annual' ? plan.annual : plan.monthly;
                        const subValue = parseFloat((prices as any).sub.replace(',', '.'));

                        return (
                            <div key={i} className={`relative rounded-3xl border p-8 flex flex-col h-full transition-all duration-300 ${plan.color}`}>
                                {plan.badge && (
                                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-emerald-400 text-emerald-950 text-xs font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                        {plan.badge}
                                    </div>
                                )}

                                {/* Cabeçalho do plano */}
                                <div className="text-center mb-8">
                                    <div className="text-4xl mb-4">{plan.icon} {plan.iconSuffix}</div>
                                    <h3 className="text-2xl font-black text-white">{plan.name}</h3>
                                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">{plan.subtitle}</p>
                                </div>

                                {/* Preço da Assinatura */}
                                <div className="text-center mb-6 bg-slate-950/30 rounded-2xl p-6 border border-white/5">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest mb-2">Assinatura {billing === 'annual' ? 'Anual' : 'Mensal'}</p>
                                    <div className="flex justify-center items-end gap-1 mb-1">
                                        <span className="text-slate-400 mb-2">R$</span>
                                        <span className="text-5xl font-black text-white tracking-tight">
                                            {(prices as any).sub}
                                        </span>
                                        {billing === 'monthly' && <span className="text-slate-400 mb-2">/mês</span>}
                                    </div>
                                    {billing === 'annual' && (
                                        <p className="text-xs text-slate-500">
                                            Pagamento único anual (≈ R$ {(plan.annual as any).perMonth}/mês)
                                        </p>
                                    )}
                                </div>

                                {/* Custo por Livro */}
                                <div className="mb-8 bg-emerald-950/30 rounded-xl p-4 border border-emerald-500/20">
                                    <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">💰 Custo por Livro Gerado</p>
                                    <div className="flex items-center justify-between">
                                        <span className="text-2xl font-black text-white">R$ {(prices as any).book}</span>
                                        <span className="text-xs text-emerald-300 bg-emerald-900/50 px-2 py-1 rounded-lg">por geração</span>
                                    </div>
                                </div>

                                {/* Features */}
                                <div className="flex-1 space-y-3 mb-8">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">O que está incluído</div>
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className={`flex items-start gap-3 text-sm leading-relaxed ${feature.included ? 'text-slate-300' : 'text-slate-600 opacity-60'}`}>
                                            {feature.included ? <Check /> : <Cross />}
                                            <span className={(feature as any).warning ? "text-amber-500 font-medium" : ""}>
                                                {(feature as any).warning && "⚠️ "}{feature.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Botão CTA */}
                                <button
                                    id={`btn-plan-${plan.name.toLowerCase()}-${billing}`}
                                    onClick={() => {
                                        fireInitiateCheckout(`Plano ${plan.name} ${billing === 'annual' ? 'Anual' : 'Mensal'}`, subValue);
                                        if (onSelectPlan) onSelectPlan(plan.name, billing);
                                    }}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${plan.name === 'PRO'
                                        ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/25'
                                        : plan.name === 'BLACK'
                                            ? 'bg-amber-500 hover:bg-amber-400 text-slate-900 shadow-lg shadow-amber-500/25'
                                            : 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600'
                                        }`}>
                                    Assinar {plan.name}
                                </button>

                                {/* Já é assinante */}
                                <button
                                    onClick={() => { if (onLoginClick) onLoginClick(); }}
                                    className="mt-3 w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-3 rounded-xl shadow-lg shadow-yellow-500/10 transition-all transform hover:scale-[1.02] text-sm"
                                >
                                    JÁ SOU ASSINANTE {plan.name} — ENTRAR
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Sem desconto progressivo — nota informativa limpa */}
                <p className="text-center text-slate-500 text-sm mt-10">
                    ✅ Preços fixos e transparentes. Sem surpresas. Cancele quando quiser.
                </p>
            </div>
        </section>
    );
};
