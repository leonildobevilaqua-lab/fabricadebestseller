import { useState, createContext, useContext } from 'react';
import { pt, en, es } from './locales';

type Language = 'pt' | 'en' | 'es';
const translations = { pt, en, es };

export const LanguageContext = createContext({
    lang: 'pt' as Language,
    setLang: (l: Language) => { },
    t: pt
});

export const useLanguage = () => useContext(LanguageContext);

export const getTranslation = (lang: Language) => translations[lang];
