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
  Youtube,
  Search,
  BookMarked
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

export const SalesLandingV5: React.FC = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <div className="min-h-screen bg-deep-charcoal text-white font-outfit selection:bg-cyber-gold selection:text-black overflow-x-hidden">
      {/* Progress Bar */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-cyber-gold z-[100] origin-left" 
        style={{ scaleX }} 
      />

      {/* Floating CTA (Desktop) */}
      <motion.div 
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 2, duration: 1 }}
        className="fixed bottom-8 right-8 z-50 hidden lg:block"
      >
        <a 
          href="https://payment.ticto.app/O6CE296D4"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-3 bg-signal-orange px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:scale-105 transition-all duration-300 active:scale-95"
        >
          <span className="absolute inset-0 rounded-full bg-white/20 animate-ping group-hover:hidden" />
          <Zap className="w-6 h-6 fill-white" />
          QUERO MEU LIVRO AGORA
          <ArrowRight className="group-hover:translate-x-1 transition-transform" />
        </a>
      </motion.div>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 px-4">
        {/* Background Patterns */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          <img 
            src="/assets/hero_bg.png" 
            alt="Background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-deep-charcoal via-transparent to-deep-charcoal" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyber-gold/30 bg-cyber-gold/5 text-cyber-gold text-sm font-bold uppercase tracking-widest mb-8"
          >
            <Cpu className="w-4 h-4" />
            O Futuro dos Ativos Digitais Chegou
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl md:text-8xl font-black mb-8 leading-[0.9] tracking-tighter"
          >
            Gere um Best Seller de <span className="text-cyber-gold">170+ Páginas</span> na Amazon em 30 Minutos
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-3xl text-gray-400 font-medium mb-12 max-w-4xl mx-auto leading-relaxed"
          >
            Sem Escrever uma Única Linha. Nossa tecnologia realiza uma <span className="text-white border-b-2 border-cyber-gold/50">engenharia reversa</span> nos 10 livros mais vendidos do seu nicho e minera dados reais do Google e YouTube.
          </motion.p>

          {/* VSL Video Container */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
            className="relative w-full max-w-5xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-[0_0_100px_-20px_rgba(255,215,0,0.3)] group"
          >
            <div className="absolute inset-0 bg-black flex items-center justify-center">
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/U9tLQR9XKrY?autoplay=0&rel=0&modestbranding=1" 
                title="VSL Best Seller Factory"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="mt-16 flex flex-col items-center"
          >
            <a 
              href="https://payment.ticto.app/O6CE296D4"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col md:flex-row items-center gap-6 bg-white text-black px-12 py-6 rounded-2xl font-black text-2xl hover:bg-cyber-gold transition-all duration-500 shadow-[0_20px_50px_rgba(255,215,0,0.2)]"
            >
              QUERO MEU KIT DE AUTORIDADE POR R$ 39,90
              <ArrowRight className="w-8 h-8 group-hover:translate-x-2 transition-transform" />
            </a>
            <p className="mt-4 text-gray-500 font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-500" />
              Pagamento 100% Seguro • Acesso Imediato
            </p>
          </motion.div>
        </div>
      </section>

      {/* The Science Section */}
      <section className="py-32 px-4 bg-deep-charcoal relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <motion.div {...fadeInUp} className="flex-1">
              <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
                Você entra com o Nicho.<br/>
                <span className="text-cyber-gold">Nós entramos com a Inteligência de Mercado.</span>
              </h2>
              <p className="text-xl text-gray-400 mb-12">
                Esqueça a tentativa de transformar memórias em texto. A Fábrica de Best Seller utiliza o <strong>Protocolo Bio-Autoral 12X</strong> para criar livros baseados no que o mercado já quer comprar.
              </p>

              <div className="space-y-8">
                {[
                  {
                    icon: <Search className="w-8 h-8 text-cyber-gold" />,
                    title: "Varredura de Demanda",
                    text: "A IA identifica as dúvidas e dores reais que o seu público pesquisa no YouTube e Google agora."
                  },
                  {
                    icon: <TrendingUp className="w-8 h-8 text-cyber-gold" />,
                    title: "Modelagem de Sucesso",
                    text: "Analisamos a estrutura dos 10 maiores Best Sellers da Amazon no seu tema para replicar o padrão de capítulos que vende."
                  },
                  {
                    icon: <Layers className="w-8 h-8 text-cyber-gold" />,
                    title: "DNA Estrutural Humano",
                    text: "O conteúdo é gerado em 12 camadas interdependentes, mimetizando o ritmo de um autor veterano."
                  }
                ].map((item, i) => (
                  <motion.div 
                    key={i}
                    {...fadeInUp}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-6 p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-cyber-gold/50 transition-colors"
                  >
                    <div className="flex-shrink-0">{item.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                      <p className="text-gray-400 leading-relaxed">{item.text}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div 
              {...fadeInUp}
              className="flex-1 relative"
            >
              <div className="absolute inset-0 bg-cyber-gold/20 blur-[120px] rounded-full" />
              <img 
                src="/assets/intelligence_map.png" 
                alt="Inteligência de Mercado" 
                className="relative z-10 w-full h-auto rounded-3xl border border-white/10 shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* The Kit Section */}
      <section className="py-32 px-4 bg-gradient-to-b from-deep-charcoal to-black">
        <div className="max-w-7xl mx-auto">
          <motion.div {...fadeInUp} className="text-center mb-20">
            <h2 className="text-4xl md:text-7xl font-black mb-6">O que você recebe em menos de <span className="text-cyber-gold">30 minutos:</span></h2>
            <p className="text-xl text-gray-400">O Kit de Publicação Completo (.ZIP) direto no seu painel.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: "Manuscrito Blindado",
                desc: "12 capítulos estruturados e mais de 170 páginas de conteúdo denso.",
                icon: <BookMarked className="w-10 h-10" />
              },
              {
                title: "Diagramação Automática",
                desc: "Arquivo no padrão 'Amazon-Ready', eliminando erros de margem e sangria.",
                icon: <Layers className="w-10 h-10" />
              },
              {
                title: "Arsenal de Vendas",
                desc: "Sinopse profissional, 20 palavras-chave estratégicas e textos de capa.",
                icon: <TrendingUp className="w-10 h-10" />
              },
              {
                title: "Elementos Textuais",
                desc: "Geração automática de Agradecimentos, Dedicatória e 'Sobre o Autor'.",
                icon: <CheckCircle2 className="w-10 h-10" />
              }
            ].map((item, i) => (
              <motion.div 
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="group p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-cyber-gold hover:text-black transition-all duration-500"
              >
                <div className="mb-6 text-cyber-gold group-hover:text-black transition-colors">{item.icon}</div>
                <h3 className="text-2xl font-black mb-4">{item.title}</h3>
                <p className="opacity-60 group-hover:opacity-100 font-medium leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>

          <motion.div {...fadeInUp} className="mt-20 p-12 rounded-[40px] bg-cyber-gold flex flex-col lg:flex-row items-center gap-12 text-black">
            <div className="flex-1">
              <h3 className="text-4xl md:text-5xl font-black mb-6 leading-none">Domine o Mercado Global e Fature em Dólar.</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Globe className="w-6 h-6 flex-shrink-0" />
                  <p className="font-bold">Bônus 1: Tradução Global (EN/ES) automática.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Star className="w-6 h-6 flex-shrink-0" />
                  <p className="font-bold">Bônus 2: Área de Membros Vitalícia.</p>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="w-6 h-6 flex-shrink-0" />
                  <p className="font-bold">Bônus 3: Automação de Perfil e Biografia.</p>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-1/3">
              <img src="/assets/book_mockup.png" alt="Mockup Kit" className="w-full h-auto drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)] scale-110" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-32 px-4 text-center bg-deep-charcoal relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl aspect-square bg-cyber-gold/10 blur-[150px] rounded-full -z-10" />
        
        <div className="max-w-4xl mx-auto">
          <motion.div {...fadeInUp}>
            <p className="text-xl text-gray-500 font-bold line-through mb-2">De R$ 97,00</p>
            <h2 className="text-7xl md:text-9xl font-black mb-8 leading-none">Por apenas <span className="text-cyber-gold block md:inline">R$ 39,90</span></h2>
            
            <p className="text-2xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              Não é um curso de escrita. É o <strong>software</strong> que faz o trabalho pesado por você. Tenha seu livro publicado na Amazon e alavanque sua autoridade profissional agora.
            </p>

            <a 
              href="https://payment.ticto.app/O6CE296D4"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-4 bg-signal-orange text-white px-16 py-8 rounded-full font-black text-3xl shadow-[0_30px_60px_-15px_rgba(255,77,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              CRIAR MEU LIVRO AGORA
              <ArrowRight className="w-10 h-10" />
            </a>

            <div className="mt-12 flex flex-wrap justify-center gap-8 opacity-50">
              <div className="flex items-center gap-2 font-bold"><ShieldCheck /> Compra Segura</div>
              <div className="flex items-center gap-2 font-bold"><Download /> Download Imediato</div>
              <div className="flex items-center gap-2 font-bold"><History /> 7 Dias de Garantia</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-4 bg-black/50">
        <div className="max-w-3xl mx-auto">
          <motion.h2 {...fadeInUp} className="text-4xl md:text-6xl font-black mb-16 text-center">Dúvidas Frequentes</motion.h2>
          
          <div className="space-y-6">
            {[
              {
                q: "Eu preciso escrever algo?",
                a: "Não. O sistema gera o conteúdo completo a partir do tema ou nicho que você definir."
              },
              {
                q: "O livro é baseado na minha vida?",
                a: "Não. O foco é autoridade de nicho. O sistema modela o que há de melhor no mercado para garantir que seu livro seja relevante e vendável."
              },
              {
                q: "Os direitos autorais são meus?",
                a: "Sim. Por ser um conteúdo 'Assistido' e estruturado por você como Diretor, a propriedade intelectual é 100% sua."
              },
              {
                q: "Como recebo o acesso?",
                a: "Imediatamente após a confirmação do pagamento, você receberá um e-mail com seus dados de acesso ao painel de geração."
              }
            ].map((item, i) => (
              <motion.details 
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="group bg-white/5 rounded-3xl p-8 border border-white/10 open:bg-cyber-gold open:text-black transition-all cursor-pointer"
              >
                <summary className="text-xl md:text-2xl font-black list-none flex justify-between items-center">
                  {item.q}
                  <div className="text-3xl group-open:rotate-45 transition-transform">+</div>
                </summary>
                <p className="mt-6 text-lg opacity-70 group-open:opacity-100 font-medium leading-relaxed">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-white/10 text-center opacity-50">
        <p className="font-bold mb-4">© 2024 Fábrica de Best Seller. Todos os direitos reservados.</p>
        <div className="flex justify-center gap-8 font-bold text-sm">
          <a href="/termos-uso" className="hover:text-cyber-gold">Termos de Uso</a>
          <a href="/politica-privacidade" className="hover:text-cyber-gold">Política de Privacidade</a>
        </div>
      </footer>
    </div>
  );
};
