import React, { useEffect } from 'react';
import { AlertTriangle, ExternalLink, ArrowRight, MessageSquare, BookOpen, UserCheck } from 'lucide-react';
import { trackPageView, trackPurchase, setAdvancedMatching } from '../services/meta-pixel';

export const Obrigado: React.FC = () => {
  useEffect(() => {
    // 1. Enviar PageView para a rota de obrigado
    trackPageView();

    // 2. Tentar capturar parâmetros da URL passados pela Ticto
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email') || params.get('email_cus') || params.get('cus_email') || params.get('emailCus');
    const priceStr = params.get('price') || params.get('amount') || params.get('value') || params.get('price_str');
    const transactionId = params.get('transaction') || params.get('tid') || params.get('reference');

    // Evitar disparar múltiplos Purchases em recarregamento de página usando sessionStorage
    const alreadyTracked = sessionStorage.getItem('bsf_purchase_tracked');

    if (!alreadyTracked) {
      // Configurar advanced matching se o email estiver presente
      if (email) {
        setAdvancedMatching(email);
      }

      // Disparar o evento de Compra (Purchase)
      const purchaseValue = priceStr ? parseFloat(priceStr) : 97.00; // Valor padrão se não vier na URL
      trackPurchase(purchaseValue, 'BRL', 'Acesso Fábrica de Best Seller', transactionId || undefined);
      
      // Marcar como rastreado nesta sessão
      sessionStorage.setItem('bsf_purchase_tracked', 'true');
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-[#E8E4DC] font-sans relative overflow-x-hidden flex flex-col items-center">
      {/* Textura de Ruído de Fundo (Estética Premium) */}
      <div className="absolute inset-0 noise-bg opacity-[0.015] pointer-events-none z-0" />

      {/* Gradientes Suaves de Fundo */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-20 left-1/4 w-[400px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* BANNER DE ATENÇÃO (Cabeçalho de Alerta) */}
      <div className="w-full bg-[#1A1408] border-b border-yellow-500/20 py-4 px-4 text-center z-10 animate-fade-in">
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center">
          <div className="flex items-center gap-2 text-yellow-500 font-extrabold uppercase tracking-widest text-sm md:text-base">
            <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse" />
            <span>ATENÇÃO! NÃO FECHE ESTA TELA AINDA!</span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-1 uppercase font-semibold tracking-wider">
            Assista ao vídeo de orientação abaixo para receber seus acessos e instruções.
          </p>
        </div>
      </div>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="w-full max-w-4xl px-4 py-8 md:py-12 flex-grow flex flex-col items-center z-10 relative pt-12 md:pt-16">
        {/* TÍTULO PRINCIPAL */}
        <h1 className="text-center font-serif text-3xl md:text-5xl font-bold tracking-tight text-white mb-8 max-w-3xl leading-tight">
          Parabéns pela sua compra! <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F0C040] via-[#EAD4A2] to-[#D4A017] drop-shadow-sm font-light italic">
            Seu livro está cada vez mais perto.
          </span>
        </h1>

        {/* CONTÊINER DO VÍDEO COM BRILHO DOURADO */}
        <div className="w-full max-w-3xl aspect-video rounded-xl overflow-hidden border border-yellow-500/30 shadow-[0_0_40px_rgba(212,160,23,0.15)] bg-black mb-12 animate-fade-in-up relative group">
          <iframe 
            src="https://www.youtube.com/embed/yDv1sMotQgI?autoplay=1" 
            title="Vídeo de Orientação - Fábrica de Best Seller"
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowFullScreen
          />
        </div>

        {/* SEÇÃO DOS PASSOS / BOTÕES */}
        <div className="w-full max-w-3xl space-y-6 md:space-y-8 animate-fade-in-up">
          <div className="text-center mb-6">
            <h2 className="text-lg md:text-xl font-bold uppercase tracking-wider text-slate-300">
              Siga os passos abaixo para começar
            </h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-2" />
          </div>

          {/* PASSO 1: TICTO */}
          <div className="bg-[#121212]/90 border border-slate-800 rounded-xl p-5 md:p-6 transition-all duration-300 hover:border-yellow-500/30 hover:bg-[#151515]/95 shadow-md flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="bg-[#1A1408] border border-yellow-500/30 rounded-lg p-3 flex-shrink-0 flex items-center justify-center text-yellow-500 w-12 h-12">
              <UserCheck className="w-6 h-6" />
            </div>
            <div className="flex-grow space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-yellow-500 tracking-widest uppercase">Passo 1</span>
                <h3 className="text-lg font-bold text-white leading-tight">Área de Membros Ticto</h3>
              </div>
              
              <a 
                href="https://leonildobevilaqua.ticto.club/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-gradient-to-b from-[#F0C040] to-[#D4A017] hover:from-[#f3c852] hover:to-[#e0ad24] text-[#1A1408] font-extrabold uppercase text-xs md:text-sm tracking-wider py-3 px-6 rounded-md shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 active:scale-[0.98] transition-all duration-200"
              >
                <span>Acessar Área de Membros na Ticto</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <p className="text-xs md:text-sm text-slate-400 leading-relaxed pt-1">
                Acesse e informe o mesmo e-mail que utilizou para comprar o crédito para gerar seu livro na Fábrica de Best Seller.
              </p>
            </div>
          </div>

          {/* PASSO 2: FÁBRICA DE BEST SELLER */}
          <div className="bg-[#121212]/90 border border-slate-800 rounded-xl p-5 md:p-6 transition-all duration-300 hover:border-yellow-500/30 hover:bg-[#151515]/95 shadow-md flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="bg-[#1A1408] border border-yellow-500/30 rounded-lg p-3 flex-shrink-0 flex items-center justify-center text-yellow-500 w-12 h-12">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-grow space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-yellow-500 tracking-widest uppercase">Passo 2</span>
                <h3 className="text-lg font-bold text-white leading-tight">Painel do Escritor</h3>
              </div>
              
              <a 
                href="https://fabricadebestseller.com.br/login" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-gradient-to-b from-[#F0C040] to-[#D4A017] hover:from-[#f3c852] hover:to-[#e0ad24] text-[#1A1408] font-extrabold uppercase text-xs md:text-sm tracking-wider py-3 px-6 rounded-md shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 active:scale-[0.98] transition-all duration-200"
              >
                <span>Acessar a Fábrica de Best Seller</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <p className="text-xs md:text-sm text-slate-400 leading-relaxed pt-1">
                Acesse e informe o mesmo e-mail que utilizou para comprar o crédito para gerar seu livro na Fábrica de Best Seller.
              </p>
            </div>
          </div>

          {/* PASSO 3: GRUPO WHATSAPP */}
          <div className="bg-[#121212]/90 border border-slate-800 rounded-xl p-5 md:p-6 transition-all duration-300 hover:border-green-500/30 hover:bg-[#151515]/95 shadow-md flex flex-col md:flex-row items-start md:items-center gap-5">
            <div className="bg-green-950/40 border border-green-500/35 rounded-lg p-3 flex-shrink-0 flex items-center justify-center text-green-450 w-12 h-12">
              <MessageSquare className="w-6 h-6 text-green-400" />
            </div>
            <div className="flex-grow space-y-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-green-400 tracking-widest uppercase">Passo 3</span>
                <h3 className="text-lg font-bold text-white leading-tight">Comunidade & Modelos Reais</h3>
              </div>
              
              <a 
                href="https://chat.whatsapp.com/GZrrpmLXD91J5lAjhgv9Jr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex w-full md:w-auto items-center justify-center gap-2 bg-gradient-to-b from-green-500 to-green-650 hover:from-green-450 hover:to-green-600 text-white font-extrabold uppercase text-xs md:text-sm tracking-wider py-3 px-6 rounded-md shadow-lg shadow-green-500/10 hover:shadow-green-500/20 active:scale-[0.98] transition-all duration-200 border border-green-450/20"
              >
                <span>Entre no Grupo VIP do WhatsApp</span>
                <MessageSquare className="w-4 h-4" />
              </a>

              <p className="text-xs md:text-sm text-slate-400 leading-relaxed pt-1">
                Acesse agora o grupo do WhatsApp da Fábrica de Best Seller, vá na descrição do grupo e clique no link do Google Drive para ver o modelo real de livro gerado pela Fábrica de Best Seller, tanto para a versão impressa quanto para ebook.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* NOTA DE SEGURANÇA */}
      <footer className="w-full py-8 text-center text-xs text-slate-600 border-t border-slate-900 z-10">
        <p>© {new Date().getFullYear()} Fábrica de Best Seller. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default Obrigado;
