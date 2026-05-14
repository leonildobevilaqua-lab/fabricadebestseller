import React, { useEffect } from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';
import { 
  ArrowRight, 
  BookOpen, 
  CheckCircle2, 
  Cpu, 
  Database, 
  Download, 
  Globe, 
  History, 
  Layers, 
  Play, 
  Rocket, 
  ShieldCheck, 
  Star, 
  TrendingUp, 
  Zap,
  Box,
  Monitor,
  Activity,
  Award,
  Search
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
};

const stagger = {
  whileInView: { transition: { staggerChildren: 0.1 } }
};

interface SalesLandingProps {
  onLoginClick: () => void;
}

export const SalesLandingV6: React.FC<SalesLandingProps> = ({ onLoginClick }) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-[#020617] text-white font-outfit selection:bg-cyan-500 selection:text-white overflow-x-hidden">
      {/* Cinematic Background Overlay */}
      <div className="fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[url('/assets/futuristic_factory_bg.png')] bg-cover bg-center opacity-10 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-transparent to-[#020617]" />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
      </div>

      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-600 z-[100] origin-left" 
        style={{ scaleX }} 
      />

      {/* Header */}
      <header className="relative z-[100] flex justify-between items-center px-6 py-4 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                <Box className="text-white w-6 h-6" />
            </div>
            <span className="font-black text-xl tracking-tighter uppercase italic">Fábrica <span className="text-cyan-400">Best Seller</span></span>
        </div>
        <button 
          onClick={onLoginClick}
          className="bg-white/5 hover:bg-white/10 text-cyan-400 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border border-cyan-500/20 shadow-[0_0_10px_rgba(34,211,238,0.1)]"
        >
          Acesso Operador
        </button>
      </header>

      {/* Floating CTA (Mobile Fixed) */}
      <div className="fixed bottom-6 left-6 right-6 z-50 md:hidden">
        <a 
          href="https://payment.ticto.app/O6CE296D4"
          className="flex items-center justify-center gap-2 sm:gap-3 bg-gradient-to-r from-cyan-500 to-blue-600 p-4 rounded-xl font-black text-sm sm:text-lg shadow-[0_10px_30px_rgba(34,211,238,0.4)] active:scale-95 transition-transform"
        >
          <Zap className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
          ATIVAR MEU CRÉDITO
        </a>
      </div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-4 pt-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1 }}
                className="text-center lg:text-left flex flex-col items-center lg:items-start"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/5 text-cyan-400 text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-6">
                    <Activity className="w-3 h-3 animate-pulse flex-shrink-0" />
                    <span className="truncate">SISTEMA 100% AUTOMATIZADO</span>
                </div>

                <h1 className="text-5xl sm:text-6xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter">
                    A PRIMEIRA <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 block sm:inline">FÁBRICA</span> DE BEST SELLERS <span className="italic">AI-DRIVEN</span>
                </h1>

                <p className="text-lg sm:text-xl md:text-2xl text-slate-400 font-medium mb-10 max-w-xl leading-relaxed mx-auto lg:mx-0">
                    Transformamos nichos em livros de <span className="text-white font-bold italic">170+ páginas</span> com diagramação profissional em apenas 30 minutos. 
                    <span className="block mt-4 text-cyan-400 font-bold">Sem escrever uma única linha.</span>
                </p>

                <div className="flex flex-col xl:flex-row gap-4 w-full">
                    <a 
                        href="https://payment.ticto.app/O6CE296D4"
                        className="group flex items-center justify-center gap-4 bg-white text-black px-6 sm:px-10 py-5 rounded-2xl font-black text-lg sm:text-xl hover:bg-cyan-400 transition-all duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)] w-full xl:w-auto"
                    >
                        INICIAR PRODUÇÃO
                        <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                    </a>
                    <div className="flex items-center justify-center gap-4 px-6 py-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm w-full xl:w-auto">
                        <div className="flex -space-x-2">
                            {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#020617] bg-slate-800" />)}
                        </div>
                        <div className="text-xs text-left">
                            <div className="font-bold text-white">+1.200 LIVROS</div>
                            <div className="text-slate-500 italic uppercase tracking-tighter">Gerados este mês</div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(34,211,238,0.3)] border border-white/10 z-20"
            >
                <div className="absolute inset-0 bg-cyan-500/20 animate-pulse pointer-events-none" />
                <iframe 
                    className="w-full h-full relative z-10"
                    src="https://www.youtube.com/embed/U9tLQR9XKrY?start=17&autoplay=0&rel=0&modestbranding=1" 
                    title="Como a Fábrica Funciona"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                />
            </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="mt-20 animate-bounce">
            <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center p-1">
                <div className="w-1 h-2 bg-cyan-400 rounded-full" />
            </div>
        </div>
      </section>

      {/* Authority Section (The Architect) */}
      <section className="relative z-10 py-32 px-4 bg-slate-900/40 backdrop-blur-sm border-y border-white/5">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <motion.div {...fadeInUp} className="relative order-2 md:order-1">
                <div className="absolute inset-0 bg-blue-600/20 blur-[80px] rounded-full" />
                <div className="relative rounded-[40px] overflow-hidden border border-white/10 shadow-2xl">
                    <img 
                        src="/assets/leonildo_real.png" 
                        alt="Leonildo Bevilaqua" 
                        className="w-full h-auto object-cover object-top max-h-[600px]"
                    />
                    <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                        <div className="text-3xl font-black italic">Leonildo Bevilaqua</div>
                        <div className="text-cyan-400 font-bold text-sm uppercase tracking-[0.2em] mt-1">Estrategista de Ativos Digitais</div>
                    </div>
                </div>
            </motion.div>

            <motion.div {...fadeInUp} className="order-1 md:order-2">
                <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight italic">
                    CONHEÇA O ARQUITETO POR TRÁS DA <span className="text-cyan-400">FÁBRICA.</span>
                </h2>
                <div className="space-y-6 text-xl text-slate-400 leading-relaxed">
                    <p>
                        Leonildo Bevilaqua é o criador da <span className="text-white font-bold">Fábrica de Best Seller</span> e da Fórmula de Crescimento Online.
                    </p>
                    <p>
                        Formado pela prestigiada <span className="text-white border-b-2 border-cyan-500/30 italic">Digital Marketer do Texas (EUA)</span>, ele trouxe a engenharia reversa de mercado para o mundo editorial.
                    </p>
                    <div className="grid grid-cols-2 gap-6 pt-6">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-3xl font-black text-cyan-400">+1.200</div>
                            <div className="text-xs uppercase font-bold tracking-widest mt-1 text-slate-500">Livros Entregues</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <div className="text-3xl font-black text-blue-500">7 DIAS</div>
                            <div className="text-xs uppercase font-bold tracking-widest mt-1 text-slate-500">Garantia Total</div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
      </section>

      {/* The Machine (Process) */}
      <section className="relative z-10 py-32 px-4">
        <div className="max-w-7xl mx-auto text-center mb-20">
            <h2 className="text-4xl md:text-7xl font-black mb-6 uppercase italic">Engenharia de <span className="text-cyan-400">Alta Performance</span></h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
                Nossa IA não apenas "escreve". Ela mimetiza o processo de um autor veterano através de 12 camadas de profundidade.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
                {
                    step: "01",
                    title: "MINERAÇÃO DE DADOS",
                    desc: "Varredura em tempo real no Google e YouTube para identificar o que seu público-alvo está pesquisando agora.",
                    icon: <Search className="w-8 h-8" />
                },
                {
                    step: "02",
                    title: "ENGENHARIA REVERSA",
                    desc: "Análise estrutural dos 10 maiores Best Sellers do seu nicho na Amazon para replicar o DNA do sucesso.",
                    icon: <Layers className="w-8 h-8" />
                },
                {
                    step: "03",
                    title: "CONSTRUÇÃO MOLECULAR",
                    desc: "Geração de conteúdo denso (170+ págs) com ritmo autoral, diagramação e kit de publicação prontos.",
                    icon: <Rocket className="w-8 h-8" />
                }
            ].map((item, i) => (
                <motion.div 
                    key={i}
                    {...fadeInUp}
                    transition={{ delay: i * 0.2 }}
                    className="group relative p-12 rounded-[3rem] bg-white/5 border border-white/10 hover:border-cyan-500/50 transition-all duration-500 overflow-hidden"
                >
                    <div className="absolute -top-4 -right-4 text-9xl font-black text-white/[0.03] italic">{item.step}</div>
                    <div className="mb-8 text-cyan-400 group-hover:scale-110 transition-transform duration-500">{item.icon}</div>
                    <h3 className="text-2xl font-black mb-4 italic uppercase">{item.title}</h3>
                    <p className="text-slate-400 leading-relaxed">{item.desc}</p>
                </motion.div>
            ))}
        </div>
      </section>

      {/* Pricing Section (The Activate Module) */}
      <section className="relative z-10 py-20 md:py-32 px-4 text-center">
        <div className="max-w-4xl mx-auto">
            <motion.div 
                {...fadeInUp}
                className="relative p-8 sm:p-12 md:p-16 rounded-[2rem] md:rounded-[4rem] bg-gradient-to-b from-white/10 to-transparent border border-white/10 backdrop-blur-2xl shadow-[0_0_100px_rgba(34,211,238,0.1)] overflow-hidden"
            >
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
                
                <p className="text-slate-500 font-bold uppercase tracking-[0.1em] sm:tracking-[0.3em] mb-4 text-xs sm:text-base">CRÉDITO DE GERAÇÃO AUTORAL</p>
                
                <div className="flex items-center justify-center gap-4 mb-2">
                    <span className="text-slate-500 line-through text-lg sm:text-2xl">R$ 97,00</span>
                    <div className="bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded text-[10px] font-black uppercase">OFERTA DE ATIVAÇÃO</div>
                </div>

                <div className="text-6xl sm:text-8xl md:text-[10rem] font-black leading-none mb-6 tracking-tighter italic">
                    R$ <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500">39,90</span>
                </div>

                <p className="text-lg md:text-2xl text-slate-300 mb-10 font-bold max-w-2xl mx-auto italic">
                    Esse valor equivale a <span className="text-cyan-400">1 Crédito</span>. Com ele você tem o direito de gerar <span className="text-white">1 Livro Inédito</span> com diagramação completa.
                </p>

                <a 
                    href="https://payment.ticto.app/O6CE296D4"
                    className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 bg-cyan-500 text-[#020617] px-6 sm:px-16 py-6 sm:py-8 rounded-full font-black text-xl sm:text-3xl shadow-[0_20px_50px_rgba(34,211,238,0.4)] hover:scale-105 active:scale-95 transition-all duration-300 w-full sm:w-auto"
                >
                    <span className="text-center">ATIVAR MEU CRÉDITO</span>
                    <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10" />
                </a>


                <div className="mt-12 flex flex-wrap justify-center gap-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                    <div className="flex items-center gap-2"><ShieldCheck className="text-cyan-500 w-4 h-4" /> 7 Dias de Garantia</div>
                    <div className="flex items-center gap-2"><Download className="text-cyan-500 w-4 h-4" /> Acesso Instantâneo</div>
                    <div className="flex items-center gap-2"><Star className="text-cyan-500 w-4 h-4" /> Satisfação Blindada</div>
                </div>
            </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-20 px-4 border-t border-white/5 bg-[#020617] text-center">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center">
                    <Box className="text-white w-5 h-5" />
                </div>
                <span className="font-black text-lg tracking-tighter uppercase italic">Fábrica <span className="text-cyan-400">Best Seller</span></span>
            </div>
            <p className="text-slate-600 font-medium mb-4">© 2024 Leonildo Bevilaqua. Desenvolvido para autores que dominam o futuro.</p>
            <div className="flex justify-center gap-8 font-bold text-xs uppercase tracking-widest text-slate-500">
                <a href="/terms" className="hover:text-cyan-400 transition-colors">Termos</a>
                <a href="/privacy" className="hover:text-cyan-400 transition-colors">Privacidade</a>
            </div>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
