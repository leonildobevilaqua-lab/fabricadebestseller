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

const LandingPageEnglish: React.FC<LandingProps> = ({ onStart, onLoginClick }) => {
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
        <div className="min-h-screen bg-[#0a0f1d] text-white font-sans flex flex-col items-center selection:bg-yellow-500 selection:text-slate-900 scroll-smooth overflow-x-hidden">
            
            {/* --- HERO SECTION --- (Optimized for First Fold) */}
            <header className="w-full max-w-6xl px-4 pt-4 md:pt-16 pb-4 md:pb-12 text-center flex flex-col items-center">
                
                {/* Minimalist Badge */}
                <div className="flex justify-center mb-4 md:mb-8 animate-fade-in">
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1 md:px-4 md:py-2 rounded-full">
                        <PlayCircle className="text-yellow-400 w-3 h-3 md:w-5 md:h-5" />
                        <span className="text-[10px] md:text-xs font-bold text-slate-300 uppercase tracking-widest">Exclusive Presentation</span>
                    </div>
                </div>

                <h1 className="text-xl sm:text-2xl md:text-6xl font-black mb-3 md:mb-6 leading-[1.1] max-w-5xl mx-auto">
                    The Ultimate Shortcut to Your Authority: Have Your Name on the Cover of a Professional Book <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 underline decoration-yellow-500/30">Today.</span>
                </h1>
                
                <p className="text-[11px] sm:text-xs md:text-xl text-slate-400 max-w-3xl mx-auto mb-4 md:mb-10 leading-normal md:leading-relaxed px-4 opacity-80">
                    Without writing a single line. Our technology performs reverse engineering of your niche and delivers a complete Kit: from manuscript to professional synopsis.
                </p>

                {/* Video VSL */}
                <div className="relative w-full max-w-4xl mx-auto">
                    <div className="absolute inset-0 bg-yellow-500/10 blur-[60px] md:blur-[100px] rounded-full -z-10 animate-pulse"></div>
                    
                    <div className="relative aspect-video w-full rounded-xl md:rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                        <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
                            <iframe
                                className="w-full h-full"
                                src="https://www.youtube.com/embed/7iQ5BdT6R3k?autoplay=1&modestbranding=1&rel=0&showinfo=0"
                                title="Best Seller Factory VSL"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- DELAYED CONTENT --- */}
            <div className={`w-full transition-all duration-1000 ease-out transform ${showOffer ? 'opacity-100 translate-y-0 visible' : 'opacity-0 translate-y-20 invisible h-0 overflow-hidden'}`}>
                
                {/* Delayed CTA 1 */}
                <div className="max-w-4xl mx-auto px-6 mt-12 mb-24 text-center animate-bounce-subtle">
                    <button 
                        onClick={() => window.open('https://payment.ticto.app/O6CE296D4', '_blank')}
                        className="group relative w-full md:w-auto md:px-12 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-5 md:py-6 rounded-2xl text-lg md:text-2xl shadow-[0_20px_50px_rgba(234,179,8,0.3)] transition-all transform hover:scale-105"
                    >
                        <span className="flex items-center justify-center gap-3">
                            <Zap className="fill-current w-5 h-5 md:w-6 md:h-6" />
                            GENERATE MY FUTURE BEST SELLER NOW!
                            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    <p className="mt-6 text-slate-400 font-semibold text-xs md:text-sm flex items-center justify-center gap-2">
                        <CheckCircle className="text-yellow-500 w-4 h-4" /> One-time payment. Lifetime access.
                    </p>
                </div>

                {/* Section 2: What it does */}
                <section className="w-full py-20 md:py-24 bg-slate-900/50 border-y border-white/5">
                    <div className="max-w-6xl mx-auto px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-2xl md:text-5xl font-black mb-6">What does Best Seller Factory do for you?</h2>
                            <p className="text-slate-400 text-sm md:text-lg max-w-3xl mx-auto">
                                Writing an authoritative book used to take months. Researching what the audience wants, structuring chapters, and layout was a nightmare. <span className="text-white font-bold">That's over.</span>
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-12 rounded-[2rem] md:rounded-[2.5rem] border border-white/5 mb-16">
                            <p className="text-xl md:text-3xl font-bold text-center mb-12">
                                Our tool is not a simple text generator. <br/>
                                <span className="text-yellow-500">It is Market Engineering.</span>
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                                <div className="p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
                                        <Search className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold mb-3">Pain Mining</h3>
                                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">We search for what people are asking on YouTube and Google to ensure demand.</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
                                        <TrendingUp className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold mb-3">Success Modeling</h3>
                                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">We analyze what makes the top 10 best-selling books in your niche on Amazon leaders.</p>
                                </div>
                                <div className="p-6 bg-white/5 rounded-2xl md:rounded-3xl border border-white/5 hover:border-yellow-500/30 transition-all">
                                    <div className="w-10 h-10 md:w-12 md:h-12 bg-yellow-500/10 rounded-xl md:rounded-2xl flex items-center justify-center mb-6">
                                        <ShieldCheck className="text-yellow-500 w-5 h-5 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="text-lg md:text-xl font-bold mb-3">Armored Creation</h3>
                                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed">We generate dense content (12 chapters, 170+ pages) following the patterns that algorithms love.</p>
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
                                <h2 className="text-2xl md:text-5xl font-black mb-6">What's in your Complete Kit <span className="text-yellow-500">(.ZIP File)</span></h2>
                                <p className="text-slate-400 text-sm md:text-lg mb-8">
                                    You don't just get a text. You get a business ready to publish. After 30 minutes, you download a file containing:
                                </p>
                                <ul className="space-y-3 md:space-y-4">
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <BookOpen className="text-yellow-500 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-white">Complete Book:</strong> 12 chapters, 170+ pages, with TOC, Credits, and Dedication in Editable Word.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <TrendingUp className="text-yellow-500 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-white">9 Title Options:</strong> Created to attract clicks and sales based on psychological triggers.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <Award className="text-yellow-500 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-white">Cover Material:</strong> Ready-to-use texts for Blurbs (Front/Back) and professional jacket.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-white/5 rounded-xl md:rounded-2xl border border-white/5">
                                        <Zap className="text-yellow-400 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-white">Amazon Arsenal (Top Seller):</strong> Standard synopsis and the 20 best Keywords for the search engine.</span>
                                    </li>
                                    <li className="flex items-start gap-4 p-4 bg-yellow-500/10 rounded-xl md:rounded-2xl border border-yellow-500/20">
                                        <PlayCircle className="text-yellow-500 shrink-0 mt-0.5 md:mt-1 w-5 h-5" />
                                        <span className="text-xs md:text-base"><strong className="text-yellow-500">Marketing Bonus:</strong> Professional description for your sales video on YouTube.</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="relative mt-8 md:mt-0">
                                <div className="absolute inset-0 bg-yellow-500/20 blur-[60px] md:blur-[100px] rounded-full"></div>
                                <div className="relative bg-slate-800 p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden group">
                                    <div className="flex flex-col items-center justify-center p-8 md:p-12 border-2 border-dashed border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] group-hover:border-yellow-500/50 transition-colors">
                                        <Download className="w-12 h-12 md:w-20 md:h-20 text-yellow-500 mb-6 animate-bounce" />
                                        <span className="text-lg md:text-2xl font-bold text-center">BestSeller_Pro_Kit.zip</span>
                                        <span className="text-xs text-slate-500 mt-2">12.5 MB • Ready to Download</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 4: Who is it for? */}
                <section className="w-full py-20 md:py-24 bg-slate-900/50 border-y border-white/5">
                    <div className="max-w-6xl mx-auto px-6">
                        <h2 className="text-2xl md:text-5xl font-black text-center mb-16">Who is Best Seller Factory for?</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { icon: <Star className="text-yellow-500" />, title: "Specialists", desc: "Who want to increase their authority and charge more for mentorships." },
                                { icon: <Target className="text-yellow-500" />, title: "Entrepreneurs", desc: "Digital creators looking for passive income on Amazon (KDP) in a scalable way." },
                                { icon: <Users className="text-yellow-500" />, title: "Speakers", desc: "Who need a book to sell at their events and courses." },
                                { icon: <Feather className="text-yellow-500" />, title: "Aspirants", desc: "You, who have a message but freeze before the white screen and don't know where to start." }
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
                            <h2 className="text-xl md:text-5xl font-black mb-8">This entire Ecosystem for the price of a Pizza.</h2>
                            <div className="mb-12">
                                <span className="text-slate-400 line-through text-lg md:text-2xl">From R$ 197,90</span>
                                <div className="flex items-center justify-center gap-2 mt-2">
                                    <span className="text-slate-400 text-lg md:text-2xl font-bold">For only</span>
                                    <span className="text-4xl md:text-8xl font-black text-white">R$ 39,90</span>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => window.open('https://payment.ticto.app/O6CE296D4', '_blank')}
                                className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-black py-5 md:py-6 rounded-2xl text-lg md:text-3xl shadow-xl transition-all transform hover:scale-105 mb-8"
                            >
                                I WANT MY COMPLETE BOOK FOR R$ 39.90
                            </button>

                            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 text-slate-400 text-[10px] md:text-sm font-medium">
                                <span className="flex items-center gap-2 text-center justify-center"><CheckCircle className="text-green-500 w-4 h-4 md:w-5 md:h-5" /> Satisfaction guaranteed or your money back within 7 days.</span>
                                <span className="flex items-center gap-2 text-center justify-center"><ShieldCheck className="text-blue-500 w-4 h-4 md:w-5 md:h-5" /> 100% Secure Purchase</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Section 6: FAQ */}
                <section className="w-full py-20 md:py-24 mb-10">
                    <div className="max-w-4xl mx-auto px-6">
                        <h2 className="text-2xl md:text-4xl font-black text-center mb-16 flex items-center justify-center gap-3">
                            <HelpCircle className="text-yellow-500" /> Quick FAQ
                        </h2>
                        <div className="grid grid-cols-1 gap-4 md:gap-6">
                            {[
                                { q: "Do I need to write anything?", a: "No. The tool generates everything autonomously from the chosen topic using our exclusive Artificial Intelligence engine." },
                                { q: "Does the book come formatted?", a: "Yes, we deliver the file ready in Word for layout or direct publishing with all professional items." },
                                { q: "Can I publish on Amazon?", a: "Yes, the creation engine is fully 'Amazon-Ready', optimized for KDP standards." }
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
                            <span className="font-black text-lg md:text-xl tracking-tight">Best Seller Factory</span>
                        </div>
                        
                        <div className="text-slate-500 text-[9px] md:text-xs space-y-6">
                            <nav className="flex justify-center gap-4 md:gap-6 mb-8 text-slate-400 underline underline-offset-4">
                                <a href="/terms" className="hover:text-white transition">Terms of Use</a>
                                <a href="/privacy-policy" className="hover:text-white transition">Privacy Policy</a>
                            </nav>
                            <p className="max-w-xl mx-auto leading-relaxed italic opacity-70">
                                "This site is not affiliated with Facebook, Google or YouTube. Results vary according to each author's niche and effort."
                            </p>
                            <p>© 2026 Best Seller Factory. All rights reserved.</p>
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

export default LandingPageEnglish;
