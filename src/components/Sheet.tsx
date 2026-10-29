import { useEffect, useRef, type ReactNode } from "react";
import { useLang } from "../i18n/react";

/** A panel that slides up over the 3D view (on wide screens it sits on the right). Esc closes it. */
export default function Sheet({ title, onClose, children, size = "big" }: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: "big" | "small";
}) {
  const { t } = useLang();
  const box = useRef<HTMLElement>(null);
  const close = useRef(onClose);
  close.current = onClose;

  useEffect(() => {
    // Keyboard players land inside the panel, and go back where they were when it closes
    const before = document.activeElement as HTMLElement | null;
    box.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !e.defaultPrevented) close.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (before && document.contains(before)) before.focus({ preventScroll: true });
    };
  }, []);

  return (
    <section ref={box} tabIndex={-1} className={`panel-sheet ${size}`} role="dialog" aria-label={typeof title === "string" ? title : undefined}>
      <div className="panel-head">
        <h2>{title}</h2>
        <button className="btn plain close" onClick={onClose} aria-label={t("ui.close")}>✕</button>
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
