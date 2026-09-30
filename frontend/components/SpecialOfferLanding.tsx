import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  BookOpen, 
  Check, 
  CheckCircle, 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  FileText, 
  Lock, 
  Play, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Star, 
  TrendingUp, 
  Users, 
  Video, 
  X, 
  Zap,
  ArrowRight,
  Gift,
  Award,
  QrCode,
  Barcode,
  Layers,
  Compass,
  MessageCircle,
  Flame,
  CalendarCheck
} from 'lucide-react';
import { SocialProofSection } from './SocialProofSection';

// =========================================================================
// CONFIGURAÇÃO DOS LINKS DE CHECKOUT DOS 3 PLANOS
// =========================================================================
const CHECKOUT_URLS = {
  essencial: 'https://payment.ticto.app/O7FDCA228', // R$ 97,00 à vista ou 12x de R$ 10,03
  imersao: 'https://payment.ticto.app/OE7D84BCD',   // R$ 297,00 à vista ou 12x de R$ 30,71
  mentoria: 'https://payment.ticto.app/OCD34ABCE',  // R$ 697,00 à vista ou 12x de R$ 72,07
};

// 5 Alternativas de Título Rotativo (Sorteado a cada acesso - SEM menção a preço na dobra 1)
const HEADLINE_ALTERNATIVES = [
  {
    id: 1,
    badge: 'SISTEMA COMPLETO COM 7 BÔNUS EXCLUSIVOS',
    headline: (
      <>
        Tenha o Sistema Completo de Inteligência Editorial, Diagramação e os 7 Bônus de Lançamento Para Publicar Sua Obra Sem Escrever Uma Única Linha{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
          em Tempo Recorde.
        </span>
      </>
    ),
    subheadline: 'Tenha em mãos a inteligência que varre o YouTube, Google e o Top 10 da Amazon, gera um livro completo de +170 páginas e entrega toda a esteira editorial e de monetização pronta para você lucrar.'
  },
  {
    id: 2,
    badge: 'OFERTA ESPECIAL DE LANÇAMENTO • ECOSSISTEMA COMPLETO',
    headline: (
      <>
        O Que Ghostwriters Cobram <span className="text-red-400 line-through decoration-red-500/70">R$ 5.000</span> Para Fazer, Você Faz em Minutos: Pesquise, Crie, Diagrame e Publique Seu Livro Profissional na Amazon e Impresso{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
          com Padrão de Grandes Editoras.
        </span>
      </>
    ),
    subheadline: 'Sem bloqueio criativo e sem gastar fortunas com editoras tradicionais. Um ecossistema completo com 8 ferramentas de produção editorial e 7 bônus de negócios.'
  },
  {
    id: 3,
    badge: 'MÉTODO EDITORIAL & INTELIGÊNCIA ARTIFICIAL',
    headline: (
      <>
        Transforme Seu Conhecimento em um Livro Físico e Digital Padrão Best-Seller: Da Pesquisa de Mercado à Publicação Internacional{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
          Sem Travar na Folha em Branco.
        </span>
      </>
    ),
    subheadline: 'Tudo o que você precisa do manuscrito à venda na Amazon e UICLAP pronto em tempo recorde com 100% dos direitos autorais e royalties seus.'
  },
  {
    id: 4,
    badge: 'MÁQUINA DE AUTORIDADE & NOVAS FONTES DE RENDA',
    headline: (
      <>
        Pare de Deixar Sua Ideia na Gaveta: Crie Seu Livro de +170 Páginas em Minutos e Ative um Modelo de Negócios Lucrativo na Amazon e UICLAP{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
          em Tempo Recorde.
        </span>
      </>
    ),
    subheadline: 'A inteligência que pesquisa os livros mais vendidos do seu nicho, formata a diagramação no padrão 6x9" (15,24 x 22,86) e entrega a estratégia para gerar autoridade e vendas reais.'
  },
  {
    id: 5,
    badge: 'A REVOLUÇÃO DO MERCADO EDITORIAL',
    headline: (
      <>
        Sem Meses de Espera e Sem Gastar Fortunas com Editoras: O Ecossistema Completo de Publicação Profissional{' '}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
          Pronto Para Você Lucrar.
        </span>
      </>
    ),
    subheadline: 'Pesquise, estruture, crie e publique sua obra de padrão internacional em até 72 horas com o combo oficial da Fábrica de Best Seller.'
  }
];

export const SpecialOfferLanding: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Seleciona uma das 5 headlines aleatoriamente na montagem
  const [currentHeadlineIndex, setCurrentHeadlineIndex] = useState<number>(0);

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * HEADLINE_ALTERNATIVES.length);
    setCurrentHeadlineIndex(randomIndex);
  }, []);

  // Timer de escassez regressivo (14m 58s)
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({
    minutes: 14,
    seconds: 58
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { minutes: prev.minutes - 1, seconds: 59 };
        } else {
          return { minutes: 14, seconds: 59 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckoutPlan = (plan: 'essencial' | 'imersao' | 'mentoria') => {
    window.open(CHECKOUT_URLS[plan], '_blank', 'noopener,noreferrer');
  };

  const scrollToPlanos = () => {
    const el = document.getElementById('planos');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 450);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const currentHeadline = HEADLINE_ALTERNATIVES[currentHeadlineIndex];

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white font-sans selection:bg-amber-500/30 overflow-x-hidden">
      
      {/* 1. BARRA FIXA DE URGÊNCIA & CRONÔMETRO (Sem menção direta a preço) */}
      <div className="bg-gradient-to-r from-red-700 via-amber-600 to-red-700 text-white py-2 px-4 text-center sticky top-0 z-50 flex flex-wrap items-center justify-center gap-2 sm:gap-4 shadow-xl shadow-red-950/40 border-b border-amber-400/30">
        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 animate-pulse text-amber-300" />
          <span>Oferta Especial de Lote</span>
        </div>
        <p className="text-xs sm:text-sm font-semibold tracking-wide">
          Vagas promocionais do lote com todos os 7 bônus inclusos encerram em:
        </p>
        <div className="flex items-center gap-1 bg-black/60 px-2.5 py-0.5 rounded-lg border border-amber-400/40 text-xs sm:text-sm font-mono font-black text-amber-300 shadow-inner">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
        </div>
      </div>

      {/* 1.1 HEADER DE MARCA OFICIAL: MÉTODO PBE (PUBLICAÇÃO BUSINESS EXPRESS) */}
      <nav className="w-full bg-[#070b14]/90 border-b border-white/10 backdrop-blur-md py-3 px-4 sm:px-8 relative z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Logo Oficial Método PBE */}
          <div className="flex items-center gap-3">
            <img 
              src="/assets/metodo-pbe-logo-tight.webp" 
              alt="Método PBE - Publicação Business Express" 
              className="h-8 sm:h-11 w-auto object-contain drop-shadow-[0_2px_12px_rgba(34,197,94,0.35)]"
            />
          </div>

          {/* Integração Oficial com a Fábrica de Best Seller */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline">Tecnologia Oficial:</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-bold shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fábrica de Best Seller</span>
            </div>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION (DOBRA 1) - SEM MENÇÃO A PREÇO */}
      <header className="relative overflow-hidden px-4 sm:px-6 lg:px-8 pt-6 pb-14 md:pt-10 md:pb-20 border-b border-white/10">
        {/* Glows Decorativos */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[650px] h-[400px] bg-amber-500/10 blur-[130px] rounded-full pointer-events-none -z-10"></div>
        <div className="absolute top-1/3 right-10 w-[350px] h-[350px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>

        <div className="max-w-5xl mx-auto text-center space-y-5">
          
          {/* Tagline / Badge Superior com Identificação Oficial do Produto */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold text-xs tracking-wide shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>PRODUTO: MÉTODO PBE (PUBLICAÇÃO BUSINESS EXPRESS)</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.15)]">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="uppercase">{currentHeadline.badge}</span>
            </div>
          </div>

          {/* Headline Dinâmica (Texto ajustado com proporção elegante - Sem Preço) */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.35rem] font-extrabold text-white leading-snug tracking-tight max-w-4xl mx-auto px-2">
            {currentHeadline.headline}
          </h1>

          {/* Subheadline Refinada */}
          <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed px-4 opacity-90">
            {currentHeadline.subheadline}
          </p>

          {/* Elemento Visual Central: Vídeo Panorâmico Widescreen 1720x1080 (16:9) */}
          <div className="pt-2 max-w-4xl mx-auto">
            {/* Container Widescreen Panorâmico 16:9 (1720 x 1080) */}
            <div className="relative mx-auto rounded-3xl overflow-hidden border-2 border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.2)] bg-black w-full aspect-[16/9] max-w-4xl">
              <iframe
                className="w-full h-full object-cover"
                src="https://www.youtube.com/embed/4ErLLLcOoHc?autoplay=1&modestbranding=1&rel=0&showinfo=0&controls=1&mute=0&loop=1"
                title="Método PBE - Publicação Business Express"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>

          {/* CTA Principal da Dobra 1 (Sem Menção a Preço - Rolagem Suave Direto para #planos) */}
          <div className="pt-4 space-y-3 max-w-xl mx-auto">
            <button
              type="button"
              onClick={scrollToPlanos}
              className="w-full group relative inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white font-black text-base sm:text-lg md:text-xl py-4 sm:py-5 px-6 sm:px-8 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.45)] transition-all transform hover:scale-[1.02] active:scale-[0.98] border border-emerald-400/40"
            >
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-yellow-300" />
              <span>QUERO PUBLICAR MEU LIVRO AGORA</span>
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1.5 transition-transform" />
            </button>
            <p className="text-xs text-slate-400 font-medium">
              Acesso Imediato • 100% dos Direitos Autorais Seus • Garantia Incondicional de 7 Dias
            </p>
          </div>

          {/* Barra de Prova Social */}
          <div className="pt-3 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm font-semibold text-slate-300 border-t border-white/5 pt-4">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>+1.200 Livros Gerados</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" />
              <span>+500 Autores Publicados</span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5 text-yellow-400">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-current" />
                ))}
              </div>
              <span className="text-slate-200">Avaliação Média 4.9/5</span>
            </div>
          </div>

        </div>
      </header>

      {/* SEÇÃO 2: A DOR DO MERCADO VS. O ECOSSISTEMA FÁBRICA DE BEST SELLER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black/60 border-b border-white/5">
        <div className="max-w-5xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">A Quebra do Modelo Tradicional</p>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              O Caminho Tradicional & Caro <span className="text-slate-500">vs.</span> O Novo Jeito com a Fábrica
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Veja por que autores independentes e profissionais liberais abandonaram o processo antigo de publicação:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Coluna 1: O Caminho Tradicional & Caro */}
            <div className="p-8 rounded-3xl bg-red-950/20 border border-red-500/30 space-y-6 relative">
              <div className="inline-block bg-red-500/20 text-red-400 text-xs font-bold px-3 py-1 rounded-full border border-red-500/30 uppercase tracking-wide">
                O Caminho Antigo (Lento & Caro)
              </div>
              <ul className="space-y-4 text-sm sm:text-base text-slate-300">
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Ghostwriter sem garantia:</strong> De R$ 5.000 a R$ 12.000 cobrados à vista sem certeza de qualidade.</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Diagramador e capista avulsos:</strong> R$ 800+ extras em profissionais freelancers imprevisíveis.</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Registro de ISBN e burocracia editorial:</strong> Semanas perdidas tentando entender normas complexas.</span>
                </li>
                <li className="flex items-start gap-3">
                  <X className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Meses de espera e bloqueio criativo:</strong> Mais de 6 meses travado sem ver o livro concluído.</span>
                </li>
              </ul>
            </div>

            {/* Coluna 2: O Novo Jeito com a Fábrica */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-amber-500/10 via-emerald-950/20 to-black border-2 border-emerald-500/50 space-y-6 shadow-2xl relative">
              <div className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/40 uppercase tracking-wide">
                O Novo Jeito (Fábrica de Best Seller)
              </div>
              <ul className="space-y-4 text-sm sm:text-base text-slate-200">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Livro completo em minutos:</strong> Manuscrito de +170 páginas estruturado em dados reais de mercado.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Diagramação e capa 100% inclusas:</strong> Medidas exatas 6x9, lombada, orelhas e elementos pré-textuais.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Da ideia à venda em até 72 horas:</strong> Publicação express na Amazon KDP e impresso na UICLAP sob demanda.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span><strong>Planos a partir de R$ 97 com risco zero:</strong> Acesso total com garantia blindada incondicional de 7 dias.</span>
                </li>
              </ul>
            </div>

          </div>

        </div>
      </section>

      {/* SEÇÃO 3: O NÚCLEO — SISTEMA DE CRIAÇÃO E PRODUÇÃO EDITORIAL (R$ 536,30) - CONTRASTE MELHORADO (#cbd5e1) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#090d16] border-b border-white/5">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>O Núcleo Tecnológico & Operacional</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
              O Que Está Incluso no Núcleo do Seu Sistema
            </h2>
            <p className="text-[#cbd5e1] text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
              Tudo o que você precisa para dar vida a um livro de padrão profissional internacional.
            </p>
          </div>

          {/* Grid com 8 Cards Detalhados com Vídeos Oficiais da Área VIP de Membros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: 1 Crédito Fábrica de Best Seller */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-4 shadow-xl group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Área VIP • Vídeo</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">R$ 39,90</span>
                </div>

                {/* Vídeo Oficial da Ferramenta */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/IvnqMv3efcs?rel=0&modestbranding=1"
                    title="1 Crédito Fábrica de Best Seller"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  1 Crédito Fábrica de Best Seller
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Livro de não-ficção completo (+170 págs, 12 caps) com pesquisa tripla: YouTube, Google Trends e Top 10 Amazon. Arquivo Word editável.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> 100% Direitos Seus
              </div>
            </div>

            {/* Card 2: Ficha Catalográfica Oficial */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Área VIP • Vídeo</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">R$ 27,90</span>
                </div>

                {/* Vídeo Oficial da Ferramenta */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/qSRTerJCeNo?rel=0&modestbranding=1"
                    title="Ficha Catalográfica Oficial"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Ficha Catalográfica Oficial
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Padronizada em AACR2 e Código Decimal Universal (CDU), indispensável para catalogação em bibliotecas e livrarias.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Padrão Internacional AACR2/CDU
              </div>
            </div>

            {/* Card 3: Código de Barras Vetorizado */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                      <Barcode className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Área VIP • Vídeo</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">R$ 19,90</span>
                </div>

                {/* Vídeo Oficial da Ferramenta */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/AYMn8C3kpmY?rel=0&modestbranding=1"
                    title="Código de Barras Vetorizado"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Código de Barras Vetorizado
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Gerador EAN-13 / ISBN em altíssima resolução gráfica, pronto para inserção direta na contracapa do livro impresso.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Alta Resolução Vetorial
              </div>
            </div>

            {/* Card 4: Gerador de QR Codes de Conversão */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                      <QrCode className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Área VIP • Vídeo</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">R$ 7,00</span>
                </div>

                {/* Vídeo Oficial da Ferramenta */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/5JQd-9gdzA8?rel=0&modestbranding=1"
                    title="Gerador de QR Codes de Conversão"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Gerador de QR Codes de Conversão
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Crie QR codes estratégicos para inserir nas páginas do livro e direcionar leitores para suas redes sociais, ofertas e consultorias.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Conversão Direta no Livro
              </div>
            </div>

            {/* Card 5: Curso Diagramação 360 Express */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                      <Compass className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Área VIP • Vídeo</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">R$ 97,90</span>
                </div>

                {/* Vídeo Oficial da Ferramenta */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/q9xnlFfdWok?rel=0&modestbranding=1"
                    title="Curso Diagramação 360 Express"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Curso Diagramação 360 Express
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Método para diagramar e formatar seu manuscrito nas medidas oficiais para publicação impecável na Amazon e UICLAP.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Formatação 6"x9" (15,24 x 22,86)
              </div>
            </div>

            {/* Card 6: Criação de Capas Profissionais */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Área VIP • Vídeo</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">R$ 147,90</span>
                </div>

                {/* Vídeo Oficial da Ferramenta */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/K7AAxtH69WM?rel=0&modestbranding=1"
                    title="Criação de Capas Profissionais"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Criação de Capas Profissionais
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Técnicas de design de capa de alto impacto, lombada calculada com precisão gráfica, orelhas e quarta capa persuasiva.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Padrão Livraria 300 DPI
              </div>
            </div>

            {/* Card 7: Desafio P72h Amazon KDP */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                      <Clock className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Área VIP • Vídeo</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">R$ 97,90</span>
                </div>

                {/* Vídeo Oficial da Ferramenta */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/_mVw5W1_prk?rel=0&modestbranding=1"
                    title="Desafio P72h Amazon KDP"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Desafio P72h Amazon KDP
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Roteiro prático para cadastrar, configurar metadados, subir o manuscrito e colocar seu e-book à venda na Amazon em 72h.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Vendas Imediatas KDP
              </div>
            </div>

            {/* Card 8: Workshop APE UICLAP */}
            <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 hover:border-amber-500/40 transition-all flex flex-col justify-between space-y-4 shadow-xl group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-amber-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Área VIP • Vídeo</span>
                  </div>
                  <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">R$ 97,90</span>
                </div>

                {/* Vídeo Oficial da Ferramenta */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/iSgMWKwkkTw?rel=0&modestbranding=1"
                    title="Workshop APE UICLAP"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                  Workshop APE UICLAP
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Publicação do seu livro impresso físico no Brasil com zero custo de tiragem (impressão sob demanda com frete nacional).
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Sem Tiragem Mínima
              </div>
            </div>

          </div>

          {/* Subtotal do Sistema Editorial */}
          <div className="p-5 rounded-2xl bg-black/60 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Subtotal das 8 Ferramentas Editoriais:</p>
              <p className="text-lg font-bold text-white">Sistema de Produção Editorial Completo</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm line-through">Valor Individual:</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400">R$ 536,30</span>
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO 4: OS BÔNUS EXCLUSIVOS DE ACELERAÇÃO & MONETIZAÇÃO (R$ 559,00) - CONTRASTE MELHORADO (#cbd5e1) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black border-b border-white/5">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <span className="bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border border-amber-500/40">
              PRESENTE EXCLUSIVO
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
              BÔNUS EXCLUSIVOS: Destrave a Máquina de Negócios do Seu Livro
            </h2>
            <p className="text-[#cbd5e1] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Garanta sua vaga hoje e receba 7 aceleradores de monetização inteiramente grátis:
            </p>
          </div>

          {/* Cards dos 7 Bônus com Vídeos e Mockups Oficiais */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Bônus 1: Tutorial CBL (Com Vídeo) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-black to-black border border-amber-500/30 space-y-4 relative shadow-xl flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="bg-amber-500 text-black text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    PRESENTE GRÁTIS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs line-through text-slate-500 font-bold">R$ 19,90</span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Vídeo</span>
                  </div>
                </div>

                {/* Vídeo do Bônus 1 */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/NeM3tTW7MgU?rel=0&modestbranding=1"
                    title="Bônus 1: Tutorial de Registro na CBL"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  Bônus 1: Tutorial de Registro na CBL
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Passo a passo descomplicado para registrar sua obra na Câmara Brasileira do Livro e blindar 100% dos seus Direitos Autorais.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Proteção e Registro Oficial
              </div>
            </div>

            {/* Bônus 2: Masterclass do Método PBE (Com Vídeo) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-black to-black border border-amber-500/30 space-y-4 relative shadow-xl flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="bg-amber-500 text-black text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    PRESENTE GRÁTIS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs line-through text-slate-500 font-bold">R$ 147,90</span>
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Vídeo</span>
                  </div>
                </div>

                {/* Vídeo do Bônus 2 */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                  <iframe
                    className="w-full h-full"
                    src="https://www.youtube.com/embed/nmMUtAPHIZ0?rel=0&modestbranding=1"
                    title="Bônus 2: Masterclass do Método PBE"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  Bônus 2: Masterclass do Método PBE
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Treinamento completo revelando os bastidores para criar, formatar e posicionar sua obra com velocidade e mentalidade de autor-empresário.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Aula Completa com Leonildo Bevilaqua
              </div>
            </div>

            {/* Bônus 3: Matriz de Mineração de Temas (Mockup Visual Framework) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-black to-black border border-amber-500/30 space-y-4 relative shadow-xl flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="bg-amber-500 text-black text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    PRESENTE GRÁTIS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs line-through text-slate-500 font-bold">R$ 79,90</span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Mockup</span>
                  </div>
                </div>

                {/* Mockup Framework de Mineração de Dados */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-amber-500/30 p-3 flex flex-col justify-between shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                      <span className="text-[11px] font-bold text-white tracking-tight">Data Mining Engine • IA</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">Score 98.4%</span>
                  </div>
                  <div className="space-y-1.5 my-auto">
                    <div className="flex items-center justify-between text-[10px] text-slate-300">
                      <span>YouTube & Google Trends</span>
                      <span className="text-amber-400 font-bold">+340% Demanda</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full w-[88%]"></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-300">
                      <span>Amazon Top 10 Best-Sellers</span>
                      <span className="text-emerald-400 font-bold">Alta Margem</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gradient-to-r from-amber-400 to-yellow-300 h-1.5 rounded-full w-[94%]"></div>
                    </div>
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="text-[9px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded">#TítulosVirais</span>
                    <span className="text-[9px] bg-white/10 text-slate-300 px-1.5 py-0.5 rounded">#NichoLucrativo</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">Pronto P/ Usar</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  Bônus 3: Matriz de Mineração de Temas
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Framework de dados para encontrar temas altamente procurados e títulos virais capazes de gerar cliques e compras imediatas.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Engenharia Reversa de Sucessos
              </div>
            </div>

            {/* Bônus 4: Livro Digital 'O Campo Magnético' (Mockup 3D Real da Obra) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-black to-black border border-amber-500/30 space-y-4 relative shadow-xl flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="bg-amber-500 text-black text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    PRESENTE GRÁTIS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs line-through text-slate-500 font-bold">R$ 49,90</span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Livro 3D</span>
                  </div>
                </div>

                {/* Mockup Gráfico 3D da Obra */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center p-2 shadow-inner">
                  <img
                    src="/assets/2 – O Campo Magnético das Vendas - Leonildo Bevilaqua.webp"
                    alt="O Campo Magnético das Vendas - Leonildo Bevilaqua"
                    className="max-h-full w-auto object-contain filter drop-shadow-[0_10px_20px_rgba(245,158,11,0.3)] transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/20 text-[9px] font-bold text-amber-300">
                    Leonildo Bevilaqua
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  Bônus 4: Livro Digital 'O Campo Magnético'
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Guia estratégico para transformar leitores comuns em clientes fiéis de mentorias, consultorias e produtos de alto valor.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Edição Digital Completa
              </div>
            </div>

            {/* Bônus 5: Modelo de Página de Captura (Mockup de Squeeze Page) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-black to-black border border-amber-500/30 space-y-4 relative shadow-xl flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="bg-amber-500 text-black text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    PRESENTE GRÁTIS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs line-through text-slate-500 font-bold">R$ 19,90</span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Template Web</span>
                  </div>
                </div>

                {/* Mockup de Navegador Web com Página de Captura */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex flex-col justify-between shadow-inner">
                  {/* Chrome Browser Bar */}
                  <div className="bg-slate-950 px-2.5 py-1.5 border-b border-white/10 flex items-center gap-2">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
                      <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
                      <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono truncate">lancamento.seulivro.com.br/captura</span>
                  </div>
                  <div className="p-3 text-center space-y-1.5 my-auto">
                    <div className="inline-block px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[8px] font-bold uppercase">
                      Lista VIP Pré-Lançamento
                    </div>
                    <p className="text-[11px] font-extrabold text-white leading-tight">
                      Baixe o 1º Capítulo Gratuito do Meu Novo Livro
                    </p>
                    <div className="max-w-[180px] mx-auto space-y-1 pt-1">
                      <div className="h-5 bg-white/10 rounded border border-white/15 text-[8px] text-slate-400 flex items-center px-2">
                        Seu melhor e-mail...
                      </div>
                      <div className="h-5 bg-gradient-to-r from-emerald-600 to-green-500 rounded text-[8px] font-bold text-white flex items-center justify-center shadow">
                        QUERO ACESSAR O CAPÍTULO
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-950/60 px-2 py-1 text-[8px] text-center text-slate-400 border-t border-white/5">
                    100% Responsivo • Pronto para Inserir no seu Domínio
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  Bônus 5: Modelo de Página de Captura
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Template 100% editável para capturar leads e gerar lista de espera de leitores ávidos antes do lançamento do livro.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Pronto para WordPress/Elementor/HTML
              </div>
            </div>

            {/* Bônus 6: Acesso à Comunidade FCO (Mockup Networking VIP) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-amber-500/10 via-black to-black border border-amber-500/30 space-y-4 relative shadow-xl flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="bg-amber-500 text-black text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    PRESENTE GRÁTIS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs line-through text-slate-500 font-bold">R$ 149,90</span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Comunidade</span>
                  </div>
                </div>

                {/* Mockup de Comunidade VIP */}
                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-white/10 p-3 flex flex-col justify-between shadow-inner">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-[10px]">
                        FCO
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-white leading-tight">Comunidade Fórmula de Crescimento</p>
                        <p className="text-[8px] text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          +500 Autores Ativos
                        </p>
                      </div>
                    </div>
                    <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Canal VIP</span>
                  </div>
                  <div className="space-y-1.5 my-auto">
                    <div className="bg-white/5 border border-white/10 rounded-lg p-2 text-[9px] text-slate-200">
                      <p className="font-bold text-amber-300">Marcos S. • Autor Best-Seller:</p>
                      <p className="text-slate-300 text-[8px] leading-tight">"Subi na Amazon usando o método e já estou no Top 5 da categoria de Negócios!"</p>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-1.5 text-[8px] text-emerald-300 flex items-center justify-between">
                      <span>Networking • Troca de Reviews • Estratégias</span>
                      <span className="font-bold text-[9px]">Acesso VIP</span>
                    </div>
                  </div>
                  <div className="text-[8px] text-center text-slate-400 border-t border-white/5 pt-1">
                    Conexão direta com autores que já faturam no mercado
                  </div>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                  Bônus 6: Acesso à Comunidade FCO
                </h3>
                <p className="text-xs sm:text-sm text-[#cbd5e1] leading-relaxed">
                  Networking exclusivo na Fórmula de Crescimento Online com outros autores e empreendedores compartilhando estratégias de escala.
                </p>
              </div>
              <div className="pt-2 border-t border-white/10 text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Networking & Parcerias
              </div>
            </div>

            {/* Bônus 7: Licença RAA (Com Vídeo da Afiliação) */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-500/15 via-black to-black border border-emerald-500/40 space-y-4 relative shadow-xl md:col-span-2 lg:col-span-3 flex flex-col justify-between group">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="bg-emerald-500 text-black text-[11px] font-black uppercase px-2.5 py-0.5 rounded-md">
                    OPORTUNIDADE DE CAIXA
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs line-through text-slate-500 font-bold">R$ 91,60</span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Vídeo Exclusivo</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                  {/* Vídeo do Bônus 7 */}
                  <div className="lg:col-span-5 relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-md">
                    <iframe
                      className="w-full h-full"
                      src="https://www.youtube.com/embed/sexmf3LvJ9c?rel=0&modestbranding=1"
                      title="Bônus 7: Licença RAA (Representante Afiliado Autorizado)"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>

                  <div className="lg:col-span-7 space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-emerald-300 transition-colors">
                      Bônus 7: Licença RAA (Representante Afiliado Autorizado)
                    </h3>
                    <p className="text-sm sm:text-base text-[#cbd5e1] leading-relaxed">
                      Direito de se credenciar no programa oficial para monetizar sua autoridade com comissão de 40% ao indicar a Fábrica de Best Seller para outros profissionais do seu mercado.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold text-emerald-400">
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Comissão de 40% por Venda</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Links e Materiais Prontos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Subtotal dos Bônus */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-amber-500/10 border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
            <div>
              <p className="text-xs text-amber-400 uppercase tracking-wider font-bold">Subtotal dos 7 Bônus de Negócios:</p>
              <p className="text-lg font-bold text-white">R$ 559,00 em Treinamentos e Ferramentas</p>
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-400 font-extrabold px-4 py-2 rounded-xl border border-emerald-500/40 text-sm sm:text-base">
              <Gift className="w-5 h-5" /> 100% GRÁTIS NESSA OFERTA
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO 5: RESUMO DOS ENTREGÁVEIS & NOVA TABELA COMPARATIVA DOS 3 PLANOS */}
      <section id="planos" className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0a0d14] via-black to-[#0a0d14] border-b border-white/10 relative">
        <div className="max-w-6xl mx-auto space-y-16">
          
          {/* Header da Seção de Planos */}
          <div className="text-center space-y-4">
            <span className="bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full border border-amber-500/40">
              ESCOLHA A SUA MODALIDADE
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white">
              Planos e Condições Especiais de Lançamento
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">
              Todos os planos incluem o Sistema Editorial Completo e os 7 Bônus de Negócios (Valor Real Ancorado: <span className="line-through text-slate-500 font-bold">R$ 1.095,30</span>). Escolha o formato ideal para você:
            </p>
          </div>

          {/* GRADE COMPARATIVA COM OS 3 PLANOS LADO A LADO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch pt-4">
            
            {/* PLANO 1: PLANO ESSENCIAL */}
            <div className="rounded-3xl bg-slate-900/70 border border-white/15 p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-white/30 transition-all shadow-xl">
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Autonomia Total</span>
                  <h3 className="text-2xl font-black text-white">PLANO ESSENCIAL</h3>
                  <p className="text-xs text-amber-400 font-bold">Método PBE (Publicação Business Express)</p>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed pt-1">
                    Ideal para autores autodidatas que desejam publicar com rapidez e autonomia total.
                  </p>
                </div>

                {/* Preço */}
                <div className="pt-3 pb-4 border-y border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>De</span>
                    <span className="line-through text-slate-500 font-bold">R$ 697,00</span>
                    <span>por apenas:</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-slate-300">12x de</span>
                    <span className="text-3xl sm:text-4xl font-black text-white">R$ 10,03</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-400">ou R$ 97,00 à vista no PIX</p>
                </div>

                {/* O Que Está Incluso */}
                <div className="space-y-2.5 text-xs text-[#cbd5e1]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">O que você recebe:</p>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>1 Crédito FBS</strong> (+170 págs com pesquisa YouTube/Google/Amazon)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Ficha Catalográfica Oficial</strong> (Padrão AACR2/CDU)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Código de Barras Vetorizado</strong> (EAN-13/ISBN)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Gerador de QR Codes</strong> de Alta Conversão</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Curso Diagramação 360 Express</strong> (Amazon & UICLAP)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Curso de Criação de Capas Profissionais</strong></span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Desafio P72h Amazon KDP</strong> (Venda Imediata)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Workshop APE UICLAP</strong> (Impressão sob Demanda)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Todos os 7 Bônus de Lançamento</strong> (CBL, Método PBE, etc.)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>100% dos Direitos Autorais</strong> e Royalties Seus</span>
                  </div>
                </div>
              </div>

              {/* Botão CTA */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => handleCheckoutPlan('essencial')}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-sm sm:text-base py-4 px-6 rounded-2xl border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>QUERO O PLANO ESSENCIAL</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PLANO 2: PLANO IMERSÃO & GRUPO (DESTAQUE MÁXIMO) */}
            <div className="rounded-3xl bg-gradient-to-b from-slate-900 via-[#111728] to-black border-2 border-amber-500 p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] relative transform lg:-translate-y-3 z-10">
              
              {/* Badge Superior Dourado */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black font-black uppercase tracking-wider text-xs px-5 py-1.5 rounded-full shadow-lg whitespace-nowrap flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>⭐ MAIS ESCOLHIDO ⭐</span>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Acompanhamento Ao Vivo</span>
                  <h3 className="text-2xl sm:text-3xl font-black text-white">PLANO IMERSÃO & GRUPO</h3>
                  <p className="text-xs text-amber-400 font-bold">Método PBE (Publicação Business Express)</p>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed pt-1">
                    Para quem quer publicar com acompanhamento prático e tirar todas as dúvidas ao vivo.
                  </p>
                </div>

                {/* Preço */}
                <div className="pt-3 pb-4 border-y border-amber-500/30 space-y-1 bg-amber-500/[0.04] -mx-6 sm:-mx-8 px-6 sm:px-8">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>De</span>
                    <span className="line-through text-slate-500 font-bold">R$ 997,00</span>
                    <span>por apenas:</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-slate-300">12x de</span>
                    <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500">
                      R$ 30,71
                    </span>
                  </div>
                  <p className="text-xs font-bold text-emerald-400">ou R$ 297,00 à vista no PIX</p>
                </div>

                {/* O Que Está Incluso */}
                <div className="space-y-2.5 text-xs text-[#cbd5e1]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-yellow-300">Tudo do Essencial + Acompanhamento:</p>
                  <div className="flex items-start gap-2.5 font-bold text-white bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span>TUDO do Plano Essencial (8 Ferramentas + 7 Bônus)</span>
                  </div>
                  <div className="flex items-start gap-2.5 font-semibold text-amber-200">
                    <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <span><strong>4 Encontros Ao Vivo em Grupo</strong> (Tira-dúvidas e implementação na tela)</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Gravação Vitalícia dos Encontros</strong> para rever quando quiser</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Grupo Exclusivo de Alunos</strong> durante o período de mentoria</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Suporte Direcionado</strong> para destravar sua publicação na Amazon e UICLAP</span>
                  </div>
                </div>
              </div>

              {/* Botão CTA Pulsante */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => handleCheckoutPlan('imersao')}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 hover:from-emerald-500 hover:to-green-400 text-white font-black text-base py-4 sm:py-5 px-6 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all transform hover:scale-105 active:scale-95 border border-emerald-400/40 animate-pulse"
                >
                  <Zap className="w-5 h-5 fill-current text-yellow-300" />
                  <span>QUERO ENTRAR NO GRUPO VIP</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PLANO 3: MENTORIA VIP 1 A 1 */}
            <div className="rounded-3xl bg-slate-900/70 border border-white/15 p-6 sm:p-8 flex flex-col justify-between space-y-6 hover:border-amber-500/40 transition-all shadow-xl relative">
              
              {/* Badge Superior */}
              <div className="absolute -top-3.5 right-6 bg-red-600 text-white font-extrabold uppercase tracking-wider text-[10px] px-3.5 py-1 rounded-full shadow-md">
                APENAS 10 VAGAS / MÊS
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Atendimento Individual</span>
                  <h3 className="text-2xl font-black text-white">MENTORIA VIP 1 A 1</h3>
                  <p className="text-xs text-amber-400 font-bold">Método PBE (Publicação Business Express)</p>
                  <p className="text-xs text-[#cbd5e1] leading-relaxed pt-1">
                    Acompanhamento individual e estratégico diretamente comigo para o seu projeto e negócio.
                  </p>
                </div>

                {/* Preço */}
                <div className="pt-3 pb-4 border-y border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span>De</span>
                    <span className="line-through text-slate-500 font-bold">R$ 1.497,00</span>
                    <span>por apenas:</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xs font-semibold text-slate-300">12x de</span>
                    <span className="text-3xl sm:text-4xl font-black text-white">R$ 72,07</span>
                  </div>
                  <p className="text-xs font-bold text-emerald-400">ou R$ 697,00 à vista no PIX</p>
                </div>

                {/* O Que Está Incluso */}
                <div className="space-y-2.5 text-xs text-[#cbd5e1]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Acesso Individual Direto:</p>
                  <div className="flex items-start gap-2.5 font-bold text-white bg-white/5 p-2 rounded-xl border border-white/10">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>TUDO do Plano Essencial (Ferramentas + 7 Bônus)</span>
                  </div>
                  <div className="flex items-start gap-2.5 font-semibold text-white">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>4 Encontros Individuais 1 a 1 via Google Meet</strong> exclusivos para você</span>
                  </div>
                  <div className="flex items-start gap-2.5 font-semibold text-white">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Análise Direta e Revisão da Sua Obra</strong> e posicionamento</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Direcionamento de Esteira High-Ticket</strong> (Venda de consultorias e mentorias)</span>
                  </div>
                  <div className="flex items-start gap-2.5 font-semibold text-emerald-300">
                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span><strong>Acesso Prioritário no WhatsApp Privado</strong> direto com Leonildo Bevilaqua</span>
                  </div>
                </div>
              </div>

              {/* Botão CTA */}
              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => handleCheckoutPlan('mentoria')}
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-slate-800 to-slate-700 hover:from-amber-600 hover:to-amber-500 text-white font-extrabold text-sm sm:text-base py-4 px-6 rounded-2xl border border-white/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>APLICAR PARA VAGA INDIVIDUAL</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

          {/* Selos de Confiança Abaixo dos Planos */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-4">
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-emerald-400" /> Pagamento 100% Seguro</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5"><Zap className="w-4 h-4 text-yellow-400" /> PIX com Liberação Imediata</span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Garantia Incondicional de 7 Dias</span>
          </div>

        </div>
      </section>

      {/* PROVA SOCIAL MASSIVA (DEPOIMENTOS EM VÍDEO, ÁUDIO, WHATSAPP HUMANIZADOS E LIVROS) */}
      <section className="border-b border-white/5">
        <SocialProofSection onSelectImage={setSelectedImage} />
      </section>

      {/* SEÇÃO 6: AUTORIDADE / QUEM CRIOU */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#080c16] border-b border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-10 md:gap-14">
          
          <div className="w-full md:w-1/3 flex-shrink-0">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl shadow-amber-950/30 max-w-sm mx-auto">
              <img
                src="/assets/landing/f7acb9e3-2a41-4762-9ea4-679816fcb72a.jpeg"
                alt="Leonildo Bevilaqua"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/assets/Leonildo%20Bevilaqua%20-%20Oficial%20Landing%20page.webp";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-extrabold text-2xl text-white">Leonildo Bevilaqua</p>
                <p className="text-amber-400 text-xs font-bold mt-1">Fundador da Fábrica de Best Seller</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3 space-y-5 text-center md:text-left">
            <div>
              <p className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">Quem Criou o Sistema</p>
              <h2 className="text-3xl sm:text-4xl font-black text-white">Leonildo Bevilaqua</h2>
              <p className="text-amber-400/90 text-sm font-semibold mt-1">
                Full Stack Marketer & Criador da Fábrica de Best Seller
              </p>
            </div>

            <p className="text-[#cbd5e1] text-sm sm:text-base leading-relaxed">
              Criado por Leonildo Bevilaqua, Full Stack Marketer formado pela Digital Marketer (Texas, EUA), fundador da E+Business e com mais de 15 anos de experiência no mercado digital. Criador da Fábrica de Best Seller, que já viabilizou mais de 1.200 livros e destravou centenas de autores no Brasil e no mundo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-slate-300 text-left">
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>+1.200 Livros Viabilizados na Plataforma</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>+500 Autores com Livros Publicados</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Formação Internacional no Texas (EUA)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>15+ Anos de Experiência no Mercado Digital</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* SEÇÃO 7: GARANTIA BLINDADA DE 7 DIAS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-black border-b border-white/5 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30">
            <ShieldCheck className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">
            Garantia Blindada de 7 Dias (100% Incondicional)
          </h2>
          <p className="text-base sm:text-lg text-[#cbd5e1] leading-relaxed">
            Entre na plataforma, gere seu livro, assista às aulas e teste os geradores. Se por qualquer motivo você achar que não valeu pelo menos 10x o que pagou, basta enviar um único e-mail em até 7 dias e devolveremos 100% do seu dinheiro. Sem perguntas e sem letras miúdas.
          </p>
          <p className="text-emerald-400 font-bold text-sm sm:text-base">
            O risco é todo nosso. Você só tem a ganhar.
          </p>
        </div>
      </section>

      {/* SEÇÃO 8: PERGUNTAS FREQUENTES (FAQ) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#090d18] border-b border-white/5">
        <div className="max-w-3xl mx-auto space-y-12">
          
          <div className="text-center space-y-3">
            <p className="text-amber-500 text-xs font-bold uppercase tracking-widest">Dúvidas Frequentes</p>
            <h2 className="text-3xl md:text-4xl font-black text-white">
              Perguntas Frequentes
            </h2>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "O livro gerado é realmente meu?",
                a: "Sim, 100% dos direitos autorais e patrimoniais são seus para vender na Amazon, imprimir pela UICLAP ou comercializar onde desejar. A plataforma não cobra royalties nem retém percentual algum sobre seus lucros."
              },
              {
                q: "Posso alterar o texto do livro?",
                a: "Sim! O arquivo final é entregue em Microsoft Word (.docx) 100% editável, permitindo adicionar casos reais, ajustar o tom de voz e personalizar cada parágrafo como quiser."
              },
              {
                q: "Como funcionam os livros impressos sem custo de tiragem?",
                a: "O Workshop APE ensina o modelo de impressão sob demanda na UICLAP, onde o leitor compra online, a gráfica imprime e entrega na casa dele sem você precisar desembolsar estoque adiantado."
              },
              {
                q: "Não entendo nada de tecnologia, vou conseguir?",
                a: "Se você sabe usar o WhatsApp, você opera a Fábrica. O processo é guiado e intuitivo, além das aulas passo a passo inclusas ensinando desde a concepção do título até a publicação."
              },
              {
                q: "Como acesso os bônus?",
                a: "Imediatamente após a confirmação do pagamento, os acessos são enviados diretamente ao seu e-mail cadastrado, liberando a ferramenta da IA e a área de membros com todos os cursos e bônus do plano escolhido."
              },
              {
                q: "Quais são as formas de pagamento disponíveis?",
                a: "Você pode pagar via PIX à vista (com aprovação e liberação imediata) ou no Cartão de Crédito em até 12 vezes em qualquer um dos 3 planos."
              }
            ].map((faq, index) => (
              <div key={index} className="border border-white/10 rounded-2xl bg-white/[0.02] overflow-hidden transition-colors">
                <button
                  type="button"
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm sm:text-base font-bold text-white hover:text-amber-400 transition-colors"
                >
                  <span className="pr-4">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-amber-400 transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-[#cbd5e1] leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 sm:px-6 border-t border-white/10 bg-black text-center text-xs text-slate-500 space-y-4">
        <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">
          MÉTODO PBE (PUBLICAÇÃO BUSINESS EXPRESS) • FÁBRICA DE BEST SELLER
        </p>
        <p className="max-w-2xl mx-auto leading-relaxed">
          Este site não é afiliado ao Facebook, Google, Amazon ou UICLAP. Todos os resultados dependem da dedicação, nicho e aplicação das estratégias ensinadas.
        </p>
        <p>© {new Date().getFullYear()} Método PBE & Fábrica de Best Seller. Todos os direitos reservados.</p>
      </footer>

      {/* STICKY CTA BAR AO ROLAR (Com Menor Valor de Entrada e Botão com Âncora para #planos) */}
      {showSticky && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-amber-500/30 p-3 sm:p-4 backdrop-blur-md transition-all duration-300 shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="hidden sm:flex items-center gap-3">
              <img 
                src="/assets/metodo-pbe-logo-tight.webp" 
                alt="Método PBE" 
                className="h-8 w-auto object-contain hidden md:block"
              />
              <div>
                <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Método PBE (Publicação Business Express)
                </p>
                <p className="text-sm font-extrabold text-white">
                  Planos a partir de <span className="text-emerald-400 font-black">R$ 97,00 à vista</span> <span className="text-slate-400 text-xs font-normal">(ou 12x de R$ 10,03)</span>
                </p>
              </div>
            </div>

            <div className="w-full sm:w-auto">
              <button
                type="button"
                onClick={scrollToPlanos}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all transform hover:scale-[1.02]"
              >
                <span>VER PLANOS DISPONÍVEIS</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE ZOOM DE IMAGEM */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-white/20">
            <button 
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-black/80 text-white p-2 rounded-full border border-white/20 hover:bg-white hover:text-black transition-all"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={selectedImage} 
              alt="Comprovante de resultado" 
              className="max-h-[85vh] w-auto object-contain rounded-xl"
            />
          </div>
        </div>
      )}

    </div>
  );
};
