import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, Download, CheckCircle, AlertCircle, ShoppingCart } from 'lucide-react';
import './CipGenerator.css';
import { getApiBase } from '../services/api';

interface CIPData {
  title: string;
  subtitle: string;
  author: string;
  authorFormatted: string;
  cutter: string;
  cdd: string;
  keywords: string[];
  year: string;
  pages: number;
}

const CipGenerator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ data: CIPData; files: { docx: string; png: string } } | null>(null);
  
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');
  const [isbn, setIsbn] = useState('');
  const [cipCredits, setCipCredits] = useState<number | null>(null);
  const [isCheckingCredits, setIsCheckingCredits] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkCredits();
  }, []);

  const checkCredits = async () => {
    setIsCheckingCredits(true);
    try {
      const token = localStorage.getItem('bsf_token');
      const contact = localStorage.getItem('bsf_userContact');
      
      if (!token || !contact) {
        setCipCredits(0);
        setIsCheckingCredits(false);
        return;
      }
      
      const parsedContact = JSON.parse(contact);
      setUserEmail(parsedContact.email);

      const response = await fetch(`${getApiBase()}/api/user/me?email=${parsedContact.email}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data?.cipCredits !== undefined) {
        setCipCredits(Number(data.cipCredits));
      } else {
        setCipCredits(0);
      }
    } catch (e) {
      console.error("Error checking CIP credits", e);
      setCipCredits(0);
    } finally {
      setIsCheckingCredits(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Por favor, selecione um arquivo .docx primeiro.");
      return;
    }

    setLoading(true);
    setError(null);

    if (!cidade || !estado || !isbn) {
      setError("Preencha todos os campos obrigatórios (Cidade, Estado, ISBN).");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('bsf_token');
    if (!token) {
      setError("Por favor, faça login para gerar a ficha.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('cidade', cidade);
    formData.append('estado', estado);
    formData.append('isbn', isbn);

    try {
      const response = await fetch(`${getApiBase()}/api/cip/generate`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao processar o arquivo.");
      }

      const data = await response.json();
      
      const filesWithBase = {
          docx: data.files.docx.startsWith('http') ? data.files.docx : `${getApiBase()}${data.files.docx}`,
          png: data.files.png.startsWith('http') ? data.files.png : `${getApiBase()}${data.files.png}`
      };

      setResult({ ...data, files: filesWithBase });
      
      // Update credits locally
      setCipCredits(prev => prev !== null ? Math.max(0, prev - 1) : 0);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar o arquivo.");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyCredits = () => {
    const emailParam = userEmail ? `?email=${encodeURIComponent(userEmail)}` : '';
    window.open(`https://checkout.ticto.app/O89DB6739${emailParam}`, '_blank');
  };

  return (
    <div className="app-container">
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>

      <main className="main-content">
        <header className="header">
          <h1>Fábrica de Best Seller</h1>
          <h2>Gerador Automático de Ficha Catalográfica (CIP)</h2>
          <p>Envie o manuscrito do seu livro e nossa IA gerará a ficha oficial no padrão profissional em segundos.</p>
        </header>

        {isCheckingCredits ? (
           <div className="flex justify-center items-center py-12">
             <Loader2 className="icon spin" size={32} />
             <span className="ml-2">Verificando créditos...</span>
           </div>
        ) : !result ? (
          <div className="upload-section">
            <div 
              className={`drop-zone ${file ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".docx" 
                hidden 
              />
              
              {file ? (
                <div className="file-info">
                  <FileText className="icon file-icon" />
                  <span className="file-name">{file.name}</span>
                  <span className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                  <p className="change-file">Clique para trocar de arquivo</p>
                </div>
              ) : (
                <div className="drop-content">
                  <Upload className="icon upload-icon" />
                  <h3>Selecione o seu livro</h3>
                  <p>Arraste e solte ou clique para selecionar um arquivo .docx</p>
                </div>
              )}
            </div>

            <div className="input-group">
              <input type="text" placeholder="Estado (Ex: SP)" value={estado} onChange={e => setEstado(e.target.value)} />
              <input type="text" placeholder="Cidade (Ex: São Paulo)" value={cidade} onChange={e => setCidade(e.target.value)} />
              <input type="text" placeholder="Nº do ISBN (Ex: 978-65-02-02105-7)" value={isbn} onChange={e => setIsbn(e.target.value)} />
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle className="icon" />
                <span>{error}</span>
              </div>
            )}

            {cipCredits !== null && cipCredits > 0 ? (
                <button 
                className="generate-btn" 
                onClick={handleUpload} 
                disabled={!file || !cidade || !estado || !isbn || loading}
                >
                {loading ? (
                    <>
                    <Loader2 className="icon spin" />
                    Analisando e Gerando Ficha...
                    </>
                ) : (
                    'Gerar Ficha Catalográfica Agora'
                )}
                </button>
            ) : (
                <div className="flex flex-col gap-5">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-center space-y-4">
                        <div className="space-y-1">
                            <p className="text-xs text-slate-400 uppercase font-black tracking-[0.2em]">Crédito para Gerar</p>
                            <div className="flex items-center justify-center gap-3">
                                <span className="text-slate-500 line-through text-lg">R$ 68,60</span>
                                <span className="text-3xl font-black text-white italic">R$ 27,90</span>
                            </div>
                        </div>

                        <button 
                            className="generate-btn w-full !py-5" 
                            style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
                            onClick={handleBuyCredits} 
                        >
                            <ShoppingCart className="icon" />
                            Comprar Crédito Agora
                        </button>

                        <div className="text-left space-y-3 pt-2">
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                                Lembrando que a Ficha Catalográfica é gerada de forma profissional, você receberá o documento em <strong>word</strong> e em <strong>imagem no formato PNG</strong>.
                            </p>
                            
                            <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                                <p className="text-[10px] font-black text-amber-500 uppercase mb-1">⚠️ ATENÇÃO...</p>
                                <p className="text-[11px] text-amber-200/80 leading-relaxed font-medium">
                                    Após efetuar seu pagamento retorne para está página e gere sua Ficha Catalográfica Profissional.
                                </p>
                            </div>

                            <p className="text-[10px] text-slate-500 font-bold uppercase text-center pt-2">
                                * O GERADOR FUNCIONA UTILIZANDO APENAS OS LIVROS GERADOS PELA FÁBRICA DE BEST SELLER.
                            </p>
                        </div>
                    </div>

                    {userEmail && (
                        <button 
                        className="reset-btn flex items-center justify-center gap-2"
                        onClick={checkCredits}
                        >
                        <CheckCircle size={18} /> Já comprei! Atualizar créditos
                        </button>
                    )}
                </div>
            )}
          </div>
        ) : (
          <div className="result-section">
            <div className="success-header">
              <CheckCircle className="icon success-icon" />
              <h3>Ficha Gerada com Sucesso!</h3>
            </div>

            <div className="data-preview">
              <div className="data-item">
                <span className="label">Título:</span>
                <span className="value">{result.data.title} {result.data.subtitle && `- ${result.data.subtitle}`}</span>
              </div>
              <div className="data-item">
                <span className="label">Autor:</span>
                <span className="value">{result.data.authorFormatted}</span>
              </div>
              <div className="data-item">
                <span className="label">CDD:</span>
                <span className="value">{result.data.cdd}</span>
              </div>
              <div className="data-item">
                <span className="label">Cutter:</span>
                <span className="value">{result.data.cutter}</span>
              </div>
              <div className="data-item">
                <span className="label">Páginas:</span>
                <span className="value">{result.data.pages}</span>
              </div>
            </div>

            <div className="download-actions">
              <a href={result.files.docx} target="_blank" rel="noopener noreferrer" className="download-btn docx">
                <Download className="icon" />
                Baixar Ficha em Word (.docx)
              </a>
              <a href={result.files.png} target="_blank" rel="noopener noreferrer" className="download-btn png">
                <Download className="icon" />
                Baixar Ficha em Imagem (.png)
              </a>
            </div>

            <button className="reset-btn" onClick={() => { setResult(null); setFile(null); }}>
              Gerar Nova Ficha
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default CipGenerator;
