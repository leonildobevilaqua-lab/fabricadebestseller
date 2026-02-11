import React, { useEffect, useState, useRef } from 'react';
import { BookMetadata, BookProject, TitleOption, Chapter, MarketingAssets } from '../types';
import * as API from '../services/api';
import { generateDocx } from '../services/docxService';

interface GeneratorProps {
  metadata: BookMetadata;
  updateMetadata: (data: Partial<BookMetadata>) => void;
  onReset: () => void;
  language: string;
  userContact: any;
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

const RotatingMessage = () => {
  const messages = [
    "Estamos desenvolvendo o melhor conteúdo para o seu projeto.",
    "Está realmente ficando maravilhoso o material que estamos construindo.",
    "Parabéns, a sua escolha foi realmente muito adequada para este tema.",
    "Analisando os padrões de escrita dos top 1 best-sellers...",
    "Refinando a copy para máxima retenção do leitor.",
    "Ajustando o tom de voz para conexão emocional...",
    "Formatando parágrafos para leitura fluida..."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex(prev => (prev + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <p className="text-slate-400 text-sm italic min-h-[1.5em] animate-fade-in">
      "{messages[index]}"
    </p>
  );
};

export const Generator: React.FC<GeneratorProps> = ({ metadata, updateMetadata, onReset, language, userContact }) => {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [project, setProject] = useState<BookProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Dedication flow state (Lifted from conditional block)
  const [dedication, setDedication] = useState("");
  const [ack, setAck] = useState("");
  const [sending, setSending] = useState(false);

  const initialized = useRef(false);

  // Initialize Project
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const init = async () => {
      try {
        const p = await API.createProject(metadata.authorName, metadata.topic, language, userContact);
        setProjectId(p.id);
        setProject(p);
        await API.startResearch(p.id);
      } catch (e) {
        setError("Não foi possível conectar ao servidor. Verifique se o backend (porta 3001) está rodando.");
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
        setProject(p);
      } catch (e) {
        console.error("Polling error", e);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [projectId]);

  const handleTitleSelect = async (opt: TitleOption) => {
    if (!projectId) return;
    updateMetadata({ bookTitle: opt.title, subTitle: opt.subtitle });
    await API.selectTitle(projectId, opt.title, opt.subtitle);
    // await API.startGeneration(projectId); 
    // ^ Removed this because we now wait for structure review before writing content.
  };

  const [emailSent, setEmailSent] = useState(false);

  const handleFinalize = async () => {
    if (!project || !project.marketing) return;
    const content = {
      introduction: "",
      chapters: project.structure,
      conclusion: "",
      acknowledgments: "",
      dedication: project.metadata.dedication || "",
      marketing: project.marketing
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
        alert("Livro enviado para seu e-mail com sucesso!");
      } catch (e) {
        console.error(e);
        alert("Erro ao enviar e-mail. Verifique o console.");
      }
      setSending(false);
    }
  };

  if (error) return <div className="text-red-500 text-center p-10 bg-red-50 rounded-xl m-10 border border-red-200">{error}</div>;
  if (!project) return <div className="text-center p-20 flex flex-col items-center"><Spinner /> <span className="mt-4 text-slate-500">Inicializando Protocolo...</span></div>;

  const { status, progress, statusMessage } = project.metadata;

  if (status === 'WAITING_TITLE') {
    return (
      <div className="max-w-4xl mx-auto animate-fade-in-up pb-20">
        <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center font-serif">Análise de Mercado Concluída</h2>
        <p className="text-center text-slate-500 mb-8 text-lg">Selecione um dos títulos gerados. <span className="text-brand-600 font-bold">Os marcados são as melhores apostas virais.</span></p>

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
                <span className="absolute top-0 right-0 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-20">MELHOR ESCOLHA</span>
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
    };

    return (
      <div className="max-w-3xl mx-auto animate-fade-in-up pb-20">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2 font-serif">Estrutura Viral Gerada</h2>
          <p className="text-slate-500">Revise os 12 capítulos planejados pela IA antes de escrever.</p>
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
            Aprovar & Escrever Livro Completo ➜
          </button>
        </div>
      </div>
    );
  }

  // Handle Final Details Input (Dedication)
  if (status === 'WAITING_DETAILS') {
    const handleFinalize = async () => {
      if (!project) return;
      setSending(true);

      // Construct updated project state
      const updatedMetadata = {
        ...project.metadata,
        dedication,
        acknowledgments: ack,
        status: 'COMPLETED' as any,
        progress: 100,
        statusMessage: "Livro Concluído com Sucesso!"
      };

      const updatedProject = { ...project, metadata: updatedMetadata };

      // Trigger download logic immediately
      try {
        // Extract Introduction if it exists in structure (id=0 or title match)
        const introChapter = project.structure.find(c => c.id === 0 || c.title.toLowerCase().includes('introdução'));
        const introContent = introChapter ? introChapter.content : "";

        // Filter out intro from main chapters list to avoid duplication in Chapters section
        const mainChapters = project.structure.filter(c => c.id !== 0 && !c.title.toLowerCase().includes('introdução'));

        const content = {
          introduction: introContent,
          chapters: mainChapters,
          conclusion: "",
          dedication: dedication,
          acknowledgments: ack,
          marketing: project.marketing!
        };
        const blob = await generateDocx(updatedProject.metadata, content);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${updatedProject.metadata.bookTitle}_viral.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch (e) {
        console.error("Download error:", e);
        alert("Erro ao criar arquivo DOCX. Tente novamente.");
      }

      // Update Backend & UI
      updateMetadata({ dedication, acknowledgments: ack, status: 'COMPLETED', progress: 100 });
      setProject(updatedProject);
      setSending(false);
    };

    return (
      <div className="max-w-2xl mx-auto animate-fade-in-up pb-20">
        <h2 className="text-3xl font-bold text-slate-800 mb-6 text-center font-serif">Toques Finais de Autoria</h2>
        <div className="bg-white p-8 rounded-xl shadow-xl border border-slate-200">
          <div className="mb-6">
            <label className="block font-bold text-slate-700 mb-2">Para quem você dedica este livro?</label>
            <textarea
              className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              rows={3}
              placeholder="Ex: Dedico aos meus pais..."
              value={dedication}
              onChange={e => setDedication(e.target.value)}
            />
          </div>
          <div className="mb-8">
            <label className="block font-bold text-slate-700 mb-2">Agradecimentos Especiais</label>
            <textarea
              className="w-full p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
              rows={3}
              placeholder="Ex: Agradeço a Deus e aos meus mentores..."
              value={ack}
              onChange={e => setAck(e.target.value)}
            />
          </div>
          <button
            onClick={handleFinalize}
            disabled={sending}
            className="w-full bg-green-600 text-white text-lg py-4 rounded-xl font-bold shadow-lg hover:bg-green-700 transition"
          >
            Finalizar & Gerar Arquivos
          </button>
        </div>
      </div>
    );
  }

  if (status === 'COMPLETED' && project.marketing) {
    return (
      <div className="text-center py-12 max-w-4xl mx-auto">
        <div className="mb-6 inline-flex bg-green-100 p-4 rounded-full text-green-600 shadow-sm animate-bounce-slow">
          <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h2 className="text-4xl font-serif font-bold mb-2 text-slate-900">Obra Finalizada!</h2>
        <p className="mb-8 text-slate-600 text-xl font-light">"{project.metadata.bookTitle}"</p>

        <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500"></div>
            <h3 className="font-bold mb-3 text-slate-800 uppercase text-xs tracking-wider flex justify-between items-center">
              Sinopse Amazon
              <span className="text-green-500 text-[10px] bg-green-50 px-2 py-1 rounded">SEO Otimizado</span>
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">{project.marketing.salesSynopsis}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
            <h3 className="font-bold mb-3 text-slate-800 uppercase text-xs tracking-wider">Descrição YouTube</h3>
            <p className="text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">{project.marketing.youtubeDescription}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
            <h3 className="font-bold mb-3 text-slate-800 uppercase text-xs tracking-wider">Texto da Contracapa</h3>
            <p className="text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto pr-2 custom-scrollbar">{project.marketing.backCover}</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md border border-slate-100 relative overflow-hidden group">
            <h3 className="font-bold mb-3 text-slate-800 uppercase text-xs tracking-wider">Palavras-Chave Virais</h3>
            <div className="flex flex-wrap gap-2">
              {project.marketing.keywords.slice(0, 10).map(k => (
                <span key={k} className="text-xs bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition cursor-default">{k}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <button onClick={onReset} className="px-6 py-4 rounded-xl text-slate-500 hover:bg-slate-100 transition font-medium">
            Resetar Sistema
          </button>
          <button onClick={handleFinalize} className="bg-brand-600 text-white px-10 py-4 rounded-xl font-bold shadow-xl shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-1 transition-all flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            <div className="text-left">
              <div className="text-xs font-normal opacity-80">Download Pacote Completo</div>
              <div className="text-lg leading-none">Baixar Manuscrito (.DOCX)</div>
            </div>
          </button>
        </div>

        {/* Translation Upsell */}
        <div className="mt-8 pt-8 border-t border-slate-200">
          <h3 className="text-xl font-bold text-slate-800 mb-2">Maximize seu Alcance Global 🌍</h3>
          <p className="text-slate-500 mb-4">Traduza este livro profissionalmente para {language === 'en' ? 'Português ou Espanhol' : (language === 'pt' ? 'Inglês ou Espanhol' : 'Inglês ou Português')} e triplique suas vendas.</p>
          <button
            onClick={() => alert("Funcionalidade de tradução será liberada após pagamento de R$ 24,99. (Simulação)")}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-purple-700 transition shadow-lg flex items-center gap-2 mx-auto"
          >
            <span>Traduzir Agora (+ R$ 24,99)</span>
          </button>
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
            {status === 'FAILED' ? "Processo Interrompido" : (statusMessage || "Iniciando inteligência...")}
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
                Retomar Processo
              </button>
            ) : (
              <RotatingMessage />
            )}
          </div>
        </div>

        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden mb-8 max-w-lg mx-auto shadow-inner">
          <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-brand-500 to-brand-300 transition-all duration-700 ease-out shadow-lg" style={{ width: `${progress}%` }}></div>
        </div>

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
                Pesquisa de Mercado & Tendências
                {progress < 30 && progress > 0 && <span className="ml-2 text-xs text-brand-500 animate-pulse">...Analisando YouTube/Google</span>}
              </span>
            </div>

            {/* Structure Step */}
            <div className={`flex items-center gap-3 transition-opacity duration-500 ${progress >= 30 ? 'opacity-100' : 'opacity-40'}`}>
              {progress >= 45 ? <CheckIcon /> : <EmptyCircle />}
              <span className={progress >= 45 ? 'text-slate-500' : 'text-slate-700'}>
                Engenharia da Estrutura (12 Capítulos)
              </span>
            </div>

            {/* Writing Loop */}
            <div className={`flex items-center gap-3 transition-opacity duration-500 ${progress >= 45 ? 'opacity-100' : 'opacity-40'}`}>
              {progress >= 95 ? <CheckIcon /> : <div className={`w-5 h-5 flex items-center justify-center ${progress >= 45 ? '' : ''}`}>{progress >= 45 && <div className="w-2 h-2 bg-brand-500 rounded-full animate-ping"></div>}</div>}
              <span className={progress >= 95 ? 'text-slate-500' : 'text-slate-700'}>
                Escrita Profunda & Copywriting
              </span>
            </div>

            {project.structure.length > 0 && progress >= 45 && progress < 95 && (
              <div className="ml-8 mt-1 space-y-1 pl-4 border-l-2 border-brand-200">
                {project.structure.map(c => (
                  <div key={c.id} className="text-xs flex items-center gap-2 transition-colors duration-300">
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
              <span className={progress >= 100 ? 'text-slate-500' : 'text-slate-700'}>Otimização Amazon KDP (SEO & Sinopse)</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};