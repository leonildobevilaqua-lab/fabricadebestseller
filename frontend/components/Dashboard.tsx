
import React, { useEffect, useState } from 'react';
import { 
    BookOpen, FileText, ClipboardList, Barcode, Palette, 
    Smartphone, Cloud, Upload, Zap, Settings, LogOut,
    Menu, X, ChevronRight, User, Package
} from 'lucide-react';
import { getApiBase } from '../services/api';
import { useLanguage } from '../i18n/context';
import { SidebarItem } from './SidebarItem';
import { BookGeneratorView } from './BookGeneratorView';
import { PlaceholderView, ExternalProductView } from './DashboardViews';
import CipGenerator from './CipGenerator';
import BarcodeGenerator from './BarcodeGenerator';
import QrCodeGenerator from './QrCodeGenerator';
import CoverGenerator from './CoverGenerator/CoverGenerator';

interface DashboardProps {
    user: any;
    onNewBook: () => void;
    onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNewBook, onLogout }) => {
    const { t, lang } = useLanguage();
    const [activeTab, setActiveTab] = useState(() => {
        if (window.location.pathname === '/capas-profissionais' || window.location.pathname === '/capa-profissional') {
            return 'capas-profissionais';
        }
        return 'livro';
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [hasCredits, setHasCredits] = useState(false);
    const [pendingInvoice, setPendingInvoice] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

    // Password Change States
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPass, setCurrentPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [passLoading, setPassLoading] = useState(false);
    const [passMsg, setPassMsg] = useState({ type: '', text: '' });

    const handleBuyCredit = async (price: number) => {
        let checkoutUrl = `https://payment.ticto.app/O6CE296D4?email=${encodeURIComponent(user.email)}`;
        if (lang === 'en' && Math.abs(price - 39.90) < 0.1) {
            checkoutUrl = `https://pay.kiwify.com/DdposAY?email=${encodeURIComponent(user.email)}`;
        }
        window.open(checkoutUrl, '_blank');
    };

    const handleVerifyAndEnter = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${getApiBase()}/api/payment/access?email=${encodeURIComponent(user.email)}&forceSync=true`);
            const data = await res.json();
            if (data.hasAccess && (data.credits > 0 || data.hasActiveProject)) {
                setHasCredits(data.credits > 0 || data.hasActiveProject);
                onNewBook();
            } else {
                alert(lang === 'en' ? '⚠️ No available credits found.' : '⚠️ Não identificamos créditos disponíveis.');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (projectId: string) => {
        if (!window.confirm((t as any).dashboard.confirmDelete)) return;
        try {
            const token = localStorage.getItem('bsf_token');
            const res = await fetch(`${getApiBase()}/api/projects/${projectId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchMe();
        } catch (e) { console.error(e); }
    };

    const fetchMe = async () => {
        try {
            const token = localStorage.getItem('bsf_token');
            const headers: any = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const [meRes, resPayment] = await Promise.all([
                fetch(`${getApiBase()}/api/user/me?email=${encodeURIComponent(user.email)}`, { headers }),
                fetch(`${getApiBase()}/api/payment/access?email=${encodeURIComponent(user.email)}`)
            ]);

            if (meRes.ok) setStats(await meRes.json());
            if (resPayment.ok) {
                const payData = await resPayment.json();
                setHasCredits(payData.credits > 0 || payData.hasActiveProject);
                if (payData.latestInvoiceStatus === 'PENDING' || payData.latestInvoiceStatus === 'OVERDUE') {
                    setPendingInvoice(true);
                    setInvoiceUrl(payData.invoiceUrl);
                } else {
                    setPendingInvoice(false);
                }
            }
        } catch (e) { console.error(e); } finally { setLoading(false); }
    };

    useEffect(() => { fetchMe(); }, [user.email]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass !== confirmPass) return setPassMsg({ type: 'error', text: "Senhas não coincidem." });
        setPassLoading(true);
        try {
            const token = localStorage.getItem('bsf_token');
            const res = await fetch(`${getApiBase()}/api/user/update-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
            });
            if (res.ok) {
                setPassMsg({ type: 'success', text: "Senha alterada!" });
                setTimeout(() => setShowPasswordModal(false), 2000);
            } else {
                setPassMsg({ type: 'error', text: "Erro ao atualizar." });
            }
        } catch (e) { setPassMsg({ type: 'error', text: "Erro de conexão." }); } finally { setPassLoading(false); }
    };

    const menuItems = [
        { id: 'livro', label: 'Gerador de Livros', icon: BookOpen, price: 'R$ 39,90' },
        { id: 'capas-profissionais', label: 'Capa Profissional (IA)', icon: Palette, isPreparation: true },
        { id: 'cbl-tutorial', label: 'Registro CBL (Tutorial)', icon: FileText, price: 'R$ 19,90' },
        { id: 'ficha-catalografica', label: 'Ficha Catalográfica', icon: ClipboardList, price: 'R$ 27,90' },
        { id: 'barras', label: 'Código de Barras', icon: Barcode, price: 'R$ 19,90' },
        { id: 'qr-code', label: 'Gerador QR Code', icon: Smartphone, price: 'R$ 7,00' },
        { id: 'pacote-completo', label: 'Pacote (Ficha Catalog. + Cód. Barras + QR Code)', icon: Package, price: 'R$ 49,90' },
        { id: 'diagramacao-formatacao-360', label: 'Diagramação e Formatação 360 Express', icon: FileText, price: 'R$ 97,00', externalLink: 'https://checkout.ticto.app/O2674C7CD', badgeText: 'Novo' },
        { id: 'capa-fisica', label: 'Capa Livro Físico', icon: Palette, price: 'R$ 149,90' },
        { id: 'amazon', label: '"DESAFIO P72H" PUBLICAÇÃO NA AMAZON', icon: Cloud, price: 'R$ 97,90', externalLink: 'https://checkout.ticto.app/O32C21B1D' },
        { id: 'uiclap', label: 'Publicação UICLAP', icon: Upload, price: 'R$ 97,90', externalLink: 'https://checkout.ticto.app/OED0004AF' },
        { id: 'ticto', label: 'Publicação TICTO', icon: Zap, isPreparation: true },
    ];

    const renderSection = () => {
        switch (activeTab) {
            case 'livro':
                return (
                    <BookGeneratorView 
                        stats={stats}
                        hasCredits={hasCredits}
                        pendingInvoice={pendingInvoice}
                        invoiceUrl={invoiceUrl}
                        nextBookDisplayPrice={39.90} // Set fixed price as requested
                        onNewBook={onNewBook}
                        handleBuyCredit={handleBuyCredit}
                        handleVerifyAndEnter={handleVerifyAndEnter}
                        handleDeleteProject={handleDeleteProject}
                        getApiBase={getApiBase}
                    />
                );
            case 'cbl-tutorial':
                return (
                    <ExternalProductView 
                        title="Tutorial Registro Oficial CBL"
                        desc="Aprenda o passo a passo para registrar seu livro na Câmara Brasileira do Livro e garantir seus direitos autorais."
                        videoId="NeM3tTW7MgU"
                        checkoutUrl="https://checkout.ticto.app/O77037442"
                        price="R$ 19,90"
                    />
                );
            case 'ficha-catalografica':
                return (
                    <div className="bg-white rounded-3xl p-4 md:p-8 border border-slate-200 shadow-xl overflow-hidden min-h-[70vh]">
                         {/* Wrap CipGenerator and override internal pricing logic if needed via props or CSS */}
                         <CipGenerator />
                    </div>
                );
            case 'capa-fisica':
                return (
                    <ExternalProductView 
                        title="Criação de Capa Profissional (Físico)"
                        desc="Tenha uma capa de alta conversão para o seu livro impresso. Design premium que vende à primeira vista."
                        videoId="K7AAxtH69WM"
                        checkoutUrl="https://checkout.ticto.app/O6FA2355C"
                        originalPrice="R$ 297,90"
                        price="R$ 149,90"
                    />
                );
            case 'barras':
                return (
                    <BarcodeGenerator 
                        credits={stats?.barcodeCredits || 0}
                        userEmail={user.email}
                        onRefresh={fetchMe}
                    />
                );
            case 'qr-code':
                return (
                    <QrCodeGenerator 
                        credits={stats?.qrCredits || 0}
                        userEmail={user.email}
                        onRefresh={fetchMe}
                    />
                );
            case 'capas-profissionais':
                if (window.location.hostname === 'localhost') {
                    return (
                        <CoverGenerator 
                            credits={stats?.coverCredits || stats?.credits || 0}
                            userEmail={user.email}
                            onRefresh={fetchMe}
                        />
                    );
                }
                return (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center">
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-amber-500 mb-4 animate-pulse">
                            <Palette size={48} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">Capa Profissional (IA)</h3>
                        <p className="text-xs text-slate-500 max-w-md font-bold uppercase tracking-wider mb-6 leading-relaxed">
                            Este aplicativo está em produção e em breve estará disponível para todos os clientes!
                        </p>
                        <span className="text-[10px] bg-amber-100 text-amber-700 px-3 py-1.5 rounded-full font-black uppercase tracking-widest">
                            Em Breve
                        </span>
                    </div>
                );
            case 'pacote-completo':
                return (
                    <ExternalProductView 
                        title="Pacote (Ficha Catalog. + Cód. Barras + QR Code)"
                        desc="Economize com o combo essencial para seu livro: Ficha Catalográfica (CIP) + Código de Barras + QR Code Personalizado. Tudo o que você precisa para profissionalizar sua obra em um só lugar."
                        checkoutUrl="https://checkout.ticto.app/OAE19BCE4"
                        videoId="NeM3tTW7MgU"
                        price="R$ 49,90"
                        originalPrice="R$ 54,80"
                    />
                );
            case 'diagramacao-formatacao-360': return <PlaceholderView title="Diagramação e Formatação 360 Express" />;
            case 'capa-ebook': return <PlaceholderView title="Capa Profissional (Ebook)" />;
            case 'amazon': return <PlaceholderView title='"DESAFIO P72H" PUBLICAÇÃO NA AMAZON' />;
            case 'uiclap': return <PlaceholderView title="Publicação na UICLAP" />;
            case 'ticto': return <PlaceholderView title="Publicação na TICTO" />;
            default: return <PlaceholderView title="Seção em Desenvolvimento" />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* Mobile Sidebar Toggle */}
            <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden fixed bottom-6 right-6 z-[60] bg-indigo-600 text-white p-4 rounded-full shadow-2xl"
            >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="flex flex-col h-full">
                    {/* Sidebar Header */}
                    <div className="p-6 border-b border-slate-800">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
                                <BookOpen size={24} className="text-white" />
                            </div>
                            <span className="font-serif font-black text-xl tracking-tight">Fábrica VIP</span>
                        </div>
                    </div>

                    {/* Sidebar Menu */}
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 mb-4 mt-2">Produtos & Serviços</p>
                        {menuItems.map(item => (
                            <SidebarItem 
                                key={item.id}
                                id={item.id}
                                label={item.label}
                                icon={item.icon}
                                active={activeTab === item.id}
                                onClick={(id) => { 
                                    if (item.externalLink) {
                                        window.open(item.externalLink, '_blank');
                                    } else {
                                        setActiveTab(id); 
                                        setSidebarOpen(false); 
                                    }
                                }}
                                isPreparation={item.isPreparation}
                                price={item.price}
                                badgeText={item.badgeText}
                            />
                        ))}
                    </nav>

                    {/* Sidebar Footer */}
                    <div className="p-4 border-t border-slate-800 space-y-2">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/50 border border-slate-700/50 mb-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                                <User size={20} />
                            </div>
                            <div className="min-w-0" translate="no">
                                <p className="text-xs font-black truncate">{user.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{user.email}</p>
                            </div>
                        </div>

                        <button 
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-slate-400 hover:text-white transition-colors"
                        >
                            <Settings size={16} /> Configurações
                        </button>
                        <button 
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 px-4 py-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
                        >
                            <LogOut size={16} /> Sair do Painel
                        </button>
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 overflow-y-auto relative custom-scrollbar">
                {/* Header Strip */}
                <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-400">
                        <span className="text-xs font-bold uppercase tracking-widest">Membros VIP</span>
                        <ChevronRight size={14} />
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">
                            {menuItems.find(i => i.id === activeTab)?.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {hasCredits && activeTab === 'livro' && (
                            <span className="hidden md:flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                                <Zap size={12} /> Crédito Disponível
                            </span>
                        )}
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-slate-500">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                </header>

                {/* Section Content */}
                <div className="p-6 md:p-10 max-w-7xl mx-auto pb-32">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh]">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="mt-4 text-slate-500 font-bold uppercase text-xs tracking-widest">Carregando Área VIP...</p>
                        </div>
                    ) : (
                        renderSection()
                    )}
                </div>
            </main>

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Alterar Senha</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-4">
                            <input type="password" placeholder="Senha Atual" value={currentPass} onChange={e => setCurrentPass(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 transition outline-none" />
                            <input type="password" placeholder="Nova Senha" value={newPass} onChange={e => setNewPass(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 transition outline-none" />
                            <input type="password" placeholder="Confirmar Nova Senha" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500/20 transition outline-none" />
                            {passMsg.text && <div className={`p-4 rounded-xl text-xs font-bold ${passMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{passMsg.text}</div>}
                            <button type="submit" disabled={passLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all uppercase tracking-widest text-xs">
                                {passLoading ? "Atualizando..." : "Salvar Nova Senha"}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
