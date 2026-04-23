import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Download, 
  Gift, 
  Layout, 
  Monitor, 
  Palette, 
  ShieldCheck, 
  Sparkles, 
  Star, 
  Zap,
  BookOpen,
  MousePointer2
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
};

export const ProfessionalCoverLanding: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-deep-charcoal text-white font-outfit selection:bg-cyber-gold selection:text-black overflow-x-hidden">
      
      {/* Sticky Timer Bar */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-signal-orange text-white py-2 text-center font-black flex items-center justify-center gap-4 text-sm md:text-base">
        <Clock className="w-5 h-5 animate-pulse" />
        OFERTA POR TEMPO LIMITADÍSSIMO: {formatTime(timeLeft)}
        <span className="hidden md:inline">— APROVEITE O DESCONTO DE 50%</span>
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4">
        <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
          <img src="/assets/hero_bg.png" alt="" className="w-full h-full object-cover" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-gold/30 bg-cyber-gold/5 text-cyber-gold text-sm font-bold uppercase tracking-widest mb-8"
          >
            <Palette className="w-4 h-4" />
            Domine o Design de Livros
          </motion.div>

          <motion.h1 
            {...fadeInUp}
            className="text-4xl md:text-7xl font-black mb-8 leading-[0.95] tracking-tight"
          >
            Crie Capas Profissionais do Zero e <span className="text-cyber-gold">Economize R$ 250+</span> por Projeto
          </motion.h1>

          <motion.p 
            {...fadeInUp}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-2xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            Aprenda o método "Faça Você Mesmo" para construir capas prontas para <span className="text-white font-bold">Amazon e UICLAP</span>. Tudo o que você precisa: Capa, Contra-Capa, Lombada e Orelhas.
          </motion.p>

          <motion.div 
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            className="relative max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black group"
          >
            {/* Placeholder for Video/Visual */}
            <img 
              src="/assets/cover_course_mockup.png" 
              alt="Curso Capa Profissional" 
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
              <div className="w-20 h-20 bg-cyber-gold rounded-full flex items-center justify-center shadow-2xl animate-bounce">
                <Zap className="w-10 h-10 text-black fill-black" />
              </div>
            </div>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ delay: 0.3 }} className="mt-16">
            <a 
              href="https://payment.ticto.app/O6FA2355C"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex flex-col md:flex-row items-center gap-6 bg-white text-black px-12 py-6 rounded-2xl font-black text-2xl hover:bg-cyber-gold transition-all duration-500 shadow-[0_20px_50px_rgba(255,215,0,0.2)]"
            >
              GARANTIR MINHA VAGA AGORA
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </a>
            <p className="mt-6 text-gray-500 font-bold flex items-center justify-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Acesso Vitalício • Chance Zero de Dar Errado
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Problem & Solution */}
      <section className="py-24 px-4 bg-white/5 border-y border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeInUp}>
            <h2 className="text-3xl md:text-5xl font-black mb-8 leading-tight">
              Por que pagar caro se você pode <span className="text-cyber-gold">ter o controle?</span>
            </h2>
            <div className="space-y-6">
              <div className="flex gap-4 p-6 rounded-2xl bg-red-500/5 border border-red-500/20">
                <div className="text-red-500 font-bold text-2xl">❌</div>
                <div>
                  <p className="font-bold text-lg mb-1 text-red-500 line-through">Mercado Tradicional</p>
                  <p className="text-gray-400">Pague R$ 250,00 ou mais para um designer fazer apenas uma única capa.</p>
                </div>
              </div>
              <div className="flex gap-4 p-6 rounded-2xl bg-green-500/5 border border-green-500/20">
                <div className="text-green-500 font-bold text-2xl">✅</div>
                <div>
                  <p className="font-bold text-lg mb-1 text-green-500">Com o Nosso Curso</p>
                  <p className="text-gray-400">Aprenda a criar infinitas capas profissionais para o resto da vida por um valor único.</p>
                </div>
              </div>
            </div>
          </motion.div>
          <motion.div {...fadeInUp} className="relative">
            <div className="p-8 rounded-3xl bg-deep-charcoal border border-white/10 shadow-2xl">
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <Layout className="text-cyber-gold" /> Estrutura Completa
              </h3>
              <ul className="space-y-4">
                {[
                  "Capa Principal (Front Cover)",
                  "Contra Capa (Back Cover)",
                  "Lombada (Spine) Automática",
                  "Orelha da Capa",
                  "Orelha da Contra Capa",
                  "Padrão Amazon KDP e UICLAP"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-300 font-medium">
                    <CheckCircle2 className="text-cyber-gold w-5 h-5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bonuses Section */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-6xl font-black mb-4">Bônus Exclusivos <span className="text-cyber-gold">Liberados</span></h2>
            <p className="text-xl text-gray-400">Tudo o que você precisa para acelerar seu resultado.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Modelos Editáveis Canva",
                desc: "Templates profissionais prontos para você apenas trocar o texto e as cores.",
                icon: <Layout className="w-10 h-10" />,
                tag: "BÔNUS 1"
              },
              {
                title: "Versão Amazon Ready",
                desc: "Configurações específicas para garantir que sua capa seja aceita de primeira na Amazon.",
                icon: <Download className="w-10 h-10" />,
                tag: "BÔNUS 2"
              },
              {
                title: "1 Crédito de Livro",
                desc: "Gere mais um livro completo na Fábrica de Best Seller por nossa conta.",
                icon: <Zap className="w-10 h-10" />,
                tag: "BÔNUS 3"
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-cyber-gold transition-colors relative group"
              >
                <div className="absolute top-4 right-4 bg-cyber-gold text-black text-[10px] font-black px-3 py-1 rounded-full">{item.tag}</div>
                <div className="mb-6 text-cyber-gold">{item.icon}</div>
                <h3 className="text-2xl font-bold mb-4 leading-tight">{item.title}</h3>
                <p className="text-gray-400 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div 
            {...fadeInUp}
            className="mt-12 p-8 rounded-3xl bg-gradient-to-r from-cyber-gold/20 to-transparent border border-cyber-gold/30 flex items-center gap-6"
          >
            <Gift className="w-12 h-12 text-cyber-gold flex-shrink-0" />
            <p className="text-xl font-bold">
              E mais: <span className="text-cyber-gold underline">Outros bônus surpresa</span> que só serão apresentados para quem garantir o acesso AGORA!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing & Offer */}
      <section className="py-24 px-4 bg-gradient-to-b from-deep-charcoal to-black relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl aspect-square bg-cyber-gold/10 blur-[150px] rounded-full -z-10" />
        
        <div className="max-w-4xl mx-auto text-center">
          <motion.div {...fadeInUp}>
            <p className="text-xl text-gray-500 font-bold line-through mb-2">De R$ 297,90</p>
            <h2 className="text-5xl md:text-9xl font-black mb-8 leading-none">Apenas <span className="text-cyber-gold block md:inline">R$ 149,90</span></h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg font-bold text-gray-400">
                <CheckCircle2 className="text-green-500" /> Acesso Vitalício
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg font-bold text-gray-400">
                <Monitor className="text-blue-500" /> 100% Online
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg font-bold text-gray-400">
                <ShieldCheck className="text-cyber-gold" /> Garantia de 7 Dias
              </div>
            </div>

            <a 
              href="https://payment.ticto.app/O6FA2355C"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 bg-signal-orange text-white px-16 py-8 rounded-full font-black text-3xl shadow-[0_30px_60px_-15px_rgba(255,77,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              CRIAR MINHAS CAPAS AGORA
              <ArrowRight className="w-10 h-10" />
            </a>

            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 opacity-60">
              <div className="flex flex-col items-center">
                <BookOpen className="w-8 h-8 mb-4" />
                <p className="font-bold">Amazon Ready</p>
              </div>
              <div className="flex flex-col items-center">
                <Sparkles className="w-8 h-8 mb-4" />
                <p className="font-bold">Design Profissional</p>
              </div>
              <div className="flex flex-col items-center">
                <MousePointer2 className="w-8 h-8 mb-4" />
                <p className="font-bold">Faça Você Mesmo</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-white/10 text-center opacity-40 text-sm">
        <p className="font-bold mb-4">© 2024 Fábrica de Best Seller. Todos os direitos reservados.</p>
        <p className="max-w-2xl mx-auto leading-relaxed">
          Os resultados podem variar de pessoa para pessoa. Este curso ensina técnicas de design e não garante vendas automáticas na Amazon.
        </p>
      </footer>
    </div>
  );
};
