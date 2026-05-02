
import React from 'react';
import { Construction, ShoppingCart } from 'lucide-react';

interface PlaceholderViewProps {
    title: string;
    description?: string;
}

export const PlaceholderView: React.FC<PlaceholderViewProps> = ({ title, description }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-fade-in">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400">
                <Construction size={48} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-4">{title}</h2>
            <p className="text-slate-500 max-w-md font-medium text-lg leading-relaxed">
                {description || "Estamos trabalhando duro para liberar esta funcionalidade o mais rápido possível. Fique atento às novidades!"}
            </p>
            <div className="mt-8 px-6 py-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl font-bold uppercase tracking-widest text-xs">
                🛠️ Em Preparação
            </div>
        </div>
    );
};

export const ExternalProductView: React.FC<{ title: string; desc: string; videoId: string; checkoutUrl: string; price: string }> = ({ 
    title, desc, videoId, checkoutUrl, price 
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center">
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">{title}</h2>
                <p className="text-slate-500 font-medium text-lg">{desc}</p>
            </div>

            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl overflow-hidden">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black mb-8">
                    <iframe
                        className="absolute inset-0 w-full h-full"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <div className="text-center">
                        <p className="text-sm text-slate-400 uppercase font-black tracking-widest mb-1">Acesso Imediato por apenas</p>
                        <div className="text-5xl font-black text-slate-900">{price}</div>
                    </div>

                    <a
                        href={checkoutUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full max-w-md bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 uppercase tracking-widest text-lg hover:scale-105 active:scale-95"
                    >
                        <ShoppingCart size={24} />
                        <span>Comprar Agora</span>
                    </a>
                </div>
            </div>
        </div>
    );
};
