
import React from 'react';
import { IconBook, IconStar, IconDownload, IconTrash } from './Icons'; // I'll move icons to a separate file or keep them here
import { CheckCircle, Clock, MessageCircle, ExternalLink } from 'lucide-react';
import { SocialShare } from './SocialShare';
import { useLanguage } from '../i18n/context';

// Local Icons for BookGeneratorView
const LocalIconBook = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>;
const LocalIconDownload = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>;
const LocalIconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>;

interface BookGeneratorViewProps {
    stats: any;
    hasCredits: boolean;
    pendingInvoice: boolean;
    invoiceUrl: string | null;
    nextBookDisplayPrice: number;
    onNewBook: () => void;
    handleBuyCredit: (price: number) => void;
    handleVerifyAndEnter: () => void;
    handleDeleteProject: (id: string) => void;
    getApiBase: () => string;
}

export const BookGeneratorView: React.FC<BookGeneratorViewProps> = ({
    stats, hasCredits, pendingInvoice, invoiceUrl, nextBookDisplayPrice,
    onNewBook, handleBuyCredit, handleVerifyAndEnter, handleDeleteProject, getApiBase
}) => {
    const { t, lang } = useLanguage();
    const planName = stats?.plan?.name || "FREE";
    const planStatus = stats?.plan?.status || "INACTIVE";
    const orders = stats?.orders || [];
    const displayOrders = orders.filter((o: any) => o.status !== 'CREDIT_AVAILABLE');

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Promo Blocked Alert */}
            {stats?.stats?.promo_blocked && (
                <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 md:p-8 flex items-start gap-4 animate-shake shadow-xl shadow-red-100">
                    <div className="bg-red-500 text-white p-3 rounded-2xl shrink-0 shadow-lg shadow-red-200">
                        <AlertCircle size={28} />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-red-900 uppercase tracking-tight mb-1">
                            {lang === 'en' ? 'Offer Already Used' : 'Oferta Já Utilizada'}
                        </h3>
                        <p className="text-red-700 font-medium leading-relaxed">
                            {lang === 'en' 
                                ? 'We detected that you have already taken advantage of the special R$ 5.99 offer. This condition is valid only for the FIRST book. To generate more books, please use the standard R$ 39.90 plan below.' 
                                : 'Identificamos que você já aproveitou a oferta especial de R$ 5,99 anteriormente. Esta condição é válida apenas para o PRIMEIRO livro. Para gerar novos livros, utilize o plano padrão de R$ 39,90 abaixo.'}
                        </p>
                    </div>
                </div>
            )}

            {/* Action Card - Fixed Price */}
            <div className="bg-slate-900 rounded-3xl p-6 md:p-10 text-white shadow-xl relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h2 className="text-2xl md:text-3xl font-black mb-4 flex items-center justify-center md:justify-start gap-3">
                            <span className="text-emerald-400"><LocalIconBook /></span>
                            {(t as any).dashboard.generatorTitle}
                        </h2>
                        <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                            {hasCredits ? (
                                (t as any).dashboard.creditAvailable
                            ) : (
                                <>
                                    {(t as any).dashboard.currentMode} <strong>{planStatus === 'ACTIVE' ? planName : (t as any).dashboard.modeAvulso}</strong>.
                                    {(t as any).dashboard.feeLabel}
                                    <span className="text-white font-bold mx-1">
                                        {lang === 'en' ? '$' : 'R$'} {lang === 'en' ? nextBookDisplayPrice.toFixed(2) : nextBookDisplayPrice.toFixed(2).replace('.', ',')}
                                    </span>
                                    {lang === 'en' ? 'Leverage the power of AI to create your library right now.' : 'Aproveite o poder da IA para criar sua biblioteca agora mesmo.'}
                                </>
                            )}
                        </p>
                    </div>

                    <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700 w-full md:w-auto min-w-[300px]">
                        {hasCredits ? (
                            <div className="flex flex-col gap-4">
                                <div className="text-center mb-2">
                                    <div className="inline-block p-3 bg-emerald-500/20 rounded-full mb-2 animate-bounce">
                                        <span className="text-2xl">✨</span>
                                    </div>
                                    <p className="text-xs text-emerald-400 uppercase font-bold tracking-widest">{(t as any).dashboard.accessReleased}</p>
                                </div>
                                <button
                                    onClick={onNewBook}
                                    className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black py-6 rounded-2xl transition-all flex flex-col items-center justify-center gap-1 shadow-2xl shadow-emerald-500/40 transform hover:scale-[1.05] active:scale-95 group"
                                >
                                    <span className="text-2xl group-hover:animate-pulse">{(t as any).dashboard.generateButton}</span>
                                    <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">{(t as any).dashboard.clickToUseCredit}</span>
                                </button>
                            </div>
                        ) : pendingInvoice ? (
                            <>
                                <div className="text-center mb-6">
                                    <div className="inline-block p-3 bg-yellow-500/20 text-yellow-500 rounded-full mb-2 animate-pulse">
                                        <Clock size={24} />
                                    </div>
                                    <p className="text-sm font-bold text-yellow-400">{(t as any).dashboard.waitingPayment}</p>
                                    <p className="text-xs text-slate-400 mt-2">{(t as any).dashboard.waitInvoice}</p>
                                </div>
                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={handleVerifyAndEnter}
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-600"
                                    >
                                        <CheckCircle size={18} /> {(t as any).dashboard.refreshStatus}
                                    </button>
                                    {invoiceUrl && (
                                        <a
                                            href={invoiceUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full text-center text-xs text-slate-400 hover:text-white underline mt-2"
                                        >
                                            {(t as any).dashboard.payNow}
                                        </a>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-center mb-6">
                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-widest mb-1">{lang === 'en' ? 'Generation Cost' : 'Custo da Geração'}</p>
                                    <div className="text-4xl font-black text-white">{lang === 'en' ? '$' : 'R$'} {lang === 'en' ? nextBookDisplayPrice.toFixed(2) : nextBookDisplayPrice.toFixed(2).replace('.', ',')}</div>
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        onClick={() => handleBuyCredit(nextBookDisplayPrice)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-lg"
                                    >
                                        <span>🛒</span> {(t as any).dashboard.buyCredit}
                                    </button>

                                    <button
                                        onClick={handleVerifyAndEnter}
                                        className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-600"
                                    >
                                        <CheckCircle size={18} /> {(t as any).dashboard.alreadyPaid}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* [NEW] VIDEO SECTION */}
            <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-200 shadow-xl overflow-hidden">
                <div className="text-center mb-8">
                    <h3 className="text-xl md:text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                        {(t as any).dashboard.videoTitle}
                    </h3>
                </div>
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-200">
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/uBvagSevkaI"
                        title={lang === 'en' ? "Instructional Video" : "Vídeo de Instruções"}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            </div>

            {/* History (Meus Livros) */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-xl overflow-hidden mt-12 mb-12">
                <div className="bg-slate-50 px-8 py-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-black text-slate-900 text-xl uppercase tracking-tighter">{(t as any).dashboard.myBooks}</h3>
                    <span className="text-xs font-black text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full tracking-widest">
                        {displayOrders.length} {(t as any).dashboard.projectsCount}
                    </span>
                </div>

                {displayOrders.length === 0 ? (
                    <div className="p-20 text-center text-slate-400">
                        <div className="mb-6 opacity-20 transform scale-150"><LocalIconBook /></div>
                        <p className="text-lg font-medium">{(t as any).dashboard.noBooks}</p>
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-indigo-600 font-bold hover:underline mt-4 text-sm uppercase tracking-widest">{(t as any).dashboard.startNow}</button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {displayOrders.map((order: any, idx: number) => (
                            <div key={order.id || `book-${idx}`} className="p-4 md:p-6 hover:bg-slate-50/20 transition group relative overflow-hidden">
                                    <div className="flex flex-col xl:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-6 w-full xl:w-auto">
                                        <div className="w-14 h-16 md:w-16 md:h-20 bg-white rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl shadow-md border border-slate-100 group-hover:scale-110 transition-transform duration-500">
                                            📚
                                        </div>
                                        <div translate="no" className="min-w-0">
                                            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.3em] mb-1 block leading-none">{(t as any).dashboard.bookTitleLabel}</span>
                                            <h4 className="font-black text-slate-900 text-lg md:text-xl uppercase tracking-tighter italic leading-none truncate">
                                                {order.title || (t as any).dashboard.bookTitleFallback}
                                            </h4>
                                            
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">{(t as any).dashboard.authorLabel}</span>
                                                    <span className="text-sm font-bold text-slate-600 tracking-tight">{order.authorName || 'Autor'}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">{(t as any).dashboard.creationDate}</span>
                                                    <span className="text-sm font-bold text-slate-500 tracking-tight">{order.date ? new Date(order.date).toLocaleDateString() : (t as any).dashboard.dateUnknown}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto justify-end">
                                        <span className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY', 'DONE', 'FINISHED'].includes((order.status || '').toUpperCase())) 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            ((order.status || '').toUpperCase() === 'IN_PROGRESS' || (order.status || '').toUpperCase() === 'WRITING_CHAPTERS') 
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                            {(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY', 'DONE', 'FINISHED'].includes((order.status || '').toUpperCase())) ? (t as any).dashboard.statusGenerated :
                                                ((order.status || '').toUpperCase() === 'IN_PROGRESS' || (order.status || '').toUpperCase() === 'WRITING_CHAPTERS') ? (t as any).dashboard.statusProcessing :
                                                    (t as any).dashboard.statusWaiting}
                                        </span>

                                        {(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY', 'DONE', 'FINISHED'].includes((order.status || '').toUpperCase())) && (
                                            <a
                                                href={order.downloadUrl?.startsWith('http') ? order.downloadUrl : `${getApiBase()}${order.downloadUrl || `/api/projects/${order.id}/download-zip`}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all font-black text-[10px] shadow-lg shadow-indigo-100 uppercase tracking-widest hover:scale-105 active:scale-95"
                                            >
                                                <LocalIconDownload />
                                                <span>{(t as any).dashboard.downloadKit}</span>
                                            </a>
                                        )}

                                        {(!(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY', 'DONE', 'FINISHED'].includes((order.status || '').toUpperCase()))) && (
                                            <button
                                                onClick={async () => {
                                                    if (!window.confirm("O livro travou? Clique em OK para forçar a inteligência artificial a retomar de onde parou.")) return;
                                                    const token = localStorage.getItem('bsf_token');
                                                    try {
                                                        const res = await fetch(`${getApiBase()}/api/projects/${order.id}/resume`, {
                                                            method: 'POST',
                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                        });
                                                        if(res.ok) {
                                                            alert("Sinal de retomada enviado! A inteligência artificial assumiu o controle novamente. Atualize a página em alguns instantes.");
                                                        } else {
                                                            alert("Erro ao enviar sinal de retomada.");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-6 py-3.5 bg-amber-500 text-white rounded-2xl hover:bg-amber-600 transition-all font-black text-[10px] shadow-lg shadow-amber-100 uppercase tracking-widest hover:scale-105 active:scale-95"
                                                title="Retomar Geração de Onde Parou"
                                            >
                                                <span>▶️ Continuar Geração</span>
                                            </button>
                                        )}
                                        
                                        <button
                                            onClick={() => handleDeleteProject(order.id)}
                                            className="p-4 bg-white border border-red-100 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                            title={(t as any).dashboard.deleteProject}
                                        >
                                            <LocalIconTrash />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="pt-8 border-t border-slate-200">
                <SocialShare
                    text={lang === 'en' ? "I'm creating amazing books with AI! Check out Best Seller Factory." : "Estou criando livros incríveis com Inteligência Artificial! Conheça a Fábrica de Best Sellers."}
                    className="opacity-70 hover:opacity-100 transition-opacity"
                />
            </div>
        </div>
    );
};
