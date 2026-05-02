import React, { useState } from 'react';
import { Barcode, Download, ShoppingCart, Info, AlertCircle, FileText, CheckCircle } from 'lucide-react';

interface BarcodeGeneratorProps {
    credits: number;
    userEmail: string;
    onRefresh: () => void;
}

const BarcodeGenerator: React.FC<BarcodeGeneratorProps> = ({ credits, userEmail, onRefresh }) => {
    const [isbn, setIsbn] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!isbn) {
            setError('Por favor, informe o ISBN.');
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
            const res = await fetch('/api/barcode/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ isbn })
            });

            const data = await res.json();

            if (res.ok) {
                setGeneratedUrl(data.url);
                onRefresh(); // Update credits
            } else {
                setError(data.error || 'Erro ao gerar código de barras.');
            }
        } catch (err: any) {
            setError('Erro de conexão com o servidor.');
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!generatedUrl) return;
        const link = document.createElement('a');
        link.href = generatedUrl;
        link.download = `barcode_${isbn.replace(/[-\s]/g, '')}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in pb-20">
            {/* Header Section */}
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-200">
                            <Barcode size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Gerador de Código de Barras</h2>
                            <p className="text-slate-500 font-medium">Gere seu código de barras ISBN profissional em alta resolução.</p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                            <div className="text-right">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Meus Créditos</span>
                                <span className="text-2xl font-black text-blue-600">{credits}</span>
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
                            <Info size={18} className="text-blue-500" />
                            Configurações do Código
                        </h3>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black uppercase text-slate-400 tracking-widest mb-2">ISBN do Livro</label>
                                <input
                                    type="text"
                                    value={isbn}
                                    onChange={(e) => setIsbn(e.target.value)}
                                    placeholder="Ex: 978-65-00-00000-0"
                                    className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 text-lg"
                                />
                                <p className="text-[11px] text-slate-400 mt-2 italic">O sistema removerá traços e espaços automaticamente para a geração.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Dimensões</span>
                                    <span className="text-sm font-bold text-slate-700 block">50mm x 25mm</span>
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Resolução</span>
                                    <span className="text-sm font-bold text-slate-700 block">300 DPI (Profissional)</span>
                                </div>
                            </div>

                            {credits > 0 ? (
                                <button
                                    onClick={handleGenerate}
                                    disabled={loading || !isbn}
                                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-3 text-lg"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>GERANDO CÓDIGO...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Barcode size={24} />
                                            <span>GERAR CÓDIGO DE BARRAS AGORA</span>
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
                                                Adquira créditos para gerar seu código de barras profissional. O código é essencial para a venda em livrarias e marketplaces.
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <a
                                        href="https://checkout.ticto.app/O77037442" // Update with real link if needed
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-3 text-lg group"
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="flex items-center gap-2">
                                                <ShoppingCart size={24} />
                                                <span>COMPRAR CRÉDITO R$ 27,90</span>
                                            </div>
                                            <span className="text-[10px] opacity-70">De <del>R$ 68,60</del> por apenas R$ 27,90</span>
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
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent"></div>
                        
                        {generatedUrl ? (
                            <div className="relative z-10 w-full animate-scale-up">
                                <div className="bg-white p-6 rounded-2xl shadow-2xl mb-6 inline-block">
                                    <img src={generatedUrl} alt="Barcode Preview" className="max-w-full h-auto" />
                                </div>
                                <h4 className="text-white font-black text-xl mb-2">Código Gerado!</h4>
                                <p className="text-slate-400 text-sm mb-8">O código está pronto para ser utilizado na capa do seu livro.</p>
                                
                                <button
                                    onClick={handleDownload}
                                    className="w-full py-4 bg-white text-slate-900 font-black rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                                    BAIXAR EM PNG
                                </button>
                                
                                <button
                                    onClick={() => setGeneratedUrl(null)}
                                    className="mt-4 text-slate-500 font-bold text-sm hover:text-slate-300 transition-colors"
                                >
                                    Gerar outro ISBN
                                </button>
                            </div>
                        ) : (
                            <div className="relative z-10 py-12">
                                <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
                                    <Barcode size={40} className="text-slate-600" />
                                </div>
                                <h4 className="text-slate-400 font-bold text-lg mb-2">Pré-visualização</h4>
                                <p className="text-slate-600 text-sm max-w-[200px] mx-auto">
                                    Insira o ISBN e clique em gerar para visualizar o código de barras aqui.
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
                            <Info size={18} className="text-blue-500" />
                            ORIENTAÇÕES IMPORTANTES
                        </h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <span>O código é gerado no padrão <strong>EAN-13</strong>, obrigatório para livros comerciais.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <span>Ideal para aplicação direta em ferramentas como Canva, Photoshop ou InDesign.</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0"></div>
                                <span>Certifique-se de que o ISBN informado é o oficial registrado na CBL.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-100">
                        <h4 className="font-black mb-2 flex items-center gap-2 uppercase">
                            <AlertCircle size={18} />
                            Atenção
                        </h4>
                        <p className="text-sm opacity-90 leading-relaxed">
                            Após efetuar seu pagamento, retorne para esta página e gere seu Código de Barras Profissional. 
                            O arquivo gerado possui as dimensões exatas recomendadas para impressão de alta qualidade.
                        </p>
                        <p className="text-[10px] font-bold uppercase mt-4 text-center opacity-80">
                            LEMBRAR QUE O GERADOR FUNCIONA UTILIZANDO APENAS OS LIVROS GERADOS PELA FÁBRICA DE BEST SELLER.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BarcodeGenerator;
