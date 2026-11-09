import { Component, type ReactNode } from "react"; // React class component API

// Shown when something in the game crashes, instead of a blank white screen. Saves are untouched.
const TEXT = {
  en: { msg: "Something went wrong. Your progress is saved.", btn: "Reload" }, // English
  de: { msg: "Etwas ist schiefgelaufen. Dein Fortschritt ist gespeichert.", btn: "Neu laden" }, // German
  pcm: { msg: "Something go wrong. Your progress dey safe.", btn: "Reload am" }, // Pidgin
};

export default class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }; // nothing has crashed yet

  static getDerivedStateFromError() {
    return { failed: true }; // a child crashed: switch to the fallback
  }

  componentDidCatch(error: unknown) {
    console.error("Game crashed", error); // keep a trace for the console
  }

  render() {
    if (!this.state.failed) return this.props.children; // normal case
    const lang = document.documentElement.lang; // the language the game already set
    const t = lang === "de" ? TEXT.de : lang === "pcm" ? TEXT.pcm : TEXT.en; // pick the matching text
    return (
      <main role="alert" style={{ padding: 24, textAlign: "center" }}>
        <p>{t.msg}</p>
        <button className="btn" onClick={() => location.reload()}>{t.btn}</button>
      </main>
    );
  }
}
