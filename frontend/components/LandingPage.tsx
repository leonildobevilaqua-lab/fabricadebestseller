import React, { useState, useEffect } from 'react';
import Disclaimer from './Disclaimer';
import { 
    BookOpen, 
    ShieldCheck, 
    Zap, 
    Search, 
    TrendingUp, 
    FileText, 
    CheckCircle, 
    Award, 
    ArrowRight, 
    HelpCircle, 
    Download, 
    Target, 
    Users, 
    Feather, 
    PlayCircle,
    Star
} from 'lucide-react';

interface LandingProps {
    onStart: (userData: any) => void;
    onLoginClick: () => void;
}

const LandingPage: React.FC<LandingProps> = ({ onStart, onLoginClick }) => {
    const [showOffer, setShowOffer] = useState(false);

    // 3 minutes and 25 seconds = 205 seconds
    const DELAY_SECONDS = 205;

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowOffer(true);
        }, DELAY_SECONDS * 1000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0f1d] text-white font-sans flex flex-col items-center selection:bg-yellow-500 selection:text-slate-900 scroll-smooth">
            
            {/* --- HERO SECTION --- */}
            <header className="w-full max-w-6xl px-6 pt-12 md:pt-24 text-center">
                <div className="flex justify-center mb-8 animate-fade-in">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                        <PlayCircle className="text-yellow-400 w-5 h-5" />
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Vídeo de Apresentação Exclusivo</span>
                    </div>
                </div>

                <h1 className="text-3xl md:text-6xl font-black mb-6 leading-tight max-w-5xl mx-auto md:px-4">
                    O Atalho Definitivo para sua Autoridade: Tenha seu Nome na Capa de um Livro Profissional <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 underline decoration-yellow-500/30">Hoje Mesmo.</span>
                </h1>
                
                <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed px-4">
                    Sem escrever uma única linha. Nossa tecnologia realiza a engenharia reversa do seu nicho e entrega um Kit completo: do manuscrito à sinopse profissional. Chegou a hora de construir seu legado.
                </p>

                {/* Video VSL */}
                <div className="w-full max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_50px_-12px_rgba(234,179,8,0.3)] bg-black mb-12">
                    <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/7iQ5BdT6R3k?autoplay=1&modestbranding=1&rel=0"
                        title="Fábrica de Best Sellers VSL"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </header>

            {/* --- DELAYED CONTENT --- */}
            <div className={`w-full transition-all duration-1000 ease-out transform ${showOffer ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-20 invisible h-0 overflow-hidden'}`}>
                
                {/* Delayed CTA 1 */}
                <div className="max-w-4xl mx-auto px-6 mb-24 text-center animate-bounce-subtle">
                    <button 
                        onClick={() => window.open('https://payment.ticto.app/O6CE296D4', '_blank')}
                        className="group relative w-full md:w-auto md:px-12 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-6 rounded-2xl text-xl md:text-2xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] transition-all transform hover:scale-105"
                    >
                        <span className="flex items-center justify-center gap-3">
                            <Zap className="fill-current" />
                            QUERO GERAR MEU FUTURO BEST SELLER AGORA!
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    <p className="mt-6 text-slate-400 font-semibold text-sm flex items-center justify-center gap-2">
                        <CheckCircle className="text-yellow-500 w-4 h-4" /> Pagamento único. Acesso vitalício.
                    </p>
                </div>

                {/* Section 2: What it does */}
                <section className="w-full py-24 bg-slate-900/50 border-y border-white/5">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-black mb-6">O que a Fábrica de Best Seller faz por você?</h2>
                            <p className="text-slate-400 text-lg max-w-3xl mx-auto">
                                Escrever um livro de autoridade costumava levar meses. Pesquisar o que o público quer, estruturar capítulos e diagramar era um pesadelo. <span className="text-white font-bold">Isso acabou.</span>
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 md:p-12 rounded-[2.5rem] border border-white/5 mb-16">
                            <p className="text-2xl md:text-3xl font-bold text-center mb-12">
                                Nossa ferramenta não é um simples gerador de texto. <br/>
                                <span className="text-yellow-500">Ela é uma Engenharia de Mercado.</span>
                            </p>

                            <div className="grid md:grid-cols-3 gap-8">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
                                    <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6">
                                        <Search className="text-yellow-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">Mineração de Dores</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Buscamos o que as pessoas estão perguntando no YouTube e Google para garantir demanda.</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
                                    <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6">
                                        <TrendingUp className="text-yellow-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">Modelagem de Sucesso</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Analisamos o que faz os 10 livros mais vendidos do seu nicho na Amazon serem líderes.</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
                                    <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center mb-6">
                                        <ShieldCheck className="text-yellow-500" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">Criação Blindada</h3>
                                    <p className="text-slate-400 text-sm leading-relaxed">Geramos um conteúdo denso (12 caps, 170+ págs) seguindo o padrão que os algoritmos amam.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: The Kit */}
                <section className="w-full py-24">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl md:text-5xl font-black mb-6">O que vem no seu Kit Completo <span className="text-yellow-500">(Arquivo .ZIP)</span></h2>
                                <p className="text-slate-400 text-lg mb-8">
                                    Você não recebe apenas um texto. Você recebe um negócio pronto para publicar. Ao final de 30 minutos, você baixa um arquivo contendo:
                                </p>
                                <ul className="space-y-4">
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <BookOpen className="text-yellow-500 shrink-0 mt-1" />
                                        <span><strong className="text-white">Livro Completo:</strong> 12 capítulos, 170+ páginas, com Sumário, Agradecimentos e Dedicatória em Word Editável.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <TrendingUp className="text-yellow-500 shrink-0 mt-1" />
                                        <span><strong className="text-white">9 Opções de Títulos:</strong> Criados para atrair cliques e vendas imediatas baseados em gatilhos mentais.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <Award className="text-yellow-500 shrink-0 mt-1" />
                                        <span><strong className="text-white">Material de Capa:</strong> Textos prontos para Orelhas (Frente/Verso) e Contra-capa profissional.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <Zap className="text-yellow-400 shrink-0 mt-1" />
                                        <span><strong className="text-white">Arsenal Amazon (Top Seller):</strong> Sinopse padrão e as 20 melhores Palavras-Chave para o algoritmo.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                                        <PlayCircle className="text-yellow-500 shrink-0 mt-1" />
                                        <span><strong className="text-yellow-500">Bônus de Marketing:</strong> Descrição profissional para seu vídeo de venda no YouTube.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-0 bg-yellow-500/20 blur-[100px] rounded-full"></div>
                                <div className="relative bg-slate-800 p-8 rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden group">
                                    <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-white/10 rounded-[2.5rem] group-hover:border-yellow-500/50 transition-colors">
                                        <Download className="w-20 h-20 text-yellow-500 mb-6 animate-bounce" />
                                        <span className="text-2xl font-bold text-center">Kit_BestSeller_Pro.zip</span>
                                        <span className="text-slate-500 mt-2">12.5 MB • Pronto para Baixar</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Who is it for? */}
                <section className="w-full py-24 bg-slate-900/50 border-y border-white/5">
                    <div className="max-w-6xl mx-auto px-6">
                        <h2 className="text-3xl md:text-5xl font-black text-center mb-16">Para quem é a Fábrica?</h2>
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: <Star className="text-yellow-500" />, title: "Especialistas", desc: "Que querem aumentar sua autoridade e cobrar mais caro em mentorias." },
                                { icon: <Target className="text-yellow-500" />, title: "Empreendedores", desc: "Digital que buscam renda passiva na Amazon (KDP) de forma escalável." },
                                { icon: <Users className="text-yellow-500" />, title: "Palestrantes", desc: "Que precisam de um livro físico/digital para vender em seus eventos e cursos." },
                                { icon: <Feather className="text-yellow-500" />, title: "Aspirantes", desc: "Você, que tem uma mensagem, mas trava diante da tela branca e não sabe começar." }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-center text-center">
                                    <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/5">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 5: Price */}
                <section className="w-full py-32 bg-[#0d1428] relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full"></div>
                    <div className="max-w-4xl mx-auto px-6 relative z-10">
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-[3rem] p-10 md:p-20 border border-white/10 shadow-[0_0_100px_-10px_rgba(0,0,0,0.5)] text-center">
                            <h2 className="text-3xl md:text-5xl font-black mb-8">Todo esse Ecossistema pelo preço de uma Pizza.</h2>
                            <div className="mb-12">
                                <span className="text-slate-400 line-through text-2xl">De R$ 197,90</span>
                                <div className="flex items-center justify-center gap-3 mt-2">
                                    <span className="text-slate-400 text-2xl font-bold">Por apenas</span>
                                    <span className="text-6xl md:text-8xl font-black text-white">R$ 39,90</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => window.open('https://payment.ticto.app/O6CE296D4', '_blank')}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-6 rounded-2xl text-xl md:text-3xl shadow-xl transition-all transform hover:scale-105 mb-8"
                            >
                                QUERO MEU LIVRO COMPLETO POR R$ 39,90
                            </button>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-slate-400 text-sm font-medium">
                                <span className="flex items-center gap-2"><CheckCircle className="text-green-500 w-5 h-5" /> Satisfação garantizada ou seu dinheiro de volta em 7 dias.</span>
                                <span className="flex items-center gap-2"><ShieldCheck className="text-blue-500 w-5 h-5" /> Compra 100% segura</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 6: FAQ */}
                <section className="w-full py-24 mb-10">
                    <div className="max-w-4xl mx-auto px-6">
                        <h2 className="text-3xl md:text-4xl font-black text-center mb-16 flex items-center justify-center gap-3">
                            <HelpCircle className="text-yellow-500" /> FAQ Rápido
                        </h2>
                        <div className="space-y-6">
                            {[
                                { q: "Preciso escrever algo?", a: "Não. A ferramenta gera tudo de forma autônoma a partir do tema escolhido através da nossa Inteligência Artificial exclusiva." },
                                { q: "O livro vem formatado?", a: "Sim, entregamos o arquivo pronto em Word para diagramação final ou publicação direta com sumários, agradecimentos e todos os itens profissionais." },
                                { q: "Posso publicar na Amazon?", a: "Sim, o motor de criação é totalmente 'Amazon-Ready', otimizado para os padrões aceitos pelo KDP." }
                            ].map((faq, i) => (
                                <div key={i} className="bg-white/5 rounded-3xl p-8 border border-white/5">
                                    <h3 className="text-xl font-bold mb-4 text-white flex gap-3"><span className="text-yellow-500">?</span> {faq.q}</h3>
                                    <p className="text-slate-400 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final Footer */}
                <footer className="w-full py-20 border-t border-white/5 bg-black/40">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-8 opacity-60">
                            <BookOpen className="text-yellow-400 w-6 h-6" />
                            <span className="font-black text-xl tracking-tight">Fábrica de Best Sellers</span>
                        </div>
                        
                        <div className="text-slate-500 text-[10px] md:text-xs space-y-6">
                            <nav className="flex justify-center gap-6 mb-8 text-slate-400 underline underline-offset-4">
                                <a href="/terms" className="hover:text-white transition">Termos de Uso</a>
                                <a href="/privacy-policy" className="hover:text-white transition">Privacidade</a>
                            </nav>
                            <p className="max-w-2xl mx-auto leading-relaxed italic">
                                "Este site não é afiliado ao Facebook, Google ou YouTube. Os resultados variam de acordo com o nicho e esforço individual de cada autor."
                            </p>
                            <p>© 2026 Fábrica de Best Sellers. Todos os direitos reservados.</p>
                            <div className="pt-6">
                                <Disclaimer />
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Hidden admin/login portal */}
            <button 
                onClick={onLoginClick} 
                className="fixed top-4 right-4 bg-white/5 hover:bg-white/10 text-white/20 hover:text-white px-3 py-1 rounded text-[10px] transition z-50"
            >
                ÁREA DO ALUNO
            </button>
        </div>
    );
};

export default LandingPage;
