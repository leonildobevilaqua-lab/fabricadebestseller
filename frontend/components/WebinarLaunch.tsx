import React, { useEffect, useState } from 'react';
import { Calendar, Clock, BookOpen, AlertTriangle, CheckCircle, Video, Lock, ChevronRight, ChevronDown, Check, ShieldCheck, Star, Users } from 'lucide-react';

export const WebinarLaunch: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scarcity scroll effect
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
      <header className="relative overflow-hidden px-4 sm:px-6 lg:px-8 min-h-[85vh] flex items-center">
        {/* Background image & gradient overlays */}
        <div className="absolute inset-0 bg-[url('https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/c9d8ecf8-037b-4369-9da5-f65483c55b2f/id-preview-466dbbd5--e4d091a5-d542-4a0e-874e-c767d3340964.lovable.app-1772137611340.png')] bg-cover bg-center opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] z-0"></div>
        
        {/* Right Author Image (Absolute positioned for professional blend) */}
        <div className="absolute bottom-0 right-0 w-full md:w-[55%] lg:w-[50%] h-full z-0 hidden md:flex justify-end items-end overflow-hidden pointer-events-none">
           {/* Subtle glow behind the author */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-amber-500/10 blur-[120px] rounded-full"></div>
           <img 
              src="/assets/landing/f7acb9e3-2a41-4762-9ea4-679816fcb72a.jpeg" 
              alt="Leonildo Bevilaqua" 
              className="object-cover object-center w-full h-full z-10"
           />
           {/* Fade at the bottom to blend seamlessly */}
           <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/80 to-transparent z-20"></div>
           {/* Fade on the left to blend with text */}
           <div className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-[#0a0a0a] to-transparent z-20"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto flex w-full z-10 py-20 lg:py-28">
          {/* Left Column - Text & CTA */}
          <div className="w-full md:w-[65%] lg:w-[60%] space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-medium text-sm mb-4">
              <Video className="w-4 h-4" />
              <span>Apresentação Completa e Exclusiva</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-400 leading-tight">
              Descubra o Método Exato para <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-600">
                Criar e Lançar seu Livro
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto md:mx-0 leading-relaxed">
              Participe de um encontro intenso onde revelarei os bastidores da <strong>Fábrica de Best Seller</strong>. O passo a passo para transformar sua ideia em um livro desejado, lucrativo e de altíssima qualidade.
            </p>

            {/* DATE & TIME BADGE */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 pt-6">
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-xl backdrop-blur-sm">
                <Calendar className="w-6 h-6 text-amber-500" />
                <div className="text-left">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Quando</p>
                  <p className="text-lg font-bold text-white">Quinta-feira</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-xl backdrop-blur-sm">
                <Clock className="w-6 h-6 text-amber-500" />
                <div className="text-left">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Horário</p>
                  <p className="text-lg font-bold text-white">Às 19:30 (Brasília)</p>
                </div>
              </div>
            </div>
            
            <div className="pt-8">
              <a href="#inscricao" className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-lg py-4 px-10 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all transform hover:scale-[1.02]">
                GARANTIR MINHA VAGA | LOTE ESPECIAL <ChevronRight className="w-5 h-5" />
              </a>
              <p className="text-xs text-slate-500 mt-3 text-center md:text-left pl-2">97% dos ingressos do lote especial vendidos.</p>
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
          
          {/* O que você vai levar */}
          <div className="space-y-8">
            <div>
              <h3 className="text-amber-500 text-sm font-bold uppercase tracking-widest mb-2">Acesso Exclusivo</h3>
              <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">Não é sobre o preço.<br />É sobre dar vida ao seu livro.</h2>
            </div>
            
            <ul className="space-y-6">
              <li className="flex gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Video className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Acesso à Apresentação</h3>
                  <p className="text-slate-400 mt-1">Acesso completo ao conteúdo onde eu detalho todo o processo de criação de um Livro Profissional, passo a passo.</p>
                </div>
              </li>
              
              <li className="flex gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-bold px-2 py-1 uppercase rounded-bl-lg">Bônus Especial</div>
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <BookOpen className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-amber-400">1 Crédito na Fábrica</h3>
                  <p className="text-slate-300 mt-1">Ao garantir seu ingresso, você ganha 1 crédito para gerar um livro completo utilizando a inteligência artificial da Fábrica de Best Seller.</p>
                </div>
              </li>
            </ul>
          </div>

          {/* Checkout Card */}
          <div className="bg-gradient-to-b from-slate-900 to-black border border-white/10 rounded-3xl p-8 relative shadow-2xl shadow-amber-900/10">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-black font-bold uppercase tracking-widest text-xs px-4 py-1 rounded-full shadow-lg whitespace-nowrap">
              Oferta Limitada
            </div>
            
            <div className="text-center space-y-6 pt-4">
              <div>
                <p className="text-slate-400 text-sm line-through">De: R$ 97,00</p>
                <div className="flex items-end justify-center gap-2 mt-2">
                  <span className="text-xl font-medium text-slate-300">Por apenas:</span>
                  <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-500">R$ 29,90</span>
                </div>
                <p className="text-amber-500/80 text-sm font-medium mt-2">1º Lote. O preço subirá para R$ 49,90 em breve.</p>
              </div>

              <a 
                href="#"
                className="w-full block bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-bold text-lg py-4 px-8 rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] transition-all transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="flex items-center justify-center gap-2">
                  Garantir Minha Vaga Agora <ChevronRight className="w-5 h-5" />
                </div>
              </a>

              <div className="flex items-center justify-center gap-4 text-xs font-medium text-slate-400">
                <div className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-500" /> Pagamento Seguro</div>
                <div className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-emerald-500" /> Garantia 7 dias</div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* 7. CASOS DE SUCESSO (SOCIAL PROOF) */}
      <section className="py-20 border-t border-white/10 bg-black overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 mb-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Autores comuns.<br /><span className="text-amber-500">Resultados fora do comum.</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">O que eles têm em comum não é apenas talento, mas acesso à ferramenta e estratégia certas.</p>
          </div>
        </div>
          
        <div className="relative w-full flex overflow-hidden group">
          <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none"></div>
          <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none"></div>
          
          <div className="flex animate-scroll-slow items-center w-max flex-nowrap">
            {[1, 2].map((loop) => (
              <div key={`loop-${loop}`} className="flex items-center gap-6 px-3 flex-shrink-0 min-w-max">
                {[
                  { img: "1 – A Chama Inextinguível - Ap. Custodio Ignacio.jpg", title: "A Chama Inextinguível", desc: "Ap. Custodio Ignacio" },
                  { img: "2 – O Campo Magnético das Vendas - Leonildo Bevilaqua.png", title: "O Campo Magnético das Vendas", desc: "Leonildo Bevilaqua" },
                  { img: "3 – A Ilusão da Cor - Edinaldo Pereira da Silva.png", title: "A Ilusão da Cor", desc: "Edinaldo Pereira da Silva" },
                  { img: "4 – A Nova Educação – Moisés Allaion Ferreira.jpg", title: "A Nova Educação", desc: "Moisés Allaion Ferreira" },
                  { img: "5 – O Mapa Secreto da Puberdade – Tânia Garcia.jpg", title: "O Mapa Secreto da Puberdade", desc: "Tânia Garcia" },
                  { img: "6 – Memorize de Forma Inteligente, Não Árdua! – Prof. Carlos André.png", title: "Memorize de Forma Inteligente, Não Árdua!", desc: "Prof. Carlos André" },
                  { img: "7 – 3 Minutos de Silêncio – Aline Tanaka.png", title: "3 Minutos de Silêncio", desc: "Aline Tanaka" },
                  { img: "8 – Autodefesa é para Todos – Flávio Almeida.png", title: "Autodefesa é para Todos", desc: "Flávio Almeida" },
                  { img: "9 – A Rosa e o Cravo – Solange Cristina Leandrin Betiate.png", title: "A Rosa e o Cravo", desc: "Solange Cristina Leandrin Betiate" },
                  { img: "10 – Crianças do Amanhã – Carlos Bueno.png", title: "Crianças do Amanhã", desc: "Carlos Bueno" }
                ].map((author, index) => (
                  <div key={index} className="w-64 sm:w-72 bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative group-hover/card flex-shrink-0">
                    <div className="aspect-[3/4] relative flex items-center justify-center bg-slate-900">
                      <img 
                        src={`/assets/${author.img}`} 
                        alt={author.title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"></div>
                      
                      {/* Text info */}
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-[#0a0a0a]">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-amber-500 text-sm font-bold uppercase tracking-widest">FAQ</h3>
            <h2 className="text-3xl md:text-4xl font-bold">Alguma dúvida?</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "A apresentação será ao vivo?", a: "Sim! Teremos um momento exclusivo de interação para você extrair o máximo de conhecimento." },
              { q: "Vai ficar gravado?", a: "Sim, os alunos inscritos receberão acesso à gravação para revisar o plano estratégico quando quiserem." },
              { q: "Nunca escrevi um livro antes. Isso é para mim?", a: "Totalmente. Vamos mostrar como a Inteligência Artificial pode destravar suas ideias e te ajudar a estruturar um livro do zero absoluto." },
              { q: "Como vou acessar a Fábrica de Best Seller?", a: "O seu crédito bônus será ativado na plataforma assim que sua compra for confirmada, permitindo que você inicie o projeto do seu livro." }
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

          <div className="text-center pt-8">
            <a href="#inscricao" className="inline-block bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 px-8 rounded-xl transition-colors">
              Quero Garantir Minha Vaga
            </a>
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
    </div>
  );
};

