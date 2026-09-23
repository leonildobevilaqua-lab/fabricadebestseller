import React, { useEffect, useState } from 'react';
import { Calendar, Clock, BookOpen, AlertTriangle, CheckCircle, Video, Lock, ChevronRight, ChevronDown, Check, ShieldCheck, Star, Users, X } from 'lucide-react';
import { getDynamicWebinarSlots, WebinarSlotsInfo } from '../utils/timeUtils';
import { SocialProofSection } from './SocialProofSection';

export const MasterclassLaunch1: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showSticky, setShowSticky] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Dynamic Webinar Slots (+20m, +1h20m, +2h20m)
  const [slotsInfo, setSlotsInfo] = useState<WebinarSlotsInfo | null>(null);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);

  useEffect(() => {
    const info = getDynamicWebinarSlots();
    setSlotsInfo(info);
  }, []);

  const handleCheckout = () => {
    const currentSlot = slotsInfo ? slotsInfo.slots[selectedSlotIndex] : '21:30';
    const day = slotsInfo ? slotsInfo.dayOfWeek : 'Hoje';
    const checkoutUrl = `https://payment.ticto.app/OF211B00F?sck=${encodeURIComponent(`horario_${currentSlot.replace(':', '_')}`)}&custom=${encodeURIComponent(`${day}_${currentSlot}`)}`;
    window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleFaq = (index: number) => {
    if (openFaq === index) {
      setOpenFaq(null);
    } else {
      setOpenFaq(index);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-amber-500/30">
      
      {/* 1. SCARCITY BANNER */}
      <div className="bg-gradient-to-r from-red-600 to-red-800 text-white py-3 px-4 text-center sticky top-0 z-50 flex items-center justify-center gap-2 shadow-lg shadow-red-900/20">
        <AlertTriangle className="w-5 h-5 animate-pulse" />
        <p className="font-semibold text-sm sm:text-base">
          <span className="font-bold uppercase tracking-wider">Atenção:</span> 97% das vagas para o primeiro lote já foram preenchidas. Garanta sua vaga agora!
        </p>
      </div>

      {/* 2. HERO SECTION */}
      <header className="relative overflow-hidden px-4 sm:px-6 lg:px-8 min-h-[90vh] flex items-center pt-24 md:pt-0">
        
        {/* Cinematic Main Background (Podcast Image) */}
        <div className="absolute inset-0 z-0">
          <img 
            src="/assets/Leonildo%20Bevilaqua%20-%20Oficial%20Landing%20page.webp" 
            alt="Leonildo Bevilaqua - Fábrica de Best Seller" 
            fetchPriority="high"
            decoding="async"
            width={1200}
            height={675}
            className="w-full h-full object-cover object-[70%_center] md:object-right opacity-30 md:opacity-90"
          />
        </div>

        {/* Gradient overlays to blend the image into the dark theme and highlight text */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent w-full md:w-[75%] z-0"></div>
        <div className="absolute inset-0 bg-black/60 md:hidden z-0"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/60 to-transparent z-0"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-[#0a0a0a] via-black/50 to-transparent z-0"></div>
        <div className="absolute top-1/2 left-[10%] -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 blur-[150px] rounded-full hidden md:block z-0"></div>

        <div className="relative max-w-6xl mx-auto flex w-full z-20 py-10 lg:py-24">
          {/* Left Column - Text & CTA */}
          <div className="w-full md:w-[72%] lg:w-[68%] space-y-8 text-center md:text-left z-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium text-xs sm:text-sm mb-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <Video className="w-4 h-4 text-amber-400" />
              <span className="font-bold tracking-wide">[ MASTERCLASS PRÁTICA + 1 CRÉDITO COMPLETO DA IA INCLUSO ]</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Descubra o Método Exato para Criar, Lançar seu Livro e <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-500">
                Ativar Novas Fontes de Renda em Tempo Recorde
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto md:mx-0 leading-relaxed drop-shadow-md">
              Participe da Masterclass do Método Publicação Business Express (PBE) e veja como usar IA para publicar sua obra na Amazon e UICLAP — e conheça os bastidores do ecossistema onde nossos alunos chegam a gerar comissões de até 60% (cerca de R$ 275 por venda).
            </p>

            {/* DYNAMIC DATE & 3-TIME-SLOT SELECTOR */}
            <div className="space-y-4 pt-2 text-left bg-black/50 md:bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md max-w-xl">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Quando</p>
                  <p className="text-lg font-bold text-white">{slotsInfo ? slotsInfo.dayOfWeek : 'Hoje'}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-amber-400 font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-500" /> Escolha o melhor horário para assistir hoje:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {slotsInfo?.fullFormatted.map((item, idx) => {
                    const isSelected = selectedSlotIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedSlotIndex(idx)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl border text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? 'bg-gradient-to-r from-amber-500/25 to-yellow-500/15 border-amber-500 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.25)] ring-1 ring-amber-500'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:border-amber-500/40 hover:bg-white/10'
                        }`}
                      >
                        <span>{item.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-amber-400 flex-shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            <div className="pt-4 space-y-2">
              <button 
                type="button"
                onClick={handleCheckout}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-black text-base sm:text-lg py-4 px-8 rounded-xl shadow-[0_0_25px_rgba(34,197,94,0.4)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                GARANTIR MINHA VAGA + 1 LIVRO NA FBS POR R$ 29,90 <ChevronRight className="w-5 h-5" />
              </button>
              <p className="text-xs text-slate-400 pt-1 text-center md:text-left flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Pagamento 100% Seguro • Acesso Imediato • Garantia de 7 dias</span>
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* 3. SEÇÃO DE CONEXÃO: "O Livro te dá Autoridade. O Método PBE te dá Escala." */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest">O Modelo dos Autores de Sucesso</h3>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight">
              O Livro te dá Autoridade.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">O Método PBE te dá Escala.</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              Descubra os dois pilares fundamentais para transformar seu conhecimento em uma obra física publicada e em um ecossistema altamente lucrativo:
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-b from-slate-900 to-black p-8 rounded-3xl border border-amber-500/30 relative shadow-2xl flex flex-col justify-between space-y-6 group hover:border-amber-500/60 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-xl">
                  01
                </div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-amber-400 transition-colors">
                  Pilar 1 — Publicação Express (Amazon & UICLAP)
                </h3>
                <p className="text-slate-300 text-base leading-relaxed">
                  Como sair do zero, estruturar capítulos com a IA da Fábrica de Best Seller e ter o livro à venda impresso sob demanda e em ebook com padrão de grandes editoras.
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-amber-400 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Sem necessidade de estoque ou impressão antecipada</span>
              </div>
            </div>

            <div className="bg-gradient-to-b from-slate-900 to-black p-8 rounded-3xl border border-emerald-500/30 relative shadow-2xl flex flex-col justify-between space-y-6 group hover:border-emerald-500/60 transition-all">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl">
                  02
                </div>
                <h3 className="text-2xl font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                  Pilar 2 — O Modelo de Negócios dos Autores
                </h3>
                <p className="text-slate-300 text-base leading-relaxed">
                  Como os alunos do método têm a oportunidade exclusiva de se tornar Representantes Afiliados Autorizados (RAA), monetizando a própria autoridade com comissões de até 60% (cerca de R$ 275 por venda aprovada).
                </p>
              </div>
              <div className="pt-4 border-t border-white/10 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span>Monetização ativa com comissões diretas de R$ 275/venda</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SEÇÃO DOS 4 MÓDULOS DA MASTERCLASS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest">Cronograma do Treinamento</h3>
            <h2 className="text-3xl md:text-4xl font-extrabold">Os 4 Módulos Práticos da Masterclass:</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="text-amber-400 font-black text-3xl opacity-80 mt-1 flex-shrink-0">01</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Estruturação e Oferta do Livro</h4>
                <p className="text-slate-300 text-sm leading-relaxed">Mineração de temas lucrativos e roteiro completo do sumário à conclusão do livro.</p>
              </div>
            </div>

            <div className="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="text-amber-400 font-black text-3xl opacity-80 mt-1 flex-shrink-0">02</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Domínio da Fábrica de Best Seller</h4>
                <p className="text-slate-300 text-sm leading-relaxed">Como utilizar seu crédito incluso na ferramenta de IA para redigir e lapidar com sua voz autoral.</p>
              </div>
            </div>

            <div className="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all">
              <div className="text-amber-400 font-black text-3xl opacity-80 mt-1 flex-shrink-0">03</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Design, Diagramação e Publicação</h4>
                <p className="text-slate-300 text-sm leading-relaxed">Capas profissionais, diagramação interna e publicação express na Amazon e UICLAP.</p>
              </div>
            </div>

            <div className="flex gap-5 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all">
              <div className="text-emerald-400 font-black text-3xl opacity-80 mt-1 flex-shrink-0">04</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">O Ecossistema de Lucro do Autor</h4>
                <p className="text-slate-300 text-sm leading-relaxed">Como funciona o programa fechado de Representantes Afiliados Autorizados (RAA) para alunos e o passo a passo para gerar caixa imediato.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. OFFER & PRICING SECTION (Checkout) */}
      <section id="inscricao" className="py-20 px-4 sm:px-6 lg:px-8 relative bg-[#0a0a0a] border-t border-white/10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent"></div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          
          <div className="space-y-8">
            <div>
              <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-2">Acesso Exclusivo</h3>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">Tudo o que você vai receber<br />ao garantir sua vaga hoje:</h2>
            </div>
            
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Video className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Masterclass Método (PBE)</h3>
                  <p className="text-slate-400 text-sm mt-1">Treinamento completo revelando os bastidores para criar, formatar e lançar sua obra com velocidade e padrão profissional.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <BookOpen className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-400">1 Crédito Completo na FBS</h3>
                  <p className="text-slate-400 text-sm mt-1">Acesso direto à ferramenta de IA para estruturar e gerar seu livro completo do sumário à conclusão.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  <Star className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Matriz de Mineração de Temas</h3>
                  <p className="text-slate-400 text-sm mt-1">Framework de mercado para encontrar assuntos lucrativos e títulos que atraem cliques imediatos.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
                  <BookOpen className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Livro Digital: O Campo Magnético das Vendas</h3>
                  <p className="text-slate-400 text-sm mt-1">Guia estratégico para transformar leitores casuais em clientes fiéis do seu negócio.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
                  <Star className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Modelo de Página de Registro</h3>
                  <p className="text-slate-400 text-sm mt-1">Template 100% editável para você divulgar e capturar interessados no seu livro antes do lançamento.</p>
                </div>
              </li>
              <li className="flex gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden mt-4">
                <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 uppercase rounded-bl-lg">Liberados ao vivo</div>
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-amber-400">2 Bônus Surpresas Especiais</h3>
                  <p className="text-slate-300 text-sm mt-1">
                    Ativos de altíssimo valor (R$ 546,90) revelados unicamente para os participantes presentes ao encerramento da masterclass.
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-b from-slate-900 to-black border border-white/10 rounded-3xl p-8 relative shadow-2xl shadow-amber-900/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold uppercase tracking-widest text-xs px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
              Oferta Limitada
            </div>
            
            <div className="space-y-6 pt-2">
              <div className="bg-black/50 p-4 sm:p-5 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-400 truncate pr-2">Masterclass Método (PBE)</span>
                  <span className="text-slate-500 line-through whitespace-nowrap">R$ 147,90</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-400 truncate pr-2">1 Crédito FBS</span>
                  <span className="text-slate-500 line-through whitespace-nowrap">R$ 39,90</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-400 truncate pr-2">Matriz de Mineração</span>
                  <span className="text-slate-500 line-through whitespace-nowrap">R$ 79,90</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-400 truncate pr-2">Livro Digital</span>
                  <span className="text-slate-500 line-through whitespace-nowrap">R$ 49,90</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-400 truncate pr-2">Modelo de Página</span>
                  <span className="text-slate-500 line-through whitespace-nowrap">R$ 19,90</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-amber-500/80 truncate pr-2">Bônus Surpresa 1</span>
                  <span className="text-slate-500 line-through whitespace-nowrap">R$ 49,90</span>
                </div>
                <div className="flex justify-between items-center text-xs sm:text-sm border-b border-white/5 pb-2">
                  <span className="text-amber-500 font-bold truncate pr-2">Bônus ESPECIAL 2</span>
                  <span className="text-slate-500 line-through whitespace-nowrap">R$ 497,00</span>
                </div>
                <div className="flex justify-between items-center font-medium pt-1">
                  <span className="text-slate-300 text-xs sm:text-sm">Valor Total de Tudo:</span>
                  <span className="text-slate-500 line-through whitespace-nowrap">R$ 884,40</span>
                </div>
              </div>
              
              <div className="text-center space-y-1">
                <p className="text-slate-400 text-sm line-through">De: R$ 884,40</p>
                <div className="flex items-end justify-center gap-2">
                  <span className="text-xl font-medium text-slate-300">Por apenas:</span>
                  <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">R$ 29,90</span>
                </div>
                <p className="text-amber-500/80 text-xs sm:text-sm font-medium pt-2">
                  (Ou em até 5x de R$ 6,62 — mais de 96% de economia)
                </p>
              </div>

              <button 
                type="button"
                onClick={handleCheckout}
                className="w-full block bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-extrabold text-lg py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  Garantir Minha Vaga Agora <ChevronRight className="w-5 h-5" />
                </div>
              </button>

              <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-500" /> Pagamento Seguro</div>
                <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Garantia 7 dias</div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 6. CASOS DE SUCESSO (SOCIAL PROOF) */}
      <SocialProofSection onSelectImage={setSelectedImage} />

      {/* 7. AUTHORITY SECTION */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a] border-t border-white/5 relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-12">
          
          <div className="w-full md:w-1/3 relative">
            <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 relative group shadow-2xl shadow-amber-900/20">
              <img 
                src="/assets/landing/f7acb9e3-2a41-4762-9ea4-679816fcb72a.jpeg" 
                alt="Leonildo Bevilaqua" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80";
                  e.currentTarget.style.filter = 'grayscale(100%) contrast(1.2)';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="font-bold text-2xl text-white">Leonildo Bevilaqua</p>
                <p className="text-amber-500 text-xs font-bold mt-1">Fundador FBS & Criador Método PBE</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3 space-y-6">
            <div>
              <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest mb-1">Quem vai apresentar?</h3>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Leonildo Bevilaqua</h2>
              <p className="text-amber-400 font-semibold text-sm mt-1">Fundador da Fábrica de Best Seller & Criador do Método Publicação Business Express (PBE)</p>
            </div>

            <div className="space-y-4 text-slate-300 text-base leading-relaxed">
              <p>
                "Minha missão é simples: acabar com o mito de que publicar um livro profissional exige meses de bloqueio criativo ou milhares de reais na mão de editoras tradicionais."
              </p>
              <p>
                "Desenvolvi o ecossistema da Fábrica de Best Seller para unir tecnologia de ponta, inteligência artificial e estratégias reais de mercado. O resultado? Autores comuns publicando com o mesmo padrão das maiores livrarias do país — com registro, diagramação impecável e distribuição express."
              </p>
              <p>
                "Nesta Masterclass, vou abrir a 'caixa preta' de todo o nosso processo. Você verá exatamente como utilizar a nossa IA para estruturar sua obra e como pensar como um autor-empresário: usando seu livro não apenas como um cartão de visitas de luxo, mas como a porta de entrada para um ecossistema altamente lucrativo."
              </p>
            </div>
            
            <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
               <div className="flex items-start gap-3 text-slate-300">
                 <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                 <span><strong>Tecnologia Proprietária:</strong> Criador da plataforma FBS, utilizada por centenas de autores para estruturar e publicar livros.</span>
               </div>
               <div className="flex items-start gap-3 text-slate-300">
                 <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                 <span><strong>Visão 360° de Mercado:</strong> Especialista em estratégias de publicação independente na Amazon e UICLAP.</span>
               </div>
               <div className="flex items-start gap-3 text-slate-300">
                 <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                 <span><strong>Foco em Lucro Real:</strong> Mentor do ecossistema PBE, integrando autoridade de publicação com modelos escaláveis de negócios.</span>
               </div>
               <div className="flex items-start gap-3 text-slate-300">
                 <Users className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                 <span><strong>Centenas de Obras no Mercado:</strong> Dezenas de nichos validados, de especialistas a autores independentes.</span>
               </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 8. GUARANTEE SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
             <ShieldCheck className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Garantia Incondicional<br />de 7 Dias</h2>
          <p className="text-lg text-slate-400 leading-relaxed">
            Se você assistir à Masterclass, testar a ferramenta e sentir que o método não atende às suas expectativas, basta enviar um único e-mail para nossa equipe. Devolvemos 100% do seu valor pago (R$ 29,90), na hora e sem questionamentos. O risco é todo meu.
          </p>
        </div>
      </section>

      {/* 9. FAQ SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-amber-500 text-xs font-bold uppercase tracking-widest">FAQ</h3>
            <h2 className="text-3xl md:text-4xl font-extrabold">Alguma dúvida?</h2>
          </div>
          
          <div className="space-y-4">
            {[
              {
                q: "A apresentação será ao vivo?",
                a: "O acesso é imediato. Para que você não precise esperar dias por uma data na agenda, disponibilizamos a gravação oficial e completa da Masterclass diretamente na sua área de membros. Assim que a inscrição for aprovada, você pode começar a assistir imediatamente no seu próprio ritmo."
              },
              {
                q: "Vou ter acesso à gravação para rever depois?",
                a: "Sim, com certeza. O treinamento fica 100% disponível para você assistir quando, onde e quantas vezes quiser. Você poderá pausar, aplicar o passo a passo na prática e rever cada estratégia de estruturação e publicação sempre que precisar."
              },
              {
                q: "Nunca escrevi um livro antes e não me considero escritor. Isso é para mim?",
                a: "Com certeza. O Método PBE foi desenhado exatamente para quem não tem tempo a perder ou trava diante de uma folha em branco. Você não precisa de dons literários: nossa tecnologia de Inteligência Artificial orienta toda a estrutura da obra, organizando seu conhecimento e ideias do sumário à conclusão com padrão profissional de grandes editoras."
              },
              {
                q: "Como recebo o meu crédito e o acesso à Fábrica de Best Seller?",
                a: "A liberação é automática. Assim que a sua inscrição de R$ 29,90 for confirmada, você receberá por e-mail os dados de login da área de membros e as instruções para ativar o seu 1 Crédito Completo na FBS. Com ele em mãos, você já poderá dar os primeiros passos e estruturar seu livro dentro da ferramenta."
              },
              {
                q: "Como funciona a publicação na Amazon e na UICLAP? Preciso pagar impressão antecipada?",
                a: "Não, você não precisa investir em estoque. Na Masterclass, ensinamos o modelo de impressão sob demanda: seu livro é cadastrado para venda digital (eBook) e versão física impressa. Quando um leitor compra, a plataforma imprime e entrega diretamente para ele, e você recebe seus royalties limpos, sem risco financeiro com caixas de livros paradas em casa."
              },
              {
                q: "O que é o programa de Representante Afiliado Autorizado (RAA) citado no ecossistema?",
                a: "É a nossa via de monetização rápida para autores do Método PBE. Dentro do treinamento, revelaremos como nossos alunos qualificados podem se credenciar para indicar o ecossistema e a ferramenta para outros profissionais, conquistando comissões de até 60% (cerca de R$ 275 por venda). Você verá todos os critérios e o funcionamento detalhado durante a apresentação."
              },
              {
                q: "O que acontece se eu assistir e achar que não é para mim?",
                a: "O seu risco é absolutamente zero. Você tem uma Garantia Incondicional de 7 dias. Se você assistir à Masterclass, testar a ferramenta e sentir que o método não atende às suas expectativas, basta enviar um único e-mail para nossa equipe. Devolvemos 100% do seu valor pago (R$ 29,90), na hora e sem questionamentos."
              },
              {
                q: "Quais são as formas de pagamento disponíveis?",
                a: "Você pode garantir sua vaga e o seu crédito por apenas R$ 29,90 à vista via PIX (com liberação imediata) ou em até 5x de R$ 6,62 no cartão de crédito."
              }
            ].map((faq, index) => (
              <div key={index} className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
                <button 
                  className="w-full px-6 py-5 flex items-center justify-between font-bold text-left text-white hover:bg-white/5 transition-colors"
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
              className="inline-block bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-extrabold py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all transform hover:scale-[1.02]"
            >
              GARANTIR MINHA VAGA + 1 LIVRO NA FBS POR R$ 29,90
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center border-t border-white/10 bg-black text-slate-500 text-sm">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <p className="font-bold text-white mb-6">FÁBRICA DE BEST SELLER</p>
          <p>© {new Date().getFullYear()} FBS. Todos os direitos reservados.</p>
          <p className="text-xs opacity-60">
            Aviso Legal: Nenhuma informação contida neste site deve ser interpretada como uma afirmação da obtenção de resultados milagrosos. Qualquer referência ao desempenho da IA não é garantia de resultados idênticos sem o seu esforço, edição e curadoria.
          </p>
          <p className="text-xs opacity-60">
            Este site não faz parte do site do Facebook ou Facebook Inc. Além disso, este site NÃO é endossado pelo Facebook de nenhuma maneira. FACEBOOK é uma marca comercial independente da FACEBOOK, Inc.
          </p>
          <div className="flex justify-center gap-4 pt-4 text-amber-500/80 hover:text-amber-500">
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
              alt="Depoimento em tamanho amplo" 
              className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
            />
          </div>
        </div>
      )}
    </div>
  );
};
