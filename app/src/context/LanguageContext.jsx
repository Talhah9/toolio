import { createContext, useContext, useState, useCallback } from 'react';
import { en } from '../locales/en';
import { fr } from '../locales/fr';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('savvly-lang') || 'fr');

  const toggleLang = useCallback(() => {
    setLang(l => {
      const next = l === 'en' ? 'fr' : 'en';
      localStorage.setItem('savvly-lang', next);
      return next;
    });
  }, []);

  const t = useCallback((key) => {
    const strings = lang === 'fr' ? fr : en;
    return strings[key] ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
