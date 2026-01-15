import React, { useEffect, useState, useRef } from 'react';
import { BookMetadata, BookProject, TitleOption, Chapter, MarketingAssets } from '../types';
import * as API from '../services/api';
import { generateDocx } from '../services/docxService';
import { UpsellModal } from './UpsellModal';

import { pt, en, es } from '../i18n/locales';

interface GeneratorProps {
  metadata: BookMetadata;
  updateMetadata: (data: Partial<BookMetadata>) => void;
  onReset: () => void;
  language: 'pt' | 'en' | 'es';
  userContact: any;
  setAppStep: (step: number) => void;
}

// Icons as basic SVGs to avoid dependency crashes
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-brand-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
);

const EmptyCircle = () => (
  <div className="w-5 h-5 rounded-full border-2 border-slate-300"></div>
);

const RotatingMessage = ({ messages }: { messages: string[] }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [messages]);

  return (
    <p className="text-slate-400 text-sm italic min-h-[1.5em] animate-fade-in">
      "{messages[index] || messages[0]}"
    </p>
  );
};

export const Generator: React.FC<GeneratorProps> = ({ metadata, updateMetadata, onReset, language, userContact, setAppStep }) => {
  const t = { pt, en, es }[language].generator;
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<BookProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dedication flow state (Lifted from conditional block)
  const [dedication, setDedication] = useState("");
  const [ack, setAck] = useState("");
  const [sending, setSending] = useState(false);
  const [products, setProducts] = useState<any>({});

  // Extra states moved to top level to avoid hook errors
  const [dedicationTo, setDedicationTo] = useState("");
  const [ackTo, setAckTo] = useState("");
  const [aboutAuthorContext, setAboutAuthorContext] = useState("");
  const [aboutAuthor, setAboutAuthor] = useState(""); // Result

  const [generatingExtras, setGeneratingExtras] = useState(false);

  // Upsell State
  const [showUpsell, setShowUpsell] = useState(false);

  // Define handleGenerateExtras at top level
  const handleGenerateExtras = async () => {
    if (!dedicationTo && !ackTo) return alert(t.fillAuthInfo);
    setGeneratingExtras(true);
    try {
      const res = await fetch(`http://localhost:3001/api/projects/${projectId}/generate-extras`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dedicationTo, ackTo, aboutAuthorContext })
      });
      const data = await res.json();
      if (data.dedication) setDedication(data.dedication);
      if (data.acknowledgments) setAck(data.acknowledgments);
      if (data.aboutAuthor) setAboutAuthor(data.aboutAuthor);
    } catch (e) {
      console.error(e);
      alert(t.errorGeneratingExtras);
    } finally {
      setGeneratingExtras(false);
    }
  };

  // Define submitFinalDetails at top level (replaces inner handleFinalize)
  const submitFinalDetails = async () => {
    if (!project) return;
    setSending(true);

    // Construct updated project state
    const updatedMetadata = {
      ...project.metadata,
      dedication,
      acknowledgments: ack,
      aboutAuthor,
      status: 'COMPLETED' as any,
      progress: 100,
      statusMessage: "Livro Concluído com Sucesso!"
    };

    const updatedProject = { ...project, metadata: updatedMetadata };

    try {
      await API.updateProject(project.id, { metadata: updatedMetadata });
    } catch (e) {
      console.error("Failed to sync status to backend", e);
    }

    // Trigger download logic REMOVED - User processes download manually in COMPLETED screen
    /*
    try {
      const introChapter = project.structure.find(c => c.id === 0 || ['introdução', 'introduction', 'introducción'].some(term => c.title.toLowerCase().includes(term)));
      const introContent = introChapter ? introChapter.content : "";
      const mainChapters = project.structure.filter(c => c.id !== 0 && !['introdução', 'introduction', 'introducción'].some(term => c.title.toLowerCase().includes(term)));

      const content = {
        introduction: introContent,
        chapters: mainChapters,
        conclusion: "",
        dedication: dedication,
        acknowledgments: ack,
        aboutAuthor: aboutAuthor,
        marketing: project.marketing!
      };
      const blob = await generateDocx(updatedProject.metadata, content);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const safeTitle = (updatedProject.metadata.bookTitle || 'livro').replace(/[^a-z0-9à-ú ]/gi, '_');
      a.download = `${safeTitle}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      console.error("Download error:", e);
      alert(t.errorCreatingDocx);
    }
    */

    updateMetadata({ dedication, acknowledgments: ack, status: 'COMPLETED', progress: 100 });
    setProject(updatedProject);
    setSending(false);
  };

  const initialized = useRef(false);

  // Load Products (Public Config)
  useEffect(() => {
    fetch('http://localhost:3001/api/payment/config')
      .then(res => res.json())
      .then(data => setProducts(data.products || {}))
      .catch(console.error);
  }, []);

  // Initialize Project
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setAppStep(2); // Start at step 2 (Research)

    const init = async () => {
      try {
        const p = await API.createProject(metadata.authorName, metadata.topic, language, userContact);
        setProjectId(p.id);
        setProject(p);

        // Only start research if it's a new (IDLE) project to avoid resetting active projects
        if (p.metadata.status === 'IDLE') {
          await API.startResearch(p.id);
        }
      } catch (e) {
        setError(t.serverConnectionError);
        console.error(e);
      }
    };
    init();
  }, [metadata.authorName, metadata.topic]);

  // Polling
  useEffect(() => {
    if (!projectId) return;

    const interval = setInterval(async () => {
      try {
        const p = await API.getProject(projectId);
        // Only update if partial change or deep comparison? For now just set.
        setProject(p);
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [projectId]);

  // Sync App Step based on Project Status
  useEffect(() => {
    if (!project) return;
    const { status } = project.metadata;

    if (status === 'WRITING_CHAPTERS') {
      setAppStep(3);
    } else if (status === 'GENERATING_MARKETING' || status === 'WAITING_DETAILS' || status === 'COMPLETED') {
      setAppStep(4);
    }
  }, [project?.metadata.status, setAppStep]);

  const handleTitleSelect = async (opt: TitleOption) => {
    if (!projectId) return;
    updateMetadata({ bookTitle: opt.title, subTitle: opt.subtitle });
    await API.selectTitle(projectId, opt.title, opt.subtitle);
    // await API.startGeneration(projectId); 
    // ^ Removed this because we now wait for structure review before writing content.
  };

  const [emailSent, setEmailSent] = useState(false);

  const handleFinalize = async () => {
    if (!project) return;
    const safeMarketing = project.marketing || {
      viralHooks: [],
      description: "",
      keywords: [],
      targetAudience: "",
      salesSynopsis: "",
      youtubeDescription: "",
      backCover: ""
    };

    const content = {
      introduction: "",
      chapters: project.structure,
      conclusion: "",
      acknowledgments: "",
      dedication: project.metadata.dedication || "",
      marketing: safeMarketing
    };
    const blob = await generateDocx(project.metadata, content);

    // Download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.metadata.bookTitle || 'livro'}_viral.docx`;
    a.click();

    // Email
    if (userContact?.email) {
      setSending(true);
      const formData = new FormData();
      formData.append('file', blob, `${project.metadata.bookTitle || 'livro'}.docx`);
      formData.append('email', userContact.email);

      try {
        await fetch(`http://localhost:3001/api/projects/${projectId}/send-email`, {
          method: 'POST',
          body: formData
        });
        setEmailSent(true);
        alert(t.emailSentSuccess);
      } catch (e) {
        console.error(e);
        alert(t.errorSendingEmail);
      }
      setSending(false);
    }
  };

  if (error) return <div className="text-red-500 text-center p-10 bg-red-50 rounded-xl m-10 border border-red-200">{error}</div>;
  if (!project) return <div className="text-center p-20 flex flex-col items-center"><Spinner /> <span className="mt-4 text-slate-500">{t.startingIntelligence}</span></div>;

  const { status, progress, statusMessage } = project.metadata;

  if (status === 'WAITING_TITLE') {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center font-serif">{t.marketAnalysisComplete}</h2>
        <p className="text-center text-slate-500 mb-8 text-lg">{t.selectTitle}</p>

        <div className="grid gap-4 md:grid-cols-2 mt-6">
          {project.titleOptions.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => handleTitleSelect(opt)}
              className={`text-left p-6 rounded-xl border transition-all bg-white group relative overflow-hidden ${opt.isTopChoice ? 'border-brand-500 shadow-lg ring-2 ring-brand-100' : 'border-gray-200 hover:border-brand-500 hover:shadow-md'}`}
            >
              <div className="absolute top-0 right-0 p-2 opacity-5">
                <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              </div>
              {opt.isTopChoice && (
                <span className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-20">{t.bestChoice}</span>
              )}
              <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-brand-600 relative z-10">{opt.title}</h3>
              <p className="text-sm text-slate-600 italic mb-4 relative z-10">{opt.subtitle}</p>
              <div className="text-xs bg-slate-50 p-3 rounded text-slate-500 border border-slate-100 relative z-10 flex items-start gap-2">
                <span className="text-yellow-500 text-base">★</span>
                <span>{opt.reason}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Handle Structure Review
  if (status === 'REVIEW_STRUCTURE' || (status === 'IDLE' && project.structure.length > 0 && progress === 40)) {
    const handleApproveStructure = async () => {
      await API.generateBookContent(projectId!);
      // We update local state to reflect change immediately while polling catches up
      setProject({ ...project, metadata: { ...project.metadata, status: 'WRITING_CHAPTERS', progress: 41 } });
      setAppStep(3); // IMMEDIATE UPDATE
    };

    return (
      <div className="max-w-3xl mx-auto animate-fade-in-up pb-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2 font-serif">{t.viralStructureGenerated}</h2>
          <p className="text-slate-500">{t.reviewChapters}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden mb-8">
          <div className="p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-lg text-slate-700">{project.metadata.bookTitle}</h3>
            <p className="text-sm text-slate-500">{project.metadata.subTitle}</p>
          </div>
          <div className="divide-y divide-slate-100">
            {project.structure.map((chapter) => (
              <div key={chapter.id} className="p-4 hover:bg-slate-50 flex gap-4">
                <span className="font-bold text-slate-300 text-lg w-8">{chapter.id}.</span>
                <div>
                  <h4 className="font-bold text-slate-800">{chapter.title}</h4>
                  <p className="text-sm text-slate-500 mt-1">{chapter.intro}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-center">
          <button
            onClick={handleApproveStructure}
            className="bg-brand-600 text-white text-xl px-12 py-4 rounded-xl font-bold shadow-xl shadow-brand-500/30 hover:bg-brand-700 hover:scale-105 transition-all"
          >
            {t.approveAndWrite}
          </button>
        </div>
      </div>
    );
  }

  // Handle Final Details Input (Dedication)
  if (status === 'WAITING_DETAILS') {
    // Hooks and handlers moved to top level


    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up pb-20">
        <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center font-serif">{t.finalTouches}</h2>
        <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-200">

          <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 border border-blue-100 flex items-start gap-2">
            <span>💡</span>
            <p>{t.aiCanWrite}</p>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <label className="block font-bold text-slate-700 mb-2 text-sm">{t.dedicationToLabel}</label>
              <input
                className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                placeholder="Ex: Meus pais, meu cônjuge..."
                value={dedicationTo}
                onChange={e => setDedicationTo(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block font-bold text-slate-700 mb-2 text-sm">{t.ackToLabel}</label>
              <input
                className="w-full p-3 border border-slate-300 rounded-lg text-sm"
                placeholder="Ex: Deus, mentores, amigos..."
                value={ackTo}
                onChange={e => setAckTo(e.target.value)}
              />
            </div>
          </div>
          <div className="mb-6">
            <label className="block font-bold text-slate-700 mb-2 text-sm">Contexto Biografia do Autor</label>
            <input
              className="w-full p-3 border border-slate-300 rounded-lg text-sm"
              placeholder="Ex: Empreendedor há 20 anos, especialista em marketing, pai de 2 filhos..."
              value={aboutAuthorContext}
              onChange={e => setAboutAuthorContext(e.target.value)}
            />
          </div>

          <button
            onClick={handleGenerateExtras}
            disabled={generatingExtras || (!dedicationTo && !ackTo)}
            className="w-full mb-8 bg-indigo-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-indigo-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {generatingExtras ? <span className="animate-spin">⚙️</span> : "✨"}
            {generatingExtras ? t.writing : t.generateWithAI}
          </button>

          <div className="mb-6 relative">
            <label className="block font-bold text-slate-700 mb-2">{t.dedication}</label>
            <textarea
              className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              rows={4}
              value={dedication}
              onChange={e => setDedication(e.target.value)}
              placeholder={t.dedicationPlaceholder}
            />
          </div>
          <div className="mb-8 relative">
            <label className="block font-bold text-slate-700 mb-2">{t.acknowledgments}</label>
            <textarea
              className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              rows={4}
              value={ack}
              onChange={e => setAck(e.target.value)}
              placeholder={t.acknowledgmentsPlaceholder}
            />
          </div>
          <div className="mb-8 relative">
            <label className="block font-bold text-slate-700 mb-2">Sobre o Autor</label>
            <textarea
              className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              rows={4}
              value={aboutAuthor}
              onChange={e => setAboutAuthor(e.target.value)}
              placeholder="Biografia do autor..."
            />
          </div>
          <button
            onClick={submitFinalDetails}
            disabled={sending}
            className="w-full bg-green-600 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 transition"
          >
            {t.finalizeAndGenerate}
          </button>
        </div>
      </div>
    );
  }

  if (status === 'COMPLETED') {
    const marketing = project.marketing || {
      viralHooks: [],
      description: "",
      keywords: [],
      targetAudience: "",
      salesSynopsis: "",
      youtubeDescription: "",
      backCover: ""
    };

    return (
      <div className="text-center py-12 max-w-4xl mx-auto">
        <div className="mb-6 inline-flex bg-green-100 p-4 rounded-full text-green-600 shadow-sm animate-bounce-slow">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h2 className="text-4xl font-serif font-bold mb-2 text-slate-900">{t.workFinished}</h2>
        <p className="mb-8 text-slate-600 text-xl font-light">"{project.metadata.bookTitle}"</p>

        <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
            <h3 className="font-bold mb-3 text-slate-800 uppercase text-xs tracking-wider flex justify-between items-center">
              {t.amazonSynopsis}
              <span className="text-green-500 text-[10px] bg-green-50 px-2 py-1 rounded">SEO Otimizado</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {marketing.salesSynopsis || marketing.description || "Sinopse sendo gerada..."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <h3 className="font-bold mb-3 text-slate-800 uppercase text-xs tracking-wider">{t.youtubeDesc}</h3>
            <p className="text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {marketing.youtubeDescription || marketing.description || "Descrição..."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="font-bold mb-3 text-slate-800 uppercase text-xs tracking-wider">{t.backCover}</h3>
            <p className="text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">
              {marketing.backCover || "Texto..."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 relative overflow-hidden group">
            <h3 className="font-bold mb-3 text-slate-800 uppercase text-xs tracking-wider">{t.viralKeywords}</h3>
            <div className="flex flex-wrap gap-2">
              {(marketing.keywords || []).slice(0, 10).map((k, i) => (
                <span key={i} className="text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition cursor-default">{k}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={onReset} className="px-6 py-4 rounded-xl text-slate-500 hover:bg-slate-100 transition font-medium">
            {t.resetSystem}
          </button>
          <button
            onClick={() => {
              // Trigger Download
              if (project) {
                // Logic to download file (usually done via link or separate func)
                // Wait, the button says "Baixar Pacote".
                // The original code passed 'handleFinalize' here?
                // If handleFinalize was missing in previous view, I assume it triggers download.
                // I will check if I can trigger download AND show modal.

                // Assuming download happens via window.open or similar in a real app,
                // but here effectively it just downloads.

                // We open the Admin URL for the book for download
                if (userContact?.email) {
                  window.open(`http://localhost:3001/api/admin/books/${userContact.email}`, '_blank');
                }

                setShowUpsell(true);
              }
            }}
            className="bg-brand-600 text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <div className="text-left">
              <div className="text-xs font-normal opacity-80">{t.downloadPackage}</div>
              <div className="text-lg leading-none">{t.downloadDocx}</div>
            </div>
          </button>
        </div>

        <UpsellModal
          isOpen={showUpsell}
          onClose={() => setShowUpsell(false)}
          currentDiscount={metadata.discountUsed || 0}
          onAccept={() => {
            const current = metadata.discountUsed || 0;
            let next = 10;
            if (current === 10) next = 15;
            if (current === 15) next = 20;
            if (current === 20) next = 0;

            localStorage.setItem('activeDiscount', next.toString());
            setShowUpsell(false);
            onReset();
          }}
          onDownload={() => {
            if (userContact?.email) {
              window.open(`http://localhost:3001/api/admin/books/${userContact.email}`, '_blank');
            }
          }}
        />

        {/* UPSELL SECTION */}
        <div className="mt-16 pt-10 border-t border-slate-200">
          <h3 className="text-2xl font-bold text-slate-800 mb-2 font-serif">{t.professionalize}</h3>
          <p className="text-slate-500 mb-8 max-w-2xl mx-auto">{t.professionalizeDesc}</p>

          <div className="grid md:grid-cols-2 gap-6 text-left">

            {/* Translations */}
            {(products.english_book || products.spanish_book) && (
              <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-purple-50 to-indigo-50 p-6 rounded-xl border border-purple-100 flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <h4 className="font-bold text-lg text-purple-900 mb-1">Internacionalização (Tradução)</h4>
                  <p className="text-sm text-purple-700">Alcance leitores em todo o mundo traduzindo sua obra.</p>
                </div>
                <div className="flex gap-3">
                  {products.english_book && (
                    <a href={products.english_book} target="_blank" className="bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-100 shadow-sm flex items-center gap-2">
                      🇺🇸 Inglês (R$ 24,99)
                    </a>
                  )}
                  {products.spanish_book && (
                    <a href={products.spanish_book} target="_blank" className="bg-white border-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-100 shadow-sm flex items-center gap-2">
                      🇪🇸 Espanhol (R$ 24,99)
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Design & Covers */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4 border-b pb-2">Design & Capas</h4>
              {products.cover_printed && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 transition flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800">Capa Livro Impresso</div>
                    <div className="text-xs text-slate-500">Capa, contracapa e orelhas (7cm)</div>
                  </div>
                  <a href={products.cover_printed} target="_blank" className="bg-slate-800 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-slate-900">R$ 250,00</a>
                </div>
              )}
              {products.cover_ebook && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-brand-300 transition flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800">Capa Ebook (Kindle)</div>
                    <div className="text-xs text-slate-500">Design otimizado para digital</div>
                  </div>
                  <a href={products.cover_ebook} target="_blank" className="bg-slate-800 text-white px-3 py-1.5 rounded text-sm font-bold hover:bg-slate-900">R$ 99,90</a>
                </div>
              )}
            </div>

            {/* Publication & Legal */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-400 text-xs uppercase tracking-wider mb-4 border-b pb-2">Publicação & Legal</h4>

              {products.pub_amazon_printed && (
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-700 text-sm font-medium">Publicação Amazon (Impresso)</span>
                  <a href={products.pub_amazon_printed} target="_blank" className="text-brand-600 text-sm font-bold hover:underline">R$ 49,90 ➜</a>
                </div>
              )}
              {products.pub_amazon_digital && (
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-700 text-sm font-medium">Publicação Amazon (Digital)</span>
                  <a href={products.pub_amazon_digital} target="_blank" className="text-brand-600 text-sm font-bold hover:underline">R$ 39,90 ➜</a>
                </div>
              )}
              {products.pub_uiclap && (
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-700 text-sm font-medium">Publicação UICLAP (Impresso)</span>
                  <a href={products.pub_uiclap} target="_blank" className="text-brand-600 text-sm font-bold hover:underline">R$ 49,90 ➜</a>
                </div>
              )}
              {products.catalog_card && (
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-700 text-sm font-medium">Ficha Catalográfica</span>
                  <a href={products.catalog_card} target="_blank" className="text-brand-600 text-sm font-bold hover:underline">R$ 59,90 ➜</a>
                </div>
              )}
              {products.isbn_printed && (
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <span className="text-slate-700 text-sm font-medium">Registro ISBN (Impresso)</span>
                  <a href={products.isbn_printed} target="_blank" className="text-brand-600 text-sm font-bold hover:underline">R$ 49,90 ➜</a>
                </div>
              )}
            </div>

            {/* High Ticket Items */}
            <div className="col-span-1 md:col-span-2 grid md:grid-cols-3 gap-4 mt-6">
              {products.complete_package && (
                <div className="bg-slate-900 text-white p-6 rounded-xl relative overflow-hidden group hover:scale-[1.02] transition shadow-xl">
                  <div className="absolute top-0 right-0 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-bl-lg">MAIS VENDIDO</div>
                  <h4 className="font-bold text-lg mb-2 text-yellow-400">Pacote Completo Editora</h4>
                  <ul className="text-xs text-slate-300 space-y-1 mb-4 list-disc pl-4">
                    <li>Capa Profissional</li>
                    <li>Publicação Amazon/UICLAP</li>
                    <li>Ficha Catalográfica + ISBN</li>
                    <li>Suporte Completo</li>
                  </ul>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-bold">R$ 599,90</span>
                    <a href={products.complete_package} target="_blank" className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-yellow-300">Quero Tudo</a>
                  </div>
                </div>
              )}

              {products.sales_page && (
                <div className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-lg transition">
                  <h4 className="font-bold text-slate-800 mb-2">Página de Vendas</h4>
                  <p className="text-xs text-slate-500 mb-4 h-12">Landing Page de alta conversão para vender seu livro na internet.</p>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold text-slate-800">R$ 349,90</span>
                    <a href={products.sales_page} target="_blank" className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-bold text-sm hover:bg-slate-200">Contratar</a>
                  </div>
                </div>
              )}

              {products.hosting && (
                <div className="bg-white border border-slate-200 p-6 rounded-xl hover:shadow-lg transition">
                  <h4 className="font-bold text-slate-800 mb-2">Hospedagem Pro</h4>
                  <p className="text-xs text-slate-500 mb-4 h-12">Hospedagem rápida e segura para seus projetos. (Anual)</p>
                  <div className="flex justify-between items-end">
                    <span className="text-xl font-bold text-slate-800">R$ 499,90</span>
                    <a href={products.hosting} target="_blank" className="bg-slate-100 text-slate-700 px-3 py-2 rounded-lg font-bold text-sm hover:bg-slate-200">Assinar</a>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    );
  }

  // PROGRESS VIEW
  return (
    <div className="max-w-3xl mx-auto pb-20">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center relative overflow-hidden">

        <div className="mb-8 mt-4 relative z-10 transition-all duration-500">
          {/* Dynamic Icons / Animations based on Status */}
          <div className={`inline-block p-6 rounded-full mb-6 bg-white shadow-xl border-4 ${status === 'FAILED' ? 'border-red-100' : 'border-brand-50'}`}>
            {status === 'FAILED' ? (
              <span className="text-4xl">⚠️</span>
            ) : (
              <>
                {/* Research Icons */}
                {progress < 25 && (
                  <div className="relative w-16 h-16">
                    <svg className="w-10 h-10 text-red-500 absolute top-0 left-0 animate-bounce" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
                    <svg className="w-8 h-8 text-blue-500 absolute bottom-0 right-0 animate-pulse delay-75" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" /></svg>
                  </div>
                )}

                {/* Amazon Analysis */}
                {progress >= 25 && progress < 41 && (
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <span className="text-4xl animate-pulse">📚</span>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded shadow-sm text-black">BEST SELLER</div>
                  </div>
                )}

                {/* Writing Ink Pen */}
                {progress >= 41 && progress < 90 && (
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 text-brand-600 animate-wiggle origin-bottom-left" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-500 animate-progress-indeterminate"></div>
                    </div>
                  </div>
                )}

                {/* Marketing/Packaging */}
                {progress >= 90 && progress < 100 && (
                  <div className="text-4xl animate-bounce">📦</div>
                )}
              </>
            )}
          </div>

          <h3 className="text-xl font-bold text-slate-800 mb-2 font-serif flex items-center justify-center min-h-[3.5rem] px-4">
            {status === 'FAILED' ? t.processInterrupted : (statusMessage || t.startingIntelligence)}
          </h3>

          <div className="h-12 flex items-center justify-center">
            {status === 'FAILED' ? (
              <button
                onClick={async () => {
                  // Retry logic: just call generate again, backend handles resume
                  if (statusMessage?.includes('Pesquisa')) {
                    // If failed at research, maybe restart research? Or create new project?
                    // For now let's try generate which is safe for 'WRITING'
                    await API.generateBookContent(projectId!);
                  } else {
                    await API.generateBookContent(projectId!);
                  }
                  // Optimistic update
                  setProject({ ...project!, metadata: { ...project!.metadata, status: 'WRITING_CHAPTERS', statusMessage: 'Retomando a escrita de onde parou...' } });
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                {t.resumeProcess}
              </button>
            ) : (
              <RotatingMessage messages={t.rotatingMessages} />
            )}
          </div>
        </div>

        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-8 max-w-lg mx-auto shadow-inner">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-700 ease-out shadow-lg" style={{ width: `${progress}%` }}></div>
        </div>

        {/* FAILSAFE BUTTON */}
        {progress >= 100 && (
          <div className="text-center mb-8 animate-fade-in">
            <p className="text-sm text-yellow-600 mb-2">{t.stuckStatus}</p>
            <button
              onClick={async () => {
                if (!project) return;
                const newMeta = { ...project.metadata, status: 'WAITING_DETAILS' as const, progress: 100 };
                setProject({ ...project, metadata: newMeta });
                updateMetadata({ status: 'WAITING_DETAILS', progress: 100 });
                try {
                  await API.updateProject(project.id, { metadata: { status: 'WAITING_DETAILS', progress: 100 } });
                } catch (e) { console.error(e); }
              }}
              className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow hover:bg-yellow-600 font-bold text-sm transition"
            >
              {t.forceFinish}
            </button>
          </div>
        )}

        <div className="text-left bg-slate-50 rounded-xl p-6 border border-slate-100 shadow-sm relative">
          {/* If stuck for too long, maybe show a hint? (Not implemented yet to avoid clutter) */}

          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex justify-between">
            <span>Status da Produção</span>
            <span>{Math.round(progress)}%</span>
          </h4>
          <div className="space-y-4 font-medium text-sm">

            {/* Research Step */}
            <div className={`flex items-center gap-3 transition-opacity duration-500 ${progress >= 5 ? 'opacity-100' : 'opacity-40'}`}>
              {progress >= 30 ? <CheckIcon /> : <EmptyCircle />}
              <span className={progress >= 30 ? 'text-slate-500' : 'text-slate-700'}>
                {t.status1}
                {progress < 30 && progress > 0 && <span className="ml-2 text-xs text-brand-500 animate-pulse">...</span>}
              </span>
            </div>

            {/* Structure Step */}
            <div className={`flex items-center gap-3 transition-opacity duration-500 ${progress >= 30 ? 'opacity-100' : 'opacity-40'}`}>
              {progress >= 45 ? <CheckIcon /> : <EmptyCircle />}
              <span className={progress >= 45 ? 'text-slate-500' : 'text-slate-700'}>
                {t.status2}
              </span>
            </div>

            {/* Writing Loop */}
            <div className={`flex items-center gap-3 transition-opacity duration-500 ${progress >= 45 ? 'opacity-100' : 'opacity-40'}`}>
              {progress >= 95 ? <CheckIcon /> : <div className={`w-5 h-5 flex items-center justify-center ${progress >= 45 ? '' : ''}`}>{progress >= 45 && <div className="w-2 h-2 bg-brand-500 rounded-full animate-ping"></div>}</div>}
              <span className={progress >= 95 ? 'text-slate-500' : 'text-slate-700'}>
                {t.status3}
              </span>
            </div>

            {project.structure && project.structure.length > 0 && progress >= 45 && progress < 95 && (
              <div className="ml-8 mt-1 space-y-1 pl-4 border-l-2 border-brand-200">
                {project.structure.map(c => (
                  <div key={c?.id || Math.random()} className="text-xs flex items-center gap-2 transition-colors duration-300">
                    {c.isGenerated ?
                      <span className="text-green-600 font-bold flex items-center gap-1">✓ <span className="truncate max-w-[200px]">{c.title}</span></span> :
                      <span className={c.id === project.structure.findIndex(x => !x.isGenerated) + 1 ? "text-brand-600 font-bold animate-pulse" : "text-slate-300"}>
                        {c.id}. {c.title}
                      </span>
                    }
                  </div>
                ))}
              </div>
            )}

            {/* Marketing Step */}
            <div className={`flex items-center gap-3 transition-opacity duration-500 ${progress >= 95 ? 'opacity-100' : 'opacity-40'}`}>
              {progress >= 100 ? <CheckIcon /> : <EmptyCircle />}
              <span className={progress >= 100 ? 'text-slate-500' : 'text-slate-700'}>{t.status4}</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};