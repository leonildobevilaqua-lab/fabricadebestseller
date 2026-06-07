import React, { useEffect, useState } from 'react';
import { AlertTriangle, Clock, ExternalLink, ArrowRight, ShieldAlert, Check, HelpCircle } from 'lucide-react';
import { trackPageView, trackInitiateCheckout } from '../services/meta-pixel';

export const PacoteRegistro: React.FC = () => {
  // Cronômetro Regressivo de 15 Minutos (900 segundos)
  const [timeLeft, setTimeLeft] = useState(15 * 60);

  useEffect(() => {
    // Rastrear visualização da página
    trackPageView();

    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleCheckoutClick = () => {
    // Rastrear início do checkout no Pixel antes de redirecionar
    trackInitiateCheckout('Pacote de Registro Completo', 49.90, 'BRL');
  };

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E8E4DC] font-sans relative overflow-x-hidden flex flex-col items-center">
      {/* Textura de Ruído (Estética Premium) */}
      <div className="absolute inset-0 noise-bg opacity-[0.015] pointer-events-none z-0" />

      {/* Efeitos de Iluminação Gradiente */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[350px] bg-yellow-500/5 rounded-full blur-[110px] pointer-events-none z-0" />

      {/* HEADER DE ATENÇÃO E URGÊNCIA */}
      <div className="w-full bg-[#1A1408] border-b border-yellow-500/20 py-4 px-4 text-center z-10 animate-fade-in">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-1">
          <div className="flex items-center gap-2 text-yellow-500 font-extrabold uppercase tracking-widest text-xs md:text-sm">
            <ShieldAlert className="w-5 h-5 text-yellow-500 animate-pulse" />
            <span>ATENÇÃO: VOCÊ ACABA DE DESBLOQUEAR UMA OFERTA ESPECIAL!</span>
          </div>
          <p className="text-xs text-slate-300 font-semibold tracking-wider uppercase">
            Esta oportunidade é única e expira em breve. Não saia desta página.
          </p>
        </div>
      </div>

      <main className="w-full max-w-4xl px-4 py-8 md:py-12 flex-grow flex flex-col items-center z-10 relative">
        {/* LOGO */}
        <div className="mb-6 hover:scale-[1.02] transition-transform duration-300">
          <img 
            src="/logo_editora.png" 
            alt="Fábrica de Best Seller" 
            className="h-12 md:h-14 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>

        {/* TÍTULO PRINCIPAL DA OFERTA */}
        <div className="text-center space-y-2 mb-8 max-w-3xl">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-1 rounded-full">
            Oferta Casada Exclusiva
          </span>
          <h1 className="font-serif text-3xl md:text-5xl font-black text-white leading-tight pt-2">
            PACOTE DE REGISTRO COMPLETO <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F0C040] via-[#EAD4A2] to-[#D4A017] drop-shadow-sm font-light italic">
              Ficha Catalográfica + Código de Barras + QR Code
            </span>
          </h1>
        </div>

        {/* CRONÔMETRO FLUTUANTE DE URGÊNCIA */}
        <div className="mb-10 bg-black/60 border border-red-500/35 px-6 py-3.5 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(239,68,68,0.1)] backdrop-blur-md animate-pulse">
          <Clock className="w-5 h-5 text-red-500" />
          <span className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-300">A oferta expira em:</span>
          <span className="text-xl font-mono font-extrabold text-red-500 tracking-wider">
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* VÍDEO DA OFERTA */}
        <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden border border-yellow-500/30 shadow-[0_0_40px_rgba(212,160,23,0.15)] bg-black mb-12 animate-fade-in-up">
          <iframe 
            src="https://www.youtube.com/embed/IxMRvvmn91E?autoplay=1" 
            title="Vídeo de Oferta Especial - Pacote de Registro"
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          />
        </div>

        {/* TABELA DE COMPARAÇÃO DE VALORES (ESTÉTICA GEOMÉTRICA) */}
        <div className="w-full max-w-3xl bg-[#121212]/90 border border-slate-800 rounded-xl p-5 md:p-8 shadow-2xl mb-10 animate-fade-in-up">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-white">
              CBL vs. Fábrica de Best Seller
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Compare quanto custaria registrar de forma tradicional e quanto você economiza conosco
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50">
                  <th className="p-3.5 font-bold text-slate-400">Serviço</th>
                  <th className="p-3.5 font-bold text-red-400">Mercado Tradicional (CBL)</th>
                  <th className="p-3.5 font-bold text-yellow-500">Fábrica de Best Seller</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-800/50 hover:bg-white/[0.01] transition-colors">
                  <td className="p-3.5 font-medium text-white">Ficha Catalográfica</td>
                  <td className="p-3.5 text-slate-400 font-mono">R$ 68,60</td>
                  <td className="p-3.5 text-yellow-500/90 font-mono font-bold">R$ 27,90</td>
                </tr>
                <tr className="border-b border-slate-800/50 hover:bg-white/[0.01] transition-colors">
                  <td className="p-3.5 font-medium text-white">Código de Barras (ISBN)</td>
                  <td className="p-3.5 text-slate-400 font-mono">R$ 41,20</td>
                  <td className="p-3.5 text-yellow-500/90 font-mono font-bold">R$ 19,90</td>
                </tr>
                <tr className="border-b border-slate-800/50 hover:bg-white/[0.01] transition-colors">
                  <td className="p-3.5 font-medium text-white">QR Code Inteligente</td>
                  <td className="p-3.5 text-slate-500 italic">Não oferecem</td>
                  <td className="p-3.5 text-yellow-500/90 font-mono font-bold">R$ 7,00</td>
                </tr>
                <tr className="bg-yellow-500/5 font-bold border-t-2 border-yellow-500/20">
                  <td className="p-3.5 text-white">TOTAL INDIVIDUAL</td>
                  <td className="p-3.5 text-red-400/90 font-mono">R$ 109,80</td>
                  <td className="p-3.5 text-yellow-500 font-mono text-base font-extrabold">R$ 54,80</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* CONTAINER DE OFERTA EXCLUSIVA (MASSIVE CALLOUT) */}
        <div className="w-full max-w-3xl bg-[#1A1408] border border-yellow-500/30 rounded-xl p-6 md:p-8 text-center shadow-[0_0_30px_rgba(212,160,23,0.08)] mb-10 animate-fade-in-up relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-500 text-black font-extrabold text-[9px] md:text-xs uppercase tracking-widest px-4 py-1.5 rounded-bl-lg shadow-md">
            Melhor Preço
          </div>

          <p className="text-xs md:text-sm font-mono font-bold text-yellow-500 uppercase tracking-widest">
            Adquirindo o pacote completo agora
          </p>

          <h3 className="text-sm md:text-base text-slate-400 font-medium mt-1">
            Você não pagará R$ 109,80 (CBL) nem R$ 54,80 (FBS Individual)...
          </h3>

          <div className="my-6">
            <span className="text-slate-500 line-through text-lg font-mono">R$ 109,80</span>
            <div className="text-4xl md:text-5xl font-black text-white tracking-tight mt-1 flex items-center justify-center gap-2">
              <span className="text-xs md:text-sm text-yellow-500 font-bold uppercase tracking-wider">Apenas</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#F0C040] to-[#D4A017]">
                R$ 49,90
              </span>
            </div>
            <p className="text-xs text-emerald-400 font-bold mt-2 flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Economia imediata de R$ 59,90 sobre a CBL</span>
            </p>
          </div>

          {/* BOTÃO CTA DA OFERTA */}
          <div className="space-y-4 max-w-md mx-auto">
            <a 
              href="https://checkout.ticto.app/OAE19BCE4" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={handleCheckoutClick}
              className="inline-flex w-full items-center justify-center gap-2.5 bg-gradient-to-b from-[#F0C040] to-[#D4A017] hover:from-[#f3c852] hover:to-[#e0ad24] text-[#1A1408] font-extrabold uppercase text-sm md:text-base tracking-wider py-4 px-8 rounded-lg shadow-xl shadow-yellow-500/10 hover:shadow-yellow-500/25 active:scale-[0.98] transition-all duration-200"
            >
              <span>GARANTIR PACOTE DE REGISTRO POR R$ 49,90</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            <p className="text-[10px] md:text-xs text-slate-500 leading-relaxed font-medium">
              Ao clicar no botão, você será direcionado para nosso checkout seguro na Ticto.
            </p>
          </div>
        </div>

        {/* NOTA DE ESPECIFICAÇÃO E URGÊNCIA */}
        <div className="w-full max-w-3xl bg-red-950/10 border border-red-500/15 rounded-xl p-5 md:p-6 text-center animate-fade-in-up">
          <div className="flex items-center justify-center gap-2 text-red-400 font-extrabold uppercase text-xs tracking-wider mb-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
            <span>INFORMAÇÃO IMPORTANTE</span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            ESTA OFERTA SÓ É VÁLIDA ENQUANTO VOCÊ ESTIVER NESTA PÁGINA. VOCÊ NÃO TERÁ DIREITO A ESTE BENEFÍCIO AO FECHAR ESTA TELA, ENTÃO, GARANTA AGORA ESTA SUPER OPORTUNIDADE.
          </p>
        </div>
      </main>

      {/* RODAPÉ SIMPLES */}
      <footer className="w-full py-8 text-center text-xs text-slate-600 border-t border-slate-900 z-10">
        <p>© {new Date().getFullYear()} Fábrica de Best Seller. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default PacoteRegistro;
