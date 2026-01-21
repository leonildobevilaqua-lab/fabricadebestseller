import React, { useState, useEffect } from 'react';
import { pt, en, es } from '../i18n/locales';
import { PricingSection } from './PricingSection';
import { RewardModal } from './RewardModal';
import * as API from '../services/api';

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
    lang: 'pt' | 'en' | 'es';
    setLang: (l: 'pt' | 'en' | 'es') => void;
    initialState?: any;
}

const LandingPage: React.FC<LandingProps> = ({ onStart, onAdmin, lang, setLang, initialState }) => {
    const translations: any = { pt: pt.landing, en: en.landing, es: es.landing };
    const t: any = { pt, en, es };
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Wizard State
    // Wizard State
    const [step, setStep] = useState(0); // 0: User Data, 1: Book Data, 2: Processing, 3: Paywall, 4: Voucher Success
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        countryCode: '+55',
        type: 'BOOK' // BOOK, VOUCHER, GIFT_DIRECT
    });
    const [bookData, setBookData] = useState({
        authorName: '',
        topic: '',
        isGift: false,
        giftName: '',
        giftEmail: '',
        giftPhone: ''
    });

    const [processingStage, setProcessingStage] = useState(0);
    const [products, setProducts] = useState<any>({});

    // Voucher / Gift Redemption
    const [giftSourceEmail, setGiftSourceEmail] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<{ name: string; billing: string } | null>(null);
    const [voucherCredits, setVoucherCredits] = useState<number>(0);

    // Manual Start Logic (Payment Confirmed)
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);


    // Upload Book State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [uploadData, setUploadData] = useState({ name: '', email: '', phone: '', file: null as File | null });
    const [uploading, setUploading] = useState(false);

    // Rotating Text State
    const [rotatingWord, setRotatingWord] = useState('PUBLIQUE');
    const [fetchedPrice, setFetchedPrice] = useState(39.90);
    const [showPlanCelebration, setShowPlanCelebration] = useState(false);
    const [celebratedPlan, setCelebratedPlan] = useState<any>(null);
    const [activeDiscount, setActiveDiscount] = useState<number>(0);
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

    // PERSIST SELECTED PLAN
    useEffect(() => {
        try {
            const saved = localStorage.getItem('selectedPlan_v3');
            if (saved) setSelectedPlan(JSON.parse(saved));
        } catch (e) {
            console.error("Error parsing saved plan", e);
        }
    }, []);

    useEffect(() => {
        if (selectedPlan) {
            localStorage.setItem('selectedPlan_v3', JSON.stringify(selectedPlan));
        }
    }, [selectedPlan]);

    // CHANGED: Use a new key to reset user's discount for testing/fresh start
    const DISCOUNT_KEY = 'activeDiscount_v4_clean';


    const handleNewBook = () => {
        // RESET FLOW TO START
        setStep(0);
        setCurrentLeadId(null);
        setDiscountUpdated(false);

        // Clear book data for new project
        setBookData({
            authorName: '',
            topic: '',
            isGift: false,
            giftName: '',
            giftEmail: '',
            giftPhone: ''
        });

        // Scroll to top to show they can generate again with discount
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    useEffect(() => {
        const d = localStorage.getItem(DISCOUNT_KEY);
        if (d) setActiveDiscount(parseInt(d));
        else setActiveDiscount(0);
    }, []);

    useEffect(() => {
        const wordsMap: any = {
            pt: ['PUBLIQUE', 'CRIE', 'EDITE', 'RECEBA'],
            en: ['PUBLISH', 'CREATE', 'EDIT', 'RECEIVE'],
            es: ['PUBLICA', 'CREA', 'EDITA', 'RECIBE']
        };
        const words = wordsMap[lang] || wordsMap['pt'];

        let currentIndex = 0;
        const interval = setInterval(() => {
            currentIndex = (currentIndex + 1) % words.length;
            setRotatingWord(words[currentIndex]);
        }, 2500);
        return () => clearInterval(interval);
    }, [lang]);

    useEffect(() => {
        // Load config
        fetch('/api/payment/config')
            .then(res => res.json())
            .then(data => setProducts(data.products || {}))
            .catch(console.error);

        // Check for Gift Code in URL
        const params = new URLSearchParams(window.location.search);
        const giftCode = params.get('gift_code');
        if (giftCode) {
            try {
                const sourceEmail = atob(giftCode);
                setGiftSourceEmail(sourceEmail);
                // Auto-check validity
                fetch(`/api/payment/access?email=${sourceEmail}&_t=${Date.now()}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.hasAccess) setVoucherCredits(data.credits);
                    });
                // Open wizard if gift code is present
                setIsWizardOpen(true);
            } catch (e) {
                console.error("Invalid gift code");
            }
        }
    }, []);

    // Initial State (Upsell Recovery)
    useEffect(() => {
        if (initialState) {
            if (initialState.email) {
                // If preserving user (upsell), we keep Email/Phone but force Name clear if requested?
                // User said: "Tem que mandar ele para a página onde ele vai ter que inserir novamente o nome dele"
                // So we default name to empty if it's a "reset" flow.
                const shouldClearName = initialState.resetData === true;

                setFormData(prev => {
                    // Try to recover phone from localStorage if missing in props
                    let recoveredPhone = initialState.phone || prev.phone || '';
                    if (!recoveredPhone) {
                        try {
                            const saved = JSON.parse(localStorage.getItem('bs_formData') || '{}');
                            if (saved.email === initialState.email && saved.phone) {
                                recoveredPhone = saved.phone;
                            }
                        } catch (e) { }
                    }

                    return {
                        ...prev,
                        email: initialState.email,
                        phone: recoveredPhone,
                        name: shouldClearName ? '' : (initialState.name || prev.name || '')
                    };
                });
            }
            if (initialState.step !== undefined) {
                setStep(initialState.step);
                setIsWizardOpen(true);
            }
        }
    }, [initialState]);

    // Scroll to Wizard or Open it
    // Scroll to Wizard or Open it
    const startWizard = (plan?: string, billing?: string) => {
        setGiftSourceEmail(null);
        setIsWizardOpen(true);
        if (plan && billing) {
            setSelectedPlan({ name: plan, billing });
        } else {
            setSelectedPlan(null); // Avulso
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
    const [discountUpdated, setDiscountUpdated] = useState(false);

    // --- LOGIC: SAVE LEAD ---
    const handleSaveLead = async (overrideType?: string) => {
        try {
            // Calculate Tag
            let tag = 'Id_avulso';
            if (selectedPlan) {
                tag = `Id_${selectedPlan.name}_${selectedPlan.billing}`;
            }

            const payload = {
                ...formData,
                ...bookData,
                type: overrideType || formData.type,
                tag,
                discount: activeDiscount, // Initial guess
                plan: selectedPlan
            };
            const res = await fetch('/api/payment/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.id) setCurrentLeadId(data.id);

        } catch (e) {
            console.error("Error saving lead", e);
        }
    };

    const handleUpload = async () => {
        if (!uploadData.file || !uploadData.name || !uploadData.email || !uploadData.phone) {
            alert("Preencha todos os campos e selecione o arquivo.");
            return;
        }
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append('name', uploadData.name);
            fd.append('email', uploadData.email);
            fd.append('phone', uploadData.phone);
            fd.append('file', uploadData.file);

            const res = await fetch('/api/projects/upload-existing', {
                method: 'POST',
                body: fd
            });
            const data = await res.json();
            if (res.ok) {
                setUploadData(prev => ({ ...prev, name: '', email: '', phone: '', file: null }));
                setIsUploadModalOpen(false);

                setFormData({
                    name: uploadData.name,
                    email: uploadData.email,
                    phone: uploadData.phone,
                    countryCode: '+55',
                    type: 'DIAGRAMMING'
                });

                setStep(3);
                setIsWizardOpen(true);
            } else {
                alert("Erro ao enviar: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão.");
        }
        setUploading(false);
    };

    const nextStep = async () => {
        if (step === 0) {
            await handleSaveLead();
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
        "Informando os dados para nossa equipe de criação...",
        "Conectando com nossa plataforma de Inteligência Artificial...",
        "Criando os processos para a construção do seu novo livro...",
        "Estruturando os Capítulos...",
        "Diagramando e Finalizando Arquivo..."
    ];

    // --- DATA PERSISTENCE & RECOVERY ---
    // Save state on change
    useEffect(() => {
        if (formData.email) localStorage.setItem('bs_formData', JSON.stringify(formData));
        if (bookData.topic) localStorage.setItem('bs_bookData', JSON.stringify(bookData));
    }, [formData, bookData]);

    const handleManualStart = async () => {
        try {
            // Recover from storage if needed for robustness
            let currentForm = formData;
            let currentBook = bookData;

            if (!currentForm.name || !currentForm.email) {
                const savedForm = localStorage.getItem('bs_formData');
                if (savedForm) currentForm = JSON.parse(savedForm);
            }
            if (!currentBook.topic) {
                const savedBook = localStorage.getItem('bs_bookData');
                if (savedBook) currentBook = JSON.parse(savedBook);
            }

            if (!currentForm.name || !currentBook.topic) {
                console.error("Missing Data for start", currentForm, currentBook);
                // Don't reset step immediately to avoid loop, just alert
                alert("Sessão expirada. Recarregue a página.");
                return;
            }

            console.log("Starting generation...");
            const success = await API.useCredit(currentForm.email);

            if (success) {
                onStart(currentForm, currentBook);
            } else {
                console.warn("Start prevented: No internal credits available or API Error.");
                setPaymentConfirmed(false);
                alert("Não foi possível iniciar a produção. Verifique se seu pagamento foi confirmado ou se possui créditos.");
            }

        } catch (e) {
            console.error("Start Error", e);
            alert("Erro ao iniciar produção.");
        }
    };

    // --- AUTOMATION: AUTO-START IF CONFIRMED ---
    useEffect(() => {
        if (paymentConfirmed && step === 3) {
            const t = setTimeout(() => {
                handleManualStart();
            }, 1000); // 1s delay for visual feedback
            return () => clearTimeout(t);
        }
    }, [paymentConfirmed, step]);

    // --- LOGIC: CHECK PAYMENT (POLLING) ---
    const [debugInfo, setDebugInfo] = useState<any>(null);

    useEffect(() => {
        let interval: any;
        // Poll active on Step 2, 3, 0
        const shouldPoll = ((step === 2 || step === 3 || step === 0) && !giftSourceEmail);

        if (shouldPoll) {
            interval = setInterval(async () => {
                try {
                    console.log("Polling for:", formData.email);
                    const res = await fetch(`/api/payment/access?email=${formData.email.trim()}&_t=${Date.now()}`);
                    const data = await res.json();
                    setDebugInfo(data);
                    console.log("Poll Result:", data);

                    if (data.bookPrice) setFetchedPrice(data.bookPrice);
                    if (data.checkoutUrl) (window as any).checkoutUrl = data.checkoutUrl;
                    if (data.discountLevel) (window as any).discountLevel = data.discountLevel;
                    if (data.plan) (window as any).currentUserPlan = data.plan;

                    // RESTORE PENDING PLAN FROM DB IF LOCAL STATE LOST
                    if (data.pendingPlan) {
                        (window as any).currentUserPendingPlan = data.pendingPlan;
                        if (!selectedPlan) {
                            setSelectedPlan(data.pendingPlan);
                        }
                    }

                    // LEADS UPDATE FIX
                    if (data.discountLevel && data.plan && data.plan.status === 'ACTIVE') {
                        let correctDiscount = 0;
                        if (data.discountLevel === 2) correctDiscount = 10;
                        if (data.discountLevel === 3) correctDiscount = 15;
                        if (data.discountLevel >= 4) correctDiscount = 20;

                        // ALWAYS UPDATE LOCAL STATE
                        setActiveDiscount(correctDiscount);
                        // localStorage.setItem(DISCOUNT_KEY, correctDiscount.toString()); // If needed

                        // LEADS UPDATE FIX (Only if Lead Exists and not updated)
                        if (currentLeadId && !discountUpdated) {
                            // Update Lead with Discount and Level Tag for Admin visibility
                            fetch('/api/payment/leads', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    id: currentLeadId,
                                    updates: {
                                        discount: correctDiscount,
                                        tag: `Nível ${data.discountLevel} (${data.plan.name})`
                                    }
                                })
                            }).then(() => setDiscountUpdated(true)).catch(console.error);
                        }
                    }

                    // CHECK EXPIRATION
                    if (data.plan && data.plan.status === 'EXPIRED') {
                        console.warn("Plan Expired");
                        if (!sessionStorage.getItem('expired_alert_' + formData.email)) {
                            alert("⚠️ SEU PLANO EXPIROU!\n\nPara continuar usufruindo dos benefícios e descontos do SaaS, por favor renove sua assinatura (Mensal ou Anual).");
                            sessionStorage.setItem('expired_alert_' + formData.email, 'true');
                        }
                    }

                    // PLAN CELEBRATION
                    if (data.plan && data.plan.status === 'ACTIVE') {
                        const planKey = `celebrated_v2_${data.plan.name}_${formData.email}`;
                        if (!localStorage.getItem(planKey)) {
                            setCelebratedPlan(data.plan);
                            setShowPlanCelebration(true);
                            localStorage.setItem(planKey, 'true');
                        }
                    } else {
                        // RESET CELEBRATION IF PLAN IS LOST/DELETED (Supports Retesting)
                        if (formData.email) {
                            ['STARTER', 'PRO', 'BLACK'].forEach(p => {
                                localStorage.removeItem(`celebrated_v2_${p}_${formData.email}`);
                            });
                        }
                    }

                    // PAYMENT CONFIRMATION LOGIC
                    const hasCredit = Number(data.credits) > 0;
                    const isApproved = ['APPROVED', 'COMPLETED', 'LIVRO ENTREGUE'].includes(data.leadStatus);
                    const hasAccess = data.hasAccess === true;

                    if (hasCredit || isApproved || hasAccess) {
                        // STRICT VALIDATION FOR SUBSCRIBERS: 
                        // If user is a Subscriber, we ignores generic 'hasAccess' (which might be true due to platform access).
                        // They MUST have actual Credit or specific Approval to start generation.
                        const isSubscriber = data.plan && data.plan.status === 'ACTIVE';
                        if (isSubscriber && !hasCredit && !isApproved) {
                            console.log("Subscriber detected but no Credit/Approval. Blocking auto-start.");
                            return; // Do not confirm payment yet
                        }

                        if (!paymentConfirmed) {
                            console.log("PAYMENT CONFIRMED (POLLING)", data);
                            setPaymentConfirmed(true);

                            // AUTO START BOOK GENERATION
                            if (formData.type !== 'VOUCHER' && formData.type !== 'DIAGRAMMING') {
                                setTimeout(() => {
                                    onStart(formData, bookData);
                                }, 2000);
                            }
                        }
                    }

                    // AUTO NAVIGATE VOUCHER / DIAGRAM
                    if (formData.type === 'VOUCHER' && isApproved) {
                        clearInterval(interval);
                        setStep(4);
                    }
                    if (formData.type === 'DIAGRAMMING' && isApproved) {
                        clearInterval(interval);
                        setStep(5);
                    }

                } catch (e) { console.error("Poll Error", e); }
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [step, formData.email, formData.type, giftSourceEmail, currentLeadId, discountUpdated, paymentConfirmed]);

    const [diagramStep, setDiagramStep] = useState(0);
    const diagramMessages = [
        "Lendo o material disponível...",
        "Efetuando primeira analises do conteúdo em anexo...",
        "Organizando e começando o processo de diagramação profissional...",
        "Gerando o arquivo totalmente diagramando para revisão...",
        "Encaminhando o livro diagramado para o departamento de expedição...",
        "Enviando o livro diagramado de forma profissional ao cliente...",
        "DOWNLOAD DISPONÍVEL"
    ];

    useEffect(() => {
        if (step === 5) {
            let current = 0;
            const timer = setInterval(() => {
                setDiagramStep(prev => {
                    if (prev < diagramMessages.length - 1) {
                        return prev + 1;
                    }
                    clearInterval(timer);
                    return prev;
                });
            }, 4000); // 4 seconds per step
            return () => clearInterval(timer);
        }
    }, [step]);

    return (
        <div className="min-h-screen font-sans bg-slate-900 text-slate-100 selection:bg-yellow-500 selection:text-slate-900 overflow-x-hidden">
            {/* PLAN CELEBRATION MODAL */}
            {showPlanCelebration && celebratedPlan && (
                <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/50 p-8 rounded-3xl max-w-lg text-center relative shadow-2xl shadow-indigo-500/20">
                        <button
                            onClick={() => setShowPlanCelebration(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X />
                        </button>
                        <div className="text-6xl mb-4 animate-bounce">🎉</div>
                        <h2 className="text-3xl font-black text-white mb-4">
                            PARABÉNS! <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                VOCÊ AGORA É UM ASSINANTE!
                            </span>
                        </h2>
                        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                            Acabamos de desbloquear as condições exclusivas do seu plano e a
                            <span className="text-yellow-400 font-bold"> Taxa de Geração Promocional (R$ 26,90)</span>.
                        </p>
                        <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-xl mb-8">
                            <span className="text-sm text-indigo-300 uppercase font-bold tracking-widest">Novo Valor Por Livro</span>
                            <div className="text-4xl font-black text-white mt-1">
                                R$ {fetchedPrice.toFixed(2).replace('.', ',')}
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPlanCelebration(false)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                        >
                            APROVEITAR AGORA
                        </button>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="fixed w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <BookOpen className="text-yellow-400 w-8 h-8" />
                        <span className="text-xl md:text-2xl font-bold text-white tracking-tight">Fábrica de Best Sellers</span>
                    </a>

                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Language Selector */}
                        <div className="hidden md:flex items-center bg-slate-800 rounded-full p-1 border border-slate-700">
                            <button onClick={() => setLang('pt')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${lang === 'pt' ? 'text-yellow-400 bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-white'}`}>BR</button>
                            <div className="w-[1px] h-3 bg-slate-700"></div>
                            <button onClick={() => setLang('en')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${lang === 'en' ? 'text-yellow-400 bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-white'}`}>US</button>
                            <div className="w-[1px] h-3 bg-slate-700"></div>
                            <button onClick={() => setLang('es')} className={`px-3 py-1 text-xs font-bold rounded-full transition-colors ${lang === 'es' ? 'text-yellow-400 bg-slate-700 shadow-sm' : 'text-slate-500 hover:text-white'}`}>ES</button>
                        </div>

                        {/* Admin Link Removed as per request */}
                    </div>
                </div>
            </header>

            {isWizardOpen && (
                <div
                    className="fixed inset-0 z-[60] bg-slate-900 overflow-y-auto animate-fade-in"
                >
                    <div className="min-h-screen flex flex-col">
                        {/* Wizard Header */}
                        <div className="relative p-6 flex justify-between items-center border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
                            <div className="flex items-center gap-2 z-10">
                                <Zap className="text-yellow-400 w-6 h-6" />
                                <span className="font-bold">{translations[lang].startWizardTitle}</span>
                            </div>
                            <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-white z-10">
                                <X className="w-8 h-8" />
                            </button>

                            {/* Progress Bar */}
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                                <div
                                    className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                                    style={{ width: `${step === 0 ? 10 : step === 2 ? 50 : step === 3 ? 90 : 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Wizard Content */}
                        <div className="flex-1 flex items-center justify-center p-6">
                            <div className="w-full max-w-xl">

                                {/* MERGED STEP: DATA ENTRY */}
                                {step === 0 && (
                                    <div className="space-y-6 w-full">
                                        {activeDiscount > 0 && (
                                            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-xl mb-6 text-center animate-pulse border border-indigo-400/50 shadow-lg shadow-indigo-500/20">
                                                <div className="flex items-center justify-center gap-2 mb-1">
                                                    <span className="text-2xl">🎉</span>
                                                    <h3 className="font-black text-white text-lg tracking-wider">BÔNUS DE FIDELIDADE ATIVO</h3>
                                                </div>
                                                <p className="text-indigo-100 text-sm">
                                                    Você tem <span className="font-bold text-yellow-400 bg-black/20 px-2 py-0.5 rounded border border-yellow-500/30">{activeDiscount}% DE DESCONTO</span> garantido nesta geração.
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">
                                                Dados do Projeto
                                            </h2>
                                            <p className="text-slate-400">
                                                Preencha as informações do responsável e do livro.
                                            </p>
                                        </div>

                                        <div className="space-y-6">
                                            {/* --- USER DATA (RESPONSÁVEL) --- */}
                                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-yellow-500/10 text-yellow-500 p-2 rounded-lg">👤</span>
                                                    <h3 className="font-bold text-lg text-slate-200">
                                                        {activeDiscount > 0 ? "Identificação (Cliente Vip)" : "Responsável pelo Projeto"}
                                                    </h3>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nome Completo</label>
                                                    <input
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full bg-slate-900 border-slate-700 rounded-xl p-3 text-white focus:ring-1 focus:ring-yellow-500 outline-none transition-all hover:bg-slate-900/80 items-center"
                                                        placeholder="Seu nome completo"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">E-mail {activeDiscount > 0 && "(Registrado)"}</label>
                                                        <input
                                                            value={formData.email}
                                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                            className={`w-full rounded-xl p-3 text-white outline-none transition-all ${activeDiscount > 0 ? 'bg-slate-800/50 border border-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-900 border-slate-700 focus:ring-1 focus:ring-yellow-500 hover:bg-slate-900/80'}`}
                                                            placeholder="seu@email.com"
                                                            readOnly={activeDiscount > 0}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">WhatsApp</label>
                                                        <div className="flex gap-2">
                                                            <select
                                                                value={formData.countryCode}
                                                                onChange={e => setFormData({ ...formData, countryCode: e.target.value })}
                                                                className={`w-24 rounded-xl p-3 text-white outline-none ${activeDiscount > 0 && formData.phone ? 'bg-slate-800/50 border border-slate-700 cursor-not-allowed' : 'bg-slate-900 border-slate-700 focus:ring-1 focus:ring-yellow-500 cursor-pointer'}`}
                                                                disabled={activeDiscount > 0 && !!formData.phone}
                                                            >
                                                                <option value="+55">🇧🇷</option>
                                                                <option value="+1">🇺🇸</option>
                                                                <option value="+351">🇵🇹</option>
                                                            </select>
                                                            <input
                                                                value={formData.phone}
                                                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                                className={`flex-1 rounded-xl p-3 text-white outline-none transition-all ${activeDiscount > 0 && formData.phone ? 'bg-slate-800/50 border border-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-900 border-slate-700 focus:ring-1 focus:ring-yellow-500 hover:bg-slate-900/80'}`}
                                                                placeholder="(99) 99999-9999"
                                                                readOnly={activeDiscount > 0 && !!formData.phone}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* --- BOOK DATA --- */}
                                            {/* --- BOOK DATA --- */}
                                            <div className="bg-indigo-950/30 p-6 rounded-2xl border border-indigo-500/30 space-y-4 relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg">📘</span>
                                                    <h3 className="font-bold text-lg text-indigo-100">Sobre o Livro</h3>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-indigo-300 mb-1 uppercase">Nome do Autor (Para a Capa)</label>
                                                    <input
                                                        value={bookData.authorName}
                                                        onChange={e => setBookData({ ...bookData, authorName: e.target.value })}
                                                        className="w-full bg-indigo-950/50 border-indigo-500/30 border rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-400 outline-none transition-all hover:bg-indigo-900/50 placeholder-indigo-300/30"
                                                        placeholder="Ex: Dr. João Silva"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-indigo-300 mb-1 uppercase">Tema/Assunto do Livro</label>
                                                    <textarea
                                                        value={bookData.topic}
                                                        onChange={e => setBookData({ ...bookData, topic: e.target.value })}
                                                        className="w-full bg-indigo-950/50 border-indigo-500/30 border rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-400 outline-none h-24 resize-none transition-all hover:bg-indigo-900/50 placeholder-indigo-300/30"
                                                        placeholder="Ex: Guia definitivo sobre investimentos para iniciantes com foco em liberdade financeira..."
                                                    />
                                                    <p className="text-right text-xs text-indigo-300/50 mt-1">Quanto mais detalhes, melhor.</p>
                                                </div>
                                            </div>

                                            {/* --- GIFT SECTION --- */}
                                            {/* --- GIFT SECTION: BOOK (Immediate) --- */}
                                            <div className="bg-gradient-to-br from-indigo-900/30 to-indigo-800/20 p-6 rounded-2xl border border-indigo-500/30 space-y-4 animate-fade-in hover:border-indigo-400/50 transition-all">
                                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-indigo-300 flex items-center gap-2 mb-1">
                                                            <span>🎁</span> PRESENTEAR ESTE LIVRO AGORA
                                                        </h3>
                                                        <p className="text-xs text-indigo-200/70">
                                                            Você define o Autor e Tema agora, nós geramos e enviamos o livro pronto para a pessoa.
                                                        </p>
                                                    </div>
                                                    <button
                                                        className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg flex-shrink-0 border ${(bookData as any).isGift ? 'bg-indigo-500 text-white border-indigo-400 shadow-indigo-500/30' : 'bg-slate-800 text-indigo-300 border-indigo-500/30 hover:bg-slate-700'}`}
                                                        onClick={() => setBookData(prev => ({ ...prev, isGift: !(prev as any).isGift }))}
                                                    >
                                                        {(bookData as any).isGift ? '✅ Opção Selecionada' : 'Selecionar Esta Opção'}
                                                    </button>
                                                </div>

                                                {(bookData as any).isGift && (
                                                    <div className="bg-indigo-950/40 p-5 rounded-xl space-y-4 border border-indigo-500/20 mt-4">
                                                        <p className="text-xs font-bold text-indigo-300 uppercase border-b border-indigo-500/20 pb-2">Destinatário do Presente</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div className="md:col-span-2">
                                                                <label className="block text-xs font-bold text-indigo-400 mb-1">Nome Completo</label>
                                                                <input
                                                                    className="w-full bg-slate-900/80 border-indigo-500/30 border rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
                                                                    placeholder="Nome da pessoa que vai receber"
                                                                    value={(bookData as any).giftName || ''}
                                                                    onChange={e => setBookData(prev => ({ ...prev, giftName: e.target.value }))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-indigo-400 mb-1">E-mail</label>
                                                                <input
                                                                    className="w-full bg-slate-900/80 border-indigo-500/30 border rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
                                                                    placeholder="email@dapessoa.com"
                                                                    value={(bookData as any).giftEmail || ''}
                                                                    onChange={e => setBookData(prev => ({ ...prev, giftEmail: e.target.value }))}
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="block text-xs font-bold text-indigo-400 mb-1">WhatsApp</label>
                                                                <input
                                                                    className="w-full bg-slate-900/80 border-indigo-500/30 border rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-indigo-400 outline-none"
                                                                    placeholder="(11) 99999-9999"
                                                                    value={(bookData as any).giftPhone || ''}
                                                                    onChange={e => setBookData(prev => ({ ...prev, giftPhone: e.target.value }))}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* --- GIFT SECTION: VOUCHER (Credit) --- */}
                                            <div className="bg-gradient-to-br from-emerald-900/30 to-emerald-800/20 p-6 rounded-2xl border border-emerald-500/30 space-y-4 hover:border-emerald-400/50 transition-all">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-1">
                                                            <span>🎟️</span> COMPRAR VALE-PRESENTE (VOUCHER)
                                                        </h3>
                                                        <p className="text-xs text-emerald-200/70">
                                                            Você compra um crédito agora e recebe um LINK especial. Você envia esse link para a pessoa e ela mesma cria o livro quando quiser.
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Voucher Buyer Form */}
                                                <div className="bg-emerald-950/40 p-5 rounded-xl border border-emerald-500/20 mt-2 space-y-3">
                                                    <p className="text-xs font-bold text-emerald-400 uppercase border-b border-emerald-500/20 pb-2">Seus Dados (Comprador)</p>

                                                    <div>
                                                        <input
                                                            className="w-full bg-slate-900/80 border-emerald-500/30 border rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-emerald-400 outline-none"
                                                            placeholder="Seu Nome Completo"
                                                            value={formData.name}
                                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <input
                                                            className="w-full bg-slate-900/80 border-emerald-500/30 border rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-emerald-400 outline-none"
                                                            placeholder="Seu E-mail"
                                                            value={formData.email}
                                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                        />
                                                        <input
                                                            className="w-full bg-slate-900/80 border-emerald-500/30 border rounded-lg p-3 text-white text-sm focus:ring-1 focus:ring-emerald-400 outline-none"
                                                            placeholder="Seu WhatsApp"
                                                            value={formData.phone}
                                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                        />
                                                    </div>

                                                    {/* --- LGPD CONSENT & ACTION (VOUCHER) --- */}
                                                    <div className="space-y-4 pt-2 relative">
                                                        {!(formData as any).lgpdConsent && (
                                                            <div className="absolute -top-5 left-1 flex items-center gap-1 animate-bounce pointer-events-none z-10">
                                                                <span className="text-xl drop-shadow-lg filter">👇</span>
                                                                <span className="text-[10px] font-bold text-emerald-400 bg-slate-900/90 px-2 py-0.5 rounded shadow-lg border border-emerald-500/30">
                                                                    ACEITE AQUI
                                                                </span>
                                                            </div>
                                                        )}
                                                        <label className={`flex items-start gap-3 px-2 cursor-pointer rounded transition-all duration-300 ${!(formData as any).lgpdConsent ? 'bg-emerald-900/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] py-2' : 'hover:bg-emerald-900/10'}`}>
                                                            <input
                                                                type="checkbox"
                                                                className="mt-1 w-4 h-4 rounded border-emerald-600 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
                                                                checked={(formData as any).lgpdConsent || false}
                                                                onChange={e => setFormData({ ...formData, lgpdConsent: e.target.checked } as any)}
                                                            />
                                                            <span className="text-[10px] text-emerald-200/80 leading-tight select-none">
                                                                Concordo com os <a href="#" className="underline hover:text-white">Termos</a> e <a href="#" className="underline hover:text-white">Políticas</a> e aceito receber comunicações promocionais e atualizações.
                                                            </span>
                                                        </label>

                                                        <button
                                                            className="w-full px-4 py-4 rounded-xl font-bold text-sm uppercase tracking-wider bg-emerald-600/90 hover:bg-emerald-500 text-white transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 hover:scale-[1.02] disabled:opacity-50 disabled:grayscale"
                                                            onClick={async () => {
                                                                if (!formData.name || !formData.email || !formData.phone) {
                                                                    alert("Por favor, preencha seus dados (Nome, Email, WhatsApp) para receber o voucher.");
                                                                    return;
                                                                }
                                                                if (!(formData as any).lgpdConsent) {
                                                                    alert("É necessário aceitar os termos e consentir com as comunicações para prosseguir.");
                                                                    return;
                                                                }
                                                                setFormData(prev => ({ ...prev, type: 'VOUCHER' }));
                                                                await handleSaveLead('VOUCHER');
                                                                setStep(3); // Start processing/paywall for voucher
                                                            }}
                                                            disabled={!(formData as any).lgpdConsent}
                                                        >
                                                            <span>💳</span> FECHAR COMPRA DO VOUCHER
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* --- LGPD CONSENT & ACTION --- */}
                                            <div className="space-y-4 pt-2 relative">
                                                {!(formData as any).lgpdConsent && (
                                                    <div className="absolute -top-6 left-2 flex items-center gap-2 animate-bounce pointer-events-none z-10">
                                                        <span className="text-2xl drop-shadow-lg filter">👇</span>
                                                        <span className="text-xs font-bold text-yellow-400 bg-slate-900/80 px-2 py-1 rounded shadow-lg border border-yellow-500/30">
                                                            CLIQUE AQUI
                                                        </span>
                                                    </div>
                                                )}
                                                <label className={`flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${!(formData as any).lgpdConsent ? 'border-yellow-500/50 bg-yellow-500/5 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'border-slate-700/50 bg-slate-800/30'}`}>
                                                    <input
                                                        type="checkbox"
                                                        className="mt-1 w-5 h-5 rounded border-slate-600 bg-slate-900 text-yellow-500 focus:ring-yellow-500/50 cursor-pointer"
                                                        checked={(formData as any).lgpdConsent || false}
                                                        onChange={e => setFormData({ ...formData, lgpdConsent: e.target.checked } as any)}
                                                    />
                                                    <span className="text-xs text-slate-400 leading-relaxed select-none">
                                                        Concordo com os <a href="#" className="underline hover:text-white">Termos de Uso</a> e <a href="#" className="underline hover:text-white">Política de Privacidade</a>.
                                                        Estou ciente e concordo em receber comunicações da Editora 360 Express, incluindo ofertas exclusivas, premiações, atualizações de produtos e materiais de marketing via e-mail ou WhatsApp.
                                                        <br />
                                                        <span className="text-[10px] opacity-70 block mt-1">* Seus dados estão seguros e você pode cancelar a inscrição a qualquer momento.</span>
                                                    </span>
                                                </label>

                                                <button
                                                    onClick={async () => {
                                                        if (!formData.name || !formData.email || !formData.phone || !bookData.authorName || !bookData.topic) {
                                                            alert("Por favor, preencha todos os campos obrigatórios.");
                                                            return;
                                                        }
                                                        if (!(formData as any).lgpdConsent) {
                                                            alert("É necessário aceitar os termos e consentir com as comunicações para prosseguir.");
                                                            return;
                                                        }
                                                        await handleSaveLead();
                                                        setStep(2); // Go to Processing
                                                    }}
                                                    disabled={!formData.name || !formData.email || !formData.phone || !bookData.authorName || !bookData.topic || !(formData as any).lgpdConsent}
                                                    className="w-full bg-gradient-to-r from-[#eab308] to-[#facc15] hover:from-[#facc15] hover:to-[#fde047] text-slate-900 font-bold py-5 rounded-xl text-xl shadow-lg shadow-yellow-500/20 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none flex items-center justify-center gap-3"
                                                >
                                                    <Zap className="w-6 h-6 fill-current" />
                                                    INICIAR FABRICAÇÃO DO LIVRO
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STEP 3: PROCESSING (Existing) */}
                                {step === 2 && (
                                    <div className="text-center space-y-8 animate-fade-in">
                                        {/* ... existing spinner ... */}
                                        <div className="relative w-32 h-32 mx-auto">
                                            <div className="absolute inset-0 border-4 border-slate-700 rounded-full"></div>
                                            <div className="absolute inset-0 border-4 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Zap className="w-10 h-10 text-yellow-400 fill-current animate-pulse" />
                                            </div>
                                        </div>
                                        <div className="h-16">
                                            <p className="text-xl font-medium text-slate-300 animate-fade-in" key={processingStage}>{processingMessages[processingStage]}</p>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 max-w-xs mx-auto overflow-hidden">
                                            <div className="h-full bg-yellow-400 transition-all ease-linear" style={{ width: '95%', transitionDuration: '10000ms' }} />
                                        </div>
                                    </div>
                                )}

                                {/* STEP 4: PAYWALL OR REDEMPTION */}
                                {step === 3 && (
                                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl relative overflow-hidden animate-fade-in">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-500 to-yellow-300"></div>

                                        {/* MODE: REDEEMING VOUCHER */}
                                        {giftSourceEmail ? (
                                            <div className="text-center mb-8">
                                                <div className="inline-block p-4 bg-green-500/10 rounded-full mb-4">
                                                    <span className="text-4xl">🎁</span>
                                                </div>
                                                <h2 className="text-2xl font-bold text-white mb-2">RESGATAR SEU LIVRO DE PRESENTE</h2>
                                                <p className="text-slate-400 text-sm mt-4">
                                                    Você recebeu um crédito de <b>{giftSourceEmail}</b>.<br />
                                                    Utilize agora para gerar seu Best Seller sem custos.
                                                </p>

                                                <div className="mt-8">
                                                    {voucherCredits > 0 ? (
                                                        <button
                                                            onClick={async () => {
                                                                // Consume credit from SOURCE
                                                                const consumeRes = await fetch(`/api/payment/use`, {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ email: giftSourceEmail })
                                                                });
                                                                if (consumeRes.ok) {
                                                                    onStart(formData, bookData);
                                                                } else {
                                                                    alert("Erro ao validar crédito do presente. Tente novamente.");
                                                                }
                                                            }}
                                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            <Zap className="w-5 h-5 fill-current" />
                                                            RESGATAR E GERAR AGORA
                                                        </button>
                                                    ) : (
                                                        <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/30 flex flex-col items-center gap-3">
                                                            <span>Poxa! O crédito deste link já foi utilizado ou expirou.</span>
                                                            <button
                                                                onClick={() => { setGiftSourceEmail(null); setStep(0); }}
                                                                className="text-white bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600 transition font-bold text-xs"
                                                            >
                                                                Continuar com meu Plano / Comprar
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            // MODE: PAYING (Self or Voucher Purchase)
                                            <>
                                                <div className="text-center mb-8">
                                                    <div className="inline-block p-4 bg-yellow-500/10 rounded-full mb-4">
                                                        <Lock className="w-10 h-10 text-yellow-400" />
                                                    </div>
                                                    <h2 className="text-2xl font-bold text-white mb-2">
                                                        {formData.type === 'VOUCHER' ? 'FINALIZAR COMPRA DO VALE-PRESENTE' : (activeDiscount > 0 ? `${activeDiscount}% DE DESCONTO APLICADO!` : 'TUDO PRONTO PARA INICIAR')}
                                                    </h2>
                                                    <p className="text-slate-400 text-sm mt-4">
                                                        {formData.type === 'VOUCHER'
                                                            ? 'Após o pagamento, você receberá o link exclusivo para enviar.'
                                                            : 'Para liberar a utilização da nossa API OFICIAL e gerar o conteúdo, efetue a taxa única.'}
                                                    </p>
                                                </div>

                                                {(() => {
                                                    const isVoucher = formData.type === 'VOUCHER';

                                                    // Get standard values
                                                    let displayPrice = fetchedPrice || 39.90;
                                                    let finalLink = (window as any).checkoutUrl || 'https://pay.kiwify.com.br/QPTslcx';
                                                    const discountLevel = (window as any).discountLevel || 1;

                                                    // FORCE CORRECT LEVEL 1 PRICE IF USER HAS PLAN BUT PRICE IS GENERIC
                                                    // This fixes the issue where a Starter User sees 39.90 instead of 24.90 on Level 1
                                                    const plan = (window as any).currentUserPlan || selectedPlan;

                                                    // PRICE CALCULATION
                                                    if (!isVoucher && plan && displayPrice === 39.90) {
                                                        const pName = plan.name?.toUpperCase();
                                                        const billing = plan.billing?.toLowerCase() || 'monthly'; // Force monthly default

                                                        // Fallback Prices for Level 1 based on known config
                                                        if (pName === 'STARTER') {
                                                            if (billing === 'annual') {
                                                                displayPrice = 24.90;
                                                                finalLink = 'https://pay.kiwify.com.br/SpCDp2q';
                                                            } else {
                                                                displayPrice = 26.90;
                                                                finalLink = 'https://pay.kiwify.com.br/g1L85dO';
                                                            }
                                                        }
                                                        if (pName === 'PRO') {
                                                            if (billing === 'annual') {
                                                                displayPrice = 19.90;
                                                                finalLink = 'https://pay.kiwify.com.br/pH8lSvE';
                                                            } else {
                                                                displayPrice = 21.90;
                                                                finalLink = 'https://pay.kiwify.com.br/dEoi760';
                                                            }
                                                        }
                                                        if (pName === 'BLACK') {
                                                            if (billing === 'annual') {
                                                                displayPrice = 14.90;
                                                                finalLink = 'https://pay.kiwify.com.br/ottQN4o';
                                                            } else {
                                                                displayPrice = 16.90;
                                                                finalLink = 'https://pay.kiwify.com.br/Cg59pjZ';
                                                            }
                                                        }
                                                    }

                                                    // Enforce Voucher Rules
                                                    if (isVoucher) {
                                                        displayPrice = 39.90;
                                                        finalLink = 'https://pay.kiwify.com.br/QPTslcx';
                                                    }

                                                    const finalPriceStr = displayPrice.toFixed(2).replace('.', ',');

                                                    // --- SUBSCRIPTION ENFORCEMENT LOGIC ---
                                                    const realPlan = (window as any).currentUserPlan; // Backend Plan

                                                    // GET CHOSEN PLAN (State OR Storage OR Backend Global)
                                                    let chosenPlan = selectedPlan;
                                                    if (!chosenPlan && typeof window !== 'undefined') {
                                                        try { chosenPlan = JSON.parse(localStorage.getItem('selectedPlan_v3') || 'null'); } catch (e) { }
                                                    }
                                                    if (!chosenPlan && (window as any).currentUserPendingPlan) {
                                                        chosenPlan = (window as any).currentUserPendingPlan;
                                                    }

                                                    // STRICT CHECK: If user selected a plan, they MUST have it Active.
                                                    // If db is empty, realPlan is null.
                                                    const userHasActivePlan = realPlan && realPlan.status === 'ACTIVE';

                                                    const needToPaySubscription = (!!chosenPlan && !userHasActivePlan) && !isVoucher && !paymentConfirmed;

                                                    // --- PLAN VARIABLES CALCULATION (Pre-calc for reuse) ---
                                                    let subLink = '';
                                                    let subPrice = '0,00';
                                                    let pName = '';
                                                    let billing = '';

                                                    if (chosenPlan) {
                                                        pName = chosenPlan.name?.toUpperCase() || '';
                                                        billing = chosenPlan.billing?.toLowerCase() || '';

                                                        // HARDCODED SUBSCRIPTION LINKS (From PricingSection)
                                                        if (pName === 'STARTER') {
                                                            if (billing === 'annual') { subLink = 'https://pay.kiwify.com.br/47E9CXl'; subPrice = '118,80'; }
                                                            else { subLink = 'https://pay.kiwify.com.br/kfR54ZJ'; subPrice = '19,90'; }
                                                        } else if (pName === 'PRO') {
                                                            if (billing === 'annual') { subLink = 'https://pay.kiwify.com.br/jXQTsFm'; subPrice = '238,80'; }
                                                            else { subLink = 'https://pay.kiwify.com.br/Bls6OL7'; subPrice = '34,90'; }
                                                        } else if (pName === 'BLACK') {
                                                            if (billing === 'annual') { subLink = 'https://pay.kiwify.com.br/hSv5tYq'; subPrice = '358,80'; }
                                                            else { subLink = 'https://pay.kiwify.com.br/7UgxJ0f'; subPrice = '49,90'; }
                                                        }
                                                    }

                                                    if (needToPaySubscription) {
                                                        const TEST_USER_DATA = {
                                                            name: "Leonildo Bevilaqua da Silva",
                                                            email: "contato@leonildobevilaqua.com.br",
                                                            cpf: "272.077.588-63",
                                                            phone: "+5511994781486",
                                                            cardLast4: "4242"
                                                        };

                                                        return (
                                                            <div className="space-y-4">
                                                                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                                                    <div className="flex">
                                                                        <div className="flex-shrink-0">
                                                                            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                            </svg>
                                                                        </div>
                                                                        <div className="ml-3">
                                                                            <p className="text-sm text-yellow-700">
                                                                                Você selecionou o plano <strong>{pName}</strong>. Para liberar o valor
                                                                                {(window as any).discountLevel > 1 ? " com desconto progressivo" : " exclusivo de assinante"} (R$ {finalPriceStr}), primeiro ative sua assinatura.
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {/* STEP 1: OPEN CHECKOUT */}
                                                                <button
                                                                    onClick={() => window.open(subLink, '_blank')}
                                                                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all transform hover:-translate-y-1 block text-center"
                                                                >
                                                                    1. ATIVAR ASSINATURA (R$ {subPrice})
                                                                </button>

                                                                <div className="my-2 border-t border-slate-700/50"></div>

                                                                {/* STEP 2: SIMULATE CONFIRMATION */}
                                                                <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30">
                                                                    <p className="text-xs text-indigo-300 font-bold mb-2 text-center uppercase">Ambiente de Testes / Simulação</p>
                                                                    <p className="text-xs text-slate-400 mb-3 text-center">Após efetuar o pagamento na Kiwify (ou para simular), clique abaixo:</p>

                                                                    <button
                                                                        onClick={async () => {
                                                                            if (confirm(`SIMULAR PAGAMENTO DA ASSINATURA?\n\nSerá enviado para o Admin os dados:\nNome: ${formData.name}\nEmail: ${formData.email}\nPlano: ${pName} (${billing})`)) {
                                                                                // Robust URL Resolution Strategy (Matches Admin.tsx)
                                                                                const getApiBase = () => {
                                                                                    const env = (import.meta as any).env.VITE_API_URL;
                                                                                    if (env) return env;
                                                                                    const custom = localStorage.getItem('admin_api_url');
                                                                                    if (custom) return custom.trim();
                                                                                    const host = window.location.hostname;
                                                                                    if (host === 'localhost' || host === '127.0.0.1') return '';
                                                                                    return window.location.origin;
                                                                                };

                                                                                let baseUrl = getApiBase();
                                                                                if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
                                                                                const url = `${baseUrl}/api/payment/simulate-webhook`;

                                                                                try {
                                                                                    const res = await fetch(url, {
                                                                                        method: 'POST',
                                                                                        headers: { 'Content-Type': 'application/json' },
                                                                                        body: JSON.stringify({
                                                                                            plan: pName,
                                                                                            billing: billing,
                                                                                            user: {
                                                                                                name: formData.name,
                                                                                                email: formData.email,
                                                                                                phone: formData.phone,
                                                                                                cpf: "123.456.789-00 (Simulado)",
                                                                                                cardLast4: "4242"
                                                                                            }
                                                                                        })
                                                                                    });

                                                                                    if (res.ok) {
                                                                                        // Auto-Login and trigger Welcome Modal
                                                                                        localStorage.setItem('bsf_plan_just_activated', 'true');
                                                                                        onStart({
                                                                                            name: formData.name,
                                                                                            email: formData.email,
                                                                                            phone: formData.phone
                                                                                        }, bookData); // Pass bookData to persist topic info
                                                                                    } else {
                                                                                        const txt = await res.text();
                                                                                        alert(`❌ Erro no Servidor (${res.status}):\n${txt}`);
                                                                                    }
                                                                                } catch (err: any) {
                                                                                    alert(`❌ Erro de Conexão:\n\nTentativa em: ${url}\nErro: ${err.message}\n\nVerifique se o backend está rodando e acessível.`);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="w-full bg-green-600/80 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-sm shadow transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <span>✅</span> 2. CONFIRMAR QUE JÁ PAGUEI A ASSINATURA
                                                                    </button>
                                                                </div>

                                                                <div className="text-xs text-slate-500 text-center mt-2">
                                                                    Email monitorado: <span className="text-yellow-500 font-mono">{formData.email}</span>
                                                                    {paymentConfirmed ? <span className="text-green-500 ml-2 font-bold">✅ Aprovado</span> : <span className="text-red-500 ml-2">⏳ Aguardando</span>}
                                                                </div>
                                                                <p className="text-center text-gray-500 text-xs mt-1">
                                                                    Aguardando confirmação...
                                                                </p>
                                                            </div>
                                                        );
                                                    }

                                                    {/* IIFE FOR STEP 3 UI RENDERING */ }
                                                    if (paymentConfirmed) {
                                                        return (
                                                            <div className="w-full bg-emerald-900/20 border border-emerald-500/50 p-6 rounded-xl animate-pulse text-center">
                                                                <div className="flex justify-center mb-4">
                                                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                                </div>
                                                                <h3 className="text-xl font-bold text-emerald-400 mb-2">PAGAMENTO CONFIRMADO!</h3>
                                                                <p className="text-emerald-200">Iniciando a produção do seu livro automaticamente...</p>
                                                            </div>
                                                        );
                                                    }

                                                    if (needToPaySubscription && chosenPlan) {
                                                        return (
                                                            <div className="space-y-6 animate-fade-in">
                                                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 text-center">
                                                                    <p className="text-sm text-slate-300 mb-3">
                                                                        Se você ainda não efetuou o pagamento da Assinatura que escolheu, clique no botão abaixo para finalizar o processo.
                                                                    </p>
                                                                    <button
                                                                        onClick={() => window.open(subLink, '_blank')}
                                                                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg text-sm shadow mb-3 transition-all border border-slate-600"
                                                                    >
                                                                        Efetuar o pagamento da Assinatura
                                                                    </button>
                                                                    <p className="text-xs text-yellow-500/80">
                                                                        💡 Com o pagamento da assinatura você <strong>DESBLOQUERÁ</strong> os benefícios do plano escolhido e descontos futuros.
                                                                    </p>
                                                                </div>
                                                                <div>
                                                                    <button
                                                                        onClick={() => window.open(finalLink, '_blank')}
                                                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-1 block text-center"
                                                                    >
                                                                        {!isVoucher && discountLevel > 1 && <span className="block text-xs opacity-80 animate-pulse">🎉 DESCONTO NÍVEL {discountLevel} APLICADO!</span>}
                                                                        PAGAR R$ {finalPriceStr} E LIBERAR (TAXA ÚNICA)
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <button
                                                            onClick={() => window.open(finalLink, '_blank')}
                                                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg hover:shadow-green-500/20 transition-all transform hover:-translate-y-1 block text-center"
                                                        >
                                                            {!isVoucher && discountLevel > 1 && <span className="block text-xs opacity-80 animate-pulse">🎉 DESCONTO NÍVEL {discountLevel} APLICADO!</span>}
                                                            PAGAR R$ {finalPriceStr} E LIBERAR (TAXA ÚNICA)
                                                        </button>
                                                    );
                                                })()}

                                                {
                                                    !paymentConfirmed && (
                                                        <p className="text-center text-xs text-slate-500 mt-4 animate-pulse">
                                                            Aguardando confirmação de pagamento...
                                                        </p>
                                                    )
                                                }
                                            </>
                                        )}
                                    </div>
                                )}



                                {/* STEP 5: DIAGRAMMING PROCESS */}
                                {step === 5 && (
                                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl animate-fade-in w-full max-w-2xl">
                                        <div className="text-center mb-8">
                                            <div className="inline-block p-4 bg-indigo-500/10 rounded-full mb-4">
                                                <FileText className="w-10 h-10 text-indigo-400 animate-pulse" />
                                            </div>
                                            <h2 className="text-2xl font-bold text-white mb-2">Diagramando Seu Livro</h2>
                                            <p className="text-slate-400 text-sm">
                                                Aguarde enquanto nossa I.A. processa seu arquivo...
                                            </p>
                                        </div>

                                        <div className="space-y-6 max-w-lg mx-auto">
                                            {diagramMessages.map((msg, idx) => (
                                                <div key={idx} className={`flex items-center gap-4 transition-all duration-500 ${idx > diagramStep ? 'opacity-30' : 'opacity-100'}`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 
                                                        ${idx < diagramStep ? 'bg-green-500 border-green-500 text-slate-900' :
                                                            idx === diagramStep ? 'border-yellow-400 text-yellow-400 animate-spin-slow' : 'border-slate-600 text-slate-600'}`}>
                                                        {idx < diagramStep ? <Check className="w-5 h-5" /> :
                                                            idx === diagramStep ? <Zap className="w-4 h-4 fill-current" /> :
                                                                <span className="text-xs">{idx + 1}</span>}
                                                    </div>
                                                    <span className={`text-sm md:text-lg font-medium ${idx === diagramStep ? 'text-yellow-400' : idx < diagramStep ? 'text-green-400' : 'text-slate-500'}`}>
                                                        {msg}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {diagramStep === diagramMessages.length - 1 && (
                                            <div className="mt-10 text-center animate-fade-in-up">
                                                <button
                                                    onClick={() => {
                                                        window.open(`/api/admin/books/${formData.email}`, '_blank');
                                                        setIsRewardModalOpen(true);
                                                    }}
                                                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-500/20 text-xl flex items-center justify-center gap-3 w-full animate-bounce"
                                                >
                                                    <span>⬇️</span>
                                                    BAIXAR LIVRO DIAGRAMADO
                                                </button>
                                                <p className="text-slate-500 text-xs mt-4">Enviamos também uma cópia para seu e-mail.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl animate-fade-in text-center">
                                        <div className="inline-block p-4 bg-green-500/10 rounded-full mb-6">
                                            <CheckCircle className="w-16 h-16 text-green-400" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white mb-2">Vale-Presente Ativo!</h2>
                                        <p className="text-slate-400 mb-8">
                                            Seu crédito foi confirmado e está válido por <b>30 dias</b>.
                                        </p>

                                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 mb-8 text-left">
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Link para Enviar ao Presenteado:</label>
                                            <div className="flex gap-2">
                                                <input
                                                    readOnly
                                                    value={`${window.location.host}/?gift_code=${btoa(formData.email)}`}
                                                    className="w-full bg-slate-800 text-yellow-400 font-mono text-sm p-3 rounded border border-slate-600 outline-none"
                                                />
                                                <button
                                                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 rounded font-bold"
                                                    onClick={() => navigator.clipboard.writeText(`${window.location.host}/?gift_code=${btoa(formData.email)}`)}
                                                >
                                                    Copiar
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                * Encaminhe este link para a pessoa. Ela poderá gerar o livro sem pagar nada.
                                            </p>
                                        </div>

                                        <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-white underline">
                                            Voltar ao Início
                                        </button>
                                    </div>
                                )}


                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* --- HERO SECTION --- */}
            <main className="pt-32 pb-20 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="animate-fade-in-up">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-sm font-bold mb-8">
                            <Star className="w-4 h-4 fill-current" />
                            <span>Tecnologia de I.A. Avançada</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight">
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all duration-500 ease-in-out">
                                {rotatingWord}
                            </span> {translations[lang].heroTitle}
                            <span className="block mt-3 text-yellow-400 whitespace-nowrap">{translations[lang].heroSubtitle}</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-3xl mx-auto leading-relaxed whitespace-pre-line">
                            {translations[lang].heroDesc}
                        </p>
                        <button
                            onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-lg md:text-xl font-bold px-10 py-5 rounded-full shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/40 transition-all transform hover:-translate-y-1 flex items-center gap-3 mx-auto"
                        >
                            {translations[lang].heroButton}
                            <Zap className="w-6 h-6 fill-current" />
                        </button>
                    </div>
                </div>
            </main>

            {/* --- PROBLEM SECTION --- */}
            <section className="py-20 bg-slate-800/50 border-y border-slate-800">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 whitespace-pre-line">{translations[lang].problemTitle}</h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8">
                        {translations[lang].problems.map((item: string, i: number) => (
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
                        <span className="text-yellow-400 font-bold tracking-widest uppercase text-sm">{translations[lang].solutionTitle}</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-6">{translations[lang].solutionSubtitle}</h2>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">{translations[lang].solutionDesc}</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {translations[lang].solutionCards && translations[lang].solutionCards.map((card: any, i: number) => {
                            const Icon = card.icon || Star;
                            return (
                                <div key={i} className="bg-slate-800 p-8 rounded-2xl border border-slate-700 hover:border-yellow-500/50 transition-all hover:-translate-y-2">
                                    <Icon className="w-12 h-12 text-yellow-400 mb-6" />
                                    <h3 className="text-xl font-bold mb-3">{card.title}</h3>
                                    <p className="text-slate-400 leading-relaxed text-sm whitespace-pre-line">{card.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* --- HOW IT WORKS --- */}
            <section className="py-20 bg-slate-800/30">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid md:grid-cols-4 gap-8 text-center relative">
                        {translations[lang].howItWorks.map((s: any, i: number) => (
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

            {/* --- PRICING SECTION --- */}
            <PricingSection onSelectPlan={startWizard} lang={lang} />

            {/* --- OFFER SECTION --- */}
            <section className="py-20" id="oferta">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <div className="text-emerald-500 font-bold tracking-widest uppercase mb-4 text-xl md:text-2xl">
                            {t[lang].landing.singleGeneration}
                        </div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">{translations[lang].offerTitle}</h2>
                        <p className="text-xl text-slate-400">{translations[lang].offerSubtitle}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {/* Option 1: Generate Now */}
                        <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-3xl p-8 md:p-12 text-center shadow-2xl shadow-yellow-500/20 text-slate-900 transform hover:scale-[1.02] transition-transform relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10 pointer-events-none"></div>
                            <div className="relative z-10">
                                <h3 className="text-3xl font-bold mb-2">{translations[lang].generateNow}</h3>
                                <p className="font-medium opacity-90 mb-8 text-lg">{translations[lang].generateDesc}</p>
                                <div className="text-6xl font-black mb-8 tracking-tighter">R$ 39,90</div>
                                <button
                                    onClick={() => startWizard()}
                                    className="w-full bg-slate-900 text-white text-lg font-bold px-8 py-4 rounded-full shadow-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                                >
                                    <Zap className="w-5 h-5 fill-current text-yellow-500" />
                                    {translations[lang].heroButton}
                                </button>
                                <p className="text-xs mt-4 opacity-70 font-medium">{translations[lang].delivery}</p>
                            </div>
                        </div>

                        {/* Option 2: Buy Voucher */}
                        <div className="bg-slate-800 border-2 border-slate-700 rounded-3xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden group hover:border-green-500/50 transition-colors">
                            <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-bl-xl uppercase tracking-widest shadow-lg">{translations[lang].giftLabel}</div>

                            <h3 className="text-3xl font-bold mb-2 text-white">{translations[lang].buyVoucher}</h3>
                            <p className="text-slate-400 mb-8 text-lg">{translations[lang].voucherDesc}</p>

                            <div className="text-6xl font-black text-white mb-8 tracking-tighter">R$ 39,90</div>

                            <button
                                onClick={() => startWizard()}
                                className="w-full bg-green-600 hover:bg-green-500 text-white text-lg font-bold px-8 py-4 rounded-full shadow-xl transition-all flex items-center justify-center gap-2"
                            >
                                <span>🎟️</span>
                                {translations[lang].buyGift}
                            </button>
                            <p className="text-xs text-slate-500 mt-4 font-medium">{translations[lang].voucherLinkInfo}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- UPLOAD SECTION (HIDDEN TEMPORARILY) ---
            <section className="py-20 bg-slate-900 border-t border-slate-800">
                <div className="max-w-4xl mx-auto px-6 text-center">
                    <div className="bg-slate-800 rounded-3xl p-10 border border-slate-700 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10">
                            <span className="text-yellow-400 font-bold tracking-widest uppercase text-sm">PARA QUEM JÁ TEM CONTEÚDO</span>
                            <h2 className="text-3xl md:text-4xl font-bold mt-2 mb-6 text-white">Já escreveu seu livro?</h2>
                            <p className="text-xl text-slate-400 mb-8 max-w-2xl mx-auto">
                                Se você já tem o texto pronto (Word ou PDF) mas precisa de uma diagramação profissional no padrão Best Seller, nós fazemos isso por você.
                            </p>
                            <button
                                onClick={() => setIsUploadModalOpen(true)}
                                className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-4 px-8 rounded-full shadow-lg transition-all flex items-center justify-center gap-3 mx-auto"
                            >
                                <FileText className="w-5 h-5" />
                                QUERO DIAGRAMAR MEU LIVRO (R$ 24,99)
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            */}

            {/* --- UPLOAD MODAL --- */}
            {
                isUploadModalOpen && (
                    <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
                        <div className="bg-slate-900 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl p-8 relative">
                            <button onClick={() => setIsUploadModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
                                <X className="w-6 h-6" />
                            </button>
                            <h2 className="text-2xl font-bold text-white mb-2">Diagramação Express</h2>
                            <p className="text-slate-400 text-sm mb-6">Envie seu arquivo (.docx ou .txt). Após o pagamento, você receberá o livro diagramado.</p>

                            <div className="space-y-4">
                                <input
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-1 focus:ring-yellow-500"
                                    placeholder="Seu Nome"
                                    value={uploadData.name}
                                    onChange={e => setUploadData({ ...uploadData, name: e.target.value })}
                                />
                                <input
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-1 focus:ring-yellow-500"
                                    placeholder="Seu E-mail"
                                    value={uploadData.email}
                                    onChange={e => setUploadData({ ...uploadData, email: e.target.value })}
                                />
                                <input
                                    className="w-full bg-slate-800 border-slate-700 rounded-lg p-3 text-white outline-none focus:ring-1 focus:ring-yellow-500"
                                    placeholder="Seu WhatsApp"
                                    value={uploadData.phone}
                                    onChange={e => setUploadData({ ...uploadData, phone: e.target.value })}
                                />
                                <div className="border border-dashed border-slate-600 rounded-lg p-6 text-center cursor-pointer hover:bg-slate-800/50 relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={e => e.target.files && setUploadData({ ...uploadData, file: e.target.files[0] })}
                                        accept=".docx,.txt"
                                    />
                                    <FileText className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">{uploadData.file ? uploadData.file.name : "Clique para selecionar arquivo"}</p>
                                </div>

                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-4 rounded-xl shadow-lg transition-all"
                                >
                                    {uploading ? "Enviando..." : "ENVIAR E PAGAR"}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
            <section className="py-20 bg-slate-800/50">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-center mb-12">{translations[lang].faqTitle}</h2>
                    <div className="space-y-4">
                        {translations[lang].faq.map((item: any, i: number) => (
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

            {/* --- UPSELL SERVICES --- */}
            <section className="py-20 border-t border-slate-800 bg-slate-900/50">
                <div className="max-w-6xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-yellow-400 font-bold tracking-widest uppercase text-sm">{t[lang].upsell.tag}</span>
                        <h2 className="text-3xl md:text-5xl font-bold mt-2 mb-4">{t[lang].upsell.title}</h2>
                        <p className="text-xl text-slate-400 max-w-3xl mx-auto">{t[lang].upsell.subtitle}</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Translations */}
                        {products.english_book && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-indigo-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-indigo-400">{t[lang].upsell.items.english.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.english.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 24,99</span>
                                    <a href={products.english_book} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.english.button}</a>
                                </div>
                            </div>
                        )}
                        {products.spanish_book && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-indigo-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-indigo-400">{t[lang].upsell.items.spanish.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.spanish.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 24,99</span>
                                    <a href={products.spanish_book} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-indigo-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.spanish.button}</a>
                                </div>
                            </div>
                        )}

                        {/* Covers */}
                        {products.cover_printed && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-yellow-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-yellow-400">{t[lang].upsell.items.coverPrinted.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.coverPrinted.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 250,00</span>
                                    <a href={products.cover_printed} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-yellow-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.coverPrinted.button}</a>
                                </div>
                            </div>
                        )}
                        {products.cover_ebook && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-yellow-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-yellow-400">{t[lang].upsell.items.coverEbook.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.coverEbook.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 149,90</span>
                                    <a href={products.cover_ebook} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-yellow-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.coverEbook.button}</a>
                                </div>
                            </div>
                        )}

                        {/* Publications */}
                        {products.pub_amazon_printed && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-green-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-green-400">{t[lang].upsell.items.amazonPrinted.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.amazonPrinted.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 69,90</span>
                                    <a href={products.pub_amazon_printed} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.amazonPrinted.button}</a>
                                </div>
                            </div>
                        )}
                        {products.pub_amazon_digital && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-green-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-green-400">{t[lang].upsell.items.amazonDigital.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.amazonDigital.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 59,90</span>
                                    <a href={products.pub_amazon_digital} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.amazonDigital.button}</a>
                                </div>
                            </div>
                        )}
                        {products.pub_uiclap && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-green-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-green-400">{t[lang].upsell.items.uiclap.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.uiclap.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 59,90</span>
                                    <a href={products.pub_uiclap} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-green-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.uiclap.button}</a>
                                </div>
                            </div>
                        )}

                        {/* Legal */}
                        {products.catalog_card && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-blue-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-blue-400">{t[lang].upsell.items.catalog.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.catalog.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 59,90</span>
                                    <a href={products.catalog_card} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.catalog.button}</a>
                                </div>
                            </div>
                        )}
                        {products.isbn_printed && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-blue-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-blue-400">{t[lang].upsell.items.isbn.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.isbn.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 49,90</span>
                                    <a href={products.isbn_printed} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-blue-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.isbn.button}</a>
                                </div>
                            </div>
                        )}

                        {/* Others */}
                        {products.sales_page && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-pink-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-pink-400">{t[lang].upsell.items.salesPage.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.salesPage.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 349,90</span>
                                    <a href={products.sales_page} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-pink-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.salesPage.button}</a>
                                </div>
                            </div>
                        )}
                        {products.hosting && (
                            <div className="bg-slate-800 border border-slate-700 p-6 rounded-xl hover:border-pink-500/50 transition group">
                                <h3 className="font-bold text-lg mb-2 text-white group-hover:text-pink-400">{t[lang].upsell.items.hosting.title}</h3>
                                <p className="text-sm text-slate-400 mb-4 h-10">{t[lang].upsell.items.hosting.desc}</p>
                                <div className="flex justify-between items-center mt-auto">
                                    <span className="text-xl font-bold text-white">R$ 499,90</span>
                                    <a href={products.hosting} target="_blank" className="px-4 py-2 bg-slate-700 hover:bg-pink-600 text-white rounded-lg font-bold text-sm transition-colors">{t[lang].upsell.items.hosting.button}</a>
                                </div>
                            </div>
                        )}

                        {/* Complete Package */}
                        {products.complete_package && (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-yellow-600 to-yellow-500 text-slate-900 p-8 rounded-2xl relative overflow-hidden shadow-2xl transform hover:scale-[1.01] transition-all">
                                <div className="absolute top-0 right-0 bg-slate-900 text-yellow-400 text-xs font-bold px-4 py-2 rounded-bl-xl uppercase tracking-widest">{t[lang].upsell.items.package.badge}</div>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="text-left">
                                        <h3 className="text-3xl font-black mb-2">{t[lang].upsell.items.package.title}</h3>
                                        <p className="font-medium text-slate-800 mb-4 max-w-xl">{t[lang].upsell.items.package.desc}</p>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-5 h-5 fill-current text-slate-900" />)}
                                        </div>
                                    </div>
                                    <div className="text-center md:text-right min-w-[200px]">
                                        <div className="text-sm opacity-80 line-through font-bold">{t[lang].upsell.items.package.from} R$ 899,90</div>
                                        <div className="text-5xl font-black leading-none mb-4">R$ 599,90</div>
                                        <a href={products.complete_package} target="_blank" className="inline-block bg-slate-900 text-white px-8 py-4 rounded-full font-bold shadow-xl hover:bg-slate-800 hover:scale-105 transition-all w-full md:w-auto">
                                            {t[lang].upsell.items.package.button}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </section>

            <footer className="py-12 text-center text-slate-600 border-t border-slate-800">
                <p>&copy; {new Date().getFullYear()} Fábrica de Best Sellers. {t[lang].footer.rights}</p>
                <div className="flex justify-center gap-4 text-xs mt-4">
                    <a href="/privacy-policy" className="hover:text-white transition">{t[lang].footer.privacy}</a>
                    <span>•</span>
                    <a href="/terms-of-use" className="hover:text-white transition">{t[lang].footer.terms}</a>
                </div>
            </footer>

            {showPlanCelebration && celebratedPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-800 border border-indigo-500/30 p-8 rounded-2xl max-w-lg w-full text-center relative shadow-2xl shadow-indigo-500/20 animate-in zoom-in-95 duration-300">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-full shadow-lg">
                            <span className="text-4xl">🎉</span>
                        </div>

                        <h2 className="text-3xl font-black text-white mt-8 mb-4">
                            PARABÉNS! <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                VOCÊ AGORA É UM ASSINANTE!
                            </span>
                        </h2>

                        <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/20 mb-6">
                            <p className="text-indigo-200 font-bold text-lg mb-1">{celebratedPlan.name}</p>
                            <p className="text-sm text-indigo-300/70 uppercase tracking-widest">{celebratedPlan.billing === 'annual' ? 'Plano Anual' : 'Plano Mensal'}</p>
                        </div>

                        <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                            Acabamos de desbloquear as condições exclusivas do seu plano e a
                            <span className="text-yellow-400 font-bold"> Taxa de Geração Promocional ({
                                celebratedPlan.name === 'BLACK' ? 'R$ 16,90' :
                                    celebratedPlan.name === 'PRO' ? 'R$ 21,90' :
                                        'R$ 26,90'
                            })</span>.
                        </p>

                        <button
                            onClick={() => setShowPlanCelebration(false)}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                            CONTINUAR PARA GERAÇÃO
                        </button>
                    </div>
                </div>
            )}
            <RewardModal
                isOpen={isRewardModalOpen}
                onClose={() => setIsRewardModalOpen(false)}
                onClaim={handleNewBook}
            />


        </div >
    );
};

export default LandingPage;
