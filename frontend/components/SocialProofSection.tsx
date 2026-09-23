import React, { useState } from 'react';
import { Volume2, Play, Pause, Star, MessageSquare, ZoomIn, Video, CheckCircle, ShieldCheck } from 'lucide-react';

interface SocialProofSectionProps {
  onSelectImage: (src: string) => void;
}

export const SocialProofSection: React.FC<SocialProofSectionProps> = ({ onSelectImage }) => {
  const [playingAudio, setPlayingAudio] = useState<string | null>(null);

  const toggleAudio = (audioId: string, elementId: string) => {
    const audioElement = document.getElementById(elementId) as HTMLAudioElement | null;
    if (!audioElement) return;

    if (playingAudio === audioId) {
      audioElement.pause();
      setPlayingAudio(null);
    } else {
      // Pause any other playing audio first
      document.querySelectorAll('audio').forEach((a) => a.pause());
      audioElement.play();
      setPlayingAudio(audioId);
    }
  };

  const videoTestimonials = [
    {
      id: 'A-yD1ZmKLns',
      name: 'Flávio Almeida',
      role: 'Mestre em Krav Maga',
      location: 'Autor Publicado',
      embedUrl: 'https://www.youtube-nocookie.com/embed/A-yD1ZmKLns?rel=0'
    },
    {
      id: 'Rm1_nT5Nk-4',
      name: 'Monique',
      role: 'Autora Publicada',
      location: 'São Paulo - SP',
      embedUrl: 'https://www.youtube-nocookie.com/embed/Rm1_nT5Nk-4?rel=0'
    },
    {
      id: '8OPjQoJ0gJY',
      name: 'Jonathan',
      role: 'Autor Publicado',
      location: 'Ceará',
      embedUrl: 'https://www.youtube-nocookie.com/embed/8OPjQoJ0gJY?rel=0'
    },
    {
      id: 'UbvbwS5uzWo',
      name: 'Patricia',
      role: 'Autora Publicada',
      location: 'Fortaleza - CE',
      embedUrl: 'https://www.youtube-nocookie.com/embed/UbvbwS5uzWo?rel=0'
    },
  ];

  const audioSpotlights = [
    {
      id: 'solange',
      audioElementId: 'audio_solange',
      audioSrc: '/assets/depoimento_dra_solange.mp3',
      coverImg: '/assets/9 – A Rosa e o Cravo – Solange Cristina Leandrin Betiate.png',
      bookTitle: 'A Rosa e o Cravo',
      authorName: 'Dra. Solange',
      subtitle: 'Autora & Cliente Satisfeita',
      tag: 'OUÇA O DEPOIMENTO SOBRE O LIVRO'
    },
    {
      id: 'flavio',
      audioElementId: 'audio_flavio',
      audioSrc: '/assets/depoimento_flavio.mp3',
      coverImg: '/assets/8 – Autodefesa é para Todos – Flávio Almeida.png',
      bookTitle: 'Autodefesa é para Todos',
      authorName: 'Flávio - Mestre em Krav Maga',
      subtitle: 'Autor & Cliente Satisfeito',
      tag: 'OUÇA O DEPOIMENTO SOBRE O LIVRO'
    }
  ];

  const whatsappProofs = [
    { id: 1, src: '/assets/clientes%20satisfeitos%20-%201.jpeg', alt: 'Depoimento WhatsApp de cliente satisfeito 1' },
    { id: 2, src: '/assets/clientes%20satisfeitos%20-%202.jpeg', alt: 'Depoimento WhatsApp de cliente satisfeito 2' },
    { id: 3, src: '/assets/clientes%20satisfeitos%20-%203.jpeg', alt: 'Depoimento WhatsApp de cliente satisfeito 3' },
    { id: 4, src: '/assets/clientes%20satisfeitos%20-%204.jpeg', alt: 'Depoimento WhatsApp de cliente satisfeito 4' },
    { id: 5, src: '/assets/clientes%20satisfeitos%20-%205.jpeg', alt: 'Depoimento WhatsApp de cliente satisfeito 5' },
    { id: 6, src: '/assets/clientes%20satisfeitos%20-%206.jpeg', alt: 'Depoimento WhatsApp de cliente satisfeito 6' },
  ];

  const bookCovers = [
    { img: "1 - A Chama Inextinguível - Ap. Custodio Ignacio.png", title: "A Chama Inextinguível", desc: "Ap. Custodio Ignacio" },
    { img: "2 – O Campo Magnético das Vendas - Leonildo Bevilaqua.png", title: "O Campo Magnético das Vendas", desc: "Leonildo Bevilaqua" },
    { img: "3 – A Ilusão da Cor - Edinaldo Pereira da Silva.png", title: "A Ilusão da Cor", desc: "Edinaldo Pereira da Silva" },
    { img: "4 - A Nova Educação - Moisés Allaion Ferreira.png", title: "A Nova Educação", desc: "Moisés Allaion Ferreira" },
    { img: "5 – O Mapa Secreto da Puberdade – Tânia Garcia.jpg", title: "O Mapa Secreto da Puberdade", desc: "Tânia Garcia" },
    { img: "6 – Memorize de Forma Inteligente, Não Árdua! – Prof. Carlos André.png", title: "Memorize de Forma Inteligente, Não Árdua!", desc: "Prof. Carlos André" },
    { img: "7 – 3 Minutos de Silêncio – Aline Tanaka.png", title: "3 Minutos de Silêncio", desc: "Aline Tanaka" },
    { img: "8 – Autodefesa é para Todos – Flávio Almeida.png", title: "Autodefesa é para Todos", desc: "Flávio Almeida" },
    { img: "9 – A Rosa e o Cravo – Solange Cristina Leandrin Betiate.png", title: "A Rosa e o Cravo", desc: "Solange Cristina Leandrin Betiate" },
    { img: "10 – Crianças do Amanhã – Carlos Bueno.png", title: "Crianças do Amanhã", desc: "Carlos Bueno" }
  ];

  return (
    <section className="py-20 border-t border-white/10 bg-black overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* SECTION HEADER */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Prova Social & Histórias de Sucesso</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold">
            Autores reais.<br />
            <span className="text-amber-500">Resultados extraordinários.</span>
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-base sm:text-lg">
            Conheça os depoimentos em vídeo, áudios e conversas reais de quem já publicou seu livro com a Fábrica de Best Seller:
          </p>
        </div>

        {/* 1. VIDEO TESTIMONIALS (YOUTUBE SHORTS GRID) */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Video className="w-5 h-5 text-amber-500" />
            <h3 className="text-xl sm:text-2xl font-bold text-white">Depoimentos em Vídeo dos Nossos Autores</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videoTestimonials.map((vid) => (
              <div key={vid.id} className="bg-gradient-to-b from-slate-900 to-black rounded-2xl overflow-hidden border border-white/10 hover:border-amber-500/40 transition-all duration-300 shadow-xl flex flex-col justify-between">
                <div className="relative aspect-[9/16] w-full bg-slate-950">
                  <iframe
                    src={vid.embedUrl}
                    title={`Depoimento ${vid.name}`}
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
                <div className="p-4 bg-slate-900/90 border-t border-white/5 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-white text-base">{vid.name}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-amber-400 font-semibold">{vid.role}</p>
                  <p className="text-[11px] text-slate-400">{vid.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. AUDIO SPOTLIGHTS (DRA. SOLANGE & FLÁVIO ALMEIDA) */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <Volume2 className="w-5 h-5 text-amber-500 animate-pulse" />
            <h3 className="text-xl sm:text-2xl font-bold text-white">Depoimentos em Áudio + Capas de Livros</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {audioSpotlights.map((spotlight) => {
              const isPlaying = playingAudio === spotlight.id;
              return (
                <div 
                  key={spotlight.id} 
                  className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-black rounded-3xl p-6 sm:p-8 border border-white/10 hover:border-amber-500/40 transition-all duration-300 shadow-2xl flex flex-col items-center relative overflow-hidden text-center"
                >
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-500 text-black text-[10px] font-extrabold uppercase px-3 py-1 rounded-bl-xl tracking-wider shadow-md z-10">
                    Áudio Exclusivo
                  </div>

                  {/* Full Book Cover Image (Bigger, No Box Around) */}
                  <div className="w-full max-w-[360px] sm:max-w-[420px] mb-6 flex items-center justify-center group">
                    <img 
                      src={spotlight.coverImg} 
                      alt={spotlight.bookTitle}
                      className="w-full h-auto max-h-[500px] object-contain rounded-lg drop-shadow-[0_25px_35px_rgba(0,0,0,0.95)] transform transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>

                  {/* Audio Controls & Information Below Cover */}
                  <div className="w-full space-y-4 text-center">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
                        {spotlight.tag}
                      </span>
                      <h4 className="text-2xl font-extrabold text-white leading-tight">{spotlight.authorName}</h4>
                      <p className="text-sm text-slate-300 font-medium mt-1">Livro: <span className="text-amber-400 font-semibold">{spotlight.bookTitle}</span></p>
                      <p className="text-xs text-slate-400 mt-0.5">{spotlight.subtitle}</p>
                    </div>

                    {/* Audio Player Container */}
                    <div className="bg-black/70 border border-amber-500/30 p-4 rounded-2xl space-y-3 text-left">
                      <audio id={spotlight.audioElementId} src={spotlight.audioSrc} preload="metadata" onEnded={() => setPlayingAudio(null)} />
                      
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => toggleAudio(spotlight.id, spotlight.audioElementId)}
                          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 transform active:scale-95 shadow-lg flex-shrink-0 ${
                            isPlaying 
                              ? 'bg-amber-500 text-black shadow-amber-500/40' 
                              : 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-green-600/30'
                          }`}
                        >
                          {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-white truncate">{isPlaying ? 'Tocando Depoimento...' : 'Clique para Ouvir'}</p>
                          <p className="text-[11px] text-slate-400 truncate">Áudio real do autor em alta qualidade</p>
                        </div>
                      </div>

                      {/* Animated Soundwave Indicator */}
                      <div className="flex items-center gap-1 h-3 justify-center pt-1">
                        {[40, 70, 30, 90, 50, 80, 40, 100, 60, 30, 80, 50, 70, 40, 90].map((h, i) => (
                          <span 
                            key={i} 
                            style={{ height: isPlaying ? `${h}%` : '20%' }}
                            className={`w-1 rounded-full transition-all duration-300 ${isPlaying ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. WHATSAPP PRINTS GRID */}
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-2 border-b border-white/10 pb-4">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl sm:text-2xl font-bold text-white">Conversas & Depoimentos no WhatsApp</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {whatsappProofs.map((proof) => (
              <div 
                key={proof.id} 
                onClick={() => onSelectImage(proof.src)}
                className="group relative bg-gradient-to-b from-slate-900 to-black rounded-2xl p-3 border border-white/10 hover:border-amber-500/50 transition-all duration-300 shadow-xl cursor-pointer transform hover:-translate-y-1 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between px-2 py-2 mb-2 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-semibold text-slate-300">Cliente Satisfeito #{proof.id}</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-medium">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>Verificado</span>
                  </div>
                </div>

                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center">
                  <img 
                    src={proof.src} 
                    alt={proof.alt}
                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-white">
                    <ZoomIn className="w-8 h-8 text-amber-400" />
                    <span className="text-xs font-bold uppercase tracking-wider bg-black/80 px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                      Clique para ampliar
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. MARQUEE CAROUSEL OF PUBLISHED BOOK COVERS */}
      <div className="relative w-full flex overflow-hidden group pt-12 mt-12 border-t border-white/5">
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
        
        <div className="flex animate-scroll-slow items-center w-max flex-nowrap">
          {[1, 2].map((loop) => (
            <div key={`loop-${loop}`} className="flex items-center gap-6 px-3 flex-shrink-0 min-w-max">
              {bookCovers.map((author, index) => (
                <div key={index} className="w-80 sm:w-96 md:w-[480px] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group-hover/card flex-shrink-0">
                  <div className="aspect-[2/1] relative flex items-center justify-center bg-slate-900">
                    <img 
                      src={`/assets/${author.img}`} 
                      alt={author.title}
                      className="w-full h-full object-contain transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none"></div>
                    <div className="absolute bottom-5 left-5 right-5 pointer-events-none">
                       <p className="text-[10px] text-amber-500 font-bold tracking-widest uppercase mb-1">{author.desc}</p>
                       <p className="text-white font-bold leading-tight mb-2 text-sm sm:text-base uppercase">{author.title}</p>
                       <div className="flex gap-1">
                         {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />)}
                       </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
