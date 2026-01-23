import React, { useState, useEffect } from 'react';
import { StepWizard } from './components/StepWizard';
import { InputForm } from './components/InputForm';
import { Generator } from './components/Generator';
import { Admin } from './components/Admin';
import LandingPage from './components/LandingPage';
import { Login } from './components/Login';         // NEW
import { Dashboard } from './components/Dashboard'; // NEW
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

  // VIEW STATE: 'landing' | 'login' | 'dashboard' | 'generator'
  const [currentView, setCurrentView] = useState(() => {
    if (window.location.pathname === '/login') return 'login';
    if (localStorage.getItem('bsf_hasAccess') === 'true') return 'dashboard'; // Default to dashboard if logged in
    return 'landing';
  });

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
      let isJustActivated = false;
      if (localStorage.getItem('bsf_plan_just_activated') === 'true') {
        setShowWelcome(true);
        localStorage.removeItem('bsf_plan_just_activated');
        isJustActivated = true;
      }

      // If we are in 'landing' but have access, force dashboard (unless user explicitly went to login/admin)
      if (currentView === 'landing') setCurrentView('dashboard');
    }
  }, [hasAccess, userContact, currentView]);

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
    localStorage.removeItem('bsf_token'); // Clear token
    setStep(1);
    setMetadata({
      authorName: '',
      topic: '',
      dedication: ''
    });
    setLandingProps(props);
    setHasAccess(false);
    setCurrentView('landing');
    if (window.location.pathname !== '/') window.history.pushState({}, '', '/');
  };

  const updateMetadata = (data: Partial<BookMetadata>) => {
    setMetadata(prev => ({ ...prev, ...data }));
  };

  const handleStart = (contactInfo: any, initialData?: any) => {
    setUserContact(contactInfo);
    setHasAccess(true);
    setCurrentView('dashboard'); // Redirect to Dashboard instead of Generator directly

    if (initialData && initialData.topic) {
      // If data was passed (e.g. from Landing Page), maybe prepopulate but let Dashboard trigger generation
      // Or if we want immediate generation:
      // setCurrentView('generator'); 
      // But user asked for Dashboard flow
    }
  };

  const handleLoginSuccess = (data: any) => {
    setUserContact({
      name: data.user.name,
      email: data.user.email
    });
    localStorage.setItem('bsf_token', data.token);
    setHasAccess(true);
    setCurrentView('dashboard');
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

  if (path === '/privacy-policy' || path === '/politica-privacidade') return <PrivacyPolicy />;
  if (path === '/terms' || path === '/termos-uso' || path === '/terms-of-use') return <TermsOfUse />;

  // RENDER VIEWS
  if (currentView === 'login') {
    return (
      <Login
        onLogin={handleLoginSuccess}
        onBack={() => setCurrentView('landing')}
        onForgotPassword={() => alert("Entre em contato com o suporte para recuperar sua senha.")}
      />
    );
  }

  if (currentView === 'dashboard') {
    return (
      <Dashboard
        user={userContact}
        onLogout={resetApp}
        onNewBook={() => {
          setStep(1); // Reset wizard
          setCurrentView('generator');
        }}
      />
    );
  }

  if (currentView === 'generator' && hasAccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-fade-in">
        {/* Simple Header for Generator */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-xl">⬅</span>
              <span className="font-bold text-slate-800">Voltar ao Dashboard</span>
            </button>
          </div>
        </header>

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
                onReset={() => setCurrentView('dashboard')} // Go back to dash
                language={lang}
                userContact={userContact}
                setAppStep={setStep}
              />
            </ErrorBoundary>
          )}
        </main>
      </div>
    );
  }

  // DEFAULT: LANDING PAGE
  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      <ErrorBoundary>
        <LandingPage
          onStart={handleStart}
          onAdmin={() => setShowAdmin(true)}
          lang={lang}
          setLang={setLang}
          initialState={landingProps}
          onLoginClick={() => setCurrentView('login')} // NEW PROP
        />
      </ErrorBoundary>

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