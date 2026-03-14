import React, { useState, useEffect } from 'react';
import { pt, en, es } from '../i18n/locales';
import { PricingSection } from './PricingSection';
import { SocialShare } from './SocialShare';
import { RewardModal } from './RewardModal';
import { ExtraServiceCard, ExtraServiceBuyButton } from './ExtraServices';
import * as API from '../services/api';
import { trackInitiateCheckout, trackLead } from '../services/meta-pixel';
import Disclaimer from './Disclaimer';

// --- INLINE ICONS (No external dependency to crash) ---
const Zap = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const BookOpen = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const X = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
const Check = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12" /></svg>;
const Star = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>;
const FileText = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 0 0 0-2 2v16a2 0 0 0 2 2h12a2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><line x1="10" x2="8" y1="9" y2="9" /></svg>;
const ChevronDown = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m6 9 6 6 6-6" /></svg>;
const CheckCircle = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>;
const SettingsIcon = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12.22 2h-.44a2 0 0 0-2 2v.18a2 0 0 1-1 1.73l-.43.25a2 0 0 1-2 0l-.15-.08a2 0 0 0-2.73.73l-.22.38a2 0 0 0 .73 2.73l.15.1a2 0 0 1 1 1.72v.51a2 0 0 1-1 1.74l-.15.09a2 0 0 0-.73 2.73l.22.38a2 0 0 0 2.73.73l.15-.08a2 0 0 1 2 0l.43.25a2 0 0 1 1 1.73V20a2 0 0 0 2 2h.44a2 0 0 0 2-2v-.18a2 0 0 1 1-1.73l.43-.25a2 0 0 1 2 0l.15.08a2 0 0 0 2.73-.73l.22-.39a2 0 0 0-.73-2.73l-.15-.09a2 0 0 1-1-1.74v-.47a2 0 0 1 1-1.74l.15-.09a2 0 0 0 .73-2.73l-.22-.38a2 0 0 0-2.73-.73l-.15.08a2 0 0 1-2 0l-.43-.25a2 0 0 1-1-1.73V4a2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>;
const PenTool = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19 7-7 3 3-7 7-3-3z" /><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="m2 2 7.586 7.586" /><circle cx="11" cy="11" r="2" /></svg>;
const Globe = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>;
const FileImage = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M14.5 2H6a2 0 0 0-2 2v16a2 0 0 0 2 2h12a2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><circle cx="10" cy="13" r="2" /><path d="m20 17-1.09-1.09a2 0 0 0-2.82 0L10 22" /></svg>;
const ShoppingCart = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 0 0 0 2 1.58h9.78a2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></svg>;
const Truck = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
const Barcode = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 5v14" /><path d="M8 5v14" /><path d="M12 5v14" /><path d="M17 5v14" /><path d="M21 5v14" /></svg>;
const MousePointer2 = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" /><path d="m13 13 6 6" /></svg>;
const ShieldCheck = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 11 11 13 15 9" /></svg>;
const WhatsApp = (props: any) => (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" {...props}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.658 1.43 5.63 1.432h.005c6.551 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);


interface LandingProps {
    onStart: (userData: any, initialData?: any) => void;
    onAdmin: () => void;
    lang: 'pt' | 'en' | 'es';
    setLang: (l: 'pt' | 'en' | 'es') => void;
    initialState?: any;
    onLoginClick: () => void;
}

const LandingPageEnglish: React.FC<LandingProps> = ({ onStart, onAdmin, lang, setLang, initialState, onLoginClick }) => {
    const translations: any = { pt: pt.landing, en: en.landing, es: es.landing };
    const t: any = { pt, en, es };
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Wizard State
    // Wizard State
    const [step, setStep] = useState(0); // 0: User Data, 1: Book Data, 2: Processing, 3: Paywall, 4: Voucher Success
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        countryCode: '+55',
        type: 'BOOK', // BOOK, VOUCHER, GIFT_DIRECT
        document: '', // CPF or CNPJ
        cep: '',
        address: '',
        addressNumber: '',
        addressComplement: '',
        neighborhood: '',
        city: '',
        state: ''
    });
    const [bookData, setBookData] = useState({
        authorName: '',
        topic: '',
        isGift: false,
        giftName: '',
        giftEmail: '',
        giftPhone: ''
    });

    // SESSION TIME REFERENCE: Used to validate if a plan is NEWLY created
    const [paymentSessionStart, setPaymentSessionStart] = useState(0);

    // Update session start when entering Payment Step (3)
    useEffect(() => {
        if (step === 3 && paymentSessionStart === 0) {
            setPaymentSessionStart(Date.now());
            console.log("PAYMENT SESSION STARTED AT:", Date.now());
        }
    }, [step]);

    const [processingStage, setProcessingStage] = useState(0);
    const [products, setProducts] = useState<any>({
        trans_en: "https://pay.kiwify.com/DdposAY",
        trans_es: "https://pay.kiwify.com/DdposAY",
        cover_card: "https://pay.kiwify.com/DdposAY",
        cover_ebook: "https://pay.kiwify.com/DdposAY",
        pub_amazon_printed: "https://pay.kiwify.com/DdposAY",
        pub_amazon_digital: "https://pay.kiwify.com/DdposAY",
        pub_uiclap: "https://pay.kiwify.com/DdposAY",
        catalog_card: "https://pay.kiwify.com/DdposAY",
        isbn_printed: "https://pay.kiwify.com/DdposAY",
        isbn_digital: "https://pay.kiwify.com/DdposAY",
        complete_package: "https://pay.kiwify.com/DdposAY"
    });

    // Voucher / Gift Redemption
    const [giftSourceEmail, setGiftSourceEmail] = useState<string | null>(null);
    const [selectedPlan, setSelectedPlan] = useState<{ name: string; billing: string } | null>(null);
    const [voucherCredits, setVoucherCredits] = useState<number>(0);

    // Manual Start Logic (Payment Confirmed)
    const [paymentConfirmed, setPaymentConfirmed] = useState(false);
    const paymentConfirmedRef = React.useRef(paymentConfirmed);

    useEffect(() => {
        paymentConfirmedRef.current = paymentConfirmed;
    }, [paymentConfirmed]);

    useEffect(() => {
        // Load config from API (for overrides)
        const fetchConfig = async () => {
            try {
                const baseUrl = getApiBase().replace(/\/$/, "");
                const res = await fetch(`${baseUrl}/api/payment/config`);
                const data = await res.json();
                if (data.products) {
                    setProducts(prev => ({ ...prev, ...data.products }));
                }
            } catch (e) {
                console.error("Failed to load public config", e);
            }
        };
        fetchConfig();

        // Check for Gift Code in URL
        const params = new URLSearchParams(window.location.search);
        const giftCode = params.get('gift_code');
        if (giftCode) {
            try {
                const sourceEmail = atob(giftCode);
                setGiftSourceEmail(sourceEmail);
                // Auto-check validity
                const baseUrl = getApiBase().replace(/\/$/, "");
                fetch(`${baseUrl}/api/payment/access?email=${sourceEmail}&_t=${Date.now()}`)
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
    }, [initialState]);

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
        setBookData({
            authorName: '',
            topic: '',
            isGift: false,
            giftName: '',
            giftEmail: '',
            giftPhone: ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // --- BRASIL API & MASKS ---
    const formatCpfCnpj = (value: string) => {
        const v = value.replace(/\D/g, '');
        if (v.length <= 11) { // CPF
            return v.replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else { // CNPJ
            return v.replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
    };

    const formatCep = (value: string) => {
        return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2');
    };

    const validateCpf = (cpf: string) => {
        const strCPF = cpf.replace(/\D/g, '');
        if (strCPF.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(strCPF)) return false; // Equal digits
        let sum = 0;
        let rest;
        for (let i = 1; i <= 9; i++) sum = sum + parseInt(strCPF.substring(i - 1, i)) * (11 - i);
        rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        if (rest !== parseInt(strCPF.substring(9, 10))) return false;
        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(strCPF.substring(i - 1, i)) * (12 - i);
        rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        if (rest !== parseInt(strCPF.substring(10, 11))) return false;
        return true;
    };

    const handleDocumentBlur = async () => {
        const doc = formData.document.replace(/\D/g, '');
        if (doc.length === 14) {
            // CNPJ Lookup
            try {
                const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${doc}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData(prev => ({
                        ...prev,
                        name: data.razao_social || data.nome_fantasia || prev.name,
                        cep: data.cep ? formatCep(data.cep) : prev.cep,
                        address: data.logradouro || prev.address,
                        addressNumber: data.numero || prev.addressNumber,
                        addressComplement: data.complemento || prev.addressComplement,
                        neighborhood: data.bairro || prev.neighborhood,
                        city: data.municipio || prev.city,
                        state: data.uf || prev.state
                    }));
                }
            } catch (e) {
                console.error("CNPJ Lookup failed", e);
            }
        } else if (doc.length === 11) {
            if (!validateCpf(doc)) {
                alert("Invalid Document ID! Please check the numbers entered.");
            }
        }
    };

    const handleCepBlur = async () => {
        const cep = formData.cep.replace(/\D/g, '');
        if (cep.length === 8) {
            try {
                const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${cep}`);
                if (res.ok) {
                    const data = await res.json();
                    setFormData(prev => ({
                        ...prev,
                        address: data.street || prev.address,
                        neighborhood: data.neighborhood || prev.neighborhood,
                        city: data.city || prev.city,
                        state: data.state || prev.state
                    }));
                }
            } catch (e) {
                console.error("Zip Code Lookup failed", e);
            }
        }
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

    // Initial State (Upsell Recovery)
    useEffect(() => {
        if (initialState) {
            if (initialState.email) {
                const shouldClearName = initialState.resetData === true;
                setFormData(prev => {
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
            const p = { name: plan, billing };
            setSelectedPlan(p);
            localStorage.setItem('selectedPlan_v3', JSON.stringify(p));
        } else {
            setSelectedPlan(null); // Avulso
            localStorage.removeItem('selectedPlan_v3');
            // Force formData type to BOOK to avoid VOUCHER logic if previously used
            setFormData(prev => ({ ...prev, type: 'BOOK' }));
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
    const [discountUpdated, setDiscountUpdated] = useState(false);

    // --- LOGIC: SAVE LEAD ---
    const handleSaveLead = async (overrideType?: string) => {
        try {
            // Register User (New Flow) - Try to register if password exists
            if (formData.password) {
                const getApiBase = () => {
                    const env = (import.meta as any).env.VITE_API_URL;
                    if (env) return env;
                    const host = window.location.hostname;
                    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005';
                    return 'https://api.fabricadebestseller.com.br';
                };
                const baseUrl = getApiBase().replace(/\/$/, "");
                try {
                    await fetch(`${baseUrl}/api/user/register`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: formData.name,
                            email: formData.email,
                            password: formData.password,
                            cpf: formData.document,
                            phone: formData.phone
                        })
                    });
                } catch (err) { console.error("Register Error (ignoring)", err); }
            }

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
            alert("Please fill in all fields and select the file.");
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

                setFormData(prev => ({
                    ...prev,
                    name: uploadData.name,
                    email: uploadData.email,
                    phone: uploadData.phone,
                    countryCode: '+55',
                    type: 'DIAGRAMMING'
                }));

                setStep(3);
                setIsWizardOpen(true);
            } else {
                alert("Error sending: " + data.error);
            }
        } catch (e) {
            console.error(e);
            alert("Connection error with the payment server.");
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
        "Sending data to our creative team...",
        "Connecting to our Artificial Intelligence platform...",
        "Creating the processes for building your new book...",
        "Structuring the Chapters...",
        "Formatting and Finalizing File..."
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
                alert("Session expired. Please reload the page.");
                return;
            }

            // STRICT ACCESS VALIDATION via backend (Single Source of Truth)
            const API_URL = getApiBase();
            const statusRes = await fetch(`${API_URL}/api/payment/access?email=${currentForm.email.trim()}&_t=${Date.now()}`);
            const status = await statusRes.json();

            // SUBSCRIBER: redirect to member login
            if (status.plan && status.plan.status === 'ACTIVE') {
                if (status.latestInvoiceStatus === 'PENDING' || status.latestInvoiceStatus === 'OVERDUE') {
                    alert(`⚠️ Subscription payment pending.\n\nThe subscription invoice ${status.latestInvoiceNumber || ''} is currently PENDING.`);
                    setStep(3);
                    return;
                }
                onLoginClick();
                return;
            }

            // AVULSO/Credit: only proceed if hasAccess is true
            if (!status.hasAccess) {
                if (status.latestInvoiceStatus === 'PENDING' || status.latestInvoiceStatus === 'OVERDUE') {
                    alert(`⚠️ Payment not yet cleared.\n\nThe invoice ${status.latestInvoiceNumber || ''} is currently PENDING. Please wait for bank confirmation.`);
                } else {
                    alert("⚠️ Unauthorized access.\n\nNo credits or active plan found for this email. Please make the payment first.");
                }
                setStep(3); // Send back to paywall
                return;
            }

            console.log("✅ Access granted. Starting generation...");
            const success = await API.useCredit(currentForm.email);

            if (success) {
                onStart(currentForm, currentBook);
            } else {
                console.warn("Start prevented: No internal credits available or API Error.");
                setPaymentConfirmed(false);
                alert("Could not start production. Check if your payment was confirmed or if you have credits.");
            }

        } catch (e) {
            console.error("Start Error", e);
            alert("Error starting production. Check your connection.");
        }
    };


    const getApiBase = () => {
        const env = (import.meta as any).env.VITE_API_URL;
        if (env) return env;
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3005';
        return 'https://api.fabricadebestseller.com.br'; // Production Fallback
    };

    const handleSubscribe = async () => {
        if (!selectedPlan || !formData.email) return;

        if (!formData.document || formData.document.trim().length < 11) {
            alert("Please fill in a valid Document ID in the Billing Data before subscribing.");
            return;
        }

        // Rastreamento Meta Pixel — InitiateCheckout
        const PLAN_PRICES: Record<string, Record<string, number>> = {
            STARTER: { monthly: 19.90, annual: 147.90 },
            PRO: { monthly: 39.90, annual: 297.90 },
            BLACK: { monthly: 79.90, annual: 497.90 },
        };
        const subValue = PLAN_PRICES[selectedPlan.name]?.[selectedPlan.billing] || 0;
        trackInitiateCheckout(
            `Plan ${selectedPlan.name} ${selectedPlan.billing === 'annual' ? 'Annual' : 'Monthly'}`,
            subValue,
            'USD'
        );

        setPaymentSessionStart(Date.now());
        setStartPolling(true);
        setPaymentConfirmed(false);

        const baseUrl = getApiBase().replace(/\/$/, "");
        try {
            const res = await fetch(`${baseUrl}/api/subscription/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone,
                    cpfCnpj: formData.document,
                    planKey: selectedPlan.name,
                    billing: selectedPlan.billing,
                    address: {
                        cep: formData.cep,
                        street: formData.address,
                        number: formData.addressNumber,
                        complement: formData.addressComplement,
                        neighborhood: formData.neighborhood,
                        city: formData.city,
                        state: formData.state
                    }
                })
            });
            const data = await res.json();
            if (data.invoiceUrl) {
                window.open(data.invoiceUrl, '_blank');
            } else {
                alert("Error generating subscription link: " + (data.error || "Unknown"));
            }
        } catch (e) {
            console.error(e);
            alert("Connection error with the payment server.");
        }
    };

    const handleBookPayment = async () => {
        if (!formData.email) return;

        // Rastreamento Meta Pixel — InitiateCheckout (Livro Avulso)
        trackInitiateCheckout('Single Book', 39.90, 'USD');

        setPaymentSessionStart(Date.now());
        setStartPolling(true);
        setPaymentConfirmed(false);

        const kiwifyUrl = `https://pay.kiwify.com/DdposAY?email=${encodeURIComponent(formData.email)}&name=${encodeURIComponent(formData.name)}&phone=${encodeURIComponent(formData.phone)}`;
        window.open(kiwifyUrl, '_blank');
    };

    // --- AUTOMATION: AUTO-START IF CONFIRMED ---
    // --- AUTOMATION: AUTO-START DISABLED FOR SUBSCRIBERS ---
    // We want (Self-correction: I will view the file first)ion Modal, not be redirected to Book Data form.
    /*
    useEffect(() => {
        if (paymentConfirmed && step === 3) {
            const t = setTimeout(() => {
                // Payment confirmed, go to Book Data Step instead of Auto-Start
                setStep(1);
            }, 2000); // 2s delay to show success message
            return () => clearTimeout(t);
        }
    }, [paymentConfirmed, step]);
    */

    // --- LOGIC: CHECK PAYMENT (POLLING) ---
    const [debugInfo, setDebugInfo] = useState<any>(null);
    const [startPolling, setStartPolling] = useState(false);  // Manual trigger for polling

    // RISING EDGE DETECTION: 
    const [initialStatusChecked, setInitialStatusChecked] = useState(false);
    const [wasInitiallyActive, setWasInitiallyActive] = useState(false);

    useEffect(() => {
        let interval: any;
        // ENABLED AUTOMATIC POLLING for Step 3 (Payment) and Step 2 (Processing)
        // We use Session Time validation inside the loop to prevent instant success from old data.
        const shouldPoll = (step === 3 || step === 2) && !giftSourceEmail && startPolling;

        if (shouldPoll) {
            interval = setInterval(async () => {
                console.log('🔄 Checking status...'); // MANDATORY DEBUG LOG
                try {
                    console.log("Polling for:", formData.email);

                    console.log("Polling for:", formData.email);

                    const API_URL = getApiBase();

                    console.log('🔗 Attempting to connect to:', API_URL); // DEBUG OBRIGATÓRIO

                    const url = `${API_URL}/api/payment/access?email=${formData.email.trim()}&_t=${Date.now()}`;

                    const res = await fetch(url);

                    // FIXED: JSON Safety Check
                    const contentType = res.headers.get("content-type");
                    if (!contentType || !contentType.includes("application/json")) {
                        throw new Error(`Received non-JSON response from ${url}`);
                    }

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
                                        tag: `Level ${data.discountLevel} (${data.plan.name})`
                                    }
                                })
                            }).then(() => setDiscountUpdated(true)).catch(console.error);
                        }
                    }

                    // CHECK EXPIRATION
                    if (data.plan && data.plan.status === 'EXPIRED') {
                        console.warn("Plan Expired");
                        if (!sessionStorage.getItem('expired_alert_' + formData.email)) {
                            alert("⚠️ YOUR PLAN HAS EXPIRED!\n\nTo continue enjoying the benefits and discounts of the SaaS, please renew your subscription (Monthly or Annual).");
                            sessionStorage.setItem('expired_alert_' + formData.email, 'true');
                        }
                    }

                    // PLAN CELEBRATION
                    // REMOVED PREMATURE CELEBRATION BLOCK FROM HERE
                    // Celebration logic is now strictly inside the Payment Confirmation block below

                    // RESET CELEBRATION IF PLAN IS LOST/DELETED (Supports Retesting)
                    if (!data.plan || data.plan.status !== 'ACTIVE') {
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
                    const isSubscriber = data.plan && data.plan.status === 'ACTIVE';

                    // RISING EDGE: INITIAL BASELINE CHECK
                    // We must establish the initial state on the VERY FIRST poll result.
                    if (!initialStatusChecked) {
                        setInitialStatusChecked(true);
                        if (isSubscriber) {
                            console.log("INITIAL CHECK: User ALREADY Active. Marking as pre-existing.");
                            setWasInitiallyActive(true);
                            return; // Exit: Do not celebrate pre-existing plan
                        } else {
                            console.log("INITIAL CHECK: User NOT Active. Monitoring for payment...");
                            setWasInitiallyActive(false);
                        }
                    }

                    // STRICTLY CHECK FOR SUBSCRIBER STATUS ONLY
                    // IGNORES generic credits or approved status to force Subscription Flow
                    if (isSubscriber) {
                        if (data.latestInvoiceStatus === 'PENDING' || data.latestInvoiceStatus === 'OVERDUE') {
                            console.log("Plan Active but Invoice is PENDING/OVERDUE. Waiting for confirmation.");
                            return;
                        }

                        // RISING EDGE: Ignore if it was pre-existing
                        if (wasInitiallyActive) {
                            console.log("Ignoring Active Status (User was already active when session started).");
                            return;
                        }

                        // CRITICAL: Session-based validation.
                        // Only accept plans that have a startDate AFTER the user landed on the payment screen.
                        const planStart = new Date(data.plan.startDate).getTime();

                        const referenceTime = paymentSessionStart > 0 ? paymentSessionStart : Date.now();
                        const timeDiff = planStart - referenceTime;

                        // Tolerance: RELAXED SENSITIVITY (-5 Minutes)
                        const MINIMUM_PROCESSING_TIME = -5 * 60 * 1000;

                        if (timeDiff <= MINIMUM_PROCESSING_TIME) {
                            console.log("Ignored Active Plan (Too Old). Waiting for Webhook update...", {
                                planStart: new Date(planStart).toISOString(),
                                sessionStart: new Date(referenceTime).toISOString(),
                                diffMs: timeDiff,
                                requiredDiff: MINIMUM_PROCESSING_TIME
                            });
                            return;
                        }

                        // IF SUBSCRIBER CONFIRMED AND RECENT: Redirect to Member Area logic
                        if (!paymentConfirmedRef.current) {
                            console.log("NEW SUBSCRIBER PLAN CONFIRMED via Webhook. Show Celebration Modal.");

                            // STRICT CELEBRATION TRIGGER
                            const planKey = `celebrated_v2_${data.plan.name}_${formData.email}_${planStart}`;
                            if (!localStorage.getItem(planKey)) {
                                setCelebratedPlan(data.plan);
                                setShowPlanCelebration(true);
                                localStorage.setItem(planKey, 'true');
                            }

                            setPaymentConfirmed(true);
                            paymentConfirmedRef.current = true;
                        }
                    }

                    // AUTO NAVIGATE VOUCHER / DIAGRAM / BOOK
                    if (formData.type === 'VOUCHER' && isApproved) {
                        clearInterval(interval);
                        setStep(4);
                    }
                    else if (formData.type === 'DIAGRAMMING' && isApproved) {
                        clearInterval(interval);
                        setStep(5);
                    }
                    else if (formData.type === 'BOOK' && hasAccess && !paymentConfirmed) {
                        // Payment confirmed for AVULSO/credit user - redirect to Dashboard
                        clearInterval(interval);
                        setPaymentConfirmed(true);
                        paymentConfirmedRef.current = true;
                        onStart({
                            name: formData.name,
                            email: formData.email,
                            phone: formData.phone
                        });
                        return;
                    }

                } catch (e) { console.error("Poll Error", e); }
            }, 1500);
        }
        return () => clearInterval(interval);
    }, [step, formData.email, formData.type, giftSourceEmail, currentLeadId, discountUpdated, paymentConfirmed]);

    const [diagramStep, setDiagramStep] = useState(0);
    const diagramMessages = [
        "Reading available material...",
        "Performing initial analysis of attached content...",
        "Organizing and starting the professional layout process...",
        "Generating the fully laid out file for review...",
        "Forwarding the laid out book to the shipping department...",
        "Sending the professionally laid out book to the client...",
        "DOWNLOAD AVAILABLE"
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
            {/* --- HEADER --- */}
            <header className="fixed w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <BookOpen className="text-yellow-400 w-8 h-8" />
                        <span className="text-xl md:text-2xl font-bold text-white tracking-tight">Best Seller Factory</span>
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

                        <button
                            onClick={onLoginClick}
                            className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center gap-2 border border-white/10"
                        >
                            <span>🔐</span> <span className="hidden md:inline">I'M ALREADY A MEMBER</span><span className="md:hidden">LOGIN</span>
                        </button>

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
                                                    <h3 className="font-black text-white text-lg tracking-wider">LOYALTY BONUS ACTIVE</h3>
                                                </div>
                                                <p className="text-indigo-100 text-sm">
                                                    You have <span className="font-bold text-yellow-400 bg-black/20 px-2 py-0.5 rounded border border-yellow-500/30">{activeDiscount}% DISCOUNT</span> guaranteed on this generation.
                                                </p>
                                            </div>
                                        )}
                                        <div className="text-center mb-8">
                                            <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 mb-2">
                                                Fill in your details to access the Best Seller Factory
                                            </h2>
                                        </div>

                                        <div className="space-y-6">
                                            {/* --- USER DATA (RESPONSIBLE) --- */}
                                            <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 space-y-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="bg-yellow-500/10 text-yellow-500 p-2 rounded-lg">👤</span>
                                                    <h3 className="font-bold text-lg text-slate-200">
                                                        {activeDiscount > 0 ? "Identification (VIP Client)" : "Project Responsible"}
                                                    </h3>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label>
                                                    <input
                                                        value={formData.name}
                                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                        className="w-full bg-slate-900 border-slate-700 rounded-xl p-3 text-white focus:ring-1 focus:ring-yellow-500 outline-none transition-all hover:bg-slate-900/80 items-center"
                                                        placeholder="Your full name"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">E-mail {activeDiscount > 0 && "(Registered)"}</label>
                                                        <input
                                                            value={formData.email}
                                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                                            className={`w-full rounded-xl p-3 text-white outline-none transition-all ${activeDiscount > 0 ? 'bg-slate-800/50 border border-slate-700 text-slate-400 cursor-not-allowed' : 'bg-slate-900 border-slate-700 focus:ring-1 focus:ring-yellow-500 hover:bg-slate-900/80'}`}
                                                            placeholder="your@email.com"
                                                            readOnly={activeDiscount > 0}
                                                        />
                                                    </div>

                                                    <div className="md:col-span-2">
                                                        <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Access Password (Create now)</label>
                                                        <div className="relative">
                                                            <input
                                                                type="password"
                                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 pl-10 text-white focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder-slate-600"
                                                                placeholder="••••••••"
                                                                value={(formData as any).password || ''}
                                                                onChange={e => setFormData({ ...formData, password: e.target.value } as any)}
                                                            />
                                                            <div className="absolute left-3 top-3.5 text-slate-500">
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 mt-1">This password will be used to access your Member Area.</p>
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

                                            {/* --- MOVED TO STEP 1 (Post-Payment) --- */}
                                            {/* Author and Topic inputs removed from here */}



                                            {/* --- MAIN ACTION: START PRODUCTION --- */}
                                            <div className="space-y-4 pt-2 relative">
                                                {!(formData as any).lgpdConsent && (
                                                    <div className="absolute -top-6 left-2 flex items-center gap-2 animate-bounce pointer-events-none z-10">
                                                        <span className="text-2xl drop-shadow-lg filter">👇</span>
                                                        <span className="text-xs font-bold text-yellow-400 bg-slate-900/80 px-2 py-1 rounded shadow-lg border border-yellow-500/30">
                                                            CLICK HERE
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
                                                        I agree with the <a href="#" className="underline hover:text-white">Terms of Use</a> and <a href="#" className="underline hover:text-white">Privacy Policy</a>.
                                                        I am aware and agree to receive communications from Editora 360 Express, including exclusive offers, awards, product updates, and marketing materials via email or WhatsApp.
                                                        <br />
                                                        <span className="text-[10px] opacity-70 block mt-1">* Your data is secure and you can unsubscribe at any time.</span>
                                                    </span>
                                                </label>

                                                <button
                                                    onClick={async () => {
                                                        if (!formData.name || !formData.email || !formData.phone) {
                                                            alert("Please fill in all required fields (Name, Email, Phone).");
                                                            return;
                                                        }
                                                        if (!(formData as any).lgpdConsent) {
                                                            alert("You must accept the terms and consent to communications to proceed.");
                                                            return;
                                                        }
                                                        // Save user data (Lead Draft) and go to Payment
                                                        try {
                                                            await handleSaveLead(); // This might save lead without topic, which is fine for now
                                                        } catch (e) {
                                                            console.error("Partial save error", e);
                                                        }
                                                        setStep(3); // Go to Paywall
                                                    }}
                                                    disabled={!formData.name || !formData.email || !formData.phone || !(formData as any).lgpdConsent}
                                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 rounded-xl text-xl shadow-lg shadow-indigo-500/20 transition-all transform hover:-translate-y-1 disabled:opacity-50 disabled:grayscale disabled:pointer-events-none flex items-center justify-center gap-3"
                                                >
                                                    <Zap className="w-6 h-6 fill-current" />
                                                    CONTINUE TO PAYMENT
                                                </button>
                                            </div>

                                        </div>
                                    </div>
                                )}


                                {/* STEP 1: BOOK DATA ENTRY (Post-Payment) */}
                                {step === 1 && (
                                    <div className="space-y-6 w-full animate-fade-in">
                                        <div className="text-center mb-8">
                                            <div className="inline-block p-4 bg-green-500/10 rounded-full mb-4">
                                                <PenTool className="w-10 h-10 text-green-400" />
                                            </div>
                                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                                Payment Confirmed! 🚀
                                            </h2>
                                            <p className="text-slate-400">
                                                Now, tell us about the book you want to create.
                                            </p>
                                        </div>

                                        <div className="bg-indigo-950/30 p-6 rounded-2xl border border-indigo-500/30 space-y-4 relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="bg-indigo-500/20 text-indigo-400 p-2 rounded-lg">📘</span>
                                                <h3 className="font-bold text-lg text-indigo-100">About the Book</h3>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-indigo-300 mb-1 uppercase">Author Name (For the Cover)</label>
                                                <input
                                                    value={bookData.authorName}
                                                    onChange={e => setBookData({ ...bookData, authorName: e.target.value })}
                                                    className="w-full bg-indigo-950/50 border-indigo-500/30 border rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-400 outline-none transition-all hover:bg-indigo-900/50 placeholder-indigo-300/30 text-lg"
                                                    placeholder="Ex: Dr. John Smith"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-indigo-300 mb-1 uppercase">Book Theme/Subject</label>
                                                <textarea
                                                    value={bookData.topic}
                                                    onChange={e => setBookData({ ...bookData, topic: e.target.value })}
                                                    className="w-full bg-indigo-950/50 border-indigo-500/30 border rounded-xl p-3 text-white focus:ring-1 focus:ring-indigo-400 outline-none h-32 resize-none transition-all hover:bg-indigo-900/50 placeholder-indigo-300/30 text-lg leading-relaxed"
                                                />
                                                <p className="text-right text-xs text-indigo-300/50 mt-1">The more details, the better.</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                if (!bookData.authorName || !bookData.topic) {
                                                    alert("Please fill in the Author and the Book Theme.");
                                                    return;
                                                }
                                                // Save Updated Lead with Book Info
                                                await handleSaveLead();
                                                // Start Generation
                                                setStep(2); // Go to Processing
                                            }}
                                            disabled={!bookData.authorName || !bookData.topic}
                                            className="w-full bg-gradient-to-r from-[#eab308] to-[#facc15] hover:from-[#facc15] hover:to-[#fde047] text-slate-900 font-bold py-5 rounded-xl text-xl shadow-lg shadow-yellow-500/20 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-3"
                                        >
                                            <Zap className="w-6 h-6 fill-current" />
                                            START BOOK PRODUCTION
                                        </button>
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
                                                <h2 className="text-2xl font-bold text-white mb-2">REDEEM YOUR GIFT BOOK</h2>
                                                <p className="text-slate-400 text-sm mt-4">
                                                    You received a credit from <b>{giftSourceEmail}</b>.<br />
                                                    Use it now to generate your Best Seller for free.
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
                                                                    alert("Error validating gift credit. Please try again.");
                                                                }
                                                            }}
                                                            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            <Zap className="w-5 h-5 fill-current" />
                                                            REDEEM AND GENERATE NOW
                                                        </button>
                                                    ) : (
                                                        <div className="bg-red-500/20 text-red-400 p-4 rounded-xl border border-red-500/30 flex flex-col items-center gap-3">
                                                            <span>Oops! The credit for this link has already been used or expired.</span>
                                                            <button
                                                                onClick={() => { setGiftSourceEmail(null); setStep(0); }}
                                                                className="text-white bg-slate-700 px-4 py-2 rounded-lg hover:bg-slate-600 transition font-bold text-xs"
                                                            >
                                                                Continue with my Plan / Buy Now
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
                                                        <Zap className="w-10 h-10 text-yellow-400 fill-current" />
                                                    </div>
                                                    <h2 className="text-2xl font-bold text-white mb-2">
                                                        {formData.type === 'VOUCHER' ? 'FINALIZE GIFT VOUCHER PURCHASE' : (activeDiscount > 0 ? `${activeDiscount}% DISCOUNT APPLIED!` : 'EVERYTHING READY TO START')}
                                                    </h2>
                                                    <p className="text-slate-400 text-sm mt-4">
                                                        {formData.type === 'VOUCHER'
                                                            ? 'After payment, you will receive the exclusive link to send.'
                                                            : ''}
                                                    </p>
                                                </div>

                                                {(() => {
                                                    const isVoucher = formData.type === 'VOUCHER';

                                                    // Get standard values
                                                    let displayPrice = fetchedPrice || 39.90;
                                                    let finalLink = (window as any).checkoutUrl || 'https://pay.kiwify.com/DdposAY';
                                                    const discountLevel = (window as any).discountLevel || 1;

                                                    // GET CHOSEN PLAN (State OR Storage OR Backend Global)
                                                    let chosenPlan = selectedPlan;
                                                    if (!chosenPlan && typeof window !== 'undefined') {
                                                        try { chosenPlan = JSON.parse(localStorage.getItem('selectedPlan_v3') || 'null'); } catch (e) { }
                                                    }

                                                    // CRITICAL: Determine Avulso Mode
                                                    const isAvulsoMode = !chosenPlan || !chosenPlan.name || chosenPlan.name === 'AVULSO' || chosenPlan.name === 'NONE';

                                                    // FORCE AVULSO PRICE (Truth from Backend)
                                                    if (isAvulsoMode) {
                                                        displayPrice = 39.90;
                                                        finalLink = 'https://pay.kiwify.com/DdposAY'; // Standard Avulso Link
                                                    }

                                                    // FORCE CORRECT LEVEL 1 PRICE IF USER HAS PLAN
                                                    const plan = (window as any).currentUserPlan || selectedPlan;

                                                    // PRICE CALCULATION
                                                    if (!isVoucher && plan && displayPrice === 39.90) {
                                                        const pName = plan.name?.toUpperCase();
                                                        const billing = plan.billing?.toLowerCase() || 'monthly'; // Force monthly default

                                                        // Fallback Prices for Level 1 based on known config
                                                        if (pName === 'STARTER') {
                                                            if (billing === 'annual') {
                                                                displayPrice = 24.90;
                                                                finalLink = 'https://pay.kiwify.com/DdposAY';
                                                            } else {
                                                                displayPrice = 26.90;
                                                                finalLink = 'https://pay.kiwify.com/DdposAY';
                                                            }
                                                        }
                                                        if (pName === 'PRO') {
                                                            if (billing === 'annual') {
                                                                displayPrice = 19.90;
                                                                finalLink = 'https://pay.kiwify.com/DdposAY';
                                                            } else {
                                                                displayPrice = 21.90;
                                                                finalLink = 'https://pay.kiwify.com/DdposAY';
                                                            }
                                                        }
                                                        if (pName === 'BLACK') {
                                                            if (billing === 'annual') {
                                                                displayPrice = 14.90;
                                                                finalLink = 'https://pay.kiwify.com/DdposAY';
                                                            } else {
                                                                displayPrice = 16.90;
                                                                finalLink = 'https://pay.kiwify.com/DdposAY';
                                                            }
                                                        }
                                                    }

                                                    // Enforce Voucher Rules
                                                    if (isVoucher) {
                                                        displayPrice = 39.90;
                                                        finalLink = 'https://pay.kiwify.com/DdposAY';
                                                    }

                                                    // OVERRIDE FOR INTERNATIONAL FLOW (USA)
                                                    if (lang === 'en') {
                                                        displayPrice = 39.90;
                                                        finalLink = 'https://pay.kiwify.com/DdposAY';
                                                    }

                                                    const finalPriceStr = lang === 'en'
                                                        ? displayPrice.toFixed(2)
                                                        : displayPrice.toFixed(2).replace('.', ',');
                                                    const currencySymbol = lang === 'en' ? '$' : '$';

                                                    // --- SUBSCRIPTION ENFORCEMENT LOGIC ---
                                                    const realPlan = (window as any).currentUserPlan; // Backend Plan

                                                    // STRICT CHECK: If user selected a plan, they MUST have it Active.
                                                    // If db is empty, realPlan is null.
                                                    const userHasActivePlan = realPlan && realPlan.status === 'ACTIVE';

                                                    const needToPaySubscription = (!isAvulsoMode && !userHasActivePlan) && !isVoucher && !paymentConfirmed;

                                                    // --- PLAN VARIABLES CALCULATION (Pre-calc for reuse) ---
                                                    let subLink = '';
                                                    let subPrice = '0.00';
                                                    let pName = '';
                                                    let billing = '';

                                                    if (chosenPlan) {
                                                        pName = chosenPlan.name?.toUpperCase() || '';
                                                        billing = chosenPlan.billing?.toLowerCase() || '';

                                                        // HARDCODED SUBSCRIPTION PRICES (Alinhados ao backend SUBSCRIPTION_PRICES)
                                                        if (pName === 'STARTER') {
                                                            if (billing === 'annual') { subPrice = '147.90'; }
                                                            else { subPrice = '19.90'; }
                                                        } else if (pName === 'PRO') {
                                                            if (billing === 'annual') { subPrice = '297.90'; }
                                                            else { subPrice = '39.90'; }
                                                        } else if (pName === 'BLACK') {
                                                            if (billing === 'annual') { subPrice = '497.90'; }
                                                            else { subPrice = '79.90'; }
                                                        }
                                                    }

                                                    const needBillingData = !isVoucher && !paymentConfirmed;

                                                    if (paymentConfirmed) {
                                                        return (
                                                            <div className="w-full bg-emerald-900/20 border border-emerald-500/50 p-6 rounded-xl animate-pulse text-center">
                                                                <div className="flex justify-center mb-4">
                                                                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                                                                </div>
                                                                <h3 className="text-xl font-bold text-emerald-400 mb-2">PAYMENT CONFIRMED!</h3>
                                                                <p className="text-emerald-200 mb-4">Starting your book production automatically...</p>
                                                                <SocialShare className="mt-4" text="I just joined Best Seller Factory! 🚀" />
                                                            </div>
                                                        );
                                                    }

                                                    if (needBillingData) {
                                                        return (
                                                            <div className="space-y-4">
                                                                {needToPaySubscription && (
                                                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                                                                        <div className="flex">
                                                                            <div className="flex-shrink-0">
                                                                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                                </svg>
                                                                            </div>
                                                                            <div className="ml-3">
                                                                                <p className="text-sm text-yellow-700">
                                                                                    You selected the <strong>{pName}</strong> plan. To UNLOCK the EXCLUSIVE conditions offered by the plan, please activate your subscription.
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}

                                                                {/* --- BILLING DATA FORM --- */}
                                                                <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 mb-4 animate-fade-in">
                                                                    <div className="flex items-center gap-2 mb-3">
                                                                        <span className="text-xl">📝</span>
                                                                        <h3 className="text-sm font-bold text-white uppercase">Billing Information</h3>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="col-span-2">
                                                                            <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Document ID</label>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="000.000.000-00"
                                                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600"
                                                                                value={formData.document}
                                                                                maxLength={18}
                                                                                onChange={(e) => setFormData({ ...formData, document: formatCpfCnpj(e.target.value) })}
                                                                                onBlur={handleDocumentBlur}
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Zip Code</label>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="00000-000"
                                                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600"
                                                                                value={formData.cep}
                                                                                maxLength={9}
                                                                                onChange={(e) => setFormData({ ...formData, cep: formatCep(e.target.value) })}
                                                                                onBlur={handleCepBlur}
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Number</label>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="123"
                                                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600"
                                                                                value={formData.addressNumber}
                                                                                onChange={(e) => setFormData({ ...formData, addressNumber: e.target.value })}
                                                                            />
                                                                        </div>

                                                                        <div className="col-span-2">
                                                                            <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Street / Address</label>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Street, Avenue..."
                                                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600 cursor-not-allowed opacity-80"
                                                                                value={formData.address}
                                                                                readOnly
                                                                            />
                                                                        </div>

                                                                        <div>
                                                                            <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Neighborhood</label>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600 cursor-not-allowed opacity-80"
                                                                                value={formData.neighborhood}
                                                                                readOnly
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">City/State</label>
                                                                            <input
                                                                                type="text"
                                                                                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition-all placeholder-slate-600 cursor-not-allowed opacity-80"
                                                                                value={`${formData.city}/${formData.state}`}
                                                                                readOnly
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                {needToPaySubscription ? (
                                                                    <button
                                                                        onClick={handleSubscribe}
                                                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl text-lg shadow-lg transition-all transform hover:-translate-y-1 block text-center"
                                                                    >
                                                                        YOU ARE NOW A SUBSCRIBER! SUBSCRIPTION ({currencySymbol} {subPrice})
                                                                    </button>
                                                                ) : (
                                                                    <button
                                                                        onClick={handleBookPayment}
                                                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-black py-5 rounded-2xl text-xl shadow-xl shadow-green-500/20 transition-all transform hover:-translate-y-1 block text-center"
                                                                    >
                                                                        {!isVoucher && discountLevel > 1 && <span className="block text-xs opacity-80 animate-pulse">🎉 LEVEL {discountLevel} DISCOUNT APPLIED!</span>}
                                                                        BUY CREDIT NOW! ({currencySymbol} {finalPriceStr})
                                                                    </button>
                                                                )}

                                                                <p className="text-center text-[10px] text-slate-500 mt-2">
                                                                    Upon clicking, you will be redirected to the secure Kiwify checkout.
                                                                </p>

                                                                <div className="my-2 border-t border-slate-700/50"></div>

                                                                {/* STEP 2: SIMULATE CONFIRMATION */}
                                                                <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/30 hidden"> {/* HIDDEN FOR PRODUCTION */}
                                                                    <p className="text-xs text-indigo-300 font-bold mb-2 text-center uppercase">Test Environment / Simulation</p>
                                                                    <p className="text-xs text-slate-400 mb-3 text-center">Simulate payment confirmation:</p>

                                                                    <button
                                                                        onClick={async () => {
                                                                            if (confirm(`SIMULATE PAYMENT?\n\nData will be sent to Admin:\nName: ${formData.name}\nEmail: ${formData.email}`)) {
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
                                                                                                cpf: "123.456.789-00 (Simulated)",
                                                                                                cardLast4: "4242"
                                                                                            }
                                                                                        })
                                                                                    });

                                                                                    if (res.ok) {
                                                                                        localStorage.setItem('bsf_plan_just_activated', 'true');
                                                                                        onStart({
                                                                                            name: formData.name,
                                                                                            email: formData.email,
                                                                                            phone: formData.phone
                                                                                        }, bookData);
                                                                                    } else {
                                                                                        const txt = await res.text();
                                                                                        alert(`❌ Server Error (${res.status}):\n${txt}`);
                                                                                    }
                                                                                } catch (err: any) {
                                                                                    alert(`❌ Connection Error:\n\nAttempt at: ${url}\nError: ${err.message}\n\nCheck if the backend is running and accessible.`);
                                                                                }
                                                                            }
                                                                        }}
                                                                        className="w-full bg-green-600/80 hover:bg-green-600 text-white font-bold py-3 rounded-lg text-sm shadow transition-all flex items-center justify-center gap-2"
                                                                    >
                                                                        <span>✅</span> SIMULATE APPROVAL (DEV)
                                                                    </button>
                                                                </div>

                                                                <div className="text-xs text-slate-500 text-center mt-2">
                                                                    Monitored email: <span className="text-yellow-500 font-mono">{formData.email}</span>
                                                                    {paymentConfirmed ? <span className="text-green-500 ml-2 font-bold">✅ Approved</span> : <span className="text-red-500 ml-2">⏳ Waiting</span>}
                                                                </div>
                                                                <p className="text-center text-gray-500 text-xs mt-1">
                                                                    Waiting for confirmation...
                                                                </p>
                                                            </div>
                                                        );
                                                    }

                                                    return null;
                                                })()}

                                                {
                                                    !paymentConfirmed && (
                                                        <div className="mt-4 text-center space-y-3">
                                                            <p className="text-xs md:text-sm text-slate-300 mb-6 leading-relaxed font-medium">
                                                                AFTER MAKING THE PAYMENT, RETURN TO THIS PAGE AND <strong className="text-yellow-400">CLICK THE BUTTON BELOW</strong> IF YOU ARE NOT AUTOMATICALLY REDIRECTED TO THE VIP MEMBERS AREA.
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={async (e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    const btn = e.currentTarget;
                                                                    const originalText = btn.innerText;
                                                                    (btn as any).innerText = 'Verifying...';
                                                                    btn.disabled = true;

                                                                    try {
                                                                        const getApiBase = () => {
                                                                            const env = (import.meta as any).env.VITE_API_URL;
                                                                            if (env) return env;
                                                                            const host = window.location.hostname;
                                                                            if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3000';
                                                                            return window.location.origin;
                                                                        };
                                                                        let API_URL = getApiBase();
                                                                        if (API_URL.endsWith('/')) API_URL = API_URL.slice(0, -1);

                                                                        console.log("Manual Check Triggered via:", API_URL);

                                                                        const res = await fetch(`${API_URL}/api/payment/access?email=${formData.email.trim()}&_t=${Date.now()}`);
                                                                        const data = await res.json();

                                                                        if (data.plan && data.plan.status === 'ACTIVE') {
                                                                            if (data.latestInvoiceNumber && data.latestInvoiceStatus !== 'CONFIRMED' && data.latestInvoiceStatus !== 'RECEIVED') {
                                                                                alert('Payment not yet detected. If you have already paid, please wait a few minutes and try again.');
                                                                                return;
                                                                            }
                                                                            window.location.href = '/login';
                                                                            return;
                                                                        }

                                                                        if (data.hasAccess) {
                                                                            // Avulso confirmed! Redirect to App Dashboard
                                                                            setPaymentConfirmed(true);
                                                                            paymentConfirmedRef.current = true;
                                                                            onStart({
                                                                                name: formData.name,
                                                                                email: formData.email,
                                                                                phone: formData.phone
                                                                            });
                                                                        } else {
                                                                            alert('Payment not yet detected. If you have already paid, please wait a few minutes and try again.');
                                                                        }

                                                                    } catch (err) {
                                                                        console.error(err);
                                                                        alert('Error connecting. Please try again.');
                                                                    } finally {
                                                                        btn.innerText = originalText;
                                                                        btn.disabled = false;
                                                                    }
                                                                }}
                                                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black text-lg md:text-xl py-4 px-6 rounded-xl shadow-lg shadow-yellow-500/20 transition-all transform hover:-translate-y-1 hover:shadow-yellow-500/40 flex items-center justify-center gap-2"
                                                            >
                                                                <CheckCircle className="w-6 h-6" />
                                                                I HAVE ALREADY PAID
                                                            </button>
                                                        </div>
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
                                            <h2 className="text-2xl font-bold text-white mb-2">Formatting Your Book</h2>
                                            <p className="text-slate-400 text-sm">
                                                Please wait while our AI processes your file...
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
                                                <div className="mb-8 animate-bounce">
                                                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-2">
                                                        <Check className="w-10 h-10 text-white" />
                                                    </div>
                                                    <h3 className="text-2xl font-black text-white">CONGRATULATIONS!</h3>
                                                    <p className="text-slate-400 text-sm">Your book has been successfully generated.</p>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        const base = (import.meta as any).env.VITE_API_URL || window.location.origin;
                                                        window.open(`${base}/api/admin/books/${formData.email}`, '_blank');
                                                        setIsRewardModalOpen(true);
                                                    }}
                                                    className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-green-500/20 text-xl flex items-center justify-center gap-3 w-full"
                                                >
                                                    <span>⬇️</span>
                                                    DOWNLOAD FORMATTED BOOK
                                                </button>
                                                <p className="text-slate-500 text-xs mt-4 mb-6">We've also sent a copy to your email.</p>

                                                <button
                                                    onClick={() => {
                                                        setDiagramStep(0);
                                                        setStep(2); // Topic selection
                                                        setIsWizardOpen(false);
                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                    }}
                                                    className="w-full border-2 border-slate-700 hover:border-yellow-400 text-slate-400 hover:text-yellow-400 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 mb-8"
                                                >
                                                    ✏️ I WANT TO WRITE ANOTHER BOOK
                                                </button>

                                                {/* SERVIÇOS EXTRAS UNLOCKED */}
                                                <div className="pt-8 border-t border-slate-700 animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                                                    <div className="mb-6">
                                                        <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 uppercase tracking-widest mb-1">MARKET PRODUCT</h3>
                                                        <p className="text-slate-400 text-xs">Transform your manuscript into a professional Best Seller:</p>
                                                    </div>

                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                                        {[
                                                            { key: 'livro-ingles', icon: '🇺🇸', title: 'English Edition', price: 24.99 },
                                                            { key: 'capa-impressa', icon: '🎨', title: 'Professional Cover', price: 250.00 },
                                                            { key: 'amazon-impresso', icon: '📦', title: 'Publish on Amazon', price: 69.90 },
                                                            { key: 'pacote-completo', icon: '🔥', title: 'Bestseller Kit', price: 599.90 },
                                                        ].map(svc => (
                                                            <div key={svc.key} className="bg-slate-900/50 border border-slate-700 p-3 rounded-xl flex items-center gap-3 hover:border-emerald-500/50 transition cursor-pointer group" onClick={() => {
                                                                document.getElementById('servicos-extras')?.scrollIntoView({ behavior: 'smooth' });
                                                                setIsWizardOpen(false); // Close wizard to show landing section
                                                            }}>
                                                                <div className="text-xl">{svc.icon}</div>
                                                                <div className="flex-1">
                                                                    <div className="font-bold text-white text-xs group-hover:text-emerald-400 transition">{svc.title}</div>
                                                                    <div className="text-[10px] text-slate-500">$ {svc.price.toFixed(2)}</div>
                                                                </div>
                                                                <div className="text-slate-600 group-hover:text-emerald-400 text-xs">➔</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {step === 4 && (
                                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl animate-fade-in text-center">
                                        <div className="inline-block p-4 bg-green-500/10 rounded-full mb-6">
                                            <CheckCircle className="w-16 h-16 text-green-400" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-white mb-2">Gift Card Active!</h2>
                                        <p className="text-slate-400 mb-8">
                                            Your credit has been confirmed and is valid for <b>30 days</b>.
                                        </p>

                                        <div className="bg-slate-900 p-6 rounded-xl border border-slate-700 mb-8 text-left">
                                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Link to Send to Recipient:</label>
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
                                                    Copy
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 mt-2">
                                                * Forward this link to the person. They will be able to generate the book for free.
                                            </p>
                                        </div>

                                        <button onClick={() => window.location.reload()} className="text-slate-400 hover:text-white underline">
                                            Back to Home
                                        </button>
                                    </div>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            )
            }

            {/* --- HERO SECTION --- (CENTERED & COMPACT) */}
            <main className="relative pt-12 pb-16 px-6 overflow-hidden min-h-[95vh] flex flex-col justify-center">
                {/* Background Decor */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[400px] bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none"></div>

                <div className="max-w-6xl mx-auto text-center relative z-10 w-full">
                    <div className="flex flex-col items-center space-y-6 animate-fade-in-up">

                        {/* 1. Persuasive Text Content */}
                        <div className="max-w-4xl space-y-3">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] animate-one-time-fade-in">
                                <Star className="w-3 h-3 fill-current" />
                                <span>{lang === 'pt' ? 'Escala & Liberdade Financeira' : lang === 'en' ? 'Scale & Financial Freedom' : 'Escala y Libertad Financiera'}</span>
                            </div>

                            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-white leading-[1.15] tracking-tighter">
                                <span className="block text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
                                    {translations[lang].heroTitle}
                                </span>
                                <span className="block text-yellow-400 text-glow">
                                    {translations[lang].heroSubtitle}
                                </span>
                            </h1>

                            <p className="text-base md:text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
                                {translations[lang].heroDesc}
                            </p>
                        </div>

                        {/* 2. Centered Video Content */}
                        <div className="w-full max-w-4xl relative animate-fade-in" style={{ animationDelay: '300ms' }}>
                            {/* Glow behind video */}
                            <div className="absolute -inset-4 bg-yellow-500/5 blur-3xl rounded-[3rem] pointer-events-none"></div>

                            {/* Video Container */}
                            <div className="relative glass-panel rounded-2xl p-2 shadow-[0_20px_80px_rgba(0,0,0,0.8)] border border-white/5 overflow-hidden transform hover:scale-[1.005] transition-all duration-700">
                                <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-white/5">
                                    <iframe
                                        className="w-full h-full"
                                        src="https://www.youtube.com/embed/6i_teiiQVsg?autoplay=1&mute=1&controls=1&modestbranding=1&rel=0&showinfo=0&loop=1&playlist=6i_teiiQVsg"
                                        title="Best Seller Factory"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </div>
                        </div>

                        {/* 3. Button Below Video with Pulse Effect */}
                        <div className="flex flex-col items-center gap-4 pt-2 w-full max-w-md mx-auto">
                            <button
                                onClick={() => document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' })}
                                className="group relative bg-yellow-500 hover:bg-yellow-400 text-slate-900 text-lg font-black px-12 py-5 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 hover:scale-[1.03] flex items-center justify-center gap-3 w-full animate-pulse-gold"
                            >
                                <Zap className="w-6 h-6 fill-current group-hover:rotate-12 transition-transform" />
                                {translations[lang].heroButton}
                            </button>

                            <div className="flex items-center gap-4 opacity-60">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-green-400 font-mono text-[10px] font-black tracking-widest uppercase">
                                        {lang === 'pt' ? 'Sistema Online' : 'System Online'}
                                    </span>
                                </div>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">
                                    +1,200 Books Generated this Month
                                </p>
                            </div>
                        </div>
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
                        "Having a book is the ultimate authority in any niche. It's what separates the amateurs from the experts. And now, that authority is within your reach for the price of a snack."
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

            {/* --- COMPRA AVULSA (ONE-OFF) --- */}
            <section className="py-24 bg-slate-900 border-t border-slate-800 relative overflow-hidden" id="planos">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
                <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-10 md:p-16 border border-slate-700 shadow-2xl relative">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/5 blur-[100px] rounded-full"></div>

                        <span className="inline-block bg-yellow-500/10 text-yellow-500 text-xs font-black px-4 py-2 rounded-full border border-yellow-500/20 uppercase tracking-widest mb-6">
                            Lifetime Access to Technology - No Monthly Fee
                        </span>

                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-white leading-tight">
                            Generate Your Future Best Seller Now
                        </h2>

                        <p className="text-slate-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
                            Immediate access to create your Future Best Seller with no monthly fee. Ideal for high-quality one-off projects.
                        </p>

                        <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-10">
                            <div className="text-center md:text-left">
                                <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">One-time Payment</p>
                                <div className="flex items-end gap-1">
                                    <span className="text-slate-400 text-2xl font-bold mb-2">$</span>
                                    <span className="text-7xl font-black text-white tracking-tight">39.90</span>
                                </div>
                            </div>

                            <div className="h-20 w-px bg-slate-700 hidden md:block"></div>

                            <ul className="text-left space-y-3">
                                {[
                                    '1 Complete Book (Up to 12 Chapters and +170 pages)',
                                    '1 Free Translation per Month (English or Spanish)',
                                    'Advanced AI Research and VIP Content',
                                    'Professional Layout Design Included',
                                    'Export in Editable WORD only',
                                    'One-time Payment Without Renewal'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-3 text-slate-300">
                                        <Check className="w-5 h-5 text-yellow-500" />
                                        <span className="font-medium">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <button
                            onClick={() => window.open('https://pay.kiwify.com/DdposAY', '_blank')}
                            className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-5 px-12 rounded-2xl text-xl shadow-xl shadow-yellow-500/20 transition-all transform hover:scale-[1.03] active:scale-[0.98] w-full md:w-auto"
                        >
                            YOUR WORK READY FOR ONLY $ 39.90
                        </button>

                        <p className="mt-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Secure Payment via Kiwify (Card or Bank Transfer)
                        </p>
                    </div>
                </div>
            </section>

            {/* SEÇÃO DE AFILIADOS */}
            <section className="py-24 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900 relative overflow-hidden border-t border-indigo-500/20 text-center">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[120px] pointer-events-none"></div>

                <div className="max-w-4xl mx-auto px-4 relative z-10">
                    <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-4 py-1.5 rounded-full text-sm font-bold tracking-widest uppercase mb-6 shadow-sm shadow-indigo-500/10">
                        <span>🤝</span> PROFITABLE PARTNERSHIP
                    </div>

                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                        Become an <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Affiliate</span> and Earn Money
                    </h2>

                    <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Recommend Best Seller Factory technology and earn a <strong className="text-white">40% commission ($ 13.53)</strong> for each one-off credit sold through your link.
                    </p>

                    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8 md:p-12 shadow-2xl inline-block max-w-2xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-left mb-8">
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">High Commission</h3>
                                <p className="text-slate-400">Receive $ 13.53 directly in your Kiwify account for each successful referral.</p>
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-white mb-2">High Conversion</h3>
                                <p className="text-slate-400">Unique product on the market. The offer practically sells itself to authors and aspirants.</p>
                            </div>
                        </div>

                        <a
                            href="https://dashboard.kiwify.com/join/affiliate/BSkFJDW1"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white font-black text-xl py-5 px-10 rounded-2xl shadow-xl shadow-indigo-500/30 transition-all transform hover:scale-[1.05] active:scale-[0.98]"
                        >
                            🔗 I WANT TO BE AN AFFILIATE NOW
                        </a>
                        <p className="text-xs text-slate-500 mt-4 uppercase tracking-widest font-bold">Processed via Kiwify</p>
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
                                QUERO DIAGRAMAR MEU LIVRO ($ 24,99)
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


            {/* ═══════════════════════════════════════════════════════════
                SEÇÃO: SERVIÇOS EXTRAS
                ═══════════════════════════════════════════════════════════ */}
            <section id="servicos-extras" className="py-24 bg-slate-950 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950"></div>
                <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"></div>
                <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700/30 to-transparent"></div>




                <div className="relative max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="inline-block bg-emerald-500/10 text-emerald-400 text-xs font-black px-4 py-2 rounded-full border border-emerald-500/20 uppercase tracking-widest mb-4">
                            Professional Extra Services
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
                            Transform Your Book into a{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                Market Product
                            </span>
                        </h2>
                        <p className="text-slate-400 text-lg max-w-3xl mx-auto">
                            The same services available after your book is generated. Hire separately or in a discounted Complete Package.{' '}
                            <span className="text-emerald-400 font-semibold">After payment, you will receive all instructions to start the work by email.</span>
                        </p>
                    </div>

                    {/* GRID ORGANIZADO POR CATEGORIA */}

                    {/* ── TRADUÇÃO ── */}
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-blue-500/20 border border-blue-500/30 rounded-xl flex items-center justify-center text-xl">🌍</div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Translation</h3>
                            <div className="flex-1 h-px bg-blue-500/20"></div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {([
                                { key: 'livro-ingles', icon: '🇺🇸', title: 'Book in English', subtitle: 'Professional translation with literary AI', price: 24.99, features: ['100% content translation', 'Naturalness and style review', 'Ready-to-use formatted DOCX file', 'Delivery within 5 business days'], href: products.trans_en },
                                { key: 'livro-espanhol', icon: '🇪🇸', title: 'Book in Spanish', subtitle: 'Professional translation with literary AI', price: 24.99, features: ['100% content translation', 'Naturalness and style review', 'Ready-to-use formatted DOCX file', 'Delivery within 5 business days'], href: products.trans_es },
                            ] as const).map(svc => (
                                <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc} accentColor="blue" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={trackInitiateCheckout} />
                            ))}
                        </div>
                    </div>

                    {/* ── DESIGN DE CAPA ── */}
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-xl flex items-center justify-center text-xl">🎨</div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Cover Design</h3>
                            <div className="flex-1 h-px bg-purple-500/20"></div>
                        </div>
                        <div className="grid sm:grid-cols-2 gap-6">
                            {([
                                { key: 'capa-impressa', icon: '📗', title: 'Cover — Printed Book', subtitle: 'Professional design for KDP / UICLAP printing', price: 250.00, features: ['Exact dimensions for printing', 'Cover + Spine + Back Cover', 'High-resolution PDF file', 'Revisions included'], href: products.cover_card },
                                { key: 'capa-digital', icon: '📱', title: 'Cover — Digital Book (Ebook)', subtitle: 'Design optimized for Amazon Kindle and digital stores', price: 149.90, features: ['1600×2560px size', 'High-quality JPG and PNG', 'Optimized for digital catalogs', 'Revisions included'], href: products.cover_ebook },
                            ] as const).map(svc => (
                                <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc} accentColor="purple" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={trackInitiateCheckout} />
                            ))}
                        </div>
                    </div>

                    {/* ── PUBLICAÇÃO ── */}
                    <div className="mb-12">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-orange-500/20 border border-orange-500/30 rounded-xl flex items-center justify-center text-xl">🚀</div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Publication</h3>
                            <div className="flex-1 h-px bg-orange-500/20"></div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-6">
                            {([
                                { key: 'amazon-impresso', icon: '📦', title: 'Amazon KDP — Printed', subtitle: 'Publication of the physical book in the world\'s largest bookstore', price: 69.90, features: ['KDP upload and setup', 'Format and margin review', 'Available for global sale', 'Pricing guidance'], href: products.pub_amazon_printed },
                                { key: 'amazon-digital', icon: '📲', title: 'Amazon KDP — Digital', subtitle: 'Kindle ebook publication on Amazon', price: 59.90, features: ['KDP upload and setup', 'Mobi/epub file review', 'Available in 12+ countries', 'Royalties guidance'], href: products.pub_amazon_digital },
                                { key: 'uiclap-impresso', icon: '🇧🇷', title: 'UICLAP — Printed', subtitle: 'Publication on the largest Brazilian editorial platform', price: 59.90, features: ['UICLAP registration and upload', 'Format and cover review', 'Available for print-on-demand', 'Editorial process support'], href: products.pub_uiclap },
                            ] as const).map(svc => (
                                <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc} accentColor="orange" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={trackInitiateCheckout} />
                            ))}
                        </div>
                    </div>

                    {/* ── REGISTROS LEGAIS ── */}
                    <div className="mb-16">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-center text-xl">📋</div>
                            <h3 className="text-xl font-black text-white uppercase tracking-widest">Legal Registrations</h3>
                            <div className="flex-1 h-px bg-amber-500/20"></div>
                        </div>
                        <div className="grid sm:grid-cols-3 gap-6">
                            {([
                                { key: 'ficha-catalografica', icon: '🗂️', title: 'CIP Data', subtitle: 'Mandatory for publication in printing houses and publishers', price: 59.90, features: ['AACR2 / RDA standard', 'Issued by a licensed librarian', 'Deadline: up to 3 business days', 'PDF file to insert into the book'], href: products.catalog_card },
                                { key: 'isbn-impresso', icon: '📘', title: 'ISBN — Printed Book', subtitle: 'Official registration in the Brazilian Book Chamber', price: 49.90, features: ['Unique ISBN number for the book', 'CBL registration', 'Barcode included', 'Deadline: up to 15 business days'], href: products.isbn_printed },
                                { key: 'isbn-digital', icon: '📗', title: 'ISBN — Digital Book', subtitle: 'Official digital edition registration in the CBL', price: 49.90, features: ['Unique ISBN number for the ebook', 'CBL registration', 'Barcode included', 'Deadline: up to 15 business days'], href: products.isbn_digital },
                            ] as const).map(svc => (
                                <ExtraServiceCard key={svc.key} serviceId={svc.key} {...svc} accentColor="amber" formData={formData} getApiBase={getApiBase} trackInitiateCheckout={trackInitiateCheckout} />
                            ))}
                        </div>
                    </div>

                    {/* ── PACOTE COMPLETO ── */}
                    <div className="relative bg-gradient-to-br from-emerald-900/30 via-slate-800/60 to-slate-900 border-2 border-emerald-500/40 rounded-3xl p-10 shadow-2xl shadow-emerald-900/20">
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-900 text-sm font-black px-8 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/30">
                            🔥 BIGGEST SAVINGS — COMPLETE PACKAGE
                        </div>

                        <div className="grid md:grid-cols-2 gap-10 items-center mt-4">
                            <div>
                                <h3 className="text-3xl font-black text-white mb-3">All in One Single Package</h3>
                                <p className="text-slate-400 mb-6 text-lg leading-relaxed">
                                    Translation (EN + ES) + Printed Cover + Amazon Publication + ISBN + CIP Data. Everything you need to transform your book into a professional market product.
                                </p>
                                <ul className="grid grid-cols-2 gap-3">
                                    {[
                                        '🌍 English Translation', '🇪🇸 Spanish Translation',
                                        '📗 Professional Cover', '🚀 Amazon Publication',
                                        '🔢 Printed ISBN', '🗂️ CIP Data',
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="text-center">
                                <p className="text-slate-500 text-sm uppercase tracking-widest mb-2">Total investment</p>
                                <div className="flex justify-center items-end gap-2 mb-2">
                                    <span className="text-slate-400 text-2xl mb-2">$</span>
                                    <span className="text-7xl font-black text-white tracking-tighter">599.90</span>
                                </div>
                                <p className="text-emerald-400 text-sm font-bold mb-8">Save more than $ 300.00 by hiring the complete combo!</p>
                                <ExtraServiceBuyButton
                                    serviceKey="pacote-completo"
                                    serviceName="Complete Services Package"
                                    price={599.90}
                                    label="Hire Complete Package"
                                    accentClass="bg-emerald-500 hover:bg-emerald-400 text-slate-900 shadow-emerald-500/30"
                                    formData={formData}
                                    getApiBase={getApiBase}
                                    trackInitiateCheckout={trackInitiateCheckout}
                                    href={products.complete_package}
                                />
                                <p className="mt-4 text-xs text-slate-500 flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-4 h-4" /> Secure Payment via Kiwify (Card, Stripe, Bank Transfer)
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 text-center">
                        <p className="text-slate-500 text-sm">
                            📧 <strong className="text-slate-400">Once payment is confirmed</strong>, our team will contact you at the registered email address with all the instructions to start the work.
                        </p>
                    </div>
                </div>
            </section>

            <footer className="py-12 text-center text-slate-600 border-t border-slate-800">
                <SocialShare className="mb-8" />
                <p>&copy; {new Date().getFullYear()} Best Seller Factory. {t[lang].footer.rights}</p>
                <div className="flex justify-center gap-4 text-xs mt-4">
                    <a href="/privacy-policy" className="hover:text-white transition">{t[lang].footer.privacy}</a>
                    <span>•</span>
                    <a href="/terms-of-use" className="hover:text-white transition">{t[lang].footer.terms}</a>
                </div>
                <Disclaimer />
            </footer>

            {
                showPlanCelebration && celebratedPlan && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="bg-slate-800 border border-indigo-500/30 p-8 rounded-2xl max-w-lg w-full text-center relative shadow-2xl shadow-indigo-500/20 animate-in zoom-in-95 duration-300">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 p-4 rounded-full shadow-lg">
                                <span className="text-4xl">🎉</span>
                            </div>

                            <h2 className="text-3xl font-black text-white mt-8 mb-4">
                                CONGRATULATIONS! <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                    YOU ARE NOW A SUBSCRIBER!
                                </span>
                            </h2>

                            <div className="bg-indigo-900/30 p-4 rounded-xl border border-indigo-500/20 mb-6">
                                <p className="text-indigo-200 font-bold text-lg mb-1">{celebratedPlan.name}</p>
                                <p className="text-sm text-indigo-300/70 uppercase tracking-widest">{celebratedPlan.billing === 'annual' ? 'Annual Plan' : 'Monthly Plan'}</p>
                            </div>

                            <p className="text-slate-300 text-lg mb-8 leading-relaxed">
                                We've just unlocked your plan's exclusive conditions and the
                                <span className="text-yellow-400 font-bold"> Promotional Generation Fee ({
                                    celebratedPlan.name === 'BLACK' ? '$ 9.90' :
                                        celebratedPlan.name === 'PRO' ? '$ 18.90' :
                                            '$ 28.90'
                                })</span>.
                            </p>

                            <button
                                onClick={() => {
                                    setShowPlanCelebration(false);
                                    if (onLoginClick) onLoginClick();
                                    else window.location.href = '/login';
                                }}
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-900/40 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                ACCESS VIP SUBSCRIBER MEMBER AREA
                            </button>
                        </div>
                    </div>
                )
            }
            <RewardModal
                isOpen={isRewardModalOpen}
                onClose={() => setIsRewardModalOpen(false)}
                onClaim={handleNewBook}
            />

            {/* WhatsApp Floating Button */}
            <a
                href="https://w.app/fabricadebestseller"
                target="_blank"
                rel="noopener noreferrer"
                className="fixed bottom-8 right-8 z-[90] bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-2xl shadow-green-500/20 transition-all transform hover:scale-110 active:scale-95 flex items-center justify-center group"
                title="Contact us on WhatsApp"
            >
                <WhatsApp className="w-8 h-8" />

                {/* Tooltip text hidden on mobile, visible on hover on larger screens */}
                <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-3 transition-all duration-500 font-bold">
                    WhatsApp Support
                </span>

                {/* Pulsing ring */}
                <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none"></span>
            </a>

        </div >

    );
};


export default LandingPageEnglish;
