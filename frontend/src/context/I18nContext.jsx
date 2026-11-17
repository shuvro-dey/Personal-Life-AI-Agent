import React, { createContext, useContext, useState, useEffect } from "react";
import en from "../i18n/en.json";
import bn from "../i18n/bn.json";

const translations = { en, bn };

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem("preferred_language") || "en";
  });

  const setLanguage = (lang) => {
    const valid = lang === "bn" ? "bn" : "en";
    setLanguageState(valid);
    localStorage.setItem("preferred_language", valid);
    document.documentElement.lang = valid;
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = (path, params = {}) => {
    const keys = path.split(".");
    let current = translations[language];
    for (const key of keys) {
      if (current && typeof current === "object" && key in current) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fbKey of keys) {
          if (fallback && typeof fallback === "object" && fbKey in fallback) {
            fallback = fallback[fbKey];
          } else {
            return path;
          }
        }
        current = fallback;
        break;
      }
    }

    if (typeof current !== "string") {
      return path;
    }

    let result = current;
    for (const [pKey, pVal] of Object.entries(params)) {
      result = result.replace(`{${pKey}}`, String(pVal));
    }
    return result;
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "";
    const str = String(num);
    if (language !== "bn") return str;
    const digits = { "0": "০", "1": "১", "2": "২", "3": "৩", "4": "৪", "5": "৫", "6": "৬", "7": "৭", "8": "৮", "9": "৯" };
    return str.split("").map((c) => digits[c] || c).join("");
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, formatNumber }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
