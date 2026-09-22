const fs = require('fs');
const file = 'frontend/components/WebinarLaunch.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add showSticky state
if (!content.includes('showSticky')) {
  content = content.replace(
    'const [openFaq, setOpenFaq] = useState<number | null>(null);',
    `const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowSticky(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);`
  );
}

// 2. Replace the price section
const oldPriceSection = `<p className="text-amber-500/80 text-sm font-medium mt-2">1º Lote. O preço subirá para R$ 49,90 em breve.</p>
              </div>

              <a 
                href="#"`;

const newPriceSection = `
                <div className="flex justify-center items-center gap-3 mt-4 text-xs sm:text-sm font-medium">
                  <span className="text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded">1º Lote R$ 29,90</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">2º Lote R$ 69,90</span>
                  <span className="text-slate-600">/</span>
                  <span className="text-slate-400">3º Lote R$ 99,90</span>
                </div>
              </div>

              <a 
                href="#inscricao"`;

content = content.replace(oldPriceSection, newPriceSection);

// 3. Replace CASOS DE SUCESSO
const oldCasosSection = `      {/* 7. CASOS DE SUCESSO (SOCIAL PROOF) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-white/10 bg-black">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">Autores comuns.<br /><span className="text-amber-500">Resultados fora do comum.</span></h2>
            <p className="text-slate-400 max-w-2xl mx-auto">O que eles têm em comum não é apenas talento, mas acesso à ferramenta e estratégia certas.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Placeholder Testimonials/Books - to be updated with real ones later */}
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="bg-white/5 rounded-2xl overflow-hidden border border-white/10 group">
                <div className="aspect-[3/4] bg-slate-800 relative flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-slate-700 group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                     <p className="text-xs text-amber-500 font-bold mb-1">Autor(a) FBS</p>
                     <div className="flex gap-1">
                       {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 text-amber-500 fill-amber-500" />)}
                     </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>`;

const newCasosSection = `      {/* 7. CASOS DE SUCESSO (SOCIAL PROOF) */}
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
              <div key={\`loop-\${loop}\`} className="flex items-center gap-6 px-3 flex-shrink-0 min-w-max">
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
                        src={\`/assets/\${author.img}\`} 
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
      </section>`;

content = content.replace(oldCasosSection, newCasosSection);

// 4. Add Sticky CTA at the end
if (!content.includes('STICKY CTA')) {
  const oldFooterEnd = `      </footer>
    </div>
  );
};`;
  
  const newFooterEnd = `      </footer>

      {/* STICKY CTA */}
      <div className={\`fixed bottom-0 left-0 right-0 z-[100] transition-transform duration-500 \${showSticky ? 'translate-y-0' : 'translate-y-full'}\`}>
        <div className="bg-[#111] border-t border-[#bcf02d]/20 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.9)]">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-extrabold text-lg sm:text-xl text-white">MasterClass - Método PBE (Publicação Business Express)</p>
              <p className="text-slate-400 text-sm">De <span className="line-through">R$ 97,90</span> por <span className="text-[#bcf02d] font-bold text-lg">R$ 29,90</span></p>
            </div>
            <a href="#inscricao" className="w-full sm:w-auto bg-[#bcf02d] hover:bg-[#a3d61b] text-black font-black text-sm sm:text-base py-3 px-8 rounded-lg transition-all transform hover:scale-105 whitespace-nowrap text-center">
              GARANTIR MINHA VAGA | LOTE ESPECIAL <ChevronRight className="w-5 h-5 inline-block -mt-1" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};`;

  content = content.replace(oldFooterEnd, newFooterEnd);
}

fs.writeFileSync(file, content);
console.log('Restored all modifications with real client covers!');
