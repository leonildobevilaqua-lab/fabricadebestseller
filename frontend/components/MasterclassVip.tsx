import React, { useEffect, useState, useRef } from 'react';
import { 
  Play, 
  Sparkles, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ShieldCheck, 
  ChevronRight, 
  ChevronDown, 
  Lock, 
  Unlock, 
  Award, 
  Zap, 
  BookOpen, 
  Check, 
  X,
  Volume2,
  VolumeX,
  Pause,
  Download,
  ExternalLink,
  FileText
} from 'lucide-react';
import { SocialProofSection } from './SocialProofSection';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// 1:13:37 in seconds = 3600 + 780 + 37 = 4417 seconds
const UNLOCK_SECONDS = 4417;
const TIMER_DURATION_MINUTES = 15;
const STORAGE_KEY_UNLOCKED = 'bsf_masterclass_vip_unlocked';
const STORAGE_KEY_TIMER_END = 'bsf_masterclass_vip_timer_end';
const CHECKOUT_URL = 'https://payment.ticto.app/O001892B6';

export const MasterclassVip: React.FC = () => {
  const [showDevControls, setShowDevControls] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('unlock') === 'true' || params.get('admin') === 'true' || params.get('debug') === 'true';
    }
    return false;
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('unlock') === 'true' || params.get('debug') === 'true') {
        return true;
      }
      return localStorage.getItem(STORAGE_KEY_UNLOCKED) === 'true';
    }
    return false;
  });

  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number }>({ minutes: TIMER_DURATION_MINUTES, seconds: 0 });
  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showStickyBar, setShowStickyBar] = useState<boolean>(false);
  const [currentTimeSec, setCurrentTimeSec] = useState<number>(0);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const playerRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);
  const offerSectionRef = useRef<HTMLDivElement>(null);
  const maxWatchedTimeRef = useRef<number>(0);

  // Initialize Countdown Timer with LocalStorage persistence
  const initTimer = () => {
    let endTime = localStorage.getItem(STORAGE_KEY_TIMER_END);
    if (!endTime) {
      const targetTime = Date.now() + TIMER_DURATION_MINUTES * 60 * 1000;
      localStorage.setItem(STORAGE_KEY_TIMER_END, targetTime.toString());
      endTime = targetTime.toString();
    }

    const updateTimer = () => {
      const now = Date.now();
      const difference = parseInt(endTime!, 10) - now;

      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        setIsTimerExpired(true);
      } else {
        const m = Math.floor((difference / 1000 / 60) % 60);
        const s = Math.floor((difference / 1000) % 60);
        setTimeLeft({ minutes: m, seconds: s });
      }
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);
    return () => clearInterval(timerInterval);
  };

  // Unlock Offer Handler
  const unlockOffer = (shouldScroll = false) => {
    setIsUnlocked(true);
    localStorage.setItem(STORAGE_KEY_UNLOCKED, 'true');
    initTimer();

    if (shouldScroll) {
      setTimeout(() => {
        offerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  };

  // Toggle Play / Pause via secure custom overlay (prevents leaving to YouTube)
  const handleTogglePlay = () => {
    if (!playerRef.current) return;

    if (isMuted) {
      try {
        playerRef.current.unMute();
        playerRef.current.setVolume(100);
        setIsMuted(false);
      } catch (err) {
        console.error(err);
      }
    }

    try {
      if (isPlaying) {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      } else {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Unmute video explicitly
  const handleUnmute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!playerRef.current) return;
    try {
      playerRef.current.unMute();
      playerRef.current.setVolume(100);
      setIsMuted(false);
      if (!isPlaying) {
        playerRef.current.playVideo();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Load YouTube Iframe API with locked controls
  useEffect(() => {
    window.scrollTo(0, 0);

    if (isUnlocked) {
      initTimer();
    }

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.id = 'yt-api-script';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    }

    function createPlayer() {
      if (playerRef.current) return;
      try {
        playerRef.current = new window.YT.Player('vip-masterclass-player', {
          videoId: 'AkcDJa_KPls',
          playerVars: {
            autoplay: 1,
            controls: 0,        // Hides all YouTube timeline and controls
            disablekb: 1,       // Disables keyboard forward skipping
            modestbranding: 1,  // Minimal YouTube branding
            rel: 0,             // No related videos
            playsinline: 1,     // Inline playback on mobile
            iv_load_policy: 3,  // No annotations
            fs: 0               // Disables default fullscreen button
          },
          events: {
            onReady: (event: any) => {
              setPlayerReady(true);
              try {
                event.target.playVideo();
                // Check if browser muted audio on autoplay
                if (event.target.isMuted()) {
                  setIsMuted(true);
                }
              } catch (e) {
                console.log(e);
              }
            },
            onStateChange: (event: any) => {
              // 1 = PLAYING, 2 = PAUSED
              if (event.data === 1) {
                setIsPlaying(true);
                if (!intervalRef.current) {
                  intervalRef.current = setInterval(checkVideoTime, 1000);
                }
              } else if (event.data === 2) {
                setIsPlaying(false);
              }
            }
          }
        });
      } catch (err) {
        console.error('Error creating YouTube player:', err);
      }
    }

    function checkVideoTime() {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const time = playerRef.current.getCurrentTime();

        // Anti-skip protection: if user somehow jumps forward, reset to max watched time
        if (time > maxWatchedTimeRef.current + 2 && !showDevControls) {
          playerRef.current.seekTo(maxWatchedTimeRef.current, true);
          return;
        }

        if (time > maxWatchedTimeRef.current) {
          maxWatchedTimeRef.current = time;
        }

        setCurrentTimeSec(Math.floor(time));

        if (time >= UNLOCK_SECONDS) {
          unlockOffer(true);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    }

    // Scroll listener for sticky CTA bar
    const handleScroll = () => {
      if (window.scrollY > 900 && isUnlocked) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isUnlocked, showDevControls]);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleCheckout = () => {
    window.open(CHECKOUT_URL, '_blank', 'noopener,noreferrer');
  };

  const offerItems = [
    { name: 'Fábrica de Best Seller – 1 Crédito (1 Livro)', value: 'R$ 39,90' },
    { name: 'Tutorial de Registro na CBL', value: 'R$ 19,90' },
    { name: 'Ficha Catalográfica + Código de Barras + QR Code', value: 'R$ 54,80' },
    { name: 'Diagramação e Formatação 360 Express', value: 'R$ 97,00' },
    { name: 'Desafio P72h – Publicação na Amazon em 72h', value: 'R$ 97,90' },
    { name: 'Workshop APE – Auto Publicação Express (UICLAP)', value: 'R$ 97,90' },
    { name: 'Curso de Criação de Capa Profissional', value: 'R$ 149,90' },
    { name: '(RAA) Representante Afiliado Autorizado', value: 'R$ 91,60' },
    { name: 'Mentoria em Grupo do Método PBE (4 encontros)', value: 'R$ 349,90' },
  ];

  const formatTimerNumber = (val: number) => (val < 10 ? `0${val}` : `${val}`);

  return (
    <div className="min-h-screen bg-[#070708] text-white font-sans selection:bg-amber-500/30 overflow-x-hidden">
      
      {/* 1. TOP ACCESS VIP BANNER */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-black py-2.5 px-4 text-center sticky top-0 z-50 shadow-lg shadow-amber-500/10 font-bold text-xs sm:text-sm flex items-center justify-center gap-2">
        <Sparkles className="w-4 h-4 text-black animate-spin" style={{ animationDuration: '3s' }} />
        <span>ACESSO CONFIRMADO: Seja muito bem-vindo(a) à Sala Oficial da Masterclass Método PBE</span>
      </div>

      {/* 2. WELCOME HERO SECTION */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-10 pb-8 max-w-6xl mx-auto">
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-xs sm:text-sm shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>PAGAMENTO APROVADO • SEU ACESSO ESTÁ LIBERADO</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Parabéns pela sua iniciativa! <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500">
              Você deu o passo que 99% das pessoas apenas sonham.
            </span>
          </h1>

          <p className="text-slate-300 text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
            Ter uma obra publicada não é apenas status: é o maior catalisador de autoridade, fechamento de negócios e novas fontes de renda da sua vida profissional. Assista à aula completa abaixo com máxima atenção.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-slate-400 pt-2">
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Duração Total: <strong>1h 20min</strong></span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>Aula Prática Passo a Passo</span>
            </div>
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span>Ligue o áudio e pegue papel e caneta</span>
            </div>
          </div>
        </div>

        {/* 3. VIDEO PLAYER CONTAINER (LOCKED & PROTECTED VSL PLAYER) */}
        <div className="mt-8 relative max-w-4xl mx-auto">
          <div className="relative rounded-2xl md:rounded-3xl overflow-hidden border-2 border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.2)] bg-black aspect-video select-none group">
            
            {/* The YouTube iframe element */}
            <div id="vip-masterclass-player" className="w-full h-full pointer-events-none"></div>

            {/* Fallback iframe in case API script is blocked */}
            {!playerReady && (
              <iframe
                src="https://www.youtube.com/embed/AkcDJa_KPls?autoplay=1&controls=0&disablekb=1&modestbranding=1&rel=0&iv_load_policy=3&fs=0"
                title="Masterclass Método Publicação Business Express"
                className="w-full h-full absolute inset-0 pointer-events-none"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            )}

            {/* FULL TRANSPARENT CLICK CAPTURE OVERLAY:
                Blocks user from clicking YouTube title, share, or YouTube logo.
                Only controls play/pause and sound inside our app. */}
            <div 
              onClick={handleTogglePlay}
              className="absolute inset-0 z-20 cursor-pointer flex items-center justify-center"
              title="Clique para pausar ou continuar"
            >
              {/* UNMUTE CALL TO ACTION (when browser blocks autoplay with sound) */}
              {isMuted && (
                <button
                  type="button"
                  onClick={handleUnmute}
                  className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-black text-xs sm:text-sm py-3 px-6 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-bounce flex items-center gap-2.5 border border-white/30 uppercase tracking-wide pointer-events-auto"
                >
                  <VolumeX className="w-5 h-5 text-white animate-pulse" />
                  <span>SEU VÍDEO JÁ COMEÇOU! CLIQUE AQUI PARA ATIVAR O SOM</span>
                </button>
              )}

              {/* PAUSED STATE OVERLAY */}
              {!isPlaying && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/50 backdrop-blur-[2px] transition-all">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 text-black flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.6)] transform hover:scale-105 transition-transform">
                    <Play className="w-10 h-10 sm:w-12 sm:h-12 ml-1.5 fill-black text-black" />
                  </div>
                  <span className="mt-4 font-bold text-xs sm:text-sm text-white tracking-wider uppercase bg-black/80 px-5 py-2 rounded-full border border-white/20 shadow-lg">
                    Clique para continuar assistindo
                  </span>
                </div>
              )}
            </div>

          </div>

          {/* Dev/Testing Helper Note - ONLY VISIBLE WITH ?unlock=true or ?admin=true */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500 px-2">
            <span>Leonildo Bevilaqua • Fundador Fábrica de Best Seller</span>
            {showDevControls && !isUnlocked && (
              <button
                type="button"
                onClick={() => unlockOffer(true)}
                className="text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1 bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/30"
                title="Atalho disponível apenas com parâmetro de teste (?unlock=true)"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Simular liberação (1:13:37) [Admin]</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3.5 MATERIAIS DE APOIO & LINKS OFICIAIS */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-white/10">
        <div className="space-y-8">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Download className="w-4 h-4 text-amber-400" />
              <span>Downloads & Acessos da Masterclass</span>
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
              Materiais Complementares & Links Oficiais
            </h2>
            <p className="text-sm sm:text-base text-slate-300">
              Faça o download dos arquivos em Word citados na aula e acesse os links oficiais de cadastro e afiliação ao Método PBE.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* CARD 1: MATRIZ DE MINERAÇÃO DE TEMAS */}
            <div className="bg-gradient-to-b from-slate-900/90 to-black p-6 sm:p-7 rounded-2xl border border-white/10 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-5 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    Doc. em Word (.docx)
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  MATRIZ de Mineração de Temas - PROMPT MESTRE PARA PESQUISAS AVANÇADAS
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Roteiro prático com o prompt mestre para garimpar e validar nichos altamente lucrativos e de grande procura na Amazon e UICLAP.
                </p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <a
                  href="/materiais/matriz-mineracao-temas.docx"
                  download="MATRIZ_Mineracao_de_Temas_Prompt_Mestre.docx"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-yellow-500 text-black font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-lg shadow-amber-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-black" />
                  <span>Clique aqui para fazer o download</span>
                </a>
              </div>
            </div>

            {/* CARD 2: MODELO OFICIAL DA PÁGINA DE REGISTRO */}
            <div className="bg-gradient-to-b from-slate-900/90 to-black p-6 sm:p-7 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-5 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    Doc. em Word (.docx)
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Modelo Oficial da Página de Registro em Word 100% Editável
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Arquivo matriz editável para preparar sua página de registro formal, créditos de autoria, catalogação e dados de copyright.
                </p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <a
                  href="/materiais/modelo-oficial-pagina-registro.docx"
                  download="Modelo_Oficial_Pagina_de_Registro.docx"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-4 h-4 text-white" />
                  <span>Clique aqui para fazer o download</span>
                </a>
              </div>
            </div>

            {/* CARD 3: LINK DE CADASTRO NA TICTO */}
            <div className="bg-gradient-to-b from-slate-900/90 to-black p-6 sm:p-7 rounded-2xl border border-white/10 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-5 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <ExternalLink className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                    Plataforma Oficial
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-amber-400 transition-colors">
                  Link de Cadastro na TICTO
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Crie sua conta oficial de produtor/afiliado na plataforma Ticto para configurar seus dados e receber suas vendas e comissões diretamente.
                </p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <a
                  href="https://dash.ticto.com.br/signup?referrer=PIT28F3B99F"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-amber-500 hover:text-black border border-white/20 hover:border-amber-500 text-white font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Cadastrar-se na TICTO</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* CARD 4: LINK DE AFILIAÇÃO AO MÉTODO PBE */}
            <div className="bg-gradient-to-b from-slate-900/90 to-black p-6 sm:p-7 rounded-2xl border border-white/10 hover:border-emerald-500/50 transition-all flex flex-col justify-between space-y-5 shadow-xl group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                    Afiliação Exclusiva
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Link de Afiliação ao Método PBE (Publicação Business Express)
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Solicite seu credenciamento exclusivo como Representante Afiliado Autorizado (RAA) e receba comissões de até 60% por indicação.
                </p>
              </div>

              <div className="pt-2 border-t border-white/5">
                <a
                  href="https://dash.ticto.com.br/invitation/affiliation/P34C6A34B"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold text-sm sm:text-base py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Solicitar Afiliação ao Método PBE</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. UNLOCKED OFFER SECTION */}
      {isUnlocked ? (
        <div ref={offerSectionRef} className="animate-fade-in transition-all duration-700">
          
          {/* COUNTDOWN TIMER BANNER */}
          <section className="py-8 px-4 bg-gradient-to-b from-amber-950/40 via-red-950/20 to-black border-y border-amber-500/30">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <div className="inline-flex items-center gap-2 text-red-400 text-xs sm:text-sm font-bold uppercase tracking-wider bg-red-500/10 border border-red-500/20 px-3.5 py-1.5 rounded-full">
                <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />
                <span>Condição Exclusiva de Lançamento Revelada na Masterclass</span>
              </div>
              
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white">
                Oportunidade por Tempo Limitado
              </h2>

              <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
                O valor promocional apresentado nesta aula expira em poucos minutos. Garanta sua vaga com a condição especial abaixo:
              </p>

              {/* DIGITAL COUNTDOWN TIMER */}
              <div className="flex items-center justify-center gap-3 pt-2">
                <div className="bg-black/80 border border-amber-500/50 rounded-xl p-3 sm:p-4 min-w-[75px] sm:min-w-[90px] shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-400 font-mono">
                    {formatTimerNumber(timeLeft.minutes)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold mt-1">Minutos</div>
                </div>

                <div className="text-3xl sm:text-4xl font-black text-amber-500 animate-pulse">:</div>

                <div className="bg-black/80 border border-amber-500/50 rounded-xl p-3 sm:p-4 min-w-[75px] sm:min-w-[90px] shadow-[0_0_20px_rgba(245,158,11,0.2)]">
                  <div className="text-3xl sm:text-4xl md:text-5xl font-black text-amber-400 font-mono">
                    {formatTimerNumber(timeLeft.seconds)}
                  </div>
                  <div className="text-[10px] sm:text-xs text-slate-400 uppercase font-semibold mt-1">Segundos</div>
                </div>
              </div>

              {isTimerExpired && (
                <p className="text-xs text-red-400 font-bold uppercase tracking-wider pt-2">
                  Atenção: O cronômetro expirou! O lote pode virar a qualquer momento.
                </p>
              )}
            </div>
          </section>

          {/* TABLE OF INCLUDED ITEMS & PRICING (EXACTLY AS ATTACHED IMAGE) */}
          <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black">
            <div className="max-w-4xl mx-auto space-y-10">
              
              <div className="text-center space-y-3">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white">
                  O Que Você Recebe – <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">MÉTODO PBE</span>
                </h2>
                <p className="text-base sm:text-lg text-slate-300">
                  Veja o valor real de tudo que está incluído no ecossistema:
                </p>
              </div>

              {/* TABLE CONTAINER */}
              <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/60 shadow-2xl backdrop-blur-md">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-800/80">
                        <th className="py-4 px-6 text-sm sm:text-base font-extrabold text-white uppercase tracking-wider">
                          Item
                        </th>
                        <th className="py-4 px-6 text-sm sm:text-base font-extrabold text-right text-white uppercase tracking-wider">
                          Valor
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-sm sm:text-base">
                      {offerItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-white/[0.03] transition-colors">
                          <td className="py-4 px-6 font-medium text-slate-200 flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            <span>{item.name}</span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-right text-slate-300 whitespace-nowrap">
                            {item.value}
                          </td>
                        </tr>
                      ))}
                      
                      {/* TOTAL ROW */}
                      <tr className="bg-slate-800/90 font-black border-t-2 border-amber-500/40 text-base sm:text-lg">
                        <td className="py-5 px-6 uppercase tracking-wider text-white">
                          TOTAL
                        </td>
                        <td className="py-5 px-6 text-right text-white line-through decoration-red-500 decoration-2 whitespace-nowrap">
                          R$ 997,00
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SPECIAL OFFER CARD */}
              <div className="bg-gradient-to-b from-slate-900 to-black border-2 border-amber-500 rounded-3xl p-6 sm:p-10 text-center shadow-[0_0_40px_rgba(245,158,11,0.25)] relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-500 text-black font-black text-xs uppercase px-4 py-1.5 rounded-bl-xl shadow-md">
                  CONDIÇÃO ESPECIAL DA MASTERCLASS
                </div>

                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="space-y-2">
                    <p className="text-slate-400 text-sm sm:text-base uppercase tracking-wider font-semibold">
                      De <span className="line-through decoration-red-500 decoration-2 font-bold text-slate-300">R$ 997,00</span> por apenas:
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
                      <span className="text-4xl sm:text-6xl font-black text-white tracking-tight">
                        R$ 497,00
                      </span>
                      <span className="text-slate-400 text-sm sm:text-base font-semibold">
                        à vista
                      </span>
                    </div>
                    <p className="text-amber-400 font-bold text-lg sm:text-xl">
                      ou em <span className="text-2xl font-black text-white">12x</span> de <span className="text-2xl font-black text-white">R$ 51,40</span>
                    </p>
                  </div>

                  {/* MAIN CTA BUTTON */}
                  <div className="pt-2 space-y-3">
                    <button
                      type="button"
                      id="btn-masterclass-cta"
                      onClick={handleCheckout}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-lg sm:text-2xl py-5 px-10 rounded-2xl shadow-[0_0_35px_rgba(16,185,129,0.5)] transition-all transform hover:scale-[1.03] active:scale-[0.98] uppercase tracking-wide border border-emerald-400/30 cursor-pointer"
                    >
                      <span>GARANTA SEU ACESSO AGORA!</span>
                      <ChevronRight className="w-6 h-6 stroke-[3]" />
                    </button>

                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2">
                      <span className="flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Ambiente 100% Seguro
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Acesso Imediato ao Ecossistema
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        Garantia de 7 Dias
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* TESTIMONIALS & SOCIAL PROOF FROM MASTERCLASS-1 */}
          <SocialProofSection onSelectImage={(src) => setSelectedImage(src)} />

          {/* 7-DAY GUARANTEE */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black text-center">
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <ShieldCheck className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">
                Garantia Incondicional de 7 Dias
              </h2>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Você entra hoje, acessa todos os módulos do Método PBE, utiliza a Fábrica de Best Seller, participa da comunidade e tem 7 dias inteiros para testar tudo. Se por qualquer motivo você sentir que o método não é para você, basta nos enviar um e-mail. Devolvemos 100% do seu dinheiro, sem letras miúdas. O risco é todo nosso.
              </p>
              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 px-6 rounded-xl transition-all cursor-pointer"
                >
                  Garantir Acesso com Risco Zero <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* FAQ SECTION */}
          <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-[#0a0a0a]">
            <div className="max-w-4xl mx-auto space-y-10">
              <div className="text-center space-y-3">
                <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest">Dúvidas Frequentes</h3>
                <h2 className="text-3xl md:text-4xl font-extrabold">Perguntas Frequentes sobre o Método PBE</h2>
              </div>

              <div className="space-y-4">
                {[
                  {
                    q: 'Como recebo o acesso ao Método PBE após o pagamento?',
                    a: 'A liberação é automática e imediata. Assim que o pagamento for aprovado pela Ticto, você receberá seus dados de acesso diretamente no seu e-mail cadastrado, podendo iniciar o treinamento e ativar suas ferramentas agora mesmo.'
                  },
                  {
                    q: 'Já tenho uma ideia ou rascunho de livro, o método serve para mim?',
                    a: 'Perfeitamente. Se você já tem anotações, palestras ou rascunhos, o Método PBE acelera em até 10x a formatação, refinamento e finalização da obra. E se você não tem nenhuma ideia, o método ensina a minerar temas de altíssima demanda comercial.'
                  },
                  {
                    q: 'Como funciona a mentoria em grupo inclusa no pacote?',
                    a: 'Você terá direito a 4 encontros exclusivos de mentoria ao vivo em grupo com Leonildo Bevilaqua e time de especialistas, onde analisamos livros, estratégias de capa, posicionamento e canais de escala dos autores.'
                  },
                  {
                    q: 'O que é o programa de Representante Afiliado Autorizado (RAA)?',
                    a: 'É a nossa rota de monetização de alto retorno: autores do Método PBE podem se credenciar para comercializar o ecossistema com comissões de até 60% (cerca de R$ 275 por venda), gerando caixa rápido com a sua própria autoridade.'
                  },
                  {
                    q: 'Preciso pagar para imprimir estoque de livros?',
                    a: 'Não! O Método PBE ensina a publicar na Amazon KDP e na UICLAP no formato de impressão sob demanda. Você não investe um único real em caixas de livros parados: o leitor compra, a plataforma imprime e entrega, e você recebe os royalties.'
                  },
                  {
                    q: 'Quais as formas de pagamento disponíveis?',
                    a: 'Você pode pagar via PIX à vista por R$ 497,00 (liberação instantânea) ou parcelar no cartão de crédito em até 12x de R$ 51,40.'
                  }
                ].map((faq, index) => (
                  <div key={index} className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
                    <button
                      className="w-full px-6 py-5 flex items-center justify-between font-bold text-left text-white hover:bg-white/5 transition-colors cursor-pointer"
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="pr-4">{faq.q}</span>
                      <ChevronDown className={`w-5 h-5 text-amber-500 flex-shrink-0 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === index && (
                      <div className="px-6 py-5 border-t border-white/10 text-slate-300 text-sm sm:text-base leading-relaxed bg-black/40">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-center pt-8">
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="inline-block bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-extrabold py-5 px-10 rounded-xl shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-all transform hover:scale-[1.02] text-lg uppercase cursor-pointer"
                >
                  GARANTA SEU ACESSO AGORA COM DESCONTO
                </button>
              </div>
            </div>
          </section>

          {/* STICKY BOTTOM CTA BAR */}
          {showStickyBar && (
            <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-md border-t border-amber-500/40 p-3 sm:p-4 z-50 animate-slide-up shadow-[0_-5px_25px_rgba(0,0,0,0.8)]">
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-center sm:text-left">
                  <div className="text-xs text-amber-400 font-bold uppercase tracking-wider flex items-center justify-center sm:justify-start gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Oferta Masterclass Expira em: {formatTimerNumber(timeLeft.minutes)}:{formatTimerNumber(timeLeft.seconds)}</span>
                  </div>
                  <div className="text-white text-sm sm:text-base font-extrabold">
                    Método PBE Completo por apenas 12x de R$ 51,40 (ou R$ 497 à vista)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCheckout}
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-sm sm:text-base py-3 px-8 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all whitespace-nowrap cursor-pointer"
                >
                  GARANTA SEU ACESSO AGORA!
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* PLACEHOLDER WHEN OFFER NOT YET UNLOCKED */
        <div className="py-12 px-4 max-w-3xl mx-auto text-center space-y-4">
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <Lock className="w-8 h-8 text-amber-500/50 mx-auto" />
            <p className="text-slate-400 text-sm">
              A apresentação especial com todos os recursos, bônus e condição única do Método PBE será desbloqueada ao final da aula aos <strong>1:13:37</strong>.
            </p>
            <p className="text-xs text-slate-500">
              Assista à aula atentamente para absorver todo o conteúdo prático.
            </p>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-12 text-center border-t border-white/10 bg-black text-slate-500 text-sm">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <p className="font-bold text-white mb-2">FÁBRICA DE BEST SELLER</p>
          <p>© {new Date().getFullYear()} FBS • Método Publicação Business Express. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4 pt-2 text-amber-500/80 hover:text-amber-500 text-xs">
            <a href="/terms" className="hover:underline">Termos de Uso</a>
            <span>|</span>
            <a href="/privacy-policy" className="hover:underline">Política de Privacidade</a>
          </div>
        </div>
      </footer>

      {/* LIGHTBOX MODAL FOR ENLARGING WHATSAPP PRINTS */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center justify-center" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 sm:-top-4 sm:-right-4 z-10 bg-slate-800 text-white p-2.5 rounded-full border border-white/20 hover:bg-amber-500 hover:text-black transition-colors shadow-2xl"
              aria-label="Fechar"
            >
              <X className="w-6 h-6" />
            </button>
            <img 
              src={selectedImage} 
              alt="Depoimento em tamanho ampliado" 
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}

    </div>
  );
};
