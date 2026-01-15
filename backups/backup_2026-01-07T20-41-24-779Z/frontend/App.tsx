import React, { useState } from 'react';
import { StepWizard } from './components/StepWizard';
import { InputForm } from './components/InputForm';
import { Generator } from './components/Generator';
import { Admin } from './components/Admin';
import LandingPage from './components/LandingPage';
import { LanguageContext } from './i18n/context';
import { pt, en, es } from './i18n/locales';
import { BookMetadata } from './types';

const App: React.FC = () => {
  const [lang, setLang] = useState<'pt' | 'en' | 'es'>('pt');

  // Translation Helper
  const translations = { pt, en, es };
  const t = translations[lang];

  const [hasAccess, setHasAccess] = useState(false);
  const [userContact, setUserContact] = useState<any>(null);

  const [step, setStep] = useState(1);
  const [showAdmin, setShowAdmin] = useState(false);
  const [metadata, setMetadata] = useState<BookMetadata>({
    authorName: '',
    topic: '',
    dedication: ''
  });

  const nextStep = () => setStep(prev => prev + 1);
  const resetApp = () => {
    setStep(1);
    setMetadata({
      authorName: '',
      topic: '',
      dedication: ''
    });
    // Optional: Reset access? No, they paid.
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

  if (showAdmin) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans">
        <Admin onBack={() => setShowAdmin(false)} />
      </div>
    )
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {!hasAccess ? (
        <LandingPage onStart={handleStart} onAdmin={() => setShowAdmin(true)} />
      ) : (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans animate-fade-in">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-brand-600 text-white p-1.5 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <span className="font-serif font-bold text-xl text-slate-800">Fábrica de Best Sellers</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex gap-2 mr-4">
                  <button onClick={() => setLang('pt')} className={`font-bold ${lang === 'pt' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>BR</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => setLang('en')} className={`font-bold ${lang === 'en' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>US</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => setLang('es')} className={`font-bold ${lang === 'es' ? 'text-brand-600' : 'text-slate-400 hover:text-slate-600'}`}>ES</button>
                </div>
                <button
                  onClick={() => setShowAdmin(true)}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition"
                >
                  Admin
                </button>
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

            {step === 2 && (
              <Generator
                metadata={metadata}
                updateMetadata={updateMetadata}
                onReset={resetApp}
                language={lang}  // Pass language
                userContact={userContact} // Pass contact info
              />
            )}
          </main>

          {/* Footer */}
          <footer className="bg-slate-900 text-slate-400 py-8 text-center text-sm">
            <p>© {new Date().getFullYear()} BestSeller Factory AI. ({lang.toUpperCase()})</p>
          </footer>
        </div>
      )}
    </LanguageContext.Provider>
  );
};

export default App;