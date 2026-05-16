import React, { useState, useEffect } from 'react';
import { StepWizard } from './components/StepWizard';
import { InputForm } from './components/InputForm';
import { Generator } from './components/Generator';
import { Admin } from './components/Admin';
import LandingPage from './components/LandingPage';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LanguageContext } from './i18n/context';
import { pt, en, es } from './i18n/locales';
import { BookMetadata } from './types';
import { trackPageView } from './services/meta-pixel';

import { WelcomeModal } from './components/WelcomeModal';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { TermsOfUse } from './components/TermsOfUse';
import { RegistrationUpsell } from './components/RegistrationUpsell';
import { AffiliationUpsell } from './components/AffiliationUpsell';
import LandingPageEnglish from './components/LandingPageEnglish';
import LandingPageSpanish from './components/LandingPageSpanish';
import Promocao from './components/Promocao';
import { SalesLandingV5 } from './components/SalesLandingV5';
import { SalesLandingV6 } from './components/SalesLandingV6';
import { SalesLandingV7 } from './components/SalesLandingV7';
import { ProfessionalCoverLanding } from './components/ProfessionalCoverLanding';
import CipGenerator from './components/CipGenerator';



const App: React.FC = () => {
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>(() => {
    const params = new URLSearchParams(window.location.search);
    const langParam = params.get('lang') as any;
    if (langParam && ['pt', 'en', 'es'].includes(langParam)) {
      localStorage.setItem('bsf_lang', langParam);
      return langParam;
    }
    return (localStorage.getItem('bsf_lang') as any) || 'pt';
  });

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
    if (window.location.pathname === '/factory') return 'generator';
    const savedView = localStorage.getItem('bsf_view');
    if (savedView) return savedView;
    if (localStorage.getItem('bsf_hasAccess') === 'true') return 'dashboard';
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
      localStorage.setItem('bsf_view', currentView);
      if (userContact) localStorage.setItem('bsf_userContact', JSON.stringify(userContact));
      if (metadata) localStorage.setItem('bsf_metadata', JSON.stringify(metadata));
    } else {
      localStorage.setItem('bsf_view', currentView);
    }
  }, [hasAccess, userContact, step, metadata, currentView]);

  // SELF-HEALING: Validate Access on Load to prevent "Stuck" states
  useEffect(() => {
    if (hasAccess && userContact?.email) {
      let isJustActivated = false;
      if (localStorage.getItem('bsf_plan_just_activated') === 'true') {
        setShowWelcome(true);
        localStorage.removeItem('bsf_plan_just_activated');
        isJustActivated = true;
      }
      if (currentView === 'landing') setCurrentView('dashboard');
    }
  }, [hasAccess, userContact, currentView]);

  // META PIXEL: PageView em cada mudança de view
  useEffect(() => {
    trackPageView();
  }, [currentView]);

  // HANDLE EXTERNAL RESET (e.g. from Admin "Voltar ao App")
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('new_session') === 'true') {
      console.log("New Session Requested via URL");
      resetApp();
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Handle Impersonation from Admin
    const impEmail = params.get('impersonate_email');
    const impName = params.get('impersonate_name');
    const impToken = params.get('impersonate_token');

    if (impEmail && impName && impToken) {
        console.log("👤 Impersonation Session Active:", impEmail);
        localStorage.setItem('bsf_token', impToken);
        localStorage.setItem('bsf_hasAccess', 'true');
        localStorage.setItem('bsf_view', 'dashboard');
        localStorage.setItem('bsf_userContact', JSON.stringify({
            name: impName,
            email: impEmail,
            phone: ''
        }));
        
        // Update local state
        setUserContact({ name: impName, email: impEmail, phone: '' });
        setHasAccess(true);
        setCurrentView('dashboard');
        
        // Clean URL
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
      email: data.user.email,
      phone: data.user.phone || data.user.profile?.phone || ''
    });
    localStorage.setItem('bsf_token', data.token);
    setHasAccess(true);
    setCurrentView('dashboard');
  };

  // RENDER VIEWS
  const renderContent = () => {
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
      );
    }

    if (path === '/privacy-policy' || path === '/politica-privacidade') return <PrivacyPolicy />;
    if (path === '/terms' || path === '/termos-uso' || path === '/terms-of-use') return <TermsOfUse />;
    if (path === '/registro') return <RegistrationUpsell />;
    if (path === '/afiliacao' || path === '/afiliado' || path === '/representante') return <AffiliationUpsell />;

    if (path === '/promocao') return <Promocao />;
    if (path === '/venda' || path === '/vsl' || path === '/v5') return <SalesLandingV5 onLoginClick={() => setCurrentView('login')} />;
    if (path === '/oficial' || path === '/v6') return <SalesLandingV6 onLoginClick={() => setCurrentView('login')} />;
    if (path === '/capa_profissional') return <ProfessionalCoverLanding />;
    if (path === '/ficha-catalografica' || path === '/cip') return <CipGenerator />;

    // NEW LANDING CATCHES
    if (path === '/english' || path === '/en' || path === '/us') {
      return (
        <ErrorBoundary>
          <LandingPageEnglish
            onStart={handleStart}
            onLoginClick={() => setCurrentView('login')}
          />
        </ErrorBoundary>
      );
    }

    if (path === '/espanol' || path === '/es') {
      return (
        <ErrorBoundary>
          <LandingPageSpanish
            onStart={handleStart}
            onLoginClick={() => setCurrentView('login')}
          />
        </ErrorBoundary>
      );
    }

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
      if (!userContact) {
        setHasAccess(false);
        setCurrentView('landing');
        return null;
      }
      return (
        <div className="flex-1 overflow-y-auto bg-slate-50/50" translate="no">
          <ErrorBoundary>
            <Dashboard
              user={userContact}
              onLogout={resetApp}
              onNewBook={() => {
                // RESET METADATA FOR NEW PROJECT TO PREVENT STATE LEAK (e.g. Manual Title from previous book)
                setMetadata({
                  authorName: userContact?.name || '',
                  topic: '',
                  bookTitle: '',
                  subTitle: '',
                  title: '',
                  dedication: '',
                  acknowledgments: '',
                  aboutAuthor: '',
                  status: 'IDLE',
                  progress: 0,
                  isFiction: false,
                  genre: '',
                  characters: []
                } as any);
                setStep(1);
                setCurrentView('generator');
                window.history.pushState({}, '', '/factory');
                window.scrollTo(0, 0);
              }}
            />
          </ErrorBoundary>
        </div>
      );
    }

    if (currentView === 'generator' && hasAccess) {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-fade-in">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <button
                onClick={() => {
                  setCurrentView('dashboard');
                  window.history.pushState({}, '', '/');
                  window.scrollTo(0, 0);
                }}
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
                language={lang}
              />
            )}

            {step >= 2 && (
              <ErrorBoundary>
                <Generator
                  metadata={metadata}
                  updateMetadata={updateMetadata}
                  onReset={() => {
                    setMetadata({ 
                      authorName: '', 
                      topic: '', 
                      bookTitle: '', 
                      subTitle: '', 
                      dedication: '', 
                      acknowledgments: '', 
                      aboutAuthor: '', 
                      status: 'IDLE', 
                      progress: 0,
                      isFiction: false,
                      genre: '',
                      characters: []
                    });
                    setStep(1);
                    setCurrentView('dashboard');
                    window.history.pushState({}, '', '/');
                    window.scrollTo(0, 0);
                  }}
                  language={lang}
                  bookLanguage={((metadata as any).bookLanguage as any) || lang}
                  userContact={userContact}
                  setAppStep={setStep}
                />
              </ErrorBoundary>
            )}
          </main>
        </div>
      );
    }

    return (
      <ErrorBoundary>
        <SalesLandingV7 
          onLoginClick={() => setCurrentView('login')}
        />
      </ErrorBoundary>
    );
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {renderContent()}
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