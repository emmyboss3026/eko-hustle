import type { ReactNode } from "react";

/** A panel that slides up over the 3D view (on wide screens it sits on the right). */
export default function Sheet({ title, onClose, children, size = "big" }: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  size?: "big" | "small";
}) {
  return (
    <section className={`panel-sheet ${size}`} role="dialog" aria-label={typeof title === "string" ? title : undefined}>
      <header className="panel-head">
        <h2>{title}</h2>
        <button className="btn plain close" onClick={onClose} aria-label="Close">✕</button>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
