import React from 'react';
import { BookMetadata } from '../types';

interface InputFormProps {
  metadata: BookMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<BookMetadata>>;
  onNext: () => void;
}

export const InputForm: React.FC<InputFormProps> = ({ metadata, setMetadata, onNext }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = metadata.authorName && metadata.topic;

  return (
    <>
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-wide mb-2">
          BEM VINDO(A)! À FÁBRICA DE BEST SELLER
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          Comece a fabricar seu livro agora!
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-slate-800">Definição do Nicho</h2>
          <p className="text-slate-500 mt-2">O primeiro passo para criar um Best-Seller viral.</p>
        </div>

        <div className="space-y-8 mb-8">
          {/* SECTION 1: STYLE */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Estilo de Conteúdo</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['Espiritual', 'Técnico', 'Autoajuda', 'Religioso', 'Emocional', 'Infantil', 'Acadêmico', 'Teológico'].map((style) => (
                <button
                  key={style}
                  onClick={() => setMetadata(prev => ({ ...prev, contentStyle: style }))}
                  className={`py-3 px-2 rounded-lg text-sm font-medium transition-all border ${metadata.contentStyle === style
                    ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-white'
                    }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* SECTION 2: TONE */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">Linguagem para a Escrita</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['Técnica e Acadêmica', 'Leve e Acolhedora', 'Inspiradora', 'Conversacional'].map((tone) => (
                <button
                  key={tone}
                  onClick={() => setMetadata(prev => ({ ...prev, writingTone: tone }))}
                  className={`py-3 px-4 rounded-lg text-sm font-medium transition-all border ${metadata.writingTone === tone
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-white'
                    }`}
                >
                  {tone}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Nome do Autor(a)</label>
            <input
              name="authorName"
              value={metadata.authorName}
              onChange={handleChange}
              placeholder="Ex: João da Silva"
              className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Tema / Nicho / Assunto</label>
            <textarea
              name="topic"
              value={metadata.topic}
              onChange={handleChange}
              rows={4}
              placeholder="Ex: Finanças para iniciantes, como aprender a economizar, como começar a investir, como sair das dívidas..."
              className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all text-lg resize-none"
            />
            <p className="text-xs text-slate-400 mt-2">
              Seja específico. Quanto mais detalhes, melhor a pesquisa da IA.
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-end">
          <button
            onClick={onNext}
            disabled={!isFormValid}
            className={`w-full md:w-auto px-10 py-4 rounded-full font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${isFormValid
              ? 'bg-gradient-to-r from-[#0284c7] to-[#0ea5e9] hover:shadow-[#0ea5e9]/40'
              : 'bg-gray-300 cursor-not-allowed'
              }`}
          >
            Iniciar Pesquisa de Mercado (IA) &rarr;
          </button>
        </div>
      </div>
    </>
  );
};