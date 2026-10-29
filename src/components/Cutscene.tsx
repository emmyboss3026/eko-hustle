import { useEffect, useState } from "react";
import { placeArt, roadsideStrip, skyFor, skylineStrip, vehicleArt } from "../art/art.js";
import { useLang } from "../i18n/react";

export type Ride = { mode: string; to: string; art?: string; minutes: number; km: number; label: string; time: number };

// Our travel modes → the ride drawn in the scene
const RIDE: Record<string, string> = { trek: "walk", danfo: "danfo", keke: "keke", okada: "okada" };
const PACE: Record<string, number> = { walk: 1.8, keke: 1, danfo: 1, okada: 0.7 };

/** The travel scene: your ride passing through Lagos, with where you're going. Tap to skip. */
export default function Cutscene({ ride, onDone }: { ride: Ride; onDone: () => void }) {
  const { t } = useLang();
  const [p, setP] = useState(0);
  const reduced = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const seconds = reduced ? 1.5 : Math.min(5, Math.max(2.5, 2 + ride.minutes / 40));

  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / (seconds * 1000));
      setP(k);
      if (k < 1) raf = requestAnimationFrame(tick);
      else window.setTimeout(onDone, 500);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [seconds, onDone]);

  const hour = Math.floor((ride.time % 1440) / 60);
  const sk = skyFor(hour);
  const mode = RIDE[ride.mode] ?? "walk";
  // Frame the scene for this screen: wide screens see the whole street; tall phone
  // screens crop the sides (never the ride) and show more sky above.
  const aspect = Math.max(0.3, innerWidth / Math.max(1, innerHeight));
  const VW = Math.round(aspect >= 400 / 225 ? 400 : Math.max(180, Math.min(400, 225 * aspect)));
  const H = Math.round(aspect >= 400 / 225 ? 225 : Math.max(225, VW / aspect));
  const X0 = Math.round(200 - VW / 2);
  // The SVG below is made from our own drawing code (no user text), so it's safe to insert.
  const scene = `
    <defs><linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sk.top}"/><stop offset="1" stop-color="${sk.bottom}"/></linearGradient></defs>
    <rect y="${225 - H}" width="400" height="${H}" fill="url(#cs-sky)"/>
    ${sk.night ? `<circle cx="${X0 + VW * 0.78}" cy="${225 - H + Math.max(40, H * 0.3)}" r="12" fill="#f4f1de"/>` : `<circle cx="${X0 + VW * 0.78}" cy="${225 - H + Math.max(44, H * 0.3)}" r="16" fill="${sk.sun}"/>`}
    <g class="cs-far">${skylineStrip(sk.night)}</g>
    <rect y="150" width="400" height="12" fill="${sk.night ? "#3a3a46" : "#b9ab96"}"/>
    <g class="cs-mid">${roadsideStrip()}</g>
    <rect y="160" width="400" height="65" fill="${sk.night ? "#26262e" : "#4b4b52"}"/>
    <g class="cs-road">${Array.from({ length: 12 }, (_, i) => `<rect x="${i * 70}" y="190" width="36" height="3" fill="#f1f1f1" opacity="0.8"/>`).join("")}</g>
    <g transform="translate(200 206) scale(1.35)"><g class="cs-ride mode-${mode}">${vehicleArt(mode)}</g></g>`;

  return (
    <div className="cutscene" role="dialog" aria-label={t("ride.heading", { place: ride.to })} style={{ ["--pace" as string]: String(PACE[mode] ?? 1) }} onClick={onDone}>
      <svg className="cs-scene" viewBox={`${X0} ${225 - H} ${VW} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden dangerouslySetInnerHTML={{ __html: scene }} />
      <div className="cs-card" onClick={e => e.stopPropagation()}>
        {ride.art && <div className="cs-dest" aria-hidden dangerouslySetInnerHTML={{ __html: placeArt(ride.art, hour, "art") }} />}
        <div className="cs-text">
          <small>{ride.label} · {ride.km} km · {ride.minutes} min</small>
          <b>{p >= 1 ? t("ride.arrived") : t("ride.heading", { place: ride.to })}</b>
          <div className="cs-bar"><i style={{ width: `${Math.round(p * 100)}%` }} /></div>
        </div>
        <button className="btn" onClick={onDone}>{t("ride.skip")}</button>
      </div>
    </div>
  );
}
