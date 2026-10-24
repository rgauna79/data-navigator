import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import es from "./es.js";

// Traducciones: el texto en inglés es la clave y el diccionario de cada
// idioma lo traduce. Si falta una traducción se muestra el texto en inglés.
const DICTIONARIES = { es };
export const LANGUAGES = { en: "English", es: "Español" };
const LOCALES = { en: "en-US", es: "es-ES" };
const STORAGE_KEY = "dn-lang";

const detectLanguage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES[saved]) return saved;
  } catch {
    // localStorage puede no estar disponible (modo privado)
  }
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("es") ? "es" : "en";
};

// Reemplaza {nombre} por vars.nombre
const interpolate = (text, vars) =>
  vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m)) : text;

// Mensajes del servidor con partes variables: se traducen con su plantilla
const SERVER_PATTERNS = [
  [/^A saved file named "(.*)" already exists\.$/, 'A saved file named "{name}" already exists.', ["name"]],
  [/^Data is too large to save \(max (.*)\)\.$/, "Data is too large to save (max {max}).", ["max"]],
];

// Funciones de traducción y formato para un idioma (también se usan fuera de React)
export const createTranslator = (lang) => {
  const dict = DICTIONARIES[lang] || {};
  const locale = LOCALES[lang] || LOCALES.en;
  const t = (text, vars) => interpolate(dict[text] ?? text, vars);
  // Singular o plural según count: tn("{count} row", "{count} rows", n)
  const tn = (one, other, count, vars) => t(count === 1 ? one : other, { count: fmtNumber(count), ...vars });
  // useGrouping "always": en español 1234 también se muestra como 1.234
  const fmtNumber = (n, options = {}) =>
    n === null || n === undefined || Number.isNaN(n)
      ? "—"
      : Number(n).toLocaleString(locale, { useGrouping: "always", ...options });
  // Número con exactamente 2 decimales (importes, promedios)
  const fmtDecimal = (n) => fmtNumber(n, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtDate = (d, options = { month: "short", day: "numeric", year: "numeric" }) =>
    d ? new Date(d).toLocaleDateString(locale, options) : "—";
  // Mensaje de error de la API (en inglés) traducido; fallback si no hay mensaje
  const tServer = (message, fallback) => {
    if (!message) return t(fallback);
    for (const [re, template, names] of SERVER_PATTERNS) {
      const m = message.match(re);
      if (m) return t(template, Object.fromEntries(names.map((n, i) => [n, m[i + 1]])));
    }
    return t(message);
  };
  return { lang, locale, t, tn, tServer, fmtNumber, fmtDecimal, fmtDate };
};

export { tk } from "./tk.js";

const I18nContext = createContext(createTranslator("en"));

export const useI18n = () => useContext(I18nContext);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectLanguage);

  const setLang = useCallback((next) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Sin almacenamiento el idioma dura hasta recargar
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo(() => ({ ...createTranslator(lang), setLang }), [lang, setLang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
