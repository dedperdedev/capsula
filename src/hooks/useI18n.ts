import { useState, useEffect } from 'react';
import { getLocale, setLocale as setLocaleStorage, type Locale, t as translate } from '../lib/i18n';

export function useI18n() {
  const [locale, setLocaleState] = useState<Locale>(getLocale());

  useEffect(() => {
    const handleLocaleChange = () => {
      setLocaleState(getLocale());
    };
    window.addEventListener('localechange', handleLocaleChange);
    return () => window.removeEventListener('localechange', handleLocaleChange);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleStorage(newLocale);
    setLocaleState(newLocale);
  };

  const t = (key: string, params?: Record<string, string | number>) => {
    return translate(key, params);
  };

  return { locale, setLocale, t };
}

export { setLocaleStorage as setLocale };



