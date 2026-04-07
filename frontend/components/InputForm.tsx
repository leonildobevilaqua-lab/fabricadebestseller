import React from 'react';
import { BookMetadata } from '../types';

interface InputFormProps {
  metadata: BookMetadata;
  setMetadata: React.Dispatch<React.SetStateAction<BookMetadata>>;
  onNext: () => void;
  language?: 'pt' | 'en' | 'es'; // UI language of the current user
}

// Book generation language options
const BOOK_LANGUAGES = [
  {
    code: 'pt',
    flag: '🇧🇷',
    label: 'Português',
    sublabel: 'Mercado: Brasil',
    description: 'Pesquisa: Amazon.com.br, YouTube BR, Google BR',
    color: 'green'
  },
  {
    code: 'en',
    flag: '🇺🇸',
    label: 'English',
    sublabel: 'Market: United States',
    description: 'Research: Amazon.com, YouTube US, Google US',
    color: 'blue'
  },
  {
    code: 'es',
    flag: '🇪🇸',
    label: 'Español',
    sublabel: 'Mercado: Latinoamérica',
    description: 'Pesquisa: Amazon, YouTube, Google (ES)',
    color: 'orange'
  }
];

export const InputForm: React.FC<InputFormProps> = ({ metadata, setMetadata, onNext, language = 'pt' }) => {
  const [titleMode, setTitleMode] = React.useState<'ai' | 'manual'>('ai');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const isFormValid = metadata.authorName && metadata.topic && (metadata as any).bookLanguage && (titleMode === 'ai' || metadata.bookTitle);

  // Selected book language (separate from UI language)
  const selectedBookLang = (metadata as any).bookLanguage || '';

  const setBookLanguage = (lang: string) => {
    setMetadata(prev => ({ ...prev, bookLanguage: lang } as any));
  };

  // UI labels based on current app language
  const labels = {
    pt: {
      welcome: 'BEM VINDO(A)! À FÁBRICA DE BEST SELLER',
      subtitle: 'Comece a fabricar seu livro agora!',
      heading: 'Definição do Nicho',
      subheading: 'O primeiro passo para criar um Best-Seller viral.',
      bookLangLabel: '1. Idioma da Geração do Livro',
      bookLangNote: 'Escolha o idioma em que o livro será escrito. Todo conteúdo — pesquisa, texto e marketing — será produzido neste idioma.',
      styleLabel: '2. Estilo de Conteúdo',
      toneLabel: '3. Linguagem para a Escrita',
      authorLabel: 'Nome do Autor(a)',
      authorPlaceholder: 'Ex: João da Silva',
      topicLabel: 'Tema / Nicho / Assunto',
      topicPlaceholder: 'Ex: Finanças para iniciantes, como aprender a economizar, como começar a investir...',
      topicHint: 'Seja específico. Quanto mais detalhes, melhor a pesquisa da IA.',
      startBtn: 'Iniciar Pesquisa de Mercado (IA) →',
      selectLangFirst: 'Selecione o idioma do livro primeiro ↑',
      styleOptions: ['Espiritual', 'Técnico', 'Autoajuda', 'Religioso', 'Emocional', 'Infantil', 'Acadêmico', 'Teológico'],
      toneOptions: ['Técnica e Acadêmica', 'Leve e Acolhedora', 'Inspiradora', 'Conversacional'],
      titleModeLabel: '4. Título da Obra',
      titleModeQuestion: 'Você deseja informar o nome do Titulo do Livro ou prefere que a nossa Ferramenta sugira os melhores títulos extremamente otimizados de acordo com a pesquisa que você fizer?',
      btnManual: 'INFORMAR TÍTULO MANUALMENTE',
      btnAI: 'DEIXAR A FBS GERAR OS TÍTULOS',
      manualTitleLabel: 'Digite o Título do seu Livro',
      manualTitlePlaceholder: 'Ex: O Poder Oculto da IA no Seu Bolso'
    },
    en: {
      welcome: 'WELCOME TO THE BEST SELLER FACTORY',
      subtitle: 'Start building your book now!',
      heading: 'Niche Definition',
      subheading: 'The first step to creating a viral Best-Seller.',
      bookLangLabel: '1. Book Generation Language',
      bookLangNote: 'Choose the language your book will be written in. All content — research, text, and marketing — will be produced in this language.',
      styleLabel: '2. Content Style',
      toneLabel: '3. Writing Tone',
      authorLabel: "Author's Name",
      authorPlaceholder: 'Ex: John Smith',
      topicLabel: 'Topic / Niche / Subject',
      topicPlaceholder: 'Ex: Personal finance for beginners, how to invest, how to get out of debt...',
      topicHint: 'Be specific. The more details, the better the AI research.',
      startBtn: 'Start Market Research (AI) →',
      selectLangFirst: 'Select the book language first ↑',
      styleOptions: ['Spiritual', 'Technical', 'Self-Help', 'Religious', 'Emotional', 'Children', 'Academic', 'Theological'],
      toneOptions: ['Technical & Academic', 'Light & Welcoming', 'Inspiring', 'Conversational'],
      titleModeLabel: '4. Book Title',
      titleModeQuestion: 'Do you want to provide the book title yourself or would you prefer our tool to suggest the best optimized titles based on your research?',
      btnManual: 'PROVIDE TITLE MANUALLY',
      btnAI: 'LET FBS GENERATE TITLES',
      manualTitleLabel: 'Type your Book Title',
      manualTitlePlaceholder: 'Ex: The Hidden Power of AI in Your Pocket'
    },
    es: {
      welcome: '¡BIENVENIDO(A) A LA FÁBRICA DE BEST SELLER!',
      subtitle: '¡Comienza a fabricar tu libro ahora!',
      heading: 'Definición del Nicho',
      subheading: 'El primer paso para crear un Best-Seller viral.',
      bookLangLabel: '1. Idioma de Generación del Libro',
      bookLangNote: 'Elige el idioma en que se escribirá el libro. Todo el contenido — investigación, texto y marketing — se producirá en este idioma.',
      styleLabel: '2. Estilo de Contenido',
      toneLabel: '3. Tono de Escritura',
      authorLabel: 'Nombre del Autor(a)',
      authorPlaceholder: 'Ej: Carlos González',
      topicLabel: 'Tema / Nicho / Asunto',
      topicPlaceholder: 'Ej: Finanzas personales para principiantes, cómo invertir, cómo salir de las deudas...',
      topicHint: 'Sé específico. Cuantos más detalles, mejor será la investigación de la IA.',
      startBtn: 'Iniciar Investigación de Mercado (IA) →',
      selectLangFirst: 'Selecciona el idioma del libro primero ↑',
      styleOptions: ['Espiritual', 'Técnico', 'Autoayuda', 'Religioso', 'Emocional', 'Infantil', 'Académico', 'Teológico'],
      toneOptions: ['Técnica y Académica', 'Ligera y Acogedora', 'Inspiradora', 'Conversacional'],
      titleModeLabel: '4. Título de la Obra',
      titleModeQuestion: '¿Desea informar el nombre del Título del Libro o prefiere que nuestra Herramienta sugiera los mejores títulos extremadamente optimizados según su investigación?',
      btnManual: 'INFORMAR TÍTULO MANUALMENTE',
      btnAI: 'DEJAR QUE FBS GENERE LOS TÍTULOS',
      manualTitleLabel: 'Escribe el Título de tu Libro',
      manualTitlePlaceholder: 'Ej: El Poder Oculto de la IA en tu Bolsillo'
    }
  };

  const L = labels[language] || labels['pt'];

  return (
    <>
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-wide mb-2">
          {L.welcome}
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          {L.subtitle}
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-8 max-w-2xl mx-auto animate-fade-in-up">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-serif font-bold text-slate-800">{L.heading}</h2>
          <p className="text-slate-500 mt-2">{L.subheading}</p>
        </div>

        {/* SECTION 0: BOOK LANGUAGE SELECTION */}
        <div className="mb-8">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
            {L.bookLangLabel}
          </label>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            {L.bookLangNote}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {BOOK_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setBookLanguage(lang.code)}
                className={`relative p-4 rounded-xl text-left border-2 transition-all duration-200 ${
                  selectedBookLang === lang.code
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
                    : 'border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-white'
                }`}
              >
                {selectedBookLang === lang.code && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <div className="text-2xl mb-1">{lang.flag}</div>
                <div className="font-bold text-slate-800 text-sm">{lang.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{lang.sublabel}</div>
                <div className={`text-[10px] mt-2 leading-tight ${
                  selectedBookLang === lang.code ? 'text-blue-600' : 'text-slate-400'
                }`}>
                  {lang.description}
                </div>
              </button>
            ))}
          </div>
          {!selectedBookLang && (
            <p className="mt-2 text-xs text-amber-600 font-medium flex items-center gap-1">
              <span>⚠️</span> {L.selectLangFirst}
            </p>
          )}
        </div>

        {/* Only show the remaining sections once a book language is selected */}
        {selectedBookLang && (
          <>
            <div className="space-y-8 mb-8">
              {/* SECTION 1: STYLE */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{L.styleLabel}</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {L.styleOptions.map((style) => (
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
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{L.toneLabel}</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {L.toneOptions.map((tone) => (
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

              {/* SECTION 3: TITLE MODE (NEW) */}
              <div className="pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{(L as any).titleModeLabel}</label>
                <p className="text-sm text-slate-600 mb-6 leading-relaxed italic">
                  {(L as any).titleModeQuestion}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setTitleMode('manual');
                      setMetadata(prev => ({ ...prev, bookTitle: '' }));
                    }}
                    className={`py-4 px-6 rounded-xl text-xs font-black transition-all border-2 flex flex-col items-center justify-center gap-2 text-center ${titleMode === 'manual'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-lg ring-2 ring-amber-200'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-amber-300 hover:bg-amber-50/30'
                      }`}
                  >
                    <span className="text-xl">✍️</span>
                    {(L as any).btnManual}
                  </button>
                  <button
                    onClick={() => {
                      setTitleMode('ai');
                      setMetadata(prev => ({ ...prev, bookTitle: undefined }));
                    }}
                    className={`py-4 px-6 rounded-xl text-xs font-black transition-all border-2 flex flex-col items-center justify-center gap-2 text-center ${titleMode === 'ai'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-lg ring-2 ring-blue-200'
                      : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300 hover:bg-blue-50/30'
                      }`}
                  >
                    <span className="text-xl">🤖</span>
                    {(L as any).btnAI}
                  </button>
                </div>
              </div>

              {titleMode === 'manual' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-medium text-slate-700 mb-2">{(L as any).manualTitleLabel}</label>
                  <input
                    name="bookTitle"
                    value={metadata.bookTitle || ''}
                    onChange={handleChange}
                    placeholder={(L as any).manualTitlePlaceholder}
                    className="w-full px-5 py-4 rounded-xl border-2 border-amber-200 bg-white focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all text-lg font-bold text-slate-800 shadow-inner"
                  />
                  <p className="text-[10px] text-amber-600 mt-2 font-medium">
                    ⚠️ Atenção: Usando o título manual, a IA passará diretamente para a criação da estrutura.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{L.authorLabel}</label>
                <input
                  name="authorName"
                  value={metadata.authorName}
                  onChange={handleChange}
                  placeholder={L.authorPlaceholder}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">{L.topicLabel}</label>
                <textarea
                  name="topic"
                  value={metadata.topic}
                  onChange={handleChange}
                  rows={4}
                  placeholder={L.topicPlaceholder}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-[#0ea5e9] focus:border-[#0ea5e9] outline-none transition-all text-lg resize-none"
                />
                <p className="text-xs text-slate-400 mt-2">
                  {L.topicHint}
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
                {L.startBtn}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};