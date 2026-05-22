import React, { useState, useEffect } from 'react';
import { 
  Sparkles, UploadCloud, CheckCircle2, ArrowLeft, ArrowRight, 
  Download, Layout, Eye, RefreshCw, FileText, Lock, Palette, 
  Info, Check, ChevronRight, BookOpen, AlertTriangle
} from 'lucide-react';
import { CoverRender, calcDims, STYLES, CoverBookData, CoverAssets, CoverDims } from './CoverRender';
import './cover-generator.css';

// ---- Top 10 Bestsellers Mock Data ----
const MARKET_TOP10 = [
  { title: "Pai Rico, Pai Pobre", author: "Robert Kiyosaki", publisher: "Alta Books", rating: "4.8", reviews: "58.2k", bg: "linear-gradient(135deg,#a52929,#5a1212)" },
  { title: "Mais Esperto Que o Diabo", author: "Napoleon Hill", publisher: "CDG", rating: "4.8", reviews: "32.1k", bg: "linear-gradient(135deg,#0a0a0a,#3a2c10)" },
  { title: "Os Segredos da Mente Milionária", author: "T. Harv Eker", publisher: "Sextante", rating: "4.8", reviews: "41.4k", bg: "linear-gradient(135deg,#0c2654,#10100a)" },
  { title: "Como Fazer Amigos e Influenciar Pessoas", author: "Dale Carnegie", publisher: "Sextante", rating: "4.8", reviews: "28.9k", bg: "linear-gradient(135deg,#d4a017,#7a5a08)" },
  { title: "Hábitos Atômicos", author: "James Clear", publisher: "Alta Books", rating: "4.9", reviews: "82.5k", bg: "linear-gradient(135deg,#0a4d2a,#062814)" },
  { title: "O Poder do Hábito", author: "Charles Duhigg", publisher: "Objetiva", rating: "4.7", reviews: "34.7k", bg: "linear-gradient(135deg,#1e3a8a,#0a1838)" },
  { title: "Mindset", author: "Carol S. Dweck", publisher: "Objetiva", rating: "4.7", reviews: "19.3k", bg: "linear-gradient(135deg,#7a1d1d,#3a0a0a)" },
  { title: "A Coragem de Ser Imperfeito", author: "Brené Brown", publisher: "Sextante", rating: "4.7", reviews: "15.8k", bg: "linear-gradient(135deg,#b8860c,#5a4108)" },
];

interface CoverGeneratorProps {
  credits: number;
  userEmail: string;
  onRefresh: () => Promise<void> | void;
}

export default function CoverGenerator({ credits, userEmail, onRefresh }: CoverGeneratorProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // ---- Default initial project data ----
  const [projectData, setProjectData] = useState<{
    bookFile: string | null;
    pages: number;
    paper: string;
    format: string;
    flap: number;
    dims: CoverDims;
    analysis: {
      title: string;
      subtitle: string;
      author: string;
      publisher: string;
      niche: string;
      subniche: string;
    };
    assets: CoverAssets & {
      backHook: string;
      backBody: string;
      backBullets: string[];
      backCTA: string;
      flapHook: string;
      flapBody: string;
      authorBio: string;
    };
    selectedStyle: string;
  }>(() => {
    const defaultDims = calcDims({ pages: 150, paper: "bw-cream", flap: 70 });
    return {
      bookFile: null,
      pages: 150,
      paper: "bw-cream",
      format: "6x9",
      flap: 70,
      dims: defaultDims,
      analysis: {
        title: "O Segredo da Escrita Ágil",
        subtitle: "Como escrever e publicar seu primeiro best-seller usando o método estruturado da Fábrica",
        author: "Jonas Silva",
        publisher: "Editora 360° Express",
        niche: "Negócios & Marketing",
        subniche: "Escrita Criativa / Produtividade",
      },
      assets: {
        authorPhoto: "",
        isbn: "978-65-01-48854-7",
        backHook: "Seu livro está pronto, mas a sua capa ainda não vende?",
        backBody: "Muitos autores cometem o erro clássico de julgar que um excelente conteúdo se vende sozinho. A verdade é direta: a capa é o seu principal ponto de conversão física e digital. É ela que fisga o leitor em milésimos de segundo.",
        backBullets: [
          "ENTENDA as dinâmicas de cores de alta retenção no mercado editorial moderno.",
          "DESCUBRA o segredo do posicionamento de títulos stacked que convertem cliques.",
          "APRENDA a estruturar a quarta capa perfeita para impulsionar suas vendas online."
        ],
        backCTA: "ABRA ESTE LIVRO E CONQUISTE SEU LEGADO AUTORAL.",
        flapHook: "Domine a arte de prender leitores à primeira vista.",
        flapBody: "Em 'O Segredo da Escrita Ágil', Jonas Silva entrega um roteiro de aplicação imediata para destravar sua mente e criar capas profissionais que vendem sem esforço.",
        authorBio: "Jonas Silva é especialista em marketing literário, mentor de mais de 300 autores independentes e colaborador da Editora 360° Express.",
      },
      selectedStyle: "premium",
    };
  });

  // Recalculate dimensions when parameters change
  useEffect(() => {
    const computed = calcDims({
      pages: projectData.pages,
      paper: projectData.paper,
      flap: projectData.flap
    });
    setProjectData(prev => ({ ...prev, dims: computed }));
  }, [projectData.pages, projectData.paper, projectData.flap]);

  const handleRefreshCredits = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setTimeout(() => setRefreshing(false), 800);
    }
  };

  // ---- 0 CREDITS GATE ----
  if (credits === 0) {
    return (
      <div className="cover-generator-wrapper max-w-5xl mx-auto py-4">
        {/* Promotional / Checkout Gate */}
        <div className="card glow border-slate-800 bg-slate-950 p-8 md:p-12 text-center rounded-3xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(212,160,23,0.12),transparent_60%)] pointer-events-none" />
          
          <div className="inline-flex p-4 rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-500 mb-6 animate-pulse">
            <Palette size={40} />
          </div>

          <h1 className="h1 text-3xl md:text-5xl font-black tracking-tight mb-4 text-[#F5F0E5]">
            Gerador Automático de <em className="text-amber-400 not-italic">Capas Profissionais</em>
          </h1>
          
          <p className="text-slate-400 max-w-2xl mx-auto text-base md:text-lg mb-8 leading-relaxed">
            Esqueça designers caros e prazos demorados. Nossa IA lê seu manuscrito (Word ou PDF), extrai a essência do seu livro e gera automaticamente 3 modelos de capas prontos para impressão com lombada e orelhas calculadas milimetricamente.
          </p>

          {/* Premium features grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto text-left mb-10">
            <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <Check className="text-amber-500 shrink-0 mt-1" size={18} />
              <div>
                <h3 className="font-bold text-sm text-[#F5F0E5]">Leitura Inteligente de Manuscrito</h3>
                <p className="text-xs text-slate-500 mt-0.5">Nossa IA analisa seu arquivo PDF ou Word para inferir título, subtítulo e biografia do autor.</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <Check className="text-amber-500 shrink-0 mt-1" size={18} />
              <div>
                <h3 className="font-bold text-sm text-[#F5F0E5]">Lombada & Margens Calculadas</h3>
                <p className="text-xs text-slate-500 mt-0.5">Geração milimétrica respeitando as diretrizes oficiais da Amazon KDP baseado nas suas páginas.</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <Check className="text-amber-500 shrink-0 mt-1" size={18} />
              <div>
                <h3 className="font-bold text-sm text-[#F5F0E5]">Selos de Autoridade Integrados</h3>
                <p className="text-xs text-slate-500 mt-0.5">Selo exclusivo da Editora 360° Express pré-inserido para valorizar instantaneamente a capa.</p>
              </div>
            </div>
            <div className="flex gap-3 p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <Check className="text-amber-500 shrink-0 mt-1" size={18} />
              <div>
                <h3 className="font-bold text-sm text-[#F5F0E5]">Código de Barras & QR Code</h3>
                <p className="text-xs text-slate-500 mt-0.5">Espaços reservados e posicionamento perfeito do seu ISBN/Código de barras e QR codes de apoio.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://checkout.ticto.app/OE1970B27" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-gold btn-lg w-full sm:w-auto px-10 py-4 font-bold shadow-amber-500/20 text-slate-950 uppercase tracking-widest text-sm"
            >
              Comprar Crédito de Capa · R$ 87,00
            </a>
            
            <button 
              onClick={handleRefreshCredits} 
              disabled={refreshing} 
              className="btn btn-outline btn-lg w-full sm:w-auto px-8 py-4 font-bold border-slate-700 text-slate-300 hover:text-white uppercase tracking-widest text-xs"
            >
              {refreshing ? (
                <>
                  <RefreshCw className="animate-spin text-amber-500" size={16} /> Verificando...
                </>
              ) : (
                "Já comprei o crédito"
              )}
            </button>
          </div>

          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-6">
            Liberação automática via Ticto Webhook instantaneamente após confirmação de compra
          </p>
        </div>
      </div>
    );
  }

  // ---- 7-STEP WIZARD ----
  const steps = ["Upload", "Análise", "Nicho", "Assets", "Estilos", "Ajustes", "Pronto!"];

  const buildBook = (): CoverBookData => ({
    title: projectData.analysis.title,
    subtitle: projectData.analysis.subtitle,
    author: projectData.analysis.author.toUpperCase(),
    publisher: projectData.analysis.publisher,
    niche: projectData.analysis.niche,
    isbn: projectData.assets.isbn,
    backHook: projectData.assets.backHook,
    backBody: projectData.assets.backBody,
    backBullets: projectData.assets.backBullets,
    backCTA: projectData.assets.backCTA,
    flapHook: projectData.assets.flapHook,
    flapBody: projectData.assets.flapBody,
    authorBio: projectData.assets.authorBio,
  });

  return (
    <div className="cover-generator-wrapper cover-generator-container bg-[#080808] border border-slate-900 shadow-2xl p-6 md:p-8 rounded-3xl">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-amber-500 font-mono text-xs uppercase tracking-widest">
            <Sparkles size={14} /> Geração por Inteligência Artificial
          </div>
          <h2 className="text-xl md:text-3xl font-black text-[#F5F0E5] mt-1">Capa Profissional (IA)</h2>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs font-mono font-bold text-slate-400">
            Créditos: <span className="text-amber-400 font-bold">{credits}</span>
          </span>
          <button 
            onClick={() => { if (window.confirm("Deseja realmente sair? Seu progresso atual não será perdido.")) setActiveStep(0); }} 
            className="btn btn-sm btn-outline text-slate-400 hover:text-white"
          >
            Reiniciar
          </button>
        </div>
      </div>

      {/* Modern Stepper Indicator */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto bg-slate-950/80 border border-slate-900 rounded-2xl p-4 mb-8">
        {steps.map((label, idx) => {
          const isActive = idx === activeStep;
          const isDone = idx < activeStep;
          return (
            <div key={label} className={`flex items-center gap-2 shrink-0 ${isActive ? 'text-amber-400 font-bold' : isDone ? 'text-slate-400' : 'text-slate-600'}`}>
              <div className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center border ${
                isActive ? 'bg-amber-500 border-amber-400 text-slate-950' : isDone ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                {idx + 1}
              </div>
              <span className="text-xs uppercase tracking-widest hidden md:inline">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Step Contents */}
      {activeStep === 0 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="max-w-xl">
            <h3 className="text-lg font-bold text-[#F5F0E5] mb-2">Selecione seu Manuscrito</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              O sistema irá ler no material o nome do autor, título do livro, subtítulo e incluir a logo da Editora 360 Express. Formatos suportados: PDF ou DOCX.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label 
                htmlFor="manuscript-file"
                className={`uploader p-8 min-h-[180px] ${projectData.bookFile ? 'done border-emerald-500 bg-emerald-500/5' : ''}`}
              >
                <input 
                  type="file" 
                  id="manuscript-file"
                  accept=".docx,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setProjectData(prev => ({ ...prev, bookFile: file.name }));
                    }
                  }}
                />
                <div className="ico text-amber-400 border-amber-500/30">
                  <UploadCloud size={24} />
                </div>
                <div className="title font-bold text-sm text-[#F5F0E5]">
                  {projectData.bookFile ? 'Arquivo Selecionado!' : 'Upload do Manuscrito (.pdf ou .docx)'}
                </div>
                <p className="desc text-xs text-slate-500">
                  {projectData.bookFile ? projectData.bookFile : 'Arraste e solte ou clique para selecionar de seu dispositivo'}
                </p>
              </label>

              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label className="text-xs text-slate-400">Total de Páginas</label>
                  <input 
                    type="number" 
                    value={projectData.pages} 
                    onChange={e => setProjectData(prev => ({ ...prev, pages: Math.max(10, parseInt(e.target.value) || 120) }))}
                    className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-2"
                  />
                  <span className="text-[10px] text-slate-500 mt-1">Calcula a largura da lombada KDP</span>
                </div>
                <div className="field">
                  <label className="text-xs text-slate-400">Tipo do Papel</label>
                  <select 
                    value={projectData.paper} 
                    onChange={e => setProjectData(prev => ({ ...prev, paper: e.target.value }))}
                    className="select bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-2"
                  >
                    <option value="bw-cream">Preto e Branco - Creme</option>
                    <option value="bw-white">Preto e Branco - Branco</option>
                    <option value="premium">Premium Colorido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="field">
                  <label className="text-xs text-slate-400">Tamanho de Corte</label>
                  <select 
                    value={projectData.format} 
                    onChange={e => setProjectData(prev => ({ ...prev, format: e.target.value }))}
                    className="select bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-2"
                  >
                    <option value="6x9">15.24 x 22.86 cm (6x9 in)</option>
                    <option value="5x8">12.7 x 20.32 cm (5x8 in)</option>
                  </select>
                </div>
                <div className="field">
                  <label className="text-xs text-slate-400">Largura Orelhas (mm)</label>
                  <input 
                    type="number" 
                    value={projectData.flap} 
                    onChange={e => setProjectData(prev => ({ ...prev, flap: Math.max(0, parseInt(e.target.value) || 0) }))}
                    className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="card bg-slate-950/40 border-slate-900 rounded-3xl p-6 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest mb-4">Dimensões Reais de Impressão</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="dim bg-slate-900/60 border-slate-800 p-4 rounded-2xl">
                    <span className="k text-[10px] text-amber-400 block mb-1">LOMBADA (mm)</span>
                    <span className="v text-lg font-black text-[#F5F0E5]">{projectData.dims.spineMM}</span>
                  </div>
                  <div className="dim bg-slate-900/60 border-slate-800 p-4 rounded-2xl">
                    <span className="k text-[10px] text-amber-400 block mb-1">ALTURA TOTAL (mm)</span>
                    <span className="v text-lg font-black text-[#F5F0E5]">{projectData.dims.totalH}</span>
                  </div>
                  <div className="dim bg-slate-900/60 border-slate-800 p-4 rounded-2xl col-span-2">
                    <span className="k text-[10px] text-amber-400 block mb-1">LARGURA TOTAL (mm)</span>
                    <span className="v text-lg font-black text-[#F5F0E5]">{projectData.dims.totalW} <span className="text-xs font-normal text-slate-500">com orelhas</span></span>
                  </div>
                </div>
              </div>

              <div className="alert bg-amber-500/5 border-amber-500/10 rounded-2xl p-4 flex gap-3 text-xs text-slate-400 mt-6 leading-relaxed">
                <Info size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <p>
                  As medidas já incluem os <strong>3.175mm de sangria (bleed)</strong> exigidos pelas gráficas profissionais e Amazon KDP.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-900 mt-6">
            <button 
              onClick={() => setActiveStep(1)} 
              disabled={!projectData.bookFile} 
              className="btn btn-gold px-8 py-3 text-slate-950 font-bold uppercase tracking-widest text-xs disabled:opacity-50"
            >
              Iniciar Análise <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      {activeStep === 1 && (
        <SimulatedLogStep 
          label="Etapa 2 de 7 · Análise Inteligente" 
          messages={[
            "Conectando ao núcleo de IA da Fábrica...",
            "Processando documento: " + projectData.bookFile,
            "Lendo cabeçalho e rodapés do manuscrito...",
            "Extraindo título principal...",
            "Extraindo subtítulo de apoio e promessa...",
            "Identificando nome do autor...",
            "Ajustando layout para o padrão Editora 360 Express...",
          ]}
          onComplete={() => setActiveStep(2)}
        />
      )}

      {activeStep === 2 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="max-w-xl">
            <h3 className="text-lg font-bold text-[#F5F0E5] mb-2">Metadados Extraídos da Obra</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Verifique e ajuste abaixo os dados que o sistema identificou no seu manuscrito. Você pode editá-los livremente se necessário.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="field">
              <label className="text-xs text-slate-400">Título do Livro</label>
              <input 
                type="text" 
                value={projectData.analysis.title} 
                onChange={e => setProjectData(prev => ({ ...prev, analysis: { ...prev.analysis, title: e.target.value } }))}
                className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-3"
              />
            </div>
            
            <div className="field">
              <label className="text-xs text-slate-400">Nome do Autor</label>
              <input 
                type="text" 
                value={projectData.analysis.author} 
                onChange={e => setProjectData(prev => ({ ...prev, analysis: { ...prev.analysis, author: e.target.value } }))}
                className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-3"
              />
            </div>

            <div className="field md:col-span-2">
              <label className="text-xs text-slate-400">Subtítulo do Livro</label>
              <input 
                type="text" 
                value={projectData.analysis.subtitle} 
                onChange={e => setProjectData(prev => ({ ...prev, analysis: { ...prev.analysis, subtitle: e.target.value } }))}
                className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-3"
              />
            </div>

            <div className="field">
              <label className="text-xs text-slate-400">Nicho Temático</label>
              <input 
                type="text" 
                value={projectData.analysis.niche} 
                onChange={e => setProjectData(prev => ({ ...prev, analysis: { ...prev.analysis, niche: e.target.value } }))}
                className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-3"
              />
            </div>

            <div className="field">
              <label className="text-xs text-slate-400">Sub-nicho / Tags</label>
              <input 
                type="text" 
                value={projectData.analysis.subniche} 
                onChange={e => setProjectData(prev => ({ ...prev, analysis: { ...prev.analysis, subniche: e.target.value } }))}
                className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-3"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-900 mt-6">
            <button onClick={() => setActiveStep(0)} className="btn btn-outline text-slate-400">
              <ArrowLeft size={14} className="mr-1" /> Voltar
            </button>
            <button onClick={() => setActiveStep(3)} className="btn btn-gold px-8 py-3 text-slate-950 font-bold uppercase tracking-widest text-xs">
              Confirmar Nicho <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      {activeStep === 3 && (
        <SimulatedLogStep 
          label="Etapa 3 de 7 · Padrão de Ouro de Mercado" 
          messages={[
            "Pesquisando na biblioteca da Amazon pelos best-sellers em " + projectData.analysis.niche + "...",
            "Analisando paleta de cores dominante nos 10 livros mais vendidos...",
            "Analisando fontes e padrões tipográficos do nicho...",
            "Mapeando contrastes e pesos estruturais de capas com mais de 10k reviews...",
            "Simulando renderização competitiva nas prateleiras digitais...",
          ]}
          renderDetails={() => (
            <div className="mt-8 space-y-4">
              <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">Capas de Alta Conversão no Nicho</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {MARKET_TOP10.slice(0, 4).map((bk, i) => (
                  <div key={i} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between min-h-[120px]">
                    <div>
                      <div className="w-5 h-5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold flex items-center justify-center mb-2">#{i+1}</div>
                      <h5 className="font-bold text-xs text-[#F5F0E5] line-clamp-1">{bk.title}</h5>
                      <p className="text-[10px] text-slate-500">{bk.author}</p>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono font-bold mt-2">⭐ {bk.rating} ({bk.reviews})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          onComplete={() => setActiveStep(4)}
        />
      )}

      {activeStep === 4 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="max-w-xl">
            <h3 className="text-lg font-bold text-[#F5F0E5] mb-2">Assets de Quarta Capa & Orelhas</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Forneça os textos de apoio e arquivos opcionais para compor a contracapa e as orelhas do seu livro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="field">
                <label className="text-xs text-slate-400">Frase de Efeito Contracapa (Hook)</label>
                <input 
                  type="text" 
                  value={projectData.assets.backHook} 
                  onChange={e => setProjectData(prev => ({ ...prev, assets: { ...prev.assets, backHook: e.target.value } }))}
                  className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-2.5"
                />
              </div>

              <div className="field">
                <label className="text-xs text-slate-400">Texto Principal Contracapa</label>
                <textarea 
                  value={projectData.assets.backBody} 
                  onChange={e => setProjectData(prev => ({ ...prev, assets: { ...prev.assets, backBody: e.target.value } }))}
                  className="textarea bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-2.5 h-24"
                />
              </div>

              <div className="field">
                <label className="text-xs text-slate-400">Código de Barras / ISBN (Opcional)</label>
                <input 
                  type="text" 
                  value={projectData.assets.isbn} 
                  placeholder="Ex: 978-65-01-48854-7"
                  onChange={e => setProjectData(prev => ({ ...prev, assets: { ...prev.assets, isbn: e.target.value } }))}
                  className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-2.5"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="field">
                <label className="text-xs text-slate-400">Gancho da Orelha do Livro (Flap Hook)</label>
                <input 
                  type="text" 
                  value={projectData.assets.flapHook} 
                  onChange={e => setProjectData(prev => ({ ...prev, assets: { ...prev.assets, flapHook: e.target.value } }))}
                  className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-2.5"
                />
              </div>

              <div className="field">
                <label className="text-xs text-slate-400">Texto da Orelha do Livro</label>
                <textarea 
                  value={projectData.assets.flapBody} 
                  onChange={e => setProjectData(prev => ({ ...prev, assets: { ...prev.assets, flapBody: e.target.value } }))}
                  className="textarea bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-4 py-2.5 h-24"
                />
              </div>

              <div className="field">
                <label className="text-xs text-slate-400">Foto do Autor (Opcional)</label>
                <div className="flex gap-4 items-center">
                  <label htmlFor="author-photo-upload" className="uploader dense flex-1 py-3 px-4 rounded-xl border-dashed border-slate-800 bg-slate-900/50 cursor-pointer">
                    <input 
                      type="file" 
                      id="author-photo-upload" 
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            setProjectData(prev => ({ ...prev, assets: { ...prev.assets, authorPhoto: reader.result as string } }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <div className="ico text-amber-500 mr-2 shrink-0">
                      <UploadCloud size={16} />
                    </div>
                    <span className="text-xs font-bold text-[#F5F0E5]">
                      {projectData.assets.authorPhoto ? 'Foto Carregada!' : 'Selecionar Imagem'}
                    </span>
                  </label>
                  
                  {projectData.assets.authorPhoto && (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0">
                      <img src={projectData.assets.authorPhoto} alt="Author" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-900 mt-6">
            <button onClick={() => setActiveStep(2)} className="btn btn-outline text-slate-400">
              <ArrowLeft size={14} className="mr-1" /> Voltar
            </button>
            <button onClick={() => setActiveStep(5)} className="btn btn-gold px-8 py-3 text-slate-950 font-bold uppercase tracking-widest text-xs">
              Pesquisar Modelos <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      {activeStep === 5 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="max-w-xl">
            <h3 className="text-lg font-bold text-[#F5F0E5] mb-2">Escolha o Estilo Visual da Capa</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Criamos 3 estilos únicos baseados nos best-sellers do nicho comercial do seu livro. Clique no seu favorito para continuar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {Object.keys(STYLES).map((key) => {
              const s = STYLES[key];
              const isSelected = projectData.selectedStyle === key;
              return (
                <div 
                  key={key}
                  onClick={() => setProjectData(prev => ({ ...prev, selectedStyle: key }))}
                  className={`card cursor-pointer border-slate-900 flex flex-col justify-between text-left p-6 transition-all duration-200 ${
                    isSelected ? 'ring-2 ring-amber-500 border-transparent bg-slate-900/60 shadow-lg' : 'bg-slate-950/20 hover:border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-black text-sm text-[#F5F0E5]">{s.name}</h4>
                      {isSelected && <span className="p-1 rounded-full bg-amber-500 text-slate-950"><Check size={12} /></span>}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-6">{s.note}</p>
                    
                    {/* Embedded Cover Canvas Miniature Preview */}
                    <div className="flex justify-center scale-90 origin-top">
                      <div className="pointer-events-none rounded overflow-hidden shadow-lg border border-slate-800/50 bg-[#0e0e0e] max-w-full overflow-x-auto">
                        <CoverRender 
                          book={buildBook()} 
                          dims={projectData.dims} 
                          styleKey={key} 
                          mode="ebook" 
                          pxPerMM={0.5} 
                          showGuides={false}
                          assets={projectData.assets}
                        />
                      </div>
                    </div>
                  </div>

                  <button className={`btn btn-sm w-full font-bold uppercase tracking-widest text-[10px] mt-6 ${isSelected ? 'btn-gold' : 'btn-outline'}`}>
                    {isSelected ? 'Selecionado' : 'Escolher Modelo'}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-900 mt-6">
            <button onClick={() => setActiveStep(4)} className="btn btn-outline text-slate-400">
              <ArrowLeft size={14} className="mr-1" /> Voltar
            </button>
            <button onClick={() => setActiveStep(6)} className="btn btn-gold px-8 py-3 text-slate-950 font-bold uppercase tracking-widest text-xs">
              Editar Layout <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      {activeStep === 6 && (
        <Step6Editor 
          data={projectData} 
          setData={(d) => setProjectData(d)}
          onBack={() => setActiveStep(5)}
          onNext={() => setActiveStep(7)}
          buildBook={buildBook}
        />
      )}

      {activeStep === 7 && (
        <div className="space-y-6 animate-fadeIn">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex p-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-[#F5F0E5] mb-2">Sua Capa Profissional Está Pronta!</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Parabéns! Geramos 3 entregáveis prontos respeitando as diretrizes técnicas das principais plataformas do mercado.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="deliverable p-6 bg-slate-950/40 border-slate-900 rounded-2xl flex flex-col justify-between text-left">
              <div>
                <span className="ext text-[9px] bg-amber-500/10 text-amber-400 rounded-md py-1 px-2.5 font-bold uppercase tracking-widest">PDF 300DPI</span>
                <h4 className="font-bold text-sm text-[#F5F0E5] mt-3">Capa Completa com Orelhas</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1.5 mb-6">Perfeito para impressão editorial com orelhas completas de {projectData.flap} mm.</p>
              </div>
              <button 
                onClick={() => alert("Seu arquivo de alta qualidade está sendo preparado para download...")}
                className="btn btn-sm btn-gold font-bold uppercase tracking-widest text-xs w-full mt-auto"
              >
                <Download size={14} className="mr-1" /> Baixar PDF
              </button>
            </div>

            <div className="deliverable p-6 bg-slate-950/40 border-slate-900 rounded-2xl flex flex-col justify-between text-left">
              <div>
                <span className="ext text-[9px] bg-amber-500/10 text-amber-400 rounded-md py-1 px-2.5 font-bold uppercase tracking-widest">PDF KDP</span>
                <h4 className="font-bold text-sm text-[#F5F0E5] mt-3">Capa Sem Orelhas (KDP)</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1.5 mb-6">Ideal para publicação sob demanda na Amazon KDP com lombada exata.</p>
              </div>
              <button 
                onClick={() => alert("Seu arquivo sem orelhas está sendo preparado para download...")}
                className="btn btn-sm btn-gold font-bold uppercase tracking-widest text-xs w-full mt-auto"
              >
                <Download size={14} className="mr-1" /> Baixar PDF
              </button>
            </div>

            <div className="deliverable p-6 bg-slate-950/40 border-slate-900 rounded-2xl flex flex-col justify-between text-left">
              <div>
                <span className="ext text-[9px] bg-emerald-500/10 text-emerald-400 rounded-md py-1 px-2.5 font-bold uppercase tracking-widest">JPG ULTRA</span>
                <h4 className="font-bold text-sm text-[#F5F0E5] mt-3">Capa Frente · Ebook</h4>
                <p className="text-xs text-slate-500 leading-relaxed mt-1.5 mb-6">Projetada especificamente para plataformas digitais e campanhas promocionais.</p>
              </div>
              <button 
                onClick={() => alert("A imagem da capa frente está sendo preparada para download...")}
                className="btn btn-sm btn-gold font-bold uppercase tracking-widest text-xs w-full mt-auto"
              >
                <Download size={14} className="mr-1" /> Baixar Imagem
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-8 border-t border-slate-900 mt-8">
            <button 
              onClick={() => {
                setActiveStep(0);
                setProjectData(prev => ({ ...prev, bookFile: null }));
              }} 
              className="btn btn-outline text-slate-400 px-8 py-3 uppercase tracking-widest text-xs font-bold"
            >
              Criar Outra Capa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SIMULATED LOG PROGRESS COMPONENT
// ============================================================
function SimulatedLogStep({ label, messages, renderDetails, onComplete }: {
  label: string;
  messages: string[];
  renderDetails?: () => React.ReactNode;
  onComplete: () => void;
}) {
  const [visibleLines, setVisibleLines] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    if (currentIdx < messages.length) {
      const timer = setTimeout(() => {
        setVisibleLines(prev => [...prev, messages[currentIdx]]);
        setCurrentIdx(prev => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      const timer = setTimeout(() => {
        onComplete();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [currentIdx]);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      <div className="max-w-xl">
        <h3 className="text-lg font-bold text-[#F5F0E5] mb-2">{label}</h3>
        <p className="text-slate-500 text-xs tracking-wider uppercase font-mono mb-6">Processando em lote via IA...</p>
      </div>

      <div className="log bg-slate-950/80 border-slate-900 rounded-2xl p-6 font-mono text-xs max-h-72 overflow-y-auto space-y-2">
        {visibleLines.map((line, i) => (
          <div key={i} className="line flex gap-3 text-slate-400">
            <span className="t text-slate-600 font-bold shrink-0">[{new Date().toLocaleTimeString()}]</span>
            <span className="m text-amber-500/90">{line}</span>
            {i === visibleLines.length - 1 && currentIdx < messages.length && (
              <span className="spinner text-amber-500 font-bold shrink-0 inline-block animate-spin" />
            )}
          </div>
        ))}
        {currentIdx === messages.length && (
          <div className="line text-emerald-500 font-bold pt-2 flex items-center gap-2">
            <CheckCircle2 size={14} /> Análise concluída com sucesso! Redirecionando...
          </div>
        )}
      </div>

      {renderDetails && renderDetails()}
    </div>
  );
}

// ============================================================
// STEP 6 EDITOR COMPONENT
// ============================================================
function Step6Editor({ data, setData, onBack, onNext, buildBook }: {
  data: any;
  setData: (d: any) => void;
  onBack: () => void;
  onNext: () => void;
  buildBook: () => CoverBookData;
}) {
  const [outputMode, setOutputMode] = useState<"full" | "no-flaps" | "ebook">("full");
  const [showGuides, setShowGuides] = useState(true);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-[#F5F0E5] mb-1">Editor & Ajustes Finos</h3>
          <p className="text-slate-400 text-xs">Customize textos e selecione guias de corte reais para impressão comercial.</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button 
            onClick={() => setOutputMode("full")} 
            className={`btn btn-sm font-bold text-xs uppercase tracking-widest ${outputMode === 'full' ? 'btn-gold text-slate-950' : 'btn-outline text-slate-400'}`}
          >
            Capa Inteira + Orelhas
          </button>
          <button 
            onClick={() => setOutputMode("no-flaps")} 
            className={`btn btn-sm font-bold text-xs uppercase tracking-widest ${outputMode === 'no-flaps' ? 'btn-gold text-slate-950' : 'btn-outline text-slate-400'}`}
          >
            Lombada KDP
          </button>
          <button 
            onClick={() => setOutputMode("ebook")} 
            className={`btn btn-sm font-bold text-xs uppercase tracking-widest ${outputMode === 'ebook' ? 'btn-gold text-slate-950' : 'btn-outline text-slate-400'}`}
          >
            Ebook Frente
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Editor Inputs Panel */}
        <div className="space-y-4">
          <div className="card border-slate-900 bg-slate-950/20 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest border-b border-slate-900 pb-2">Visual do Título</h4>
            
            <div className="field">
              <label className="text-[10px] text-slate-500">Título</label>
              <input 
                type="text" 
                value={data.analysis.title} 
                onChange={e => setData({ ...data, analysis: { ...data.analysis, title: e.target.value } })}
                className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="field">
              <label className="text-[10px] text-slate-500">Subtítulo</label>
              <input 
                type="text" 
                value={data.analysis.subtitle} 
                onChange={e => setData({ ...data, analysis: { ...data.analysis, subtitle: e.target.value } })}
                className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-3 py-2 text-xs"
              />
            </div>

            <div className="field">
              <label className="text-[10px] text-slate-500">Autor</label>
              <input 
                type="text" 
                value={data.analysis.author} 
                onChange={e => setData({ ...data, analysis: { ...data.analysis, author: e.target.value } })}
                className="input bg-slate-900 border-slate-800 text-[#F5F0E5] rounded-xl px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div className="card border-slate-900 bg-slate-950/20 p-5 rounded-2xl space-y-4">
            <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest border-b border-slate-900 pb-2">Controles das Guias</h4>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Mostrar guias de corte (Bleed)</span>
              <button 
                onClick={() => setShowGuides(prev => !prev)}
                className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-200 outline-none ${showGuides ? 'bg-amber-500' : 'bg-slate-800'}`}
              >
                <div className={`bg-slate-950 w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${showGuides ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Live Canvas Preview Panel */}
        <div className="xl:col-span-2 flex flex-col items-center justify-center p-6 bg-slate-950/30 border border-slate-900 rounded-3xl min-h-[480px] overflow-hidden relative">
          <div className="absolute top-4 left-4 text-[10px] text-slate-500 uppercase font-mono flex items-center gap-1.5">
            <Eye size={12} className="text-amber-500" /> Pré-Visualização Dinâmica em Tempo Real
          </div>

          {/* Scaled Wrapper to fit within viewport dynamically */}
          <div className="scale-75 md:scale-[0.85] origin-center max-w-full overflow-x-auto p-4 flex justify-center">
            <CoverRender 
              book={buildBook()} 
              dims={data.dims} 
              styleKey={data.selectedStyle} 
              mode={outputMode} 
              pxPerMM={0.8} 
              showGuides={showGuides}
              assets={data.assets}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-900 mt-6">
        <button onClick={onBack} className="btn btn-outline text-slate-400">
          <ArrowLeft size={14} className="mr-1" /> Voltar
        </button>
        <button onClick={onNext} className="btn btn-gold px-8 py-3 text-slate-950 font-bold uppercase tracking-widest text-xs">
          Finalizar Capa <ArrowRight size={14} className="ml-1" />
        </button>
      </div>
    </div>
  );
}
