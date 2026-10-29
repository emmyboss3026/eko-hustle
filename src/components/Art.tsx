import { placeArt } from "../art/art.js";

/** A hand-drawn picture of a place (SVG made in code), lit for the time of day. */
export default function Art({ id, time, className = "art" }: { id: string; time: number; className?: string }) {
  const hour = Math.floor((time % 1440) / 60);
  // The SVG is built from our own fixed drawing code (no user text), so it's safe to insert.
  return <div className={`art-box ${className}`} aria-hidden dangerouslySetInnerHTML={{ __html: placeArt(id, hour, "art") }} />;
}
