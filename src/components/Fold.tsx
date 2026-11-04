import type { ReactNode } from "react";

/** A section that opens and closes (native <details>), so long screens stay short. */
export default function Fold({ icon, title, hint, open = false, children }: { icon: string; title: string; hint?: string; open?: boolean; children: ReactNode }) {
  return (
    <details className="fold" open={open}>
      <summary>
        <span className="fold-icon" aria-hidden>{icon}</span>
        <span className="fold-title"><b>{title}</b>{hint && <small>{hint}</small>}</span>
        <span className="fold-caret" aria-hidden>›</span>
      </summary>
      <div className="fold-body">{children}</div>
    </details>
  );
}
