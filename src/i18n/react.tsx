import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isLang, tFor, type Lang, type T } from "./core";
import { text, type Text } from "./text";

const KEY = "eko-hustle-lang";

function startLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (isLang(saved)) return saved;
  } catch {
    // no storage: fall through
  }
  return typeof navigator !== "undefined" && navigator.language?.toLowerCase().startsWith("de") ? "de" : "en";
}

type Ctx = { lang: Lang; setLang: (l: Lang) => void; t: T; tx: Text };

const LangContext = createContext<Ctx>({ lang: "en", setLang: () => {}, t: tFor("en"), tx: text("en") });

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(startLang);
  useEffect(() => {
    document.documentElement.lang = lang === "pcm" ? "pcm" : lang;
  }, [lang]);
  const value = useMemo<Ctx>(() => ({
    lang,
    setLang: (l: Lang) => {
      setLangState(l);
      try {
        localStorage.setItem(KEY, l);
      } catch {
        // ignore
      }
    },
    t: tFor(lang),
    tx: text(lang),
  }), [lang]);
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLang() {
  return useContext(LangContext);
}

/** Text with **bold** parts. */
export function Rich({ text: s }: { text: string }) {
  const parts = s.split(/\*\*(.+?)\*\*/g);
  return <>{parts.map((p, i) => (i % 2 ? <b key={i}>{p}</b> : p))}</>;
}
