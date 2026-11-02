import { useRef, useState } from "react";
import { processPhoto, setPhoto, usePhoto } from "../lib/photo";
import { useLang } from "../i18n/react";

/** Profile picture: take a photo with the camera, pick one from the gallery, or go back to your character. */
export default function PhotoSheet({ avatar, onClose }: { avatar: string; onClose: () => void }) {
  const { t } = useLang();
  const photo = usePhoto();
  const camera = useRef<HTMLInputElement>(null);
  const gallery = useRef<HTMLInputElement>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";   // so choosing the same picture again still counts
    if (!file) return;
    setProblem(null);
    setBusy(true);
    try {
      setPhoto(await processPhoto(file));
      onClose();
    } catch (err) {
      setProblem(t((err as Error).message === "not an image" ? "photo.notImage" : "photo.failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="photo-preview" aria-hidden>
        {photo ? <img src={photo} alt="" /> : <span>{avatar}</span>}
      </div>
      {/* capture="user" opens the front camera on a phone; on a computer it opens the file picker */}
      <input ref={camera} type="file" accept="image/*" capture="user" hidden onChange={pick} />
      <input ref={gallery} type="file" accept="image/*" hidden onChange={pick} />
      <div className="menu-grid">
        <button className="menu-tile" disabled={busy} onClick={() => camera.current?.click()}><span aria-hidden>📷</span>{t("photo.take")}</button>
        <button className="menu-tile" disabled={busy} onClick={() => gallery.current?.click()}><span aria-hidden>🖼️</span>{t("photo.gallery")}</button>
      </div>
      {photo && <button className="btn plain block" onClick={() => { setPhoto(null); onClose(); }}>🙂 {t("photo.remove")}</button>}
      {problem && <p className="note bad" role="alert">{problem}</p>}
      <p className="note">{t("photo.privacy")}</p>
    </>
  );
}
