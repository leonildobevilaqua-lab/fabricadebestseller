import React, { useState } from 'react';
import { 
    ShoppingBag, Video, Edit3, CheckCircle2, 
    Sparkles, ShieldCheck, ChevronRight, Lock, Save, X,
    MessageCircle, BookOpen, Zap, Award, Download, Trash2, Clock
} from 'lucide-react';
import { useLanguage } from '../i18n/context';

export interface ProductItem {
    id: string;
    title: string;
    category: 'registro' | 'design' | 'publicacao' | 'combo';
    shortDesc: string;
    originalPrice: string;
    promoPrice: string;
    discountBadge?: string;
    checkoutUrl: string;
    defaultVideoId: string;
    badgeText?: string;
    isComingSoon?: boolean;
    features?: string[];
    isInternalTool?: boolean;
    internalTabId?: string;
    creditKey?: string; // key in stats object
    buttonTextOverride?: string;
    secondaryUrl?: string;
    secondaryUrlText?: string;
}

const DEFAULT_PRODUCTS: ProductItem[] = [
    {
        id: 'livro',
        title: 'Gerador Automático de Livros (IA)',
        category: 'combo',
        shortDesc: 'Crie seu livro completo de não-ficção com mais de 170 páginas estruturadas, inteligência de pesquisa e escrita viral.',
        originalPrice: 'De R$ 97,90',
        promoPrice: 'por R$ 39,90',
        discountBadge: 'IMPACTO 170+ PÁGS',
        checkoutUrl: 'https://payment.ticto.app/O6CE296D4',
        defaultVideoId: 'IvnqMv3efcs',
        isInternalTool: true,
        internalTabId: 'livro',
        creditKey: 'credits',
        badgeText: 'DESTAQUE PRINCIPAL',
        features: ['Livro completo com 170 a 210 páginas', 'Pesquisa de mercado com IA', 'Escrita viral e formatação pronta']
    },
    {
        id: 'cbl-tutorial',
        title: 'Tutorial de Registro na CBL',
        category: 'registro',
        shortDesc: 'Aprenda o passo a passo completo para registrar seu livro na Câmara Brasileira do Livro e garantir seus Direitos Autorais.',
        originalPrice: 'De R$ 97,90',
        promoPrice: 'por R$ 19,90',
        discountBadge: '80% OFF',
        checkoutUrl: 'https://checkout.ticto.app/O77037442',
        defaultVideoId: 'NeM3tTW7MgU',
        features: ['Passo a passo em vídeo', 'Emissão direta na CBL', 'Garantia de Direitos Autorais']
    },
    {
        id: 'ficha-catalografica',
        title: 'Ficha Catalográfica (CIP)',
        category: 'registro',
        shortDesc: 'Emissão oficial de Ficha Catalográfica padronizada AACR2 / Código Decimal Universal essencial para biblioteca e livrarias.',
        originalPrice: 'De R$ 68,60',
        promoPrice: 'por R$ 27,90',
        discountBadge: '59% OFF',
        checkoutUrl: 'https://payment.ticto.app/O89DB6739',
        defaultVideoId: 'qSRTerJCeNo',
        isInternalTool: true,
        internalTabId: 'ficha-catalografica',
        creditKey: 'cipCredits',
        features: ['Normas AACR2/CDU', 'Formato Word 100% Editável', 'Essencial para distribuição', 'Configuração Profissional']
    },
    {
        id: 'barras',
        title: 'Código de Barras EAN-13',
        category: 'registro',
        shortDesc: 'Gerador profissional de Código de Barras vetorizado em Alta Resolução (EAN-13 / ISBN) pronto para a capa do seu livro.',
        originalPrice: 'De R$ 41,20',
        promoPrice: 'por R$ 19,90',
        discountBadge: '51% OFF',
        checkoutUrl: 'https://payment.ticto.app/O9012A440',
        defaultVideoId: 'AYMn8C3kpmY',
        isInternalTool: true,
        internalTabId: 'barras',
        creditKey: 'barcodeCredits',
        features: ['Vetor SVG + PNG Alta Resolução', 'Leitura Garantida em Livrarias', 'Pronto para Impressão']
    },
    {
        id: 'qr-code',
        title: 'Gerador de QR Code Interativo',
        category: 'registro',
        shortDesc: 'Crie QR Codes personalizados de alta conversão para direcionar seus leitores para suas redes, ofertas ou bônus.',
        originalPrice: 'De R$ 29,90',
        promoPrice: 'por R$ 7,00',
        discountBadge: '76% OFF',
        checkoutUrl: 'https://payment.ticto.app/O8B28DD61',
        defaultVideoId: '5JQd-9gdzA8',
        isInternalTool: true,
        internalTabId: 'qr-code',
        creditKey: 'qrCredits',
        features: ['Personalização com Logo', 'Links Dinâmicos', 'Alta Resolução para Capa e Miolo']
    },
    {
        id: 'pacote-completo',
        title: 'PACOTE DE REGISTRO COMPLETO',
        category: 'combo',
        shortDesc: 'Combo Completo com Ficha Catalográfica + Código de Barras EAN-13 + QR Code Interativo. Economia máxima e profissionalismo total.',
        originalPrice: 'De R$ 167,60',
        promoPrice: 'por R$ 49,90',
        discountBadge: 'OFERTA CAMPEÃ',
        checkoutUrl: 'https://checkout.ticto.app/OAE19BCE4',
        defaultVideoId: 'WbiFZDC8GPA',
        badgeText: 'MAIS VENDIDO',
        features: ['Ficha Catalográfica CIP', 'Código de Barras EAN-13', 'QR Code Interativo', 'Economia de R$ 117,70']
    },
    {
        id: 'diagramacao-formatacao-360',
        title: 'Diagramação e Formatação 360 Express',
        category: 'design',
        shortDesc: 'Transforme seu manuscrito em um livro profissional formatado para impressão e e-book conforme os padrões da Amazon KDP e UICLAP.',
        originalPrice: 'De R$ 247,00',
        promoPrice: 'por R$ 97,00',
        discountBadge: '60% OFF',
        checkoutUrl: 'https://checkout.ticto.app/O2674C7CD',
        defaultVideoId: 'q9xnlFfdWok',
        badgeText: 'NOVO',
        features: ['Pronto para Amazon & Impressão', 'Tipografia Editorial de Elite', 'Entregue Formatado']
    },
    {
        id: 'capa-fisica',
        title: 'Criação de Capa Profissional (Físico & Ebook)',
        category: 'design',
        shortDesc: 'Design de capa de alto impacto com inteligência de conversão visual. Lombada, quarta capa e orelhas configuradas.',
        originalPrice: 'De R$ 497,00',
        promoPrice: 'por R$ 149,90',
        discountBadge: '70% OFF',
        checkoutUrl: 'https://checkout.ticto.app/O6FA2355C',
        defaultVideoId: 'K7AAxtH69WM',
        features: ['Design Capa Frente + Verso + Lombada', 'Alta Resolução 300 DPI (CMYK)', '6 Modelos Profissionais Editáveis (Canva)', 'Padrão Oficial Amazon e UICLAP']
    },
    {
        id: 'amazon',
        title: '"Desafio P72H" Publicação na Amazon',
        category: 'publicacao',
        shortDesc: 'Treinamento completo para publicar seu e-book na Amazon KDP em 72 horas e alcançar suas vendas.',
        originalPrice: 'De R$ 199,90',
        promoPrice: 'por R$ 97,90',
        discountBadge: '51% OFF',
        checkoutUrl: 'https://checkout.ticto.app/O32C21B1D',
        defaultVideoId: '_mVw5W1_prk',
        features: ['Passo a Passo detalhado', 'SEO Amazon KDP', 'Do Zero ao Lançamento em 72h', 'Publicação de Livro Físico']
    },
    {
        id: 'metodo-business-express',
        title: 'Método Publicação Business Express',
        category: 'publicacao',
        shortDesc: 'Pacote completo de produtos, serviços e cursos para você aprender como publicar seus livros em tempo recorde.',
        originalPrice: 'De R$ 997,00',
        promoPrice: 'por R$ 497,00',
        discountBadge: '50% OFF',
        checkoutUrl: 'https://payment.ticto.app/O3B546B05',
        defaultVideoId: 'nmMUtAPHIZ0',
        badgeText: 'EXCLUSIVO 🔥',
        features: ['Torne-se um autor de verdade', 'Publica na Amazon e na UICLAP', 'Método 100% prático', 'Aprenda todos os passos necessários']
    },
    {
        id: 'uiclap',
        title: 'Autopublicação Express UICLAP',
        category: 'publicacao',
        shortDesc: 'Publique seu livro impresso no Brasil sem custos de tiragem com impressão sob demanda e venda nacional.',
        originalPrice: 'De R$ 199,90',
        promoPrice: 'por R$ 97,90',
        discountBadge: '51% OFF',
        checkoutUrl: 'https://checkout.ticto.app/OED0004AF',
        defaultVideoId: 'iSgMWKwkkTw',
        features: ['Livro Físico Sob Demanda', 'Sem Estoque Mínimo', 'Distribuição Nacional']
    },
    {
        id: 'ticto',
        title: 'Publicação Profissional TICTO',
        category: 'publicacao',
        shortDesc: 'Estruturação completa de funil de vendas de livros digitais e físicos na plataforma TICTO.',
        originalPrice: 'De R$ 297,00',
        promoPrice: 'Em Breve',
        checkoutUrl: '#',
        defaultVideoId: 'NeM3tTW7MgU',
        isComingSoon: true,
        features: ['Funil de Vendas com Upsell', 'Integração de Checkouts', 'Lançamento em Breve']
    },
    {
        id: 'afiliado-raa',
        title: 'Torne-se um RAA',
        category: 'publicacao',
        shortDesc: 'Representante Afiliado Autorizado - Ganhe comissões de até R$ 275,86 por indicação do Método Publicação Business Express.',
        originalPrice: 'Taxa de Ingresso',
        promoPrice: 'por R$ 91,60',
        discountBadge: 'AFILIAÇÃO',
        checkoutUrl: 'https://dash.ticto.com.br/invitation/affiliation/P34C6A34B',
        defaultVideoId: 'sexmf3LvJ9c',
        badgeText: 'REPRESENTANTE',
        buttonTextOverride: 'QUERO ME AFILIAR AGORA!',
        secondaryUrl: 'https://dash.ticto.com.br/signup?referrer=PIT28F3B99F',
        secondaryUrlText: 'Link de Cadastro na TICTO',
        features: ['Representante Afiliado Autorizado', 'Ganhe comissões de até R$ 275,86', 'Linha completa de produtos e serviços', 'Plataforma oficial TICTO', 'Ingresso e liberação dos links para afiliação (R$ 91,60)']
    },
    {
        id: 'comunidade-fco',
        title: 'COMUNIDADE FCO (Discord)',
        category: 'publicacao',
        shortDesc: 'Fórmula de Crescimento Online - Comunidade VIP no Discord com direito a 1 crédito mensal para gerar seus futuros livros.',
        originalPrice: 'Mensalidade',
        promoPrice: 'R$ 34,90/mês',
        discountBadge: 'DISCORD VIP',
        checkoutUrl: '#',
        defaultVideoId: '17SCmMy5ZDs',
        badgeText: 'EM BREVE 🚀',
        isComingSoon: true,
        buttonTextOverride: 'LIBERAÇÃO EM BREVE!',
        features: ['Fórmula de Crescimento Online', 'R$ 34,90 mensais', 'Direito a um crédito mensal para gerar seus futuros livros', 'Acesso à comunidade exclusiva no Discord']
    },
    {
        id: 'mentoria-leonildo',
        title: 'Mentoria Individual da FBS com Leonildo Bevilaqua',
        category: 'combo',
        shortDesc: 'Acompanhamento individual e mentoria direta com Leonildo Bevilaqua. Faça o seu sonho se tornar realidade e tenha seu livro publicado na Amazon e na UICLAP feito 100% pelo Leonildo Bevilaqua e todos os profissionais da Editora 360 Express.',
        originalPrice: 'De R$ 3.490,00',
        promoPrice: 'por R$ 1.990,00',
        discountBadge: '12x R$ 206,53',
        checkoutUrl: 'https://payment.ticto.app/O5DCE311C',
        defaultVideoId: 'ZTJ9Wig11Cc',
        badgeText: 'MENTORIA VIP 🔥',
        features: [
            'Registro na CBL',
            'Ficha Catalográfica + Código de Barras + QR Code',
            'Capa Profissional',
            'Publicação na Amazon',
            'Publicação na UICLAP',
            '10 Exemplares Físicos entregues no seu endereço'
        ]
    }
];

export interface ProductCatalogViewProps {
    onSelectTab?: (tabId: string) => void;
    stats?: any;
    hasCredits?: boolean;
    onNewBook?: () => void;
    handleBuyCredit?: (price: number) => void;
    handleDeleteProject?: (id: string) => void;
    getApiBase?: () => string;
    userEmail?: string;
}

export const ProductCatalogView: React.FC<ProductCatalogViewProps> = ({ 
    onSelectTab, 
    stats, 
    hasCredits, 
    onNewBook,
    handleBuyCredit,
    handleDeleteProject,
    getApiBase,
    userEmail 
}) => {
    const { t, lang } = useLanguage();
    const orders = stats?.orders || [];
    const displayOrders = orders.filter((o: any) => o.status !== 'CREDIT_AVAILABLE');

    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [videoOverrides, setVideoOverrides] = useState<Record<string, string>>(() => {
        try {
            const saved = localStorage.getItem('bsf_product_videos');
            return saved ? JSON.parse(saved) : {};
        } catch (_) {
            return {};
        }
    });

    const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
    const [newVideoInput, setNewVideoInput] = useState<string>('');

    const handleOpenEditVideo = (product: ProductItem) => {
        const currentVideo = videoOverrides[product.id] || product.defaultVideoId;
        setNewVideoInput(currentVideo);
        setEditingProduct(product);
    };

    const handleSaveVideo = () => {
        if (!editingProduct) return;
        let cleanId = newVideoInput.trim();
        if (cleanId.includes('youtube.com/watch?v=')) {
            cleanId = cleanId.split('v=')[1]?.split('&')[0] || cleanId;
        } else if (cleanId.includes('youtu.be/')) {
            cleanId = cleanId.split('youtu.be/')[1]?.split('?')[0] || cleanId;
        } else if (cleanId.includes('youtube.com/embed/')) {
            cleanId = cleanId.split('embed/')[1]?.split('?')[0] || cleanId;
        }

        const updated = { ...videoOverrides, [editingProduct.id]: cleanId };
        setVideoOverrides(updated);
        try {
            localStorage.setItem('bsf_product_videos', JSON.stringify(updated));
        } catch (_) {}
        setEditingProduct(null);
    };

    const filteredProducts = DEFAULT_PRODUCTS.filter(p => {
        if (filterCategory === 'all') return true;
        return p.category === filterCategory;
    });

    // Helper to get credits count for internal tools
    const getProductCreditCount = (product: ProductItem): number => {
        if (product.id === 'livro') {
            if (hasCredits) return 1;
            return stats?.credits || stats?.bookCredits || 0;
        }
        if (product.creditKey && stats) {
            return stats[product.creditKey] || 0;
        }
        return 0;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-12 font-sans">
            {/* Top Banner - Book Generator Credit Status & Buy Action */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="max-w-2xl space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-widest">
                            <Sparkles size={14} className="text-amber-400" />
                            <span>Geração Automática de Livros (170+ a 210 Páginas)</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-serif font-black tracking-tight text-white">
                            Seu Próximo Best-Seller está Pronto para Nascer
                        </h1>
                        <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed">
                            Crie obras completas com pesquisa de mercado com IA, estrutura viral de não-ficção e formatação automática em minutos.
                        </p>
                    </div>

                    {/* Credit Action Box */}
                    <div className="w-full md:w-auto shrink-0 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/10 flex flex-col items-center text-center space-y-3">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-300">
                            <BookOpen size={16} className="text-emerald-400" />
                            <span>Status da Conta</span>
                        </div>

                        {hasCredits || (stats?.credits || 0) > 0 ? (
                            <div className="space-y-2 w-full">
                                <div className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-widest text-center">
                                    {(stats?.credits || 1) === 1 
                                        ? "Você possui 1 crédito ativo" 
                                        : `Você possui ${stats?.credits || 1} créditos ativos`
                                    }
                                </div>
                                <button
                                    onClick={() => {
                                        if (onNewBook) onNewBook();
                                        else if (onSelectTab) onSelectTab('livro');
                                    }}
                                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Zap size={16} />
                                    <span>GERAR LIVRO AGORA</span>
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2 w-full">
                                <div className="text-2xl font-black text-white italic">
                                    R$ 39,90 <span className="text-xs text-slate-400 font-normal line-through">De R$ 97,90</span>
                                </div>
                                <button
                                    onClick={() => {
                                        if (handleBuyCredit) handleBuyCredit(39.90);
                                        else window.open(`https://payment.ticto.app/O6CE296D4?email=${encodeURIComponent(userEmail || '')}`, '_blank');
                                    }}
                                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black px-6 py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                                >
                                    <ShoppingBag size={16} />
                                    <span>COMPRAR CRÉDITO PARA GERAR LIVRO</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Instructional Video Section - Standard Amazon Quality */}
            <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                    {/* Video Frame */}
                    <div className="lg:col-span-7 relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-900">
                        <iframe
                            className="absolute inset-0 w-full h-full"
                            src="https://www.youtube.com/embed/2EpCqqRFWsw"
                            title={lang === 'en' ? "Instructional Video" : "Vídeo de Instruções Padrão Amazon"}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>

                    {/* Text Beside Video */}
                    <div className="lg:col-span-5 space-y-4 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black uppercase tracking-widest">
                            <Video size={14} className="text-amber-500" />
                            <span>Tutorial Essencial de Qualidade</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif font-black text-slate-900 leading-tight">
                            Padrão Amazon de Qualidade Editorial
                        </h3>
                        <p className="text-slate-600 font-medium text-sm md:text-base leading-relaxed">
                            Assista este vídeo para saber como fazer as duas alterações necessárias para deixar seu livro profissional no padrão <strong className="text-slate-900 font-black">AMAZON</strong> de qualidade.
                        </p>
                        <div className="pt-2 flex items-center justify-center lg:justify-start gap-3 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 size={16} /> 2 Ajustes Simples</span>
                            <span>•</span>
                            <span>Formatos Impresso & E-book</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* WhatsApp VIP Group Invitation Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 border border-emerald-700/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-emerald-500 text-slate-950 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30">
                        <MessageCircle size={32} />
                    </div>
                    <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 font-black text-[10px] uppercase tracking-widest mb-1 border border-emerald-400/30">
                            <span>Comunidade Exclusiva VIP</span>
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            Grupo de Autores & Best-Sellers no WhatsApp
                        </h3>
                        <p className="text-emerald-100/80 text-xs md:text-sm font-medium">
                            Tire dúvidas, troque experiências, receba atualizações exclusivas e networking com outros escritores VIP.
                        </p>
                    </div>
                </div>

                <a
                    href="https://chat.whatsapp.com/EjqYiRGXtSjGqOfLQIC07i"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-6 py-3.5 rounded-2xl shadow-xl shadow-emerald-500/20 text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                    <MessageCircle size={18} />
                    <span>ENTRAR NO GRUPO VIP DO WHATSAPP</span>
                    <ChevronRight size={16} />
                </a>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {[
                    { id: 'all', label: 'Todos os Produtos' },
                    { id: 'combo', label: '⭐ Ofertas Especiais' },
                    { id: 'registro', label: 'Registros & CIP' },
                    { id: 'design', label: 'Capas & Diagramação' },
                    { id: 'publicacao', label: 'Cursos & Publicação' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilterCategory(tab.id)}
                        className={`
                            px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all whitespace-nowrap border
                            ${filterCategory === tab.id 
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-lg shadow-indigo-600/20' 
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {filteredProducts.map(product => {
                    const videoId = videoOverrides[product.id] || product.defaultVideoId;
                    const creditCount = getProductCreditCount(product);

                    return (
                        <div 
                            key={product.id}
                            className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col justify-between hover:shadow-2xl transition-all duration-300 group hover:-translate-y-1 relative"
                        >
                            <div>
                                {/* Active Credit Banner Top Strip */}
                                {product.isInternalTool && creditCount > 0 && (
                                    <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-xs px-4 py-2.5 flex items-center justify-between shadow-lg shadow-emerald-500/20 border-b border-emerald-400/30">
                                        <span className="flex items-center gap-2 font-black uppercase tracking-wider text-[11px] drop-shadow-sm">
                                            <Award size={16} className="text-amber-300 animate-bounce" />
                                            <span>
                                                {creditCount === 1 
                                                    ? 'VOCÊ POSSUI CRÉDITO ATIVO!' 
                                                    : `VOCÊ POSSUI ${creditCount} CRÉDITOS ATIVOS!`
                                                }
                                            </span>
                                        </span>
                                        <span className="bg-slate-950/40 text-amber-300 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border border-amber-400/40 shadow-inner">
                                            🎉 {creditCount} {creditCount === 1 ? 'Crédito' : 'Créditos'}
                                        </span>
                                    </div>
                                )}

                                {/* Card Header & Badges */}
                                <div className="p-5 pb-3 flex items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50">
                                    <div className="space-y-1">
                                        {product.badgeText && (
                                            <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 text-[10px] font-black uppercase tracking-widest">
                                                {product.badgeText}
                                            </span>
                                        )}
                                        <h3 className="font-bold text-slate-900 text-lg leading-snug group-hover:text-indigo-600 transition-colors">
                                            {product.title}
                                        </h3>
                                    </div>

                                    {product.discountBadge && (
                                        <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-700 font-black text-xs uppercase tracking-wider shrink-0 border border-emerald-200">
                                            {product.discountBadge}
                                        </span>
                                    )}
                                </div>

                                {/* Video Container */}
                                <div className="relative w-full aspect-video bg-slate-950 overflow-hidden group/video">
                                    <iframe
                                        className="w-full h-full"
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        title={product.title}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                    />
                                    
                                    {/* Edit Video Button (For Admin/Owner) */}
                                    <button
                                        onClick={() => handleOpenEditVideo(product)}
                                        className="absolute top-3 right-3 bg-slate-900/80 hover:bg-indigo-600 text-white p-2 rounded-xl backdrop-blur-md opacity-80 hover:opacity-100 transition-all text-xs flex items-center gap-1.5 font-bold shadow-lg"
                                        title="Alterar Vídeo deste Produto"
                                    >
                                        <Edit3 size={14} />
                                        <span className="hidden sm:inline">Alterar Vídeo</span>
                                    </button>
                                </div>

                                {/* Content Details */}
                                <div className="p-5 space-y-4">
                                    <p className="text-slate-600 text-sm leading-relaxed font-normal">
                                        {product.shortDesc}
                                    </p>

                                    {/* Features Checklist */}
                                    {product.features && (
                                        <ul className="space-y-1.5 pt-2 border-t border-slate-100">
                                            {product.features.map((feat, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                    <span>{feat}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer with Price & Actions */}
                            <div className="p-5 pt-0 bg-white">
                                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                                    {/* Pricing Box */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Preço Promocional</span>
                                            <div className="flex items-baseline gap-2 flex-wrap">
                                                {product.originalPrice.startsWith('De ') || product.originalPrice.includes('De R$') ? (
                                                    <span className="text-sm md:text-base text-red-600 font-bold line-through">
                                                        {product.originalPrice}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs md:text-sm text-slate-600 font-extrabold bg-slate-200/70 px-2 py-0.5 rounded-md border border-slate-300/60">
                                                        {product.originalPrice}
                                                    </span>
                                                )}
                                                <span className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                                                    {product.promoPrice}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            {creditCount > 0 ? (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-300 shadow-sm animate-pulse">
                                                    <Award size={13} className="text-amber-500" />
                                                    <span>VOCÊ POSSUI CRÉDITO ATIVO!</span>
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                                                    <ShieldCheck size={12} />
                                                    <span>Acesso Imediato</span>
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {product.isComingSoon ? (
                                        <button
                                            disabled
                                            className="w-full bg-slate-200 text-slate-500 font-black py-3.5 rounded-xl text-center text-xs uppercase tracking-widest cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300"
                                        >
                                            <Lock size={16} />
                                            <span>{product.buttonTextOverride || 'Em Breve'}</span>
                                        </button>
                                    ) : product.isInternalTool && creditCount > 0 ? (
                                        <div className="space-y-2">
                                            <button
                                                onClick={() => {
                                                    if (product.id === 'livro' && onNewBook) onNewBook();
                                                    else if (product.internalTabId && onSelectTab) onSelectTab(product.internalTabId);
                                                }}
                                                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-3.5 rounded-xl shadow-xl shadow-emerald-500/25 text-center uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-95 border border-emerald-300"
                                            >
                                                <Zap size={18} className="text-amber-300 fill-amber-300" />
                                                <span>{product.id === 'livro' ? 'Gerar Livro Agora!' : 'Usar funcionalidade agora!'}</span>
                                            </button>

                                            <a
                                                href={product.checkoutUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 transition-colors"
                                            >
                                                <ShoppingBag size={14} />
                                                <span>Comprar Créditos Extra</span>
                                            </a>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <a
                                                href={product.checkoutUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-xl shadow-lg shadow-emerald-600/20 text-center uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95"
                                            >
                                                <ShoppingBag size={16} />
                                                <span>{product.buttonTextOverride || 'COMPRAR AGORA!'}</span>
                                            </a>

                                            {product.secondaryUrl && (
                                                <a
                                                    href={product.secondaryUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl text-center text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
                                                >
                                                    <span>{product.secondaryUrlText || 'Link Secundário'}</span>
                                                    <ChevronRight size={14} />
                                                </a>
                                            )}

                                            {product.isInternalTool && product.internalTabId && onSelectTab && (
                                                <button
                                                    onClick={() => {
                                                        if (product.id === 'livro' && onNewBook) onNewBook();
                                                        else onSelectTab(product.internalTabId!);
                                                    }}
                                                    className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-2 rounded-xl text-center text-xs flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <span>Usar Funcionalidade no App</span>
                                                    <ChevronRight size={14} />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* History (Histórico dos Livros Gerados) */}
            <div className="bg-white rounded-[24px] border border-slate-200 shadow-xl overflow-hidden mt-12 mb-12">
                <div className="bg-slate-50 px-6 md:px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-500/20">
                            <BookOpen size={22} />
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-xl uppercase tracking-tight">
                                {(t as any)?.dashboard?.myBooks || "Histórico dos Livros Gerados"}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium">
                                Acesse, baixe e gerencie todas as suas obras criadas na plataforma.
                            </p>
                        </div>
                    </div>
                    <span className="text-xs font-black text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full tracking-widest shrink-0">
                        {displayOrders.length} {(t as any)?.dashboard?.projectsCount || "Projeto(s)"}
                    </span>
                </div>

                {displayOrders.length === 0 ? (
                    <div className="p-16 text-center text-slate-400 space-y-4">
                        <div className="text-5xl">📚</div>
                        <p className="text-lg font-bold text-slate-700">{(t as any)?.dashboard?.noBooks || "Nenhum livro gerado ainda."}</p>
                        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                            Aproveite seu crédito ativo ou adquira um novo crédito acima para criar seu próximo Best-Seller em minutos.
                        </p>
                        {onNewBook && (
                            <button 
                                onClick={onNewBook} 
                                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Zap size={16} />
                                <span>{(t as any)?.dashboard?.startNow || "GERAR SEU LIVRO AGORA"}</span>
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {displayOrders.map((order: any, idx: number) => (
                            <div key={order.id || `book-${idx}`} className="p-4 md:p-6 hover:bg-slate-50/50 transition group relative overflow-hidden">
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                    <div className="flex items-center gap-4 md:gap-6 flex-1 min-w-0 w-full">
                                        <div className="w-14 h-16 md:w-16 md:h-20 bg-gradient-to-br from-indigo-50 to-slate-100 rounded-2xl flex-shrink-0 flex items-center justify-center text-3xl shadow-sm border border-slate-200 group-hover:scale-110 transition-transform duration-300">
                                            📚
                                        </div>
                                        <div translate="no" className="flex-1 min-w-0">
                                            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.3em] mb-1 block leading-none">{(t as any)?.dashboard?.bookTitleLabel || "TÍTULO DA OBRA"}</span>
                                            <h4 className="font-black text-slate-900 text-base md:text-lg uppercase tracking-tight italic leading-tight line-clamp-2 pr-4">
                                                {order.title || (t as any)?.dashboard?.bookTitleFallback || "Livro sem Título"}
                                            </h4>
                                            
                                            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-2">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">{(t as any)?.dashboard?.authorLabel || "AUTOR:"}</span>
                                                    <span className="text-xs font-bold text-slate-600 tracking-tight truncate max-w-[140px]">{order.authorName || 'Autor'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none">{(t as any)?.dashboard?.creationDate || "CRIADO EM:"}</span>
                                                    <span className="text-xs font-bold text-slate-500 tracking-tight">{order.date ? new Date(order.date).toLocaleDateString() : (t as any)?.dashboard?.dateUnknown || "Recente"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end shrink-0">
                                        <span className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY', 'DONE', 'FINISHED', 'APPROVED', 'READY_TO_DOWNLOAD'].includes((order.status || '').toUpperCase())) 
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                            ((order.status || '').toUpperCase() === 'IN_PROGRESS' || (order.status || '').toUpperCase() === 'WRITING_CHAPTERS' || (order.status || '').toUpperCase() === 'GENERATING_STRUCTURE') 
                                            ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                                            ((order.status || '').toUpperCase() === 'FAILED')
                                            ? 'bg-red-50 text-red-700 border-red-200' :
                                            'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                            {(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY', 'DONE', 'FINISHED', 'APPROVED', 'READY_TO_DOWNLOAD'].includes((order.status || '').toUpperCase())) ? ((t as any)?.dashboard?.statusGenerated || "✅ Gerado") :
                                                ((order.status || '').toUpperCase() === 'IN_PROGRESS' || (order.status || '').toUpperCase() === 'WRITING_CHAPTERS' || (order.status || '').toUpperCase() === 'GENERATING_STRUCTURE') ? ((t as any)?.dashboard?.statusProcessing || "⏳ Processando...") :
                                                    ((order.status || '').toUpperCase() === 'FAILED') ? (lang === 'en' ? 'FAILED (CLICK TO RESUME)' : 'FALHOU (CLIQUE PARA RETOMAR)') :
                                                    ((t as any)?.dashboard?.statusWaiting || "Na Fila")}
                                        </span>

                                        {(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY', 'DONE', 'FINISHED', 'APPROVED', 'READY_TO_DOWNLOAD'].includes((order.status || '').toUpperCase())) && (
                                            <a
                                                href={order.downloadUrl?.startsWith('http') ? order.downloadUrl : `${getApiBase ? getApiBase() : ''}${order.downloadUrl || `/api/projects/${order.id}/download-zip`}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-black text-[10px] shadow-lg shadow-indigo-100 uppercase tracking-widest hover:scale-105 active:scale-95"
                                            >
                                                <Download size={14} />
                                                <span>{(t as any)?.dashboard?.downloadKit || "BAIXAR KIT LIVRO"}</span>
                                            </a>
                                        )}

                                        {(!(['COMPLETED', 'LIVRO ENTREGUE', 'SUCCESS', 'READY', 'DONE', 'FINISHED', 'APPROVED', 'READY_TO_DOWNLOAD'].includes((order.status || '').toUpperCase()))) && (
                                            <button
                                                onClick={async () => {
                                                    const msg = lang === 'en' 
                                                        ? "Book stuck? Click OK to force the AI to detect where it stopped and resume automatically." 
                                                        : "O livro travou? Clique em OK para forçar a inteligência artificial a detectar onde parou e retomar automaticamente.";
                                                    if (!window.confirm(msg)) return;
                                                    
                                                    const token = localStorage.getItem('bsf_token');
                                                    try {
                                                        const baseUrl = getApiBase ? getApiBase() : '';
                                                        const res = await fetch(`${baseUrl}/api/projects/${order.id}/resume`, {
                                                            method: 'POST',
                                                            headers: { 'Authorization': `Bearer ${token}` }
                                                        });
                                                        if(res.ok) {
                                                            const successMsg = lang === 'en'
                                                                ? "Resumption signal sent! AI is back in control. Refresh the page in a few moments."
                                                                : "Sinal de retomada enviado! A IA assumiu o controle novamente. Atualize a página em alguns instantes.";
                                                            alert(successMsg);
                                                            window.location.reload();
                                                        } else {
                                                            alert(lang === 'en' ? "Error sending resumption signal." : "Erro ao enviar sinal de retomada.");
                                                        }
                                                    } catch (e) {
                                                        console.error(e);
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-5 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-black text-[10px] shadow-lg shadow-amber-100 uppercase tracking-widest hover:scale-105 active:scale-95"
                                                title={lang === 'en' ? "Resume Generation from where it stopped" : "Retomar Geração de Onde Parou"}
                                            >
                                                <span>▶️ {lang === 'en' ? 'RESUME GENERATION' : 'RETOMAR GERAÇÃO'}</span>
                                            </button>
                                        )}
                                        
                                        {handleDeleteProject && (
                                            <button
                                                onClick={() => handleDeleteProject(order.id)}
                                                className="p-3 bg-white border border-red-100 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm"
                                                title={(t as any)?.dashboard?.deleteProject || "Excluir Projeto"}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Video Edit Modal */}
            {editingProduct && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                <Video className="text-indigo-600" size={20} />
                                <span>Alterar Vídeo do Produto</span>
                            </h3>
                            <button 
                                onClick={() => setEditingProduct(null)} 
                                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                Produto: {editingProduct.title}
                            </label>
                            <input
                                type="text"
                                value={newVideoInput}
                                onChange={(e) => setNewVideoInput(e.target.value)}
                                placeholder="Insira o ID do YouTube ou a URL do vídeo..."
                                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm text-slate-800"
                            />
                            <p className="text-[11px] text-slate-400 mt-2">
                                Dica: Cole o link completo do YouTube (ex: <code>https://www.youtube.com/watch?v=NeM3tTW7MgU</code>) ou apenas o ID do vídeo (ex: <code>NeM3tTW7MgU</code>).
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setEditingProduct(null)}
                                className="px-4 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 uppercase tracking-wider"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveVideo}
                                className="px-5 py-2.5 rounded-xl font-black text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 uppercase tracking-wider flex items-center gap-1.5"
                            >
                                <Save size={16} />
                                <span>Salvar Vídeo</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCatalogView;
