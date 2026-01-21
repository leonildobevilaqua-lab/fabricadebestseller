import React, { useState, useEffect } from 'react';
import { StepWizard } from './components/StepWizard';
import { InputForm } from './components/InputForm';
import { Generator } from './components/Generator';
import { Admin } from './components/Admin';
import LandingPage from './components/LandingPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageContext } from './i18n/context';
import { pt, en, es } from './i18n/locales';
import { BookMetadata } from './types';

import { WelcomeModal } from './components/WelcomeModal';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfUse } from './components/TermsOfUse';

const App: React.FC = () => {
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>(() => (localStorage.getItem('bsf_lang') as any) || 'pt');

  // Translation Helper
  const translations = { pt, en, es };
  const t = translations[lang];

  const [hasAccess, setHasAccess] = useState(() => localStorage.getItem('bsf_hasAccess') === 'true');
  const [userContact, setUserContact] = useState<any>(() => {
    try { return JSON.parse(localStorage.getItem('bsf_userContact') || 'null'); } catch { return null; }
  });
  const [landingProps, setLandingProps] = useState<any>(null);

  const [step, setStep] = useState(() => Number(localStorage.getItem('bsf_step') || 1));
  const [showAdmin, setShowAdmin] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [metadata, setMetadata] = useState<BookMetadata>(() => {
    try {
      return JSON.parse(localStorage.getItem('bsf_metadata') || 'null') || { authorName: '', topic: '', dedication: '' };
    } catch {
      return { authorName: '', topic: '', dedication: '' };
    }
  });

  // PERSISTENCE EFFECTS
  useEffect(() => localStorage.setItem('bsf_lang', lang), [lang]);
  useEffect(() => {
    if (hasAccess) {
      localStorage.setItem('bsf_hasAccess', 'true');
      localStorage.setItem('bsf_step', String(step));
      if (userContact) localStorage.setItem('bsf_userContact', JSON.stringify(userContact));
      if (metadata) localStorage.setItem('bsf_metadata', JSON.stringify(metadata));
    }
  }, [hasAccess, userContact, step, metadata]);

  // SELF-HEALING: Validate Access on Load to prevent "Stuck" states
  useEffect(() => {
    if (hasAccess && userContact?.email) {
      // Check for JUST ACTIVATED flag
      if (localStorage.getItem('bsf_plan_just_activated') === 'true') {
        setShowWelcome(true);
        localStorage.removeItem('bsf_plan_just_activated');
      }

      // Create a specific check to verify if this user SHOULD be here
      fetch(`/api/payment/check-access?email=${userContact.email}`)
        .then(r => r.json())
        .then(d => {
          // If backend says NO access, but frontend has Access, it means state is dirty.
          if (d.success && !d.hasAccess) {
            console.warn("State Mismatch: Backend denies access. Resetting App.");
            resetApp();
          }
        })
        .catch(e => console.error("Access Check Failed", e));
    }
  }, [hasAccess, userContact]); // Run on change of access/contact

  // HANDLE EXTERNAL RESET (e.g. from Admin "Voltar ao App")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new_session') === 'true') {
      console.log("New Session Requested via URL");
      resetApp();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const nextStep = () => setStep(prev => prev + 1);
  const resetApp = (props?: any) => {
    localStorage.removeItem('bsf_hasAccess');
    localStorage.removeItem('bsf_userContact');
    localStorage.removeItem('bsf_metadata');
    localStorage.removeItem('bsf_step');
    setStep(1);
    setMetadata({
      authorName: '',
      topic: '',
      dedication: ''
    });
    setLandingProps(props);
    setHasAccess(false); // Force re-check of credits/payment for next book
  };

  const updateMetadata = (data: Partial<BookMetadata>) => {
    setMetadata(prev => ({ ...prev, ...data }));
  };

  const handleStart = (contactInfo: any, initialData?: any) => {
    setUserContact(contactInfo);
    setHasAccess(true);

    if (initialData && initialData.topic) {
      setMetadata(prev => ({
        ...prev,
        authorName: initialData.authorName || contactInfo.name,
        topic: initialData.topic
      }));
      setStep(2); // Skip InputForm, go straight to Generator
    } else {
      setMetadata(prev => ({ ...prev, authorName: contactInfo.name }));
    }
  };

  // Simple Router Check
  const path = window.location.pathname;
  if (path === '/admin' || showAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Admin onBack={() => {
          resetApp();
          setShowAdmin(false);
          if (path === '/admin') window.location.href = '/';
        }} />
      </div>
    )
  }

  if (path === '/privacy-policy' || path === '/politica-privacidade') {
    return <PrivacyPolicy />;
  }

  if (path === '/terms' || path === '/termos-uso' || path === '/terms-of-use') {
    return <TermsOfUse />;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {!hasAccess ? (
        <ErrorBoundary>
          <LandingPage
            onStart={handleStart}
            onAdmin={() => setShowAdmin(true)}
            lang={lang}
            setLang={setLang}
            initialState={landingProps} // Pass Upsell State
          />
        </ErrorBoundary>
      ) : (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-fade-in">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <a href="/" onClick={(e) => { e.preventDefault(); resetApp(); }} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                <div className="bg-brand-600 text-white p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span className="font-serif font-bold text-xl text-slate-800">Fábrica de Best Sellers</span>
              </a>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    if (confirm(t.landing.confirmExit || "Deseja realmente sair? Todo o progresso não salvo será perdido.")) {
                      resetApp();
                    }
                  }}
                  className="text-xs font-bold text-red-400 hover:text-red-500 uppercase tracking-widest transition border border-red-200 hover:border-red-400 px-3 py-1 rounded-full"
                >
                  {lang === 'pt' ? 'Sair' : lang === 'es' ? 'Salir' : 'Exit'}
                </button>
                <div className="flex gap-2 mr-4">
                  <button onClick={() => setLang('pt')} className={`font-bold ${lang === 'pt' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>BR</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => setLang('en')} className={`font-bold ${lang === 'en' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>US</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => setLang('es')} className={`font-bold ${lang === 'es' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>ES</button>
                </div>
                <a
                  href="/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition"
                >
                  Admin
                </a>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-grow p-6 md:p-12">
            <StepWizard currentStep={step} />

            {step === 1 && (
              <InputForm
                metadata={metadata}
                setMetadata={setMetadata}
                onNext={nextStep}
              />
            )}

            {step >= 2 && (
              <ErrorBoundary>
                <Generator
                  metadata={metadata}
                  updateMetadata={updateMetadata}
                  onReset={resetApp}
                  language={lang}
                  userContact={userContact}
                  setAppStep={setStep}
                />
              </ErrorBoundary>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
            <p className="mb-2">© {new Date().getFullYear()} BestSeller Factory AI. ({lang.toUpperCase()})</p>
            <div className="flex justify-center gap-4 text-xs">
              <a href="/privacy-policy" className="hover:text-white transition">Política de Privacidade</a>
              <span>•</span>
              <a href="/terms-of-use" className="hover:text-white transition">Termos de Uso</a>
            </div>
          </footer>
        </div>
      )}
      {showWelcome && userContact && (
        <WelcomeModal
          onClose={() => setShowWelcome(false)}
          userEmail={userContact.email}
        />
      )}
    </LanguageContext.Provider>
  );
};

export default App;