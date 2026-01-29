import React, { useEffect, useState, useRef } from 'react';
import { BookMetadata, BookProject, TitleOption, Chapter, MarketingAssets } from '../types';
import * as API from '../services/api';
import { generateDocx } from '../services/docxService';
import { RewardModal } from './RewardModal';
import { PaymentGate } from './PaymentGate';

import { pt, en, es } from '../i18n/locales';

interface GeneratorProps {
  metadata: BookMetadata;
  updateMetadata: (data: Partial<BookMetadata>) => void;
  onReset: (props?: any) => void;
  language: 'pt' | 'en' | 'es';
  userContact: any;
  setAppStep: (step: number) => void;
}

// Icons as basic SVGs to avoid dependency crashes
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-[#0284c7]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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

  // Custom State for Factory Intro
  const [isManufacturing, setIsManufacturing] = useState(false); // Default false: Wait for Access Check
  const [isLoadingAccess, setIsLoadingAccess] = useState(true); // New Loading State
  const [factoryStep, setFactoryStep] = useState(0);
  const [showPaymentGate, setShowPaymentGate] = useState(false);
  const [showReward, setShowReward] = useState(false);

  // Hoist metadata extraction for Effects
  const { status, progress, statusMessage } = project?.metadata || ({} as any);

  // Dedication flow state
  const [dedication, setDedication] = useState("");
  const [ack, setAck] = useState("");
  const [sending, setSending] = useState(false);
  const [products, setProducts] = useState<any>({});

  const [dedicationTo, setDedicationTo] = useState("");
  const [ackTo, setAckTo] = useState("");
  const [aboutAuthorContext, setAboutAuthorContext] = useState("");
  const [aboutAuthor, setAboutAuthor] = useState("");

  const [generatingExtras, setGeneratingExtras] = useState(false);

  // Upsell Offer State
  const [upsellOffer, setUpsellOffer] = useState<any>(null);
  const [showUpsell, setShowUpsell] = useState(false);

  const [isPollingPayment, setIsPollingPayment] = useState(false);

  // --- NEW: PRE-VALIDATE ACCESS ON MOUNT ---
  useEffect(() => {
    const checkInitial = async () => {
      if (!userContact?.email) {
        setIsLoadingAccess(false);
        return;
      }
      if (projectId) {
        // If we already have a project ID passed (e.g. continuing), just check if it's active
        setIsLoadingAccess(false);
        return;
      }

      try {
        const res = await fetch(`/api/payment/check-access?email=${userContact.email}`);
        const access = await res.json();

        if ((access.hasAccess && access.credits > 0) || access.activeProjectId) {
          // Authorized: Start Animation
          setIsManufacturing(true);
          setIsLoadingAccess(false);
        } else {
          // Unauthorized: KICK OUT
          alert('Você precisa adquirir um crédito para acessar a fábrica.');
          // Force redirect to dashboard
          window.location.href = '/dashboard';
        }
      } catch (e) {
        console.error("Access Check Failed", e);
        // Instead of alerting, set clean error state to allow retry
        // alert('Erro ao verificar acesso. Tente novamente.'); 
        setError("Não foi possível sincronizar com o servidor. Por favor, verifique sua conexão e recarregue a página.");
        setIsLoadingAccess(false);
      }
    };
    checkInitial();
  }, [projectId, onReset]);

  // Factory Intro Effect
  useEffect(() => {
    if (isManufacturing) {
      const timer = setInterval(() => {
        setFactoryStep(prev => {
          if (prev >= 3) {
            clearInterval(timer);
            return 3;
          }
          return prev + 1;
        });
      }, 1500);

      // End animation after ~6 seconds, THEN try to create project
      const finishTimer = setTimeout(() => {
        setIsManufacturing(false);
        initProject();
      }, 6000);

      return () => { clearInterval(timer); clearTimeout(finishTimer); };
    }
  }, [isManufacturing]);

  // Refine Research State
  const [isRefining, setIsRefining] = useState(false);
  const [refineTopic, setRefineTopic] = useState("");

  const handleRefineSubmit = async () => {
    if (!projectId || !refineTopic) return;
    try {
      // Update Project Topic
      await API.updateProject(projectId, { metadata: { ...project?.metadata, topic: refineTopic } });
      // Restart Research
      await API.startResearch(projectId, language);
      // Reset UI
      setIsRefining(false);
      // Set Project Status locally to force UI update to Loading
      if (project) {
        setProject({ ...project, metadata: { ...project.metadata, status: 'RESEARCHING', progress: 5, statusMessage: 'Reiniciando pesquisa...' } });
      }
    } catch (e) {
      console.error("Refine error", e);
      alert("Erro ao reiniciar pesquisa.");
    }
  };

  const checkAccessStatus = () => {
    if (!userContact?.email) return;

    fetch(`/api/payment/check-access?email=${userContact.email}`)
      .then(r => r.json())
      .then(access => {
        if (access.hasAccess) {
          setShowPaymentGate(false);

          if (access.activeProjectId) {
            setProjectId(access.activeProjectId);
            setShowReward(false);
            // Force fetch project immediately to prevent stuck loading
            API.getProject(access.activeProjectId).then(async (p) => {
              if (p) {
                setProject(p);
                // FIX: Kickstart research if project was stuck in IDLE state waiting for payment
                if (p.metadata.status === 'IDLE') {
                  console.log("Kickstarting IDLE project...");
                  try {
                    await API.startResearch(p.id, language);
                    setProject(curr => curr ? ({ ...curr, metadata: { ...curr.metadata, status: 'RESEARCHING', progress: 5, statusMessage: 'Iniciando pesquisa...' } }) : p);
                  } catch (e) { console.error("Error auto-starting", e); }
                }
              }
            });
          } else {
            setShowReward(true);
          }
        }
      })
      .catch(e => console.error("Access Poll Error", e));
  };

  // POLLING FOR ACCESS (Real-time Unlock)
  useEffect(() => {
    if (!showPaymentGate) return;
    const interval = setInterval(checkAccessStatus, 3000);
    return () => clearInterval(interval);
  }, [showPaymentGate, userContact]);

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

    // Smart Extraction of Sections logic
    const isIntro = (c: Chapter) => c.id === 0 || ['introdução', 'introduction', 'introducción', 'introducao'].some(term => c.title.toLowerCase().includes(term));
    const isConc = (c: Chapter) => ['conclusão', 'conclusion', 'conclusao', 'considerações finais'].some(term => c.title.toLowerCase().includes(term)) && c.id > 1;

    const introChapter = project.structure.find(isIntro);
    // Find conclusion (must not be intro)
    const conclusionChapter = project.structure.find(c => isConc(c) && c !== introChapter);

    // Main Chapters: Exclude Intro and Conclusion
    const mainChapters = project.structure.filter(c => c !== introChapter && c !== conclusionChapter);

    const content = {
      introduction: introChapter ? introChapter.content : "",
      chapters: mainChapters,
      conclusion: conclusionChapter ? conclusionChapter.content : "",
      acknowledgments: project.metadata.acknowledgments || "",
      dedication: project.metadata.dedication || "",
      aboutAuthor: project.metadata.aboutAuthor || "",
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
        await fetch(`/api/projects/${projectId}/send-email`, {
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

  // Define handleGenerateExtras at top level
  const handleGenerateExtras = async () => {
    if (!dedicationTo && !ackTo) return alert(t.fillAuthInfo);
    setGeneratingExtras(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/generate-extras`, {
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

    updateMetadata({ dedication, acknowledgments: ack, status: 'COMPLETED', progress: 100 });
    setProject(updatedProject);
    setSending(false);
  };

  const initialized = useRef(false);

  const initProject = async () => {
    if (initialized.current) return;
    initialized.current = true;

    setAppStep(2);

    try {
      const p = await API.createProject(metadata.authorName, metadata.topic, language, userContact, true);

      if ((p as any).error || !p.id) {
        console.warn("Project Create Failed:", p);

        // Manual Release Override Check: If we can verify the user has access via another call, maybe we skip?
        // Actually, API.createProject should HAVE succeeded if manually released.
        // If it failed, it means createProject rejected it.
        // Let's double check if we can bypass.

        // Payment Required Logic
        if (userContact?.email) {
          fetch(`/api/payment/check-access?email=${userContact.email}`)
            .then(r => r.json())
            .then(access => {
              if (access.hasAccess && access.credits > 0) {
                setError("Erro ao iniciar projeto, mas você tem créditos. Tente recarregar.");
                return;
              }

              const isPlanActive = !!(access.plan && access.plan.status === 'ACTIVE');
              const subPrice = isPlanActive ? 0 : (access.subscriptionPrice || 49.90);

              setUpsellOffer({
                price: access.bookPrice,
                planName: access.planLabel || (access.plan?.name ? `Plano ${access.plan.name}` : "STARTER"),
                link: access.checkoutUrl,
                level: access.discountLevel,
                subscriptionPrice: subPrice,
                subscriptionLink: "#"
              });

              // Flow: If Plan Active -> Show Reward (User clicks -> Go to Book Checkout)
              // If Plan Inactive -> Show Payment Gate (Total)
              if (isPlanActive) {
                setShowReward(true);
                setShowPaymentGate(false);
              } else {
                setShowPaymentGate(true);
                setShowReward(false);
              }
              setError("Aguardando Pagamento...");
            })
            .catch(err => {
              console.error("Access check fail", err);
              setError("Erro ao verificar status.");
            });
          return;
        }
        throw new Error((p as any).error || "Failed to create project");
      }

      setProjectId(p.id);
      setProject(p);

      // STRICT CHECK: Only start research if explicitly authorized via Payment/Admin
      if (p.metadata.status === 'IDLE') {
        const accessCheck = await fetch(`/api/payment/check-access?email=${userContact.email}`).then(r => r.json());

        if (accessCheck.hasAccess) {
          await API.startResearch(p.id, language, userContact?.email);
        } else {
          // Access Denied -> Show Payment Gate (User must pay or Admin must approve)
          const isPlanActive = !!(accessCheck.plan && accessCheck.plan.status === 'ACTIVE');
          const subPrice = isPlanActive ? 0 : (accessCheck.subscriptionPrice || 49.90);

          setUpsellOffer({
            price: accessCheck.bookPrice,
            planName: accessCheck.planLabel || (accessCheck.plan?.name ? `Plano ${accessCheck.plan.name}` : "STARTER"),
            link: accessCheck.checkoutUrl,
            level: accessCheck.discountLevel,
            subscriptionPrice: subPrice,
            subscriptionLink: "#"
          });

          if (isPlanActive) {
            setShowReward(true);
            setShowPaymentGate(false);
          } else {
            setShowPaymentGate(true);
            setShowReward(false);
          }
        }
      }
    } catch (e: any) {
      console.error("Project Init Error:", e);

      // Robust check for Payment Error (String or JSON)
      let isPaymentError = e.message?.includes('Payment Required') || e.message?.includes('PAYMENT_REQUIRED');
      if (!isPaymentError && e.message?.startsWith('{')) {
        try {
          const parsed = JSON.parse(e.message);
          if (parsed.code === 'PAYMENT_REQUIRED') isPaymentError = true;
        } catch (_) { console.warn("Failed to parse error JSON", _); }
      }

      if (userContact?.email) {
        // Always attempt to refresh access status to show correct Gate/Error
        fetch(`/api/payment/check-access?email=${userContact.email}`)
          .then(r => r.json())
          .then(access => {
            // If we confirmed it's a payment error, OR if access check says no access
            if (isPaymentError || !access.hasAccess) {
              setUpsellOffer({
                price: access.bookPrice,
                planName: access.plan?.name || "STARTER",
                link: access.checkoutUrl,
                level: access.discountLevel
              });
              setShowPaymentGate(true);
              setError(null); // Clear generic error
            } else {
              // Access seems OK, but startResearch failed for other reasons
              const msg = isPaymentError ? "Pagamento necessário." : (e.message || String(e));
              setError(`Debug Loop 1: ${msg}`);
            }
          })
          .catch(err => {
            console.error("Access check fail", err);
            setError(`Debug Loop 2: ${err.message || String(err)}`);
          });
        return;
      }

      // Fallback
      const rawMsg = e.message || String(e);
      // DEBUG MODE: Show exact error
      setError(`Erro Técnico: ${rawMsg}`);
    }
  };

  // Skip the useEffect init since we call it manually after animation
  // useEffect(() => {
  //   if (initialized.current) return;
  //   initialized.current = true;
  //   setAppStep(2);
  //   const init = async () => { ... }
  //   init();
  // }, [metadata.authorName, metadata.topic]);


  // --- HOISTED HELPER FUNCTIONS & EFFECTS (Must be before conditional returns) ---

  const handleTitleSelect = async (opt: TitleOption) => {
    if (!projectId) return;
    updateMetadata({ bookTitle: opt.title, subTitle: opt.subtitle });
    await API.selectTitle(projectId, opt.title, opt.subtitle);
  };

  const handleApproveStructure = async () => {
    if (!projectId || !project) return;
    try {
      await API.generateBookContent(projectId, undefined, userContact?.email);
      setProject({ ...project, metadata: { ...project.metadata, status: 'WRITING_CHAPTERS', progress: 41 } });
      setAppStep(3);
    } catch (e: any) {
      console.error("Structure Approve Error", e);
      setError("Erro ao iniciar escrita. Tente novamente.");
    }
  };

  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = async () => {
    if (!projectId || !project) return;
    setRetryCount(prev => prev + 1);
    try {
      if (progress < 30) {
        await API.startResearch(projectId);
        setProject({ ...project, metadata: { ...project.metadata, status: 'RESEARCHING', statusMessage: 'Reiniciando pesquisa automaticamente...' } });
      } else if (progress >= 30 && progress < 41) {
        await API.generateBookContent(projectId);
        setProject({ ...project, metadata: { ...project.metadata, status: 'WRITING_CHAPTERS', statusMessage: 'Iniciando escrita...' } });
      } else {
        await API.generateBookContent(projectId);
        setProject({ ...project, metadata: { ...project.metadata, status: 'WRITING_CHAPTERS', statusMessage: 'Retomando a escrita automaticamente...' } });
      }
    } catch (e) {
      console.error("Auto-retry failed", e);
    }
  };

  // Auto-Retry Effect
  useEffect(() => {
    if (status === 'FAILED') {
      if (retryCount < 20) {
        const timer = setTimeout(() => { handleRetry(); }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      if (status !== 'FAILED' && retryCount > 0 && status !== 'IDLE') {
        setRetryCount(0);
      }
    }
  }, [status, retryCount]);

  // Polling
  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(async () => {
      try {
        const p = await API.getProject(projectId);
        if (p && p.metadata) setProject(p);
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [projectId]);

  // Sync App Step
  useEffect(() => {
    if (!project || !project.metadata) return;
    const { status } = project.metadata;
    if (status === 'WRITING_CHAPTERS') {
      setAppStep(3);
    } else if (status === 'GENERATING_MARKETING' || status === 'WAITING_DETAILS' || status === 'COMPLETED') {
      setAppStep(4);
    }
  }, [project?.metadata?.status, setAppStep]);

  // AUTO-ADVANCE EFFECT
  useEffect(() => {
    if (!project || !project.metadata || error) return;
    const { status, autoGenerate } = project.metadata;
    const { titleOptions } = project;

    // Check if Auto-Generate Flag is ON (Set by Admin "Gerar Livro")
    if (autoGenerate) {
      // Auto-Select Title
      if (status === 'WAITING_TITLE' && titleOptions && titleOptions.length > 0) {
        handleTitleSelect(titleOptions[0]);
      }
      // Auto-Approve Structure
      if (status === 'REVIEW_STRUCTURE' || (status === 'IDLE' && project.structure.length > 0 && progress === 40)) {
        handleApproveStructure();
      }
    }
  }, [project, error]);

  // --- END OF EFFECTS ---

  if (isLoadingAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center p-8">
        <Spinner />
        <p className="mt-4 text-slate-500">Conectando aos servidores de criação...</p>
      </div>
    );
  }

  // RENDER CUSTOM FACTORY INTRO
  if (isManufacturing) {
    const messages = [
      "Verificando os dados informados...",
      "Validando o Tema/Assunto do livro...",
      "Preparando as máquinas para começar a produzir seu futuro Best Seller...",
      "Tudo pronto para começar..."
    ];

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in text-center p-8">
        <div className="mb-12 relative w-32 h-32 flex items-center justify-center">
          {/* Gear Animation */}
          <svg className="w-32 h-32 text-slate-800 animate-spin-slow absolute opacity-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
          <div className="text-6xl animate-bounce">🏭</div>
        </div>

        <h2 className="text-2xl font-bold text-slate-700 mb-4 animate-pulse">
          {messages[factoryStep]}
        </h2>

        <div className="w-64 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(factoryStep + 1) * 25}%` }}
          ></div>
        </div>
      </div>
    );
  }



  if (showReward) {
    return (
      <RewardModal
        isOpen={true}
        onClose={() => setShowReward(false)}
        onClaim={() => {
          if (upsellOffer?.link) {
            window.location.href = upsellOffer.link;
          } else {
            setShowReward(false);
            if (!projectId) initProject();
          }
        }}
        offer={{
          level: upsellOffer?.level || 4,
          price: upsellOffer?.price || 16.90,
          planName: upsellOffer?.planName || "BLACK"
        }}
      />
    )
  }

  if (showPaymentGate) {
    return (
      <PaymentGate
        isOpen={true}
        planName={upsellOffer?.planName || "STARTER"}
        bookPrice={upsellOffer?.price || 39.90}
        subscriptionPrice={upsellOffer?.subscriptionPrice || 49.90}
        checkoutUrl={upsellOffer?.subscriptionLink || "https://pay.kiwify.com.br/SpCDp2q"} // FIX: Ensure this is the PLAN Link not Book Link? 
        // Logic: If user is Pending Sub, they need PLAN link. If they are Sub but no credits, they need BOOK link.
        // Usually Admin sets Plan Link in backend 'payment.controller'.
        userEmail={userContact?.email}
        onConfirmPayment={checkAccessStatus}
      />
    );
  }








  if (error) return <div className="text-red-500 text-center p-10 bg-red-50 rounded-xl m-10 border border-red-200">{error}</div>;
  if (!project || !project.metadata) return <div className="text-center p-20 flex flex-col items-center"><Spinner /> <span className="mt-4 text-slate-500">{t.startingIntelligence}</span></div>;

  // Refine UI (Moved here to take precedence over status checks)
  if (isRefining) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-xl shadow-lg border border-slate-200 animate-fade-in-up">
        <h2 className="text-2xl font-bold mb-4 text-slate-800">Refinar Pesquisa 🧐</h2>
        <div className="bg-blue-50 p-4 rounded-lg mb-6 text-sm text-blue-800 border border-blue-100">
          <p>A inteligência artificial pode ter interpretado mal seu tema. Use o campo abaixo para ser <strong>mais específico</strong>.</p>
          <p className="mt-2 text-xs opacity-75">Ex: "Antigravity (Ferramenta Google)" ao invés de apenas "Antigravity".</p>
        </div>

        <label className="block text-sm font-bold text-slate-700 mb-2">Tema / Tópico do Livro</label>
        <textarea
          value={refineTopic}
          onChange={e => setRefineTopic(e.target.value)}
          className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
          rows={4}
          placeholder="Descreva o tema com mais detalhes..."
        />

        <div className="flex gap-3 mt-6 justify-end">
          <button
            onClick={() => setIsRefining(false)}
            className="px-6 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleRefineSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30"
          >
            🔄 Refazer Pesquisa
          </button>
        </div>
      </div>
    );
  }

  if (status === 'WAITING_TITLE') {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center font-serif">{t.marketAnalysisComplete}</h2>
        <p className="text-center text-slate-500 mb-8 text-lg">{t.selectTitle}</p>

        <div className="grid gap-4 md:grid-cols-2 mt-6">
          {project.titleOptions && project.titleOptions.length > 0 ? (
            project.titleOptions.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleTitleSelect(opt)}
                className={`text-left p-6 rounded-xl border transition-all bg-white group relative overflow-hidden ${opt.isTopChoice ? 'border-[#0ea5e9] shadow-lg ring-2 ring-[#e0f2fe]' : 'border-gray-200 hover:border-[#0ea5e9] hover:shadow-md'}`}
              >
                <div className="absolute top-0 right-0 p-2 opacity-5">
                  <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                </div>
                {opt.isTopChoice && (
                  <span className="absolute top-0 right-0 bg-[#0ea5e9] text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-20">{t.bestChoice}</span>
                )}
                <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-[#0284c7] relative z-10">{opt.title}</h3>
                <p className="text-sm text-slate-600 italic mb-4 relative z-10">{opt.subtitle}</p>
                <div className="text-xs bg-slate-50 p-3 rounded text-slate-500 border border-slate-100 relative z-10 flex items-start gap-2">
                  <span className="text-yellow-500 text-base">★</span>
                  <span>{opt.reason}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="md:col-span-2 text-center p-10 bg-slate-50 rounded-xl border border-dashed border-slate-300 animate-fade-in-up">
              <div className="text-4xl mb-4">🤔</div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">Ops! Precisamos de mais detalhes.</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto">A Inteligência Artificial não conseguiu criar títulos virais com o tema atual. Tente ser mais específico sobre o nicho.</p>
              <button
                onClick={() => {
                  setRefineTopic(project?.metadata.topic || "");
                  setIsRefining(true);
                }}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition transform hover:-translate-y-1"
              >
                🔄 Refinar Pesquisa Agora
              </button>
            </div>
          )}
        </div>
        <div className="text-center mt-8">
          <button
            onClick={() => {
              setRefineTopic(project?.metadata.topic || "");
              setIsRefining(true);
            }}
            className="text-slate-400 hover:text-red-500 text-sm font-medium underline transition-colors flex items-center gap-2 mx-auto"
          >
            ❌ Não gostei: Refazer Pesquisa
          </button>
        </div>
      </div>
    );
  }

  // Handle Structure Review
  if (status === 'REVIEW_STRUCTURE' || (status === 'IDLE' && project.structure.length > 0 && progress === 40)) {
    // Logic moved to handleApproveStructure hoisted above

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
            className="bg-[#0284c7] text-white text-xl px-12 py-4 rounded-xl font-bold shadow-xl shadow-[#0ea5e9]/30 hover:bg-[#0369a1] hover:scale-105 transition-all"
          >
            {t.approveAndWrite}
          </button>
        </div>
        <div className="text-center mt-6">
          <button
            onClick={() => {
              setRefineTopic(project?.metadata.topic || "");
              setIsRefining(true);
            }}
            className="text-slate-400 hover:text-red-500 text-sm font-medium underline transition-colors"
          >
            ❌ Estrutura incorreta? Refazer Pesquisa
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
              className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0ea5e9] outline-none"
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
                if (project && project.id) {
                  window.open(`/api/admin/books/${project.id}`, '_blank');
                }

                // setShowUpsell(true); // Removed to prevent confusing reset
              }
            }}
            className="bg-[#0284c7] text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-[#0ea5e9]/20 hover:bg-[#0369a1] hover:-translate-y-1 transition-all flex items-center gap-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <div className="text-left">
              <div className="text-xs font-normal opacity-80">{t.downloadPackage}</div>
              <div className="text-lg leading-none">{t.downloadDocx}</div>
            </div>
          </button>
        </div>

        <RewardModal
          isOpen={showUpsell}
          onClose={() => setShowUpsell(false)}
          offer={upsellOffer}
          onClaim={async () => {
            // Logic Split:
            // 1. If COMPLETED: User wants to start next book -> Reset to Input Form.
            // 2. If Blocked (Init Failed): User needs to pay -> Open Link.

            const isCompleted = project?.metadata?.status === 'COMPLETED';

            if (isCompleted) {
              // RESET TO START (Input Form) - FORCE NEW TOPIC
              // We reset to Step 0 (Start) or 1 depending on App logic, but crucial is clearing 'topic'
              setShowUpsell(false);
              onReset({
                step: 0, // Go to User/Bio input or start
                resetData: true,
                preserveUser: true, // Hint to App to keep email if possible (implementation depends on App.tsx)
                name: userContact?.name || "",
                email: userContact?.email || "",
                // CRITICAL: Clear Book Metadata
                topic: "",
                authorName: "",
                dedication: ""
              });


            } else {
              // Payment Block (Pay Now)
              if (upsellOffer?.link) {
                window.open(upsellOffer.link, '_blank');
              }
              setShowUpsell(false);
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
                  {language !== 'en' && (
                    <button
                      onClick={() => {
                        // 1. Open Payment
                        window.open(products.english_book || 'https://pay.kiwify.com.br/YOUR_LINK', '_blank');
                        // 2. Ask for confirmation (Simulated "Wait for Payment")
                        if (confirm("Após confirmar o pagamento na nova aba, clique em OK para iniciar a tradução automática.")) {
                          fetch(`/api/projects/${projectId}/translate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ targetLang: 'en' })
                          }).then(res => res.json()).then(data => {
                            alert(data.message);
                          });
                        }
                      }}
                      className="bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-100 shadow-sm flex items-center gap-2"
                    >
                      🇺🇸 Inglês (R$ 24,90)
                    </button>
                  )}

                  {language !== 'es' && (
                    <button
                      onClick={() => {
                        window.open(products.spanish_book || 'https://pay.kiwify.com.br/YOUR_LINK', '_blank');
                        if (confirm("Após confirmar o pagamento na nova aba, clique em OK para iniciar a tradução automática.")) {
                          fetch(`/api/projects/${projectId}/translate`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ targetLang: 'es' })
                          }).then(res => res.json()).then(data => {
                            alert(data.message);
                          });
                        }
                      }}
                      className="bg-white border border-purple-200 text-purple-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-purple-100 shadow-sm flex items-center gap-2"
                    >
                      🇪🇸 Espanhol (R$ 24,90)
                    </button>
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
          <div className={`inline-block p-6 rounded-full mb-6 bg-white shadow-xl border-4 ${status === 'FAILED' ? 'border-red-100' : 'border-[#f0f9ff]'}`}>
            {status === 'FAILED' ? (
              <span className="text-4xl">⚠️</span>
            ) : (
              <>
                {/* Industrial Research: Gears & Scanner */}
                {progress < 25 && (
                  <div className="relative w-20 h-20">
                    <svg className="w-20 h-20 text-slate-300 absolute top-0 left-0 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-brand-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                  </div>
                )}

                {/* Industrial Analysis: Blueprint/Schematic */}
                {progress >= 25 && progress < 41 && (
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-16 h-16 text-blue-600 drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <div className="absolute -bottom-2 -right-2 bg-blue-600 text-[10px] font-mono text-white px-2 py-0.5 rounded shadow border border-blue-400">BLUEPRINT</div>
                    <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                )}

                {/* Industrial Production: Robot Arm / Assembly */}
                {progress >= 41 && progress < 90 && (
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    {/* Mechanical Arm */}
                    <svg className="w-16 h-16 text-slate-700 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    <div className="absolute bottom-1 w-12 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 animate-[shine_1s_infinite]"></div>
                    </div>
                  </div>
                )}

                {/* Final Packing: Shipping Crate */}
                {progress >= 90 && progress < 100 && (
                  <div className="relative w-20 h-20 flex items-center justify-center">
                    <svg className="w-16 h-16 text-amber-700 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                    <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">READY</div>
                  </div>
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
                  if (progress < 30) {
                    // Failed during Research
                    await API.startResearch(projectId!);
                    // Optimistic update to Researching
                    setProject({ ...project!, metadata: { ...project!.metadata, status: 'RESEARCHING', statusMessage: 'Reiniciando pesquisa...' } });
                  } else if (progress >= 30 && progress < 41) {
                    // Failed during Structure/Title
                    // If structure is missing, maybe regenerate structure?
                    // If we are here, it's ambiguous. But likely we want to go back to Title select or Structure review.
                    // Ideally we reload project. For now let's just Refresh?
                    // Or try generateContent if we think structure is ready.
                    // Let's assume if progress >= 40 (Review Structure), we retry generation.
                    await API.generateBookContent(projectId!);
                    setProject({ ...project!, metadata: { ...project!.metadata, status: 'WRITING_CHAPTERS', statusMessage: 'Iniciando escrita...' } });
                  } else {
                    // Failed during Writing
                    await API.generateBookContent(projectId!);
                    setProject({ ...project!, metadata: { ...project!.metadata, status: 'WRITING_CHAPTERS', statusMessage: 'Retomando a escrita de onde parou...' } });
                  }
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-full font-bold shadow-lg transition-transform hover:scale-105 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                {t.resumeProcess}
              </button>
            ) : (
              <RotatingMessage messages={(() => {
                if (progress < 40) return [
                  "Pesquisando os vídeos mais visualizados sobre o assunto...",
                  "Verificando os comentários nos vídeos sobre o tema...",
                  "Mapeando as dores, dúvidas e sugestões da audiência...",
                  "Analisando tendências de pesquisa no Google...",
                  "Identificando gatilhos mentais mais utilizados...",
                  "Cruzando dados de concorrentes best-sellers..."
                ];
                if (progress < 90) return [
                  "Selecionando as principais informações coletadas na pesquisa profissional...",
                  "Organizando os assuntos de acordo com os capítulos...",
                  "Fazendo a estruturação adequada do pensamento lógico do livro...",
                  "Escrevendo os conteúdos de forma profissional e harmônica...",
                  "Desenvolvendo o pensamento crítico e aplicando ao conteúdo do livro.",
                  "Otimizando parágrafos para retenção de leitura...",
                  "Enriquecendo o texto com exemplos práticos...",
                  "Aplicando técnicas de PNL para persuasão..."
                ];
                return [
                  "REVISANDO O CONTEÚDO FINAL...",
                  "FINALIZANDO OS CAPÍTULOS...",
                  "AJUSTANDO DETALHES FINAIS...",
                  "PREPARANDO O ARQUIVO PARA VOCÊ...",
                  "CONCLUINDO A GERAÇÃO..."
                ];
              })()} />
            )}
          </div>
        </div>

        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-8 max-w-lg mx-auto shadow-inner">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#0ea5e9] to-[#7dd3fc] transition-all duration-700 ease-out shadow-lg" style={{ width: `${progress}%` }}></div>
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
                PESQUISA AVANÇADA
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
                PESQUISA VIRAL PROFISSIONAL
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