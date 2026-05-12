
import React, { useState } from 'react';
import { QrCode, Download, ShoppingCart, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { getApiBase } from '../services/api';

interface QrCodeGeneratorProps {
    credits: number;
    userEmail: string;
    onRefresh: () => void;
}

const QrCodeGenerator: React.FC<QrCodeGeneratorProps> = ({ credits, userEmail, onRefresh }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

    const handleDownload = async (urlToDownload?: string) => {
        const dUrl = urlToDownload || generatedUrl;
        if (!dUrl) return;
        
        try {
            const response = await fetch(dUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `qrcode_${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error("Erro ao baixar imagem:", err);
            const link = document.createElement('a');
            link.href = dUrl;
            link.download = `qrcode_${Date.now()}.png`;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const handleGenerate = async () => {
        if (!url) {
            setError('Por favor, informe o link/URL.');
            return;
        }
        if (credits <= 0) {
            setError('Você não possui créditos suficientes.');
            return;
        }

        setLoading(true);
        setError('');
        setGeneratedUrl(null);

        try {
            const res = await fetch(`${getApiBase()}/api/qr/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('bsf_token')}`
                },
                body: JSON.stringify({ 
                    url,
                    email: userEmail 
                })
            });

            const data = await res.json();

            if (res.ok) {
                const finalUrl = data.url.startsWith('http') ? data.url : `${getApiBase()}${data.url}`;
                setGeneratedUrl(finalUrl);
                onRefresh(); // Update credits
                
                // TRIGGER AUTOMATIC DOWNLOAD
                setTimeout(() => handleDownload(finalUrl), 500);
            } else {
                setError(data.error || 'Erro ao gerar QR Code.');
            }
        } catch (err: any) {
            setError('Erro de conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            {/* Header Section */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-200">
                            <QrCode size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Gerador de QR Code</h2>
                            <p className="text-slate-500 font-medium">Crie um QR Code profissional para seu site, redes sociais ou canal.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Meus Créditos</span>
                                <span className="text-2xl font-black text-emerald-600">{credits}</span>
                            </div>
                            <div className="w-px h-8 bg-slate-200 mx-1"></div>
                            <CheckCircle className={credits > 0 ? "text-emerald-500" : "text-slate-300"} size={24} />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Control Panel */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 h-full">
                        <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                            <Info size={18} className="text-emerald-500" />
                            Configurações do QR Code
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">Link de Destino</label>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="Ex: https://meusite.com.br"
                                    className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700 text-lg"
                                />
                                <p className="text-[11px] text-slate-400 mt-2 italic">Insira o link completo (incluindo https://) para garantir o funcionamento.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Qualidade</span>
                                    <span className="text-sm font-bold text-slate-700 block">Alta Resolução</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Formato</span>
                                    <span className="text-sm font-bold text-slate-700 block">PNG (Transparente)</span>
                                </div>
                            </div>

                            {credits > 0 ? (
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !url}
                                    className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 text-lg"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>GERANDO QR CODE...</span>
                                        </>
                                    ) : (
                                        <>
                                            <QrCode size={24} />
                                            <span>GERAR MEU QR CODE AGORA!</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                                        <AlertCircle className="text-amber-500 mt-0.5 shrink-0" size={20} />
                                        <div>
                                            <p className="text-sm font-bold text-amber-800">Créditos Esgotados</p>
                                            <p className="text-xs text-amber-700 mt-1">
                                                Adquira créditos para gerar seu QR Code personalizado. Ideal para divulgar seu livro, redes sociais ou contato.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <a
                                        href="https://checkout.ticto.app/O8B28DD61"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center justify-center gap-3 text-lg group"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-2">
                                                <ShoppingCart size={24} />
                                                <span>COMPRAR CRÉDITO R$ 7,00</span>
                                            </div>
                                            <span className="text-[10px] opacity-70">Preço Promocional de Lançamento | <strong>Apenas R$ 7,00</strong></span>
                                        </div>
                                    </a>
                                </div>
                            )}

                            {error && (
                                <p className="text-center text-rose-600 font-bold text-sm bg-rose-50 py-3 rounded-xl border border-rose-100 animate-shake">
                                    ❌ {error}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Preview Panel */}
                <div className="lg:col-span-5">
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-xl h-full flex flex-col items-center justify-center text-center border border-slate-800 relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent"></div>
                        
                        {generatedUrl ? (
                            <div className="relative z-10 w-full animate-scale-up">
                                <div className="bg-white p-6 rounded-2xl shadow-2xl mb-6 inline-block">
                                    <img src={generatedUrl} alt="QR Code Preview" className="max-w-full h-auto" />
                                </div>
                                <h4 className="text-white font-black text-xl mb-2">QR Code Gerado!</h4>
                                <p className="text-slate-400 text-sm mb-8">Escaneie com a câmera do seu celular para testar.</p>
                                
                                <button
                                    onClick={() => handleDownload()}
                                    className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                                    BAIXAR EM PNG
                                </button>
                                
                                <button
                                    onClick={() => setGeneratedUrl(null)}
                                    className="mt-4 text-slate-500 font-bold text-sm hover:text-slate-300 transition-colors"
                                >
                                    Gerar outro QR Code
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10 py-12">
                                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
                                    <QrCode size={40} className="text-slate-600" />
                                </div>
                                <h4 className="text-slate-400 font-bold text-lg mb-2">Pré-visualização</h4>
                                <p className="text-slate-600 text-sm max-w-[200px] mx-auto">
                                    Cole o link desejado e clique em gerar para visualizar seu QR Code aqui.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Instruction Footer */}
            <div className="mt-12 bg-white/50 backdrop-blur-sm p-8 rounded-3xl border border-slate-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h4 className="font-black text-slate-800 flex items-center gap-2">
                            <Info size={18} className="text-emerald-500" />
                            ONDE USAR SEU QR CODE?
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                <span><strong>Contracapa:</strong> Leve o leitor direto para seu site ou Instagram.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                <span><strong>Marcador de Páginas:</strong> Divulgue seus outros livros e cursos.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                                <span><strong>Material de Marketing:</strong> Cartões de visita e banners de divulgação.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-emerald-600 p-6 rounded-2xl text-white shadow-lg shadow-emerald-100">
                        <h4 className="font-black mb-2 flex items-center gap-2 uppercase">
                            <QrCode size={18} />
                            Dica de Autor
                        </h4>
                        <p className="text-sm opacity-90 leading-relaxed">
                            Crie um QR Code que leve para um grupo de WhatsApp ou uma lista de e-mails. 
                            Ter contato direto com seus leitores é o segredo para construir uma carreira de sucesso.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QrCodeGenerator;
