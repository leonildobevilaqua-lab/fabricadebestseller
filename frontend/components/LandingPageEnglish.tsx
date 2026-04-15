import React, { useState, useEffect } from 'react';
import { pt, en, es } from '../i18n/locales';
import { SocialShare } from './SocialShare';
import { RewardModal } from './RewardModal';
import * as API from '../services/api';
import { trackInitiateCheckout, trackLead } from '../services/meta-pixel';
import Disclaimer from './Disclaimer';

// --- INLINE ICONS ---
const Zap = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>;
const BookOpen = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></svg>;
const X = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>;
const Check = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="20 6 9 17 4 12" /></svg>;
const ShieldCheck = (props: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 11 11 13 15 9" /></svg>;

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
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [step, setStep] = useState(0); 
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        countryCode: '+1',
        type: 'BOOK',
        lgpdConsent: false
    });
    const [bookData, setBookData] = useState({
        authorName: '',
        topic: ''
    });

    const [processingStage, setProcessingStage] = useState(0);
    const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

    useEffect(() => {
        if (step === 2) {
            const timer = setInterval(() => {
                setProcessingStage(prev => {
                    if (prev >= 4) {
                        clearInterval(timer);
                        setTimeout(() => setStep(3), 1000);
                        return 4;
                    }
                    return prev + 1;
                });
            }, 2000);
            return () => clearInterval(timer);
        }
    }, [step]);

    const processingStages = [
        "Sending data to the creative team...",
        "Connecting with Artificial Intelligence...",
        "Structuring your book's chapters...",
        "Formatting the content professionally...",
        "Finalizing the file for download..."
    ];

    const handleSaveLead = async () => {
        try {
            await fetch('/api/payment/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, ...bookData, tag: 'Id_avulso_en' })
            });
        } catch (e) {
            console.error("Error saving lead", e);
        }
    };

    return (
        <div className="min-h-screen font-sans bg-slate-900 text-slate-100 selection:bg-yellow-500 selection:text-slate-900 overflow-x-hidden">
            {/* --- HEADER --- */}
            <header className="fixed w-full z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <a href="/" className="flex items-center gap-2">
                        <BookOpen className="text-yellow-400 w-8 h-8" />
                        <span className="text-xl md:text-2xl font-bold text-white tracking-tight">Best Seller Factory</span>
                    </a>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center bg-slate-800 rounded-full p-1 border border-slate-700">
                            <button onClick={() => setLang('pt')} className={`px-3 py-1 text-xs font-bold rounded-full ${lang === 'pt' ? 'text-yellow-400 bg-slate-700' : 'text-slate-500'}`}>BR</button>
                            <button onClick={() => setLang('en')} className={`px-3 py-1 text-xs font-bold rounded-full ${lang === 'en' ? 'text-yellow-400 bg-slate-700' : 'text-slate-500'}`}>US</button>
                            <button onClick={() => setLang('es')} className={`px-3 py-1 text-xs font-bold rounded-full ${lang === 'es' ? 'text-yellow-400 bg-slate-700' : 'text-slate-500'}`}>ES</button>
                        </div>
                        <button onClick={onLoginClick} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold border border-white/10 transition">
                            MEMBERS LOGIN
                        </button>
                    </div>
                </div>
            </header>

            {/* --- WIZARD --- */}
            {isWizardOpen && (
                <div className="fixed inset-0 z-[60] bg-slate-900 overflow-y-auto animate-fade-in">
                    <div className="min-h-screen flex flex-col">
                        <div className="p-6 flex justify-between items-center border-b border-slate-800">
                            <div className="flex items-center gap-2">
                                <Zap className="text-yellow-400 w-6 h-6" />
                                <span className="font-bold">Create My Best Seller</span>
                            </div>
                            <button onClick={() => setIsWizardOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="flex-1 flex items-center justify-center p-6">
                            <div className="w-full max-w-xl">
                                {step === 0 && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-bold text-center">Personal Data</h2>
                                        <div className="space-y-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-900 border-slate-700 rounded-xl p-3" placeholder="Full Name" />
                                            <input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-900 border-slate-700 rounded-xl p-3" placeholder="Email Address" />
                                            <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-900 border-slate-700 rounded-xl p-3" placeholder="Phone Number" />
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input type="checkbox" checked={formData.lgpdConsent} onChange={e => setFormData({...formData, lgpdConsent: e.target.checked})} className="mt-1 w-5 h-5" />
                                                <span className="text-xs text-slate-400">I agree to the Terms and Privacy Policy.</span>
                                            </label>
                                        </div>
                                        <button onClick={() => { handleSaveLead(); setStep(2); }} disabled={!formData.name || !formData.email || !formData.lgpdConsent} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-4 rounded-xl text-lg transition disabled:opacity-50">
                                            CONTINUE
                                        </button>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="text-center space-y-8">
                                        <div className="relative w-24 h-24 mx-auto animate-spin border-4 border-yellow-500 border-t-transparent rounded-full"></div>
                                        <p className="text-xl font-medium text-slate-300">{processingStages[processingStage]}</p>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="text-center space-y-6 bg-slate-800 p-8 rounded-2xl border border-slate-700">
                                        <Zap className="w-12 h-12 text-yellow-500 mx-auto" />
                                        <h2 className="text-2xl font-bold">Ready to Launch!</h2>
                                        <p className="text-slate-400">Complete the R$ 39,90 payment to unlock automatic generation.</p>
                                        <button onClick={() => window.open('https://payment.ticto.app/O6CE296D4', '_blank')} className="w-full bg-green-500 hover:bg-green-400 text-white font-bold py-5 rounded-xl text-xl shadow-lg transition">
                                            PAY NOW R$ 39,90
                                        </button>
                                        <button onClick={() => setStep(1)} className="text-yellow-500 font-bold text-sm">ALREADY PAID? CLICK HERE TO START</button>
                                    </div>
                                )}

                                {step === 1 && (
                                    <div className="space-y-6">
                                        <h2 className="text-2xl font-bold text-center">About Your Book</h2>
                                        <div className="space-y-4 bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                                            <input value={bookData.authorName} onChange={e => setBookData({...bookData, authorName: e.target.value})} className="w-full bg-slate-900 border-slate-700 rounded-xl p-3" placeholder="Author's Name" />
                                            <textarea value={bookData.topic} onChange={e => setBookData({...bookData, topic: e.target.value})} className="w-full bg-slate-900 border-slate-700 rounded-xl p-3 h-32" placeholder="Book Topic/Subject..." />
                                        </div>
                                        <button onClick={() => onStart(formData, bookData)} disabled={!bookData.authorName || !bookData.topic} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-bold py-4 rounded-xl text-lg transition disabled:opacity-50">
                                            GENERATE BOOK NOW
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MAIN CONTENT --- */}
            <main className="pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight">
                        {translations[lang].heroTitle}
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
                        {translations[lang].heroDesc}
                    </p>
                    
                    <div className="aspect-video max-w-4xl mx-auto bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden mb-12 shadow-2xl">
                        <iframe className="w-full h-full" src="https://www.youtube.com/embed/6i_teiiQVsg" title="Video" frameBorder="0" allowFullScreen></iframe>
                    </div>

                    <button onClick={() => document.getElementById('offer')?.scrollIntoView({behavior: 'smooth'})} className="bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black px-12 py-5 rounded-2xl text-xl shadow-xl transition-all transform hover:scale-105 animate-pulse-gold">
                        {translations[lang].heroButton}
                    </button>
                </div>
            </main>

            <section id="offer" className="py-24 bg-slate-800/30 border-y border-slate-800">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] p-10 md:p-16 border border-slate-700 shadow-2xl text-center">
                        <span className="bg-yellow-500/10 text-yellow-500 text-xs font-black px-4 py-2 rounded-full border border-yellow-500/20 uppercase tracking-widest mb-6 inline-block">
                            Lifetime Access - One-Time Payment
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black mb-6">Generate Your Future Best Seller NOW</h2>
                        <div className="flex items-center justify-center gap-4 mb-10">
                            <span className="text-7xl font-black">R$ 39.90</span>
                        </div>
                        <ul className="text-left space-y-4 max-w-md mx-auto mb-10">
                            {['1 Complete Book with AI', 'Professional Formatting Included', 'Editable Word Export', 'Advanced Topic Research'].map((f, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <Check className="text-yellow-500 w-6 h-6" />
                                    <span className="text-slate-300 font-medium">{f}</span>
                                </li>
                            ))}
                        </ul>
                        <button onClick={() => window.open('https://payment.ticto.app/O6CE296D4', '_blank')} className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-5 rounded-2xl text-xl shadow-xl transition-all transform hover:scale-105">
                            I WANT MY BOOK FOR R$ 39.90
                        </button>
                        <p className="mt-6 text-slate-500 text-xs flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4" /> Secure Payment via Ticto
                        </p>
                    </div>
                </div>
            </section>

            <footer className="py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <BookOpen className="text-yellow-400 w-6 h-6" />
                        <span className="font-bold">Best Seller Factory</span>
                    </div>
                    <p className="text-slate-500 text-sm mb-6">© 2026 All rights reserved.</p>
                    <Disclaimer />
                </div>
            </footer>

            <RewardModal isOpen={isRewardModalOpen} onClose={() => setIsRewardModalOpen(false)} onRedeem={() => { setIsWizardOpen(true); setIsRewardModalOpen(false); }} />
        </div>
    );
};

export default LandingPageEnglish;
