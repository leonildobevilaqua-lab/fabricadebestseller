import React, { useState, useEffect } from 'react';

// --- INLINE ICONS (No external dependency to crash) ---
const Zap = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const BookOpen = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const X = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
const Check = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12" /></svg>;
const Lock = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const Star = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const FileText = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>;
const ChevronDown = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6" /></svg>;
const CheckCircle = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const SettingsIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;

interface LandingProps {
    onStart: (userData: any, initialData?: any) => void;
    onAdmin: () => void;
}

const LandingPage: React.FC<LandingProps> = ({ onStart, onAdmin }) => {
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Wizard State
    const [step, setStep] = useState(0); // 0: User Data, 1: Book Data, 2: Processing, 3: Paywall
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        countryCode: '+55'
    });
    const [bookData, setBookData] = useState({
        authorName: '',
        topic: ''
    });

    const [processingStage, setProcessingStage] = useState(0);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [checkingPayment, setCheckingPayment] = useState(false);

    // Scroll to Wizard or Open it
    const startWizard = () => {
        setIsWizardOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- LOGIC: SAVE LEAD ---
    const handleSaveLead = async () => {
        try {
            await fetch('http://localhost:3001/api/payment/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
        } catch (e) {
            console.error("Error saving lead", e);
        }
    };

    const nextStep = async () => {
        if (step === 0) {
            await handleSaveLead();
            setStep(1);
        } else if (step === 1) {
            setStep(2);
        }
    };

    // --- LOGIC: PROCESSING ANIMATION ---
    useEffect(() => {
        if (step === 2) {
            // Sequence of messages
            const intervals = [2000, 2000, 2000, 2000, 2000]; // 10s total
            let current = 0;

            const timer = setInterval(() => {
                current++;
                setProcessingStage(prev => {
                    if (prev >= 4) {
                        clearInterval(timer);
                        setTimeout(() => setStep(3), 1000); // Go to Paywall
                        return 4;
                    }
                    return prev + 1;
                });
            }, 2000);

            return () => clearInterval(timer);
        }
    }, [step]);

    const processingMessages = [
        "Conectando com Inteligência Artificial...",
        "Estruturando os 12 Capítulos...",
        "Definindo Palavras-Chaves...",
        "Diagramando Margens e Espelhos...",
        "Gerando Sinopse Profissional..."
    ];

    // --- LOGIC: CHECK PAYMENT ---
    useEffect(() => {
        let interval: any;
        if (step === 3) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`http://localhost:3001/api/payment/access?email=${formData.email}`);
                    const data = await res.json();
                    if (data.hasAccess) {
                        clearInterval(interval);
                        // SUCCESS: Start the real app
                        // Pass both user data and book data to pre-fill the generator
                        onStart(formData, bookData);
                    }
                } catch (e) { console.error(e); }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [step, formData.email]);

    return (
        <div className="min-h-screen font-sans bg-slate-900 text-slate-100 selection:bg-yellow-500 selection:text-slate-900 overflow-x-hidden">

            {/* --- HEADER --- */}
            <header className="fixed w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="text-yellow-400 w-8 h-8" />
                        <span className="text-xl md:text-2xl font-bold text-white tracking-tight">Fábrica de Best Sellers</span>
                    </div>
                    <button
                        onClick={onAdmin}
                        className="text-xs font-bold text-slate-500 hover:text-white uppercase tracking-widest transition"
                    >
                        Admin Area
                    </button>
                </div>
            </header>

            {isWizardOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-slate-900 overflow-y-auto animate-fade-in"
                >
                    <div className="min-h-screen flex flex-col">
                        {/* Wizard Header */}
                        <div className="p-6 flex justify-between items-center border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <Zap className="text-yellow-400 w-6 h-6" />
                                <span className="font-bold">Fábrica de Best Sellers - Gerando Seu Livro Agora!</span>
                            </div>
                            <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        {/* Wizard Content */}
                        <div className="flex-1 flex items-center justify-center p-6">
                            <div className="w-full max-w-xl">

                                {/* STEP 1: USER DATA */}
                                {step === 0 && (
                                    <div className="space-y-6 animate-fade-in">
                                        <h2 className="text-3xl font-bold text-center mb-2">Quem será o autor?</h2>
                                        <p className="text-center text-slate-400 mb-8">Informe seus dados para receber o arquivo final.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Nome Completo</label>
                                                <input
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    className="w-full bg-slate-800 border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-yellow-400 outline-none"
                                                    placeholder="Seu nome"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">E-mail Profissional</label>
                                                <input
                                                    value={formData.email}
                                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                    className="w-full bg-slate-800 border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-yellow-400 outline-none"
                                                    placeholder="seu@email.com"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">WhatsApp</label>
                                                <input
                                                    value={formData.phone}
                                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                    className="w-full bg-slate-800 border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-yellow-400 outline-none"
                                                    placeholder="(11) 99999-9999"
                                                />
                                            </div>
                                            <button
                                                onClick={nextStep}
                                                disabled={!formData.name || !formData.email || !formData.phone}
                                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-4 rounded-xl text-lg transition-all disabled:opacity-50 disabled:grayscale mt-4"
                                            >
                                                Avançar para Criação
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 2: BOOK DATA */}
                                {step === 1 && (
                                    <div className="space-y-6 animate-fade-in">
                                        <h2 className="text-3xl font-bold text-center mb-2">Sobre o que é seu Best Seller?</h2>
                                        <p className="text-center text-slate-400 mb-8">Nossa IA vai estruturar tudo com base nisso.</p>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Nome do Autor (para a Capa)</label>
                                                <input
                                                    value={bookData.authorName}
                                                    onChange={e => setBookData({ ...bookData, authorName: e.target.value })}
                                                    className="w-full bg-slate-800 border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-yellow-400 outline-none"
                                                    placeholder="Ex: Dr. João Silva"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm text-slate-400 mb-1">Tema/Assunto do Livro</label>
                                                <textarea
                                                    value={bookData.topic}
                                                    onChange={e => setBookData({ ...bookData, topic: e.target.value })}
                                                    className="w-full bg-slate-800 border-slate-700 rounded-xl p-4 text-white focus:ring-2 focus:ring-yellow-400 outline-none h-32 resize-none"
                                                    placeholder="Ex: Guia definitivo sobre investimentos para iniciantes com foco em liberdade financeira..."
                                                />
                                            </div>
                                            <button
                                                onClick={nextStep}
                                                disabled={!bookData.authorName || !bookData.topic}
                                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-4 rounded-xl text-lg transition-all disabled:opacity-50 disabled:grayscale mt-4 flex items-center justify-center gap-2"
                                            >
                                                <Zap className="w-5 h-5 fill-current" />
                                                INICIAR FABRICAÇÃO DO LIVRO
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: PROCESSING */}
                                {step === 2 && (
                                    <div className="text-center space-y-8 animate-fade-in">
                                        <div className="relative w-32 h-32 mx-auto">
                                            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Zap className="w-10 h-10 text-yellow-400 fill-current animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="h-16">
                                            <p
                                                className="text-xl font-medium text-slate-300 animate-fade-in"
                                                key={processingStage}
                                            >
                                                {processingMessages[processingStage]}
                                            </p>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                                            <div
                                                className="h-full bg-yellow-400 transition-all ease-linear"
                                                style={{ width: '95%', transitionDuration: '10000ms' }}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: PAYWALL */}
                                {step === 3 && (
                                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden animate-fade-in">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 to-yellow-300"></div>

                                        <div className="text-center mb-8">
                                            <div className="inline-block p-4 bg-yellow-500/10 rounded-full mb-4">
                                                <Lock className="w-10 h-10 text-yellow-400" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Finalize para Baixar seu Livro</h2>
                                            <p className="text-slate-400 text-sm">Para utilizar a API OFICIAL DO GOOGLE GEMINI e gerar o conteúdo completo de mais de 160 páginas, é necessário uma taxa única de processamento.</p>
                                        </div>

                                        <div className="space-y-3 mb-8">
                                            {[
                                                "12 Capítulos Completos",
                                                "+ de 160 Páginas Diagramadas",
                                                "Sessão Sobre o Autor",
                                                "Sinopse Profissional",
                                                "20 Palavras-Chave Otimizadas",
                                                "Texto para Contracapa e Orelha",
                                                "Descrição para YouTube"
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-center gap-3 text-slate-300 text-sm">
                                                    <div className="bg-green-500/20 p-1 rounded-full"><Check className="w-3 h-3 text-green-400" /></div>
                                                    {item}
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            onClick={() => window.open('https://pay.kiwify.com.br/SEU_LINK_AQUI', '_blank')}
                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-1"
                                        >
                                            PAGAR R$ 24,99 E LIBERAR DOWNLOAD
                                        </button>

                                        <p className="text-center text-xs text-slate-500 mt-4 animate-pulse">
                                            Aguardando confirmação de pagamento...
                                        </p>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- HERO SECTION --- */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-bold mb-8">
                            <Star className="w-4 h-4 fill-current" />
                            <span>Tecnologia de I.A. Avançada</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                            PUBLIQUE SEU LIVRO PROFISSIONAL <span className="text-yellow-400">AINDA HOJE</span>.
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed">
                            Esqueça os meses de escrita e os altos custos com designers.
                            A <span className="text-white font-bold">Fábrica de Best Sellers</span> entrega seu livro pronto para venda por apenas R$ 24,99.
                        </p>
                        <button
                            onClick={startWizard}
                            className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-lg md:text-xl font-bold px-10 py-5 rounded-full shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all transform hover:-translate-y-1 flex items-center gap-3 mx-auto"
                        >
                            QUERO GERAR MEU BEST SELLER AGORA
                            <Zap className="w-6 h-6 fill-current" />
                        </button>
                    </div>
                </div>
            </main>

            {/* --- PROBLEM SECTION --- */}
            <section className="py-20 bg-slate-800/50 border-y border-slate-800">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Você sempre sonhou em ter um livro publicado, <br />mas parou em um desses obstáculos?</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            "Falta de tempo para escrever mais de 100 páginas.",
                            "Bloqueio criativo na hora de estruturar os capítulos.",
                            "Dificuldade técnica para formatar margens, numeração e espelhos.",
                            "Orçamentos caros de diagramadores e ghostwriters."
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-4 p-6 bg-slate-900 rounded-xl border border-slate-800 hover:border-red-500/30 transition-colors group">
                                <div className="bg-red-500/10 p-2 rounded-lg group-hover:bg-red-500/20">
                                    <X className="w-6 h-6 text-red-500" />
                                </div>
                                <p className="text-lg text-slate-300 font-medium">{item}</p>
                            </div>
                        ))}
                    </div>
                    <p className="text-center text-xl text-slate-400 mt-12 max-w-3xl mx-auto italic">
                        "Ter um livro é a autoridade máxima em qualquer nicho. É o que separa os amadores dos especialistas. E agora, essa autoridade está ao seu alcance pelo preço de um lanche."
                    </p>
                </div>
            </section>

            {/* --- SOLUTION SECTION --- */}
            <section className="py-20">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-yellow-400 font-bold tracking-widest uppercase text-sm">A Solução Definitiva</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-6">Apresentamos a Fábrica de Best Sellers</h2>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">Nossa tecnologia inovadora não apenas escreve o conteúdo, mas entrega o produto final pronto para o mercado. Não entregamos um rascunho; entregamos um livro completo.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: "Conteúdo Robusto", desc: "Livro completo com 12 Capítulos estruturados logicamente, +160 páginas.", icon: FileText },
                            { title: "Diagramação Pro", desc: "Formatado nas medidas exatas (15,24 x 22,86 cm), padrão Amazon KDP.", icon: BookOpen },
                            { title: "Formatação Impecável", desc: "Margens espelho, numeração no rodapé, cabeçalhos dinâmicos.", icon: Star },
                            { title: "Zero Páginas em Branco", desc: "Fluxo contínuo e profissional, sem erros de formatação.", icon: CheckCircle },
                        ].map((card, i) => (
                            <div key={i} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-yellow-500/50 transition-all hover:-translate-y-2">
                                <card.icon className="w-12 h-12 text-yellow-400 mb-6" />
                                <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                                <p className="text-slate-400 leading-relaxed text-sm">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="py-20 bg-slate-800/30">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 text-center relative">
                        {[
                            { step: "01", title: "Defina o Tema", icon: Zap },
                            { step: "02", title: "Nossa IA Estrutura", icon: SettingsIcon },
                            { step: "03", title: "Geração & Diagramação", icon: FileText },
                            { step: "04", title: "Baixe o Arquivo", icon: BookOpen },
                        ].map((s, i) => (
                            <div key={i} className="relative z-10">
                                <div className="w-20 h-20 bg-slate-800 rounded-full border-4 border-slate-700 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-yellow-400 shadow-xl">
                                    {s.step}
                                </div>
                                <h3 className="text-lg font-bold">{s.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- OFFER SECTION --- */}
            <section className="py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-3xl p-10 md:p-16 text-center shadow-2xl shadow-yellow-500/20 text-slate-900">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Oferta Exclusiva de Lançamento</h2>
                        <p className="text-xl md:text-2xl font-medium opacity-90 mb-8">
                            Contratar um ghostwriter custaria R$ 5.000+.<br />
                            Hoje, tenha seu Best Seller pronto por apenas:
                        </p>
                        <div className="text-6xl md:text-8xl font-black mb-10 tracking-tighter">
                            R$ 24,99
                        </div>
                        <button
                            onClick={startWizard}
                            className="bg-slate-900 text-white text-xl font-bold px-12 py-6 rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-3 mx-auto"
                        >
                            <Zap className="w-6 h-6 fill-current text-yellow-500" />
                            QUERO GERAR MEU BEST SELLER AGORA
                        </button>
                    </div>
                </div>
            </section>

            {/* --- FAQ --- */}
            <section className="py-20 bg-slate-800/50">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
                    <div className="space-y-4">
                        {[
                            { q: "O livro vem com capa?", a: "O foco é o miolo diagramado. A capa deve ser criada à parte, mas fornecemos o texto da contracapa e orelhas." },
                            { q: "Posso editar o texto depois?", a: "Sim, o arquivo é seu (DOCX). Você tem total liberdade editorial." },
                            { q: "Serve para publicar na Amazon?", a: "Sim, medidas 6x9 inches (15.24 x 22.86 cm) já configuradas para KDP." },
                            { q: "Quantas páginas?", a: "Garantia de estrutura robusta com mais de 160 páginas geradas." },
                        ].map((item, i) => (
                            <details key={i} className="bg-slate-900 border border-slate-700 rounded-xl overflow-hidden group">
                                <summary className="p-6 cursor-pointer font-bold flex justify-between items-center hover:text-yellow-400 transition-colors list-none">
                                    {item.q}
                                    <ChevronDown className="w-5 h-5 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-6 pb-6 text-slate-400 leading-relaxed border-t border-slate-800 pt-4">
                                    {item.a}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>
            </section>

            <footer className="py-12 text-center text-slate-600 border-t border-slate-800">
                <p>&copy; 2024 Fábrica de Best Sellers. Todos os direitos reservados.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
