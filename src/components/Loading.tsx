/** Shown while a big part of the game (the 3D room or streets) downloads. */
export default function Loading({ what }: { what: string }) {
  return (
    <div className="loading" role="status">
      <div className="loading-danfo" aria-hidden>🚌</div>
      <b>Loading {what}…</b>
      <span className="note">The first time takes a few seconds.</span>
      <div className="loading-bar" aria-hidden><i /></div>
    </div>
  );
}
