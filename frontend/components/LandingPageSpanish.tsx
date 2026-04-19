import React from 'react';
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

const LandingPageSpanish: React.FC<LandingProps> = ({ onStart, onLoginClick }) => {
    return (
        <div className="min-h-screen bg-[#0a0f1d] text-white font-sans flex flex-col items-center selection:bg-yellow-500 selection:text-slate-900 scroll-smooth overflow-x-hidden">
            
            {/* --- HERO SECTION --- (Optimized for First Fold + Vertical VSL) */}
            <header className="w-full max-w-6xl px-4 pt-4 md:pt-12 pb-4 md:pb-8 text-center flex flex-col items-center">
                
                {/* Minimalist Badge */}
                <div className="flex justify-center mb-3 md:mb-6 animate-fade-in">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 md:px-4 md:py-2 rounded-full">
                        <PlayCircle className="text-yellow-400 w-3 h-3 md:w-5 md:h-5" />
                        <span className="text-[9px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">Presentación Exclusiva</span>
                    </div>
                </div>

                <h1 className="text-lg sm:text-2xl md:text-6xl font-black mb-2 md:mb-6 leading-[1.1] max-w-5xl mx-auto px-2">
                    El Atajo Definitivo para tu Autoridad: Ten tu Nombre en la Portada de un Libro Profesional <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 underline decoration-yellow-500/30">Hoy Mismo.</span>
                </h1>
                
                <p className="text-[10px] sm:text-xs md:text-xl text-slate-400 max-w-3xl mx-auto mb-4 md:mb-8 leading-tight md:leading-relaxed px-6 opacity-70">
                    Sin escribir una única línea. Nuestra tecnología realiza la ingeniería inversa de tu nicho y entrega un Kit completo: desde manuscrito hasta sinopsis.
                </p>

                {/* Vertical Video VSL - 9:16 Format Optimized */}
                <div className="relative w-full flex justify-center px-4">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[300px] h-[400px] bg-yellow-500/10 blur-[60px] md:blur-[120px] rounded-full -z-10 animate-pulse"></div>
                    
                    <div className="relative aspect-[9/16] w-[220px] sm:w-[280px] md:w-[350px] rounded-[2rem] md:rounded-[3rem] overflow-hidden border-4 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black">
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center pointer-events-auto overflow-hidden">
                            <iframe
                                className="absolute w-[105%] h-[105%] max-w-none scale-[1.05]"
                                src="https://www.youtube.com/embed/7iQ5BdT6R3k?autoplay=1&modestbranding=1&rel=0&showinfo=0&controls=0&mute=0&loop=1"
                                title="Fábrica de Best Sellers VSL"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/5 to-transparent"></div>
                    </div>
                </div>
            </header>

            {/* --- IMMEDIATE CONTENT --- */}
            <div className="w-full opacity-100 translate-y-0 visible transition-all duration-1000">
                
                {/* CTA 1 */}
                <div className="max-w-4xl mx-auto px-6 mt-8 md:mt-12 mb-20 md:mb-24 text-center animate-bounce-subtle">
                    <button 
                        onClick={() => window.open('https://payment.ticto.app/O6CE296D4', '_blank')}
                        className="group relative w-full md:w-auto md:px-12 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-5 md:py-6 rounded-2xl text-lg md:text-2xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] transition-all transform hover:scale-105"
                    >
                        <span className="flex items-center justify-center gap-3">
                            <Zap className="fill-current w-5 h-5 md:w-6 md:h-6" />
                            ¡QUIERO GENERAR MI FUTURO BEST SELLER AHORA!
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    <p className="mt-6 text-slate-400 font-semibold text-xs md:text-sm flex items-center justify-center gap-2">
                        <CheckCircle className="text-yellow-500 w-4 h-4" /> Pago único. Acceso vitalicio.
                    </p>
                </div>

                {/* Section 2: What it does */}
                <section className="w-full py-20 md:py-24 bg-slate-900/50 border-y border-white/5">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-2xl md:text-5xl font-black mb-6">¿Qué hace Fábrica de Best Sellers por ti?</h2>
                            <p className="text-slate-400 text-sm md:text-lg max-w-3xl mx-auto">
                                Escribir un libro de autoridad solía llevar meses. Investigar lo que el público quiere, estructurar capítulos y diagramar era una pesadilla. <span className="text-white font-bold">Eso se acabó.</span>
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 mb-16">
                            <p className="text-xl md:text-3xl font-bold text-center mb-12">
                                Nuestra herramienta no es un simple generador de texto. <br/>
                                <span className="text-yellow-500">Es una Ingeniería de Mercado.</span>
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                                <div className="p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
                                        <Search className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold mb-3">Minería de Dolores</h3>
                                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">Buscamos lo que las personas preguntan en YouTube y Google para garantizar la demanda.</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
                                        <TrendingUp className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold mb-3">Modelado de Éxito</h3>
                                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">Analizamos por qué los 10 libros más vendidos del nicho en Amazon son líderes.</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
                                        <ShieldCheck className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold mb-3">Creación Blindada</h3>
                                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">Generamos contenido denso (12 caps, 170+ págs) siguiendo patrones de algoritmos.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 3: The Kit */}
                <section className="w-full py-20 md:py-24">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-2xl md:text-5xl font-black mb-6">Lo que incluye tu Kit Completo <span className="text-yellow-500">(Archivo .ZIP)</span></h2>
                                <p className="text-slate-400 text-sm md:text-lg mb-8">
                                    No recibes solo un texto. Recibes un negocio listo para publicar. Al cabo de 30 minutos, descargas un arquivo que contiene:
                                </p>
                                <ul className="space-y-3 md:space-y-4">
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <BookOpen className="text-yellow-500 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-white">Libro Completo:</strong> 12 capítulos, 170+ páginas, en Word Editable.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <TrendingUp className="text-yellow-500 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-white">9 Opciones de Títulos:</strong> Creados para atraer clics basados en disparadores.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <Award className="text-yellow-500 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-white">Material de Portada:</strong> Textos listos para Solapas y contraportada.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <Zap className="text-yellow-400 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-white">Arsenal Amazon:</strong> Sinopsis profesional y palabras clave poderosas.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-yellow-500/10 rounded-xl md:rounded-2xl border border-yellow-500/20">
                                        <PlayCircle className="text-yellow-500 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-yellow-500">Bono de Marketing:</strong> Descripción profesional para tu video de ventas.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="relative mt-8 md:mt-0">
                                <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] md:blur-[100px] rounded-full"></div>
                                <div className="relative bg-slate-800 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden group">
                                    <div className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] group-hover:border-yellow-500/50 transition-colors">
                                        <Download className="w-12 h-12 md:w-20 md:h-20 text-yellow-500 mb-6 animate-bounce" />
                                        <span className="text-lg md:text-2xl font-bold text-center">Kit_BestSeller_Pro.zip</span>
                                        <span className="text-xs text-slate-500 mt-2">12.5 MB • Listo para Descargar</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Who is it for? */}
                <section className="w-full py-20 md:py-24 bg-slate-900/50 border-y border-white/5">
                    <div className="max-w-6xl mx-auto px-6">
                        <h2 className="text-2xl md:text-5xl font-black text-center mb-16">¿Para quién es la Fábrica?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: <Star className="text-yellow-500" />, title: "Especialistas", desc: "Que quieren aumentar su autoridade e cobrar más caro en mentorías." },
                                { icon: <Target className="text-yellow-500" />, title: "Emprendedores", desc: "Digitales que buscan ingresos pasivos en Amazon (KDP)." },
                                { icon: <Users className="text-yellow-500" />, title: "Conferencistas", desc: "Que necesitan un libro para vender en sus eventos y cursos." },
                                { icon: <Feather className="text-yellow-500" />, title: "Aspirantes", desc: "Tú, que tienes un mensaje, pero te bloqueas ante la pantalla blanca." }
                            ].map((item, idx) => (
                                <div key={idx} className="p-8 bg-white/5 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-colors flex flex-col items-center text-center">
                                    <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-800 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 shadow-xl border border-white/5">
                                        {item.icon}
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold mb-4">{item.title}</h3>
                                    <p className="text-xs md:text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 5: Price */}
                <section className="w-full py-24 md:py-32 bg-[#0d1428] relative overflow-hidden">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-yellow-500/10 blur-[120px] rounded-full"></div>
                    <div className="max-w-4xl mx-auto px-6 relative z-10">
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-20 border border-white/10 shadow-[0_0_100px_-10px_rgba(0,0,0,0.5)] text-center">
                            <h2 className="text-xl md:text-5xl font-black mb-8">Ecosistema por el precio de una Pizza.</h2>
                            <div className="mb-12">
                                <span className="text-slate-400 line-through text-lg md:text-2xl">De R$ 197,90</span>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="text-slate-400 text-lg md:text-2xl font-bold">Por solo</span>
                                    <span className="text-4xl md:text-8xl font-black text-white">R$ 39,90</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => window.open('https://payment.ticto.app/O6CE296D4', '_blank')}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-5 md:py-6 rounded-2xl text-lg md:text-3xl shadow-xl transition-all transform hover:scale-105 mb-8"
                            >
                                QUIERO MI LIBRO COMPLETO POR R$ 39,90
                            </button>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-slate-400 text-[10px] md:text-sm font-medium">
                                <span className="flex items-center gap-2 text-center justify-center"><CheckCircle className="text-green-500 w-4 h-4 md:w-5 md:h-5" /> Satisfacción garantizada o su dinheiro en 7 dias.</span>
                                <span className="flex items-center gap-2 text-center justify-center"><ShieldCheck className="text-blue-500 w-4 h-4 md:w-5 md:h-5" /> Compra 100% segura</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 6: FAQ */}
                <section className="w-full py-20 md:py-24 mb-10">
                    <div className="max-w-4xl mx-auto px-6">
                        <h2 className="text-2xl md:text-4xl font-black text-center mb-16 flex items-center justify-center gap-3">
                            <HelpCircle className="text-yellow-500" /> FAQ Rápido
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:gap-6">
                            {[
                                { q: "¿Necesito escribir algo?", a: "No. La herramienta genera todo de forma autónoma con nuestra IA exclusiva." },
                                { q: "¿El libro viene formateado?", a: "Sí, entregamos el arquivo listo en Word para diagramación o publicação direta." },
                                { q: "¿Puedo publicar en Amazon?", a: "Sí, el motor de creación es totalmente 'Amazon-Ready'." }
                            ].map((faq, i) => (
                                <div key={i} className="bg-white/5 rounded-[1.5rem] md:rounded-3xl p-6 md:p-8 border border-white/5">
                                    <h3 className="text-base md:text-xl font-bold mb-4 text-white flex gap-3"><span className="text-yellow-500">?</span> {faq.q}</h3>
                                    <p className="text-xs md:text-slate-400 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final Footer */}
                <footer className="w-full py-16 md:py-20 border-t border-white/5 bg-black/40">
                    <div className="max-w-4xl mx-auto px-6 text-center">
                        <div className="flex items-center justify-center gap-2 mb-8 opacity-60">
                            <BookOpen className="text-yellow-400 w-5 h-5 md:w-6 md:h-6" />
                            <span className="font-black text-lg md:text-xl tracking-tight">Fábrica de Best Sellers</span>
                        </div>
                        
                        <div className="text-slate-500 text-[9px] md:text-xs space-y-6">
                            <nav className="flex justify-center gap-4 md:gap-6 mb-8 text-slate-400 underline underline-offset-4">
                                <a href="/terms" className="hover:text-white transition">Términos de Uso</a>
                                <a href="/privacy-policy" className="hover:text-white transition">Privacidad</a>
                            </nav>
                            <p>© 2026 Fábrica de Best Sellers. Todos os direitos reservados.</p>
                            <div className="pt-6">
                                <Disclaimer />
                            </div>
                        </div>
                    </div>
                </footer>
            </div>

            {/* Hidden admin portal */}
            <button 
                onClick={onLoginClick} 
                className="fixed top-2 right-2 md:top-4 md:right-4 bg-white/5 hover:bg-white/10 text-white/20 hover:text-white px-2 py-0.5 md:px-3 md:py-1 rounded text-[8px] md:text-[10px] transition z-50"
            >
                STUDENT AREA
            </button>
        </div>
    );
};

export default LandingPageSpanish;
