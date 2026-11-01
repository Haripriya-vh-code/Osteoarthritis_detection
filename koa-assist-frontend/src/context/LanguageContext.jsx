import { useEffect, useState } from "react";

import en from "../translations/en.json";
import hi from "../translations/hi.json";
import as from "../translations/as.json";

import { LanguageContext } from "./LanguageContext.js";

const translations = {
  en,
  hi,
  as,
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("koaLanguage") || "en";
  });

  useEffect(() => {
    localStorage.setItem("koaLanguage", language);
  }, [language]);

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];

    for (const part of keys) {
      value = value?.[part];
    }

    return value || key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}