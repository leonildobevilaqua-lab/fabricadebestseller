import React from 'react';
import { BookMetadata } from '../types';
import { useLanguage } from '../i18n/context';

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
    sublabel: 'Market: Latinoamérica',
    description: 'Pesquisa: Amazon, YouTube, Google (ES)',
    color: 'orange'
  }
];

export const InputForm: React.FC<InputFormProps> = ({ metadata, setMetadata, onNext, language = 'pt' }) => {
  const [titleMode, setTitleMode] = React.useState<'ai' | 'manual'>('ai');
  const { t } = useLanguage();
  const F = (t as any).fiction;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
  };

  const addCharacter = () => {
    const chars = metadata.characters || [];
    if (chars.length >= 5) return;
    setMetadata(prev => ({
      ...prev,
      characters: [...chars, { name: '', info: '' }]
    }));
  };

  const updateCharacter = (index: number, field: 'name' | 'info', value: string) => {
    const chars = [...(metadata.characters || [])];
    chars[index] = { ...chars[index], [field]: value };
    setMetadata(prev => ({ ...prev, characters: chars }));
  };

  const removeCharacter = (index: number) => {
    const chars = [...(metadata.characters || [])];
    chars.splice(index, 1);
    setMetadata(prev => ({ ...prev, characters: chars }));
  };

  const isFormValid = metadata.authorName && 
                     metadata.topic && 
                     (metadata as any).bookLanguage && 
                     (titleMode === 'ai' || metadata.bookTitle) &&
                     (!metadata.isFiction || metadata.genre);

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
      styleLabel: '3. Estilo de Conteúdo',
      toneLabel: '4. Linguagem para a Escrita',
      authorLabel: 'Nome do Autor(a)',
      authorPlaceholder: 'Ex: João da Silva',
      topicLabel: 'Tema / Nicho / Assunto',
      topicPlaceholder: 'Ex: Finanças para iniciantes, como aprender a economizar, como começar a investir...',
      topicHint: 'Seja específico. Quanto mais detalhes, melhor a pesquisa da IA.',
      startBtn: 'Iniciar Pesquisa de Mercado (IA) →',
      selectLangFirst: 'Selecione o idioma do livro primeiro ↑',
      styleOptions: ['Espiritual', 'Técnico', 'Autoajuda', 'Religioso', 'Emocional', 'Infantil', 'Acadêmico', 'Teológico'],
      toneOptions: ['Técnica e Acadêmica', 'Leve e Acolhedora', 'Inspiradora', 'Conversacional'],
      titleModeLabel: '5. Título da Obra (Opcional)',
      titleModeQuestion: 'Você deseja informar o nome do Titulo do Livro ou prefere que a nossa Ferramenta sugira os melhores títulos extremamente otimizados?',
      btnManual: 'INFORMAR TÍTULO MANUALMENTE',
      btnAI: 'DEIXAR A FBS GERAR OS TÍTULOS',
      manualTitleLabel: 'Digite o Título do seu Livro',
      manualTitlePlaceholder: 'Ex: O Poder Oculto da IA no Seu Bolso',
      manualSubTitleLabel: 'Digite o Subtítulo do seu Livro (Opcional)',
      manualSubTitlePlaceholder: 'Ex: Como dominar as ferramentas mais poderosas do mundo'
    },
    en: {
      welcome: 'WELCOME TO THE BEST SELLER FACTORY',
      subtitle: 'Start building your book now!',
      heading: 'Niche Definition',
      subheading: 'The first step to creating a viral Best-Seller.',
      bookLangLabel: '1. Book Generation Language',
      bookLangNote: 'Choose the language your book will be written in. All content — research, text, and marketing — will be produced in this language.',
      styleLabel: '3. Content Style',
      toneLabel: '4. Writing Tone',
      authorLabel: "Author's Name",
      authorPlaceholder: 'Ex: John Smith',
      topicLabel: 'Topic / Niche / Subject',
      topicPlaceholder: 'Ex: Personal finance for beginners, how to invest, how to get out of debt...',
      topicHint: 'Be specific. The more details, the better the AI research.',
      startBtn: 'Start Market Research (AI) →',
      selectLangFirst: 'Select the book language first ↑',
      styleOptions: ['Spiritual', 'Technical', 'Self-Help', 'Religious', 'Emotional', 'Children', 'Academic', 'Theological'],
      toneOptions: ['Technical & Academic', 'Light & Welcoming', 'Inspiring', 'Conversational'],
      titleModeLabel: '5. Book Title (Optional)',
      titleModeQuestion: 'Do you want to provide the book title yourself or would you prefer our tool to suggest the best optimized titles?',
      btnManual: 'PROVIDE TITLE MANUALLY',
      btnAI: 'LET FBS GENERATE TITLES',
      manualTitleLabel: 'Type your Book Title',
      manualTitlePlaceholder: 'Ex: The Hidden Power of AI in Your Pocket',
      manualSubTitleLabel: 'Type your Book Subtitle (Optional)',
      manualSubTitlePlaceholder: 'Ex: How to master the most powerful tools in the world'
    },
    es: {
      welcome: '¡BIENVENIDO(A) A LA FÁBRICA DE BEST SELLER!',
      subtitle: '¡Comienza a fabricar tu libro ahora!',
      heading: 'Definición del Nicho',
      subheading: 'El primer paso para crear un Best-Seller viral.',
      bookLangLabel: '1. Idioma de Generación del Libro',
      bookLangNote: 'Elige el idioma en que se escribirá el libro. Todo el contenido — investigación, texto y marketing — se producirá en este idioma.',
      styleLabel: '3. Estilo de Conteúdo',
      toneLabel: '4. Tono de Escritura',
      authorLabel: 'Nombre del Autor(a)',
      authorPlaceholder: 'Ej: Carlos González',
      topicLabel: 'Tema / Nicho / Assunto',
      topicPlaceholder: 'Ej: Finanzas personales para principiantes, cómo invertir, cómo salir de las deudas...',
      topicHint: 'Sé específico. Cuantos más detalles, mejor será la investigación de la IA.',
      startBtn: 'Iniciar Investigación de Mercado (IA) →',
      selectLangFirst: 'Selecciona el idioma del libro primero ↑',
      styleOptions: ['Espiritual', 'Técnico', 'Autoajuda', 'Religioso', 'Emocional', 'Infantil', 'Académico', 'Teológico'],
      toneOptions: ['Técnica y Académica', 'Ligera y Acogedora', 'Inspiradora', 'Conversacional'],
      titleModeLabel: '5. Título de la Obra (Opcional)',
      titleModeQuestion: '¿Desea informar el nombre del Título del Libro o prefiere que nuestra Herramienta sugiera los mejores títulos extremadamente optimizados?',
      btnManual: 'INFORMAR TÍTULO MANUALMENTE',
      btnAI: 'DEJAR QUE FBS GENERE LOS TÍTULOS',
      manualTitleLabel: 'Escribe el Título de tu Libro',
      manualTitlePlaceholder: 'Ej: El Poder Oculto de la IA en tu Bolsillo',
      manualSubTitleLabel: 'Escribe el Subtítulo de tu Libro (Opcional)',
      manualSubTitlePlaceholder: 'Ej: Cómo dominar as herramientas más poderosas del mundo'
    }
  };

  const L = labels[language] || labels['pt'];

  return (
    <>
      <div className="text-center mb-8 animate-fade-in text-slate-800">
        <h1 className="text-2xl md:text-3xl font-black uppercase tracking-wide mb-2">
          {L.welcome}
        </h1>
        <p className="text-lg text-slate-600 font-medium">
          {L.subtitle}
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 max-w-3xl mx-auto animate-fade-in-up">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-slate-900">{L.heading}</h2>
          <p className="text-slate-500 mt-2">{L.subheading}</p>
        </div>

        {/* SECTION 0: BOOK LANGUAGE SELECTION */}
        <div className="mb-10">
          <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">
            {L.bookLangLabel}
          </label>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            {L.bookLangNote}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {BOOK_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setBookLanguage(lang.code)}
                className={`relative p-4 rounded-xl text-left border-2 transition-all duration-200 ${
                  selectedBookLang === lang.code
                    ? 'border-blue-500 bg-blue-50 shadow-md ring-4 ring-blue-100'
                    : 'border-slate-100 bg-slate-50 hover:border-slate-300 hover:bg-white'
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
          <div className="animate-fade-in">
            {/* NEW SECTION: MODE SELECTION (Fiction vs Non-Fiction) */}
            <div className="mb-10 p-1 bg-slate-100 rounded-2xl flex gap-1">
              <button
                onClick={() => setMetadata(prev => ({ ...prev, isFiction: false, genre: undefined }))}
                className={`flex-1 py-4 px-4 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-1 ${!metadata.isFiction 
                  ? 'bg-white text-slate-800 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="text-xl">📚</span>
                {F.nonFiction}
              </button>
              <button
                onClick={() => setMetadata(prev => ({ ...prev, isFiction: true }))}
                className={`flex-1 py-4 px-4 rounded-xl font-black text-xs transition-all flex flex-col items-center gap-1 ${metadata.isFiction 
                  ? 'bg-white text-[#0ea5e9] shadow-sm' 
                  : 'text-slate-400 hover:text-slate-600'}`}
              >
                <span className="text-xl">🚀</span>
                {F.fiction}
              </button>
            </div>

            <div className="space-y-10 mb-10">
              
              {/* CONDITIONAL SECTION: GENRE (Fiction) or STYLE (Non-Fiction) */}
              {metadata.isFiction ? (
                <div className="animate-fade-in">
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{F.chooseGenre}</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(F.genres).map(([key, label]: [string, any]) => (
                      <button
                        key={key}
                        onClick={() => setMetadata(prev => ({ ...prev, genre: label }))}
                        className={`p-4 rounded-xl text-left border-2 transition-all flex flex-col gap-1 ${metadata.genre === label
                          ? 'border-[#0ea5e9] bg-sky-50 shadow-md ring-4 ring-sky-100'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-300'
                          }`}
                      >
                        <div className={`font-bold text-sm ${metadata.genre === label ? 'text-[#0ea5e9]' : 'text-slate-700'}`}>{label}</div>
                        <div className="text-[10px] text-slate-400 leading-tight uppercase font-medium">{(F.genreFocus as any)[key]}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{L.styleLabel}</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {L.styleOptions.map((style) => (
                      <button
                        key={style}
                        onClick={() => setMetadata(prev => ({ ...prev, contentStyle: style }))}
                        className={`py-3 px-2 rounded-lg text-xs font-bold transition-all border ${metadata.contentStyle === style
                          ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-4 ring-slate-100'
                          : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-slate-300 hover:bg-white'
                          }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TONE */}
              {!metadata.isFiction && (
                <div className="animate-fade-in">
                  <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{L.toneLabel}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {L.toneOptions.map((tone) => (
                      <button
                        key={tone}
                        onClick={() => setMetadata(prev => ({ ...prev, writingTone: tone }))}
                        className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border ${metadata.writingTone === tone
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-4 ring-blue-100'
                          : 'bg-slate-50 text-slate-600 border-slate-100 hover:border-blue-300 hover:bg-white'
                          }`}
                      >
                        {tone}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CHARACTERS (Only for Fiction) */}
              {metadata.isFiction && (
                <div className="animate-fade-in pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-bold text-slate-700 uppercase tracking-wider">{F.characterHeading}</label>
                    <button 
                      onClick={addCharacter}
                      disabled={(metadata.characters || []).length >= 5}
                      className="text-xs font-black text-[#0ea5e9] hover:underline uppercase"
                    >
                      {F.addCharacter}
                    </button>
                  </div>
                  <div className="space-y-4">
                    {(metadata.characters || []).map((char, idx) => (
                      <div key={idx} className="group relative bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-sky-200 transition-all animate-in slide-in-from-left-2 duration-300">
                        <button 
                          onClick={() => removeCharacter(idx)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          ×
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input 
                            value={char.name}
                            onChange={(e) => updateCharacter(idx, 'name', e.target.value)}
                            placeholder={F.characterName}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-100 outline-none text-sm font-bold"
                          />
                          <input 
                            value={char.info}
                            onChange={(e) => updateCharacter(idx, 'info', e.target.value)}
                            placeholder={F.characterInfo}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-sky-100 outline-none text-sm md:col-span-2"
                          />
                        </div>
                      </div>
                    ))}
                    {(metadata.characters || []).length === 0 && (
                      <p className="text-center py-4 text-xs text-slate-400 italic">Nenhum personagem adicionado. A IA criará personagens automáticos se necessário.</p>
                    )}
                  </div>
                  <div className="mt-6 flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[10px] text-emerald-700 font-bold uppercase tracking-tight">
                    <span className="text-base">🛡️</span> {F.antiAiNote}
                  </div>
                </div>
              )}

              {/* TITLE MODE */}
              <div className="pt-8 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700 mb-3 uppercase tracking-wider">{L.titleModeLabel}</label>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed italic">
                  {L.titleModeQuestion}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setTitleMode('manual');
                      setMetadata(prev => ({ ...prev, bookTitle: '' }));
                    }}
                    className={`py-4 px-6 rounded-xl text-xs font-black transition-all border-2 flex flex-col items-center justify-center gap-2 text-center ${titleMode === 'manual'
                      ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-md ring-4 ring-amber-100'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    <span className="text-xl">✍️</span>
                    {L.btnManual}
                  </button>
                  <button
                    onClick={() => {
                      setTitleMode('ai');
                      setMetadata(prev => ({ ...prev, bookTitle: '' }));
                    }}
                    className={`py-4 px-6 rounded-xl text-xs font-black transition-all border-2 flex flex-col items-center justify-center gap-2 text-center ${titleMode === 'ai'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-md ring-4 ring-blue-100'
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                      }`}
                  >
                    <span className="text-xl">🤖</span>
                    {L.btnAI}
                  </button>
                </div>
              </div>

              {titleMode === 'manual' && (
                <div className="animate-in slide-in-from-top-2 duration-300 space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{L.manualTitleLabel}</label>
                    <input
                      name="bookTitle"
                      value={metadata.bookTitle || ''}
                      onChange={handleChange}
                      placeholder={L.manualTitlePlaceholder}
                      className="w-full px-5 py-4 rounded-xl border-2 border-amber-200 bg-white focus:ring-4 focus:ring-amber-100 focus:border-amber-400 outline-none transition-all text-lg font-black text-slate-800 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">{L.manualSubTitleLabel}</label>
                    <input
                      name="subTitle"
                      value={metadata.subTitle || ''}
                      onChange={handleChange}
                      placeholder={L.manualSubTitlePlaceholder}
                      className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 bg-white focus:ring-4 focus:ring-slate-50 focus:border-slate-200 outline-none transition-all text-base font-medium text-slate-700 shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">{L.authorLabel}</label>
                <input
                  name="authorName"
                  value={metadata.authorName}
                  onChange={handleChange}
                  placeholder={L.authorPlaceholder}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all text-lg font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tight">{L.topicLabel}</label>
                <textarea
                  name="topic"
                  value={metadata.topic}
                  onChange={handleChange}
                  rows={4}
                  placeholder={metadata.isFiction ? 'Sobre o que é sua história? Descreva em poucas linhas o conflito central...' : L.topicPlaceholder}
                  className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-300 outline-none transition-all text-lg resize-none font-medium"
                />
                <p className="text-xs text-slate-400 mt-3 font-medium">
                  {L.topicHint}
                </p>
              </div>
            </div>

            <div className="mt-12">
              <button
                onClick={onNext}
                disabled={!isFormValid}
                className={`w-full py-5 rounded-2xl font-black text-white shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 ${isFormValid
                  ? 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-black hover:to-slate-900 shadow-slate-200'
                  : 'bg-slate-200 cursor-not-allowed text-slate-400'
                  }`}
              >
                {L.startBtn}
              </button>
              {!isFormValid && (
                <p className="text-center text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest animate-pulse">Preencha todos os campos obrigatórios para liberar a IA</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};