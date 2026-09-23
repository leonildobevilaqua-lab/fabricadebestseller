import React, { useEffect, useState } from 'react';
import { Calendar, Clock, BookOpen, AlertTriangle, CheckCircle, Video, Lock, ChevronRight, ChevronDown, Check, ShieldCheck, Star, Users, X } from 'lucide-react';
import { getDynamicWebinarSlots, WebinarSlotsInfo } from '../utils/timeUtils';
import { SocialProofSection } from './SocialProofSection';

export const MasterclassLaunch2: React.FC = () => {
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

        <div className="relative max-w-6xl mx-auto flex w-full z-20 py-10 lg:py-28">
          {/* Left Column - Text & CTA */}
          <div className="w-full md:w-[68%] lg:w-[65%] space-y-8 text-center md:text-left z-20">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium text-sm mb-4 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
              <BookOpen className="w-4 h-4" />
              <span>Receba acesso à FBS + Acesso à Masterclass Prática</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-400 leading-tight">
              Do Zero ao Livro Pronto para Vender na Amazon em Tempo Recorde <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">
                Sem Bloqueios e Sem Custos com Editora
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto md:mx-0 leading-relaxed drop-shadow-md">
              Descubra o passo a passo prático e use a inteligência artificial da Fábrica de Best Seller para estruturar, escrever com sua própria voz e publicar seu livro com padrão profissional.
            </p>

            {/* DYNAMIC DATE & 3-TIME-SLOT SELECTOR */}
            <div className="space-y-4 pt-4 text-left bg-black/40 md:bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md max-w-xl">
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
            
            <div className="pt-6">
              <button 
                type="button"
                onClick={handleCheckout}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all transform hover:scale-[1.02]"
              >
                GARANTIR ACESSO IMEDIATO | LOTE ESPECIAL <ChevronRight className="w-5 h-5" />
              </button>
              <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 mt-4 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-amber-500" /> Acesso Imediato à IA</span>
                <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-amber-500" /> Garantia 7 Dias</span>
                <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-amber-500" /> Compra 100% Segura</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 3. SUB-HERO (PROBLEM AGITATION) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold leading-tight">
            Seu livro pode ter um conteúdo incrível.<br />
            <span className="text-amber-500">Mas se ele ficar na gaveta, ele não existe.</span>
          </h2>
          
          <p className="text-xl text-slate-400">
            Muitos autores passam meses, ou até anos, tentando escrever. Quando terminam, descobrem que as editoras fecham as portas e o público os ignora.
          </p>
          <div className="bg-white/5 border border-amber-500/20 p-6 rounded-2xl max-w-2xl mx-auto">
            <p className="text-amber-400 font-medium text-lg">
              Se você não tem um plano estruturado para lançar, publicar de forma independente e usar a tecnologia a seu favor, o problema não é o seu livro. É a sua estratégia.
            </p>
          </div>
        </div>
      </section>

      {/* 4. PARA QUEM É (QUALIFICATION) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-amber-500 text-sm font-bold uppercase tracking-widest">Antes de continuar...</h3>
            <h2 className="text-3xl md:text-4xl font-bold">Isso é para você?</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <p className="text-slate-300">Tem uma ideia na cabeça, mas trava na hora de organizar e escrever o conteúdo.</p>
            </div>
            <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <p className="text-slate-300">Quer publicar um livro com padrão profissional de grandes editoras, sem gastar milhares de reais.</p>
            </div>
            <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <p className="text-slate-300">Já publicou antes, mas o livro está "escondido" na Amazon e não gera vendas consistentes.</p>
            </div>
            <div className="flex gap-4 items-start p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/30 transition-colors">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
              <p className="text-slate-300">Quer descobrir como a Inteligência Artificial pode multiplicar a sua velocidade de criação.</p>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <p className="text-xl text-amber-500 font-semibold">Se você se viu aqui, você precisa dessa apresentação.</p>
          </div>
        </div>
      </section>

      {/* 5. CONTEÚDO (WHAT THEY WILL LEARN) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-amber-500 text-sm font-bold uppercase tracking-widest">Conteúdo do Encontro</h3>
            <h2 className="text-3xl md:text-4xl font-bold">Você sairá com um plano prático para:</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <div className="text-amber-500 font-black text-2xl opacity-50 mt-1">01</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Estruturar a Oferta do Livro</h4>
                <p className="text-slate-400">Como encontrar um ângulo único que faça os leitores desejarem seu livro antes mesmo de lerem a primeira página.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-amber-500 font-black text-2xl opacity-50 mt-1">02</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Domínio da Fábrica de Best Seller</h4>
                <p className="text-slate-400">Veremos na prática como a IA constrói, estrutura e lapida cada capítulo para que o livro tenha a sua voz.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-amber-500 font-black text-2xl opacity-50 mt-1">03</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Design e Diagramação Express</h4>
                <p className="text-slate-400">Os segredos para ter capas que convertem e interiores perfeitamente diagramados, igual aos de livraria.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-amber-500 font-black text-2xl opacity-50 mt-1">04</div>
              <div>
                <h4 className="text-xl font-bold text-white mb-2">Posicionamento Independente</h4>
                <p className="text-slate-400">O que fazer depois do livro pronto para ele realmente vender de forma independente na Amazon e fora dela.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. OFFER & PRICING SECTION (Checkout) */}
      <section id="inscricao" className="py-20 px-4 sm:px-6 lg:px-8 relative bg-[#0a0a0a]">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent"></div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
          
          <div className="space-y-8">
            <div>
              <h3 className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-2">Acesso Exclusivo</h3>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">Não é sobre o preço.<br />É sobre dar vida ao seu livro.</h2>
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
                  <h3 className="text-lg font-semibold text-white">O Campo Magnético das Vendas</h3>
                  <p className="text-slate-400 text-sm mt-1">Livro digital com guia estratégico para transformar leitores casuais em clientes fiéis.</p>
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
                className="w-full block bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
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

      {/* 7. CASOS DE SUCESSO (SOCIAL PROOF) */}
      <SocialProofSection onSelectImage={setSelectedImage} />

      {/* 8. AUTHORITY SECTION */}
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
                <p className="text-amber-500 text-sm font-bold mt-1">Especialista & Fundador</p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-2/3 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">Quem vai apresentar?</h2>
            <p className="text-lg text-slate-300 leading-relaxed">
              Minha missão é democratizar a criação de livros de alta qualidade. Desenvolvi o ecossistema <strong>FBS - Fábrica de Best Seller</strong>, a ferramenta de inteligência artificial para que autores comuns pudessem alcançar o padrão das grandes editoras.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              Nesta apresentação, vou abrir a "caixa preta" do processo. Vou mostrar a você não apenas como escrever usando IA, mas como pensar de forma estratégica para que o seu livro não seja apenas mais um na estante, e sim um material lido, desejado e lembrado.
            </p>
            
            <div className="pt-6 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="flex items-center gap-3 text-slate-300">
                 <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                 <span>Especialista em Publicação</span>
               </div>
               <div className="flex items-center gap-3 text-slate-300">
                 <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                 <span>Criador da FBS (Fábrica de Best Seller)</span>
               </div>
               <div className="flex items-center gap-3 text-slate-300">
                 <CheckCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                 <span>Foco em Resultado e Alta Qualidade</span>
               </div>
               <div className="flex items-center gap-3 text-slate-300">
                 <Users className="w-5 h-5 text-amber-500 flex-shrink-0" />
                 <span>Centenas de autores impactados</span>
               </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 9. GUARANTEE SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto border border-green-500/20">
             <ShieldCheck className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">Garantia incondicional<br />de 7 dias</h2>
          <p className="text-lg text-slate-400">
            Se você sentir que o conteúdo da apresentação não é para você ou que a ferramenta da Fábrica não vai ajudar no seu projeto, basta enviar um único email. Devolvemos 100% do seu investimento, sem perguntas e sem burocracia. O risco é todo meu.
          </p>
        </div>
      </section>

      {/* 10. FAQ SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-[#0a0a0a] pb-32 md:pb-20">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-amber-500 text-sm font-bold uppercase tracking-widest">FAQ</h3>
            <h2 className="text-3xl md:text-4xl font-bold">Alguma dúvida?</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "Nunca escrevi nada, consigo acompanhar?", a: "Sim. O método foi desenvolvido justamente para quem não sabe por onde começar. A ferramenta guia você respondendo perguntas simples sobre a sua ideia, e a IA faz a estruturação lógica do conteúdo." },
              { q: "O livro gerado por IA não fica robótico ou genérico?", a: "Não. A Fábrica de Best Seller utiliza prompts proprietários treinados com técnicas de storytelling e retenção editorial. Além disso, você aprende na masterclass a injetar o seu próprio tom de voz e vivência." },
              { q: "O que acontece se eu não puder assistir ao vivo?", a: "Sem problemas. Todos os inscritos receberão acesso à gravação completa em alta definição para assistir no seu próprio ritmo, além de poderem usar o crédito da ferramenta a qualquer momento." },
              { q: "Como vou acessar a Fábrica de Best Seller?", a: "O seu crédito bônus será ativado na plataforma assim que sua compra for confirmada, permitindo que você inicie o projeto do seu livro imediatamente." }
            ].map((faq, index) => (
              <div key={index} className="border border-white/10 rounded-xl bg-white/5 overflow-hidden">
                <button 
                  className="w-full px-6 py-4 flex items-center justify-between font-semibold text-left hover:bg-white/5 transition-colors"
                  onClick={() => toggleFaq(index)}
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-amber-500 transition-transform ${openFaq === index ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === index && (
                  <div className="px-6 py-4 border-t border-white/10 text-slate-400 bg-black/20">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center pt-8 hidden md:block">
            <button 
              type="button"
              onClick={handleCheckout}
              className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 px-8 rounded-xl transition-colors"
            >
              Quero Garantir Minha Vaga
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 text-center border-t border-white/10 bg-black text-slate-400 text-sm pb-24 md:pb-12">
        <div className="max-w-4xl mx-auto px-4 space-y-4">
          <p className="font-bold text-white mb-6">FÁBRICA DE BEST SELLER</p>
          <p className="opacity-80">© {new Date().getFullYear()} FBS. Todos os direitos reservados.</p>
          <p className="text-xs opacity-75">
            Aviso Legal: Nenhuma informação contida neste site deve ser interpretada como uma afirmação da obtenção de resultados milagrosos. Qualquer referência ao desempenho da IA não é garantia de resultados idênticos sem o seu esforço, edição e curadoria.
          </p>
          <p className="text-xs opacity-75">
            Este site não faz parte do site do Facebook ou Facebook Inc. Além disso, este site NÃO é endossado pelo Facebook de nenhuma maneira. FACEBOOK é uma marca comercial independente da FACEBOOK, Inc.
          </p>
          <div className="flex justify-center gap-4 pt-4 text-amber-500 hover:text-amber-400">
            <a href="/terms" className="hover:underline">Termos de Uso</a>
            <span>|</span>
            <a href="/privacy-policy" className="hover:underline">Política de Privacidade</a>
          </div>
        </div>
      </footer>

      {/* MOBILE STICKY CTA */}
      <div className={`md:hidden fixed bottom-0 left-0 w-full p-4 bg-[#0a0a0a]/95 backdrop-blur-md border-t border-white/10 z-50 transition-transform duration-300 ${showSticky ? 'translate-y-0' : 'translate-y-full'}`}>
        <button 
          type="button"
          onClick={handleCheckout}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 text-white font-bold text-lg py-3 px-6 rounded-xl shadow-[0_0_15px_rgba(34,197,94,0.3)]"
        >
          Garantir Vaga por R$ 29,90 <ChevronRight className="w-5 h-5" />
        </button>
      </div>

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
