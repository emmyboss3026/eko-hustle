// Your own profile picture. It is cropped to a small square on your device and kept in this browser only:
// it is never sent to the game's servers, saved to your account or shown to other players.

import { useSyncExternalStore } from "react";

const KEY = "eko-hustle-photo";
const SIZE = 192;                 // pixels: plenty for a round picture of a few dozen pixels
const MAX_FILE = 25 * 1024 * 1024; // refuse anything bigger than this before even trying

let current: string | null = read();
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    return v && v.startsWith("data:image/jpeg;base64,") ? v : null;
  } catch {
    return null;   // blocked storage: no picture
  }
}

export const getPhoto = () => current;

export function setPhoto(dataUrl: string | null) {
  current = dataUrl;
  try {
    if (dataUrl) localStorage.setItem(KEY, dataUrl);
    else localStorage.removeItem(KEY);
  } catch {
    // storage full or blocked: the picture lasts until the page is closed
  }
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => { listeners.delete(l); };
};

/** The profile picture (a small JPEG as a data URL), or null to show the character instead. */
export const usePhoto = () => useSyncExternalStore(subscribe, getPhoto, () => null);

/** The square the picture is cut from: the middle of the image. */
export function cropSquare(w: number, h: number) {
  const side = Math.min(w, h);
  return { sx: Math.floor((w - side) / 2), sy: Math.floor((h - side) / 2), side };
}

/** Turn a chosen or just-taken image into a small, centred, square JPEG. Rejects if it is not an image we can read. */
export async function processPhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("not an image");
  if (file.size > MAX_FILE) throw new Error("too big");
  let source: ImageBitmap | HTMLImageElement;
  let w: number, h: number;
  try {
    // from-image turns phone photos the right way up
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
    w = source.width; h = source.height;
  } catch {
    const url = URL.createObjectURL(file);
    try {
      source = await new Promise<HTMLImageElement>((ok, no) => {
        const img = new Image();
        img.onload = () => ok(img);
        img.onerror = () => no(new Error("unreadable"));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
    w = source.naturalWidth; h = source.naturalHeight;
  }
  if (!w || !h) throw new Error("empty image");
  const { sx, sy, side } = cropSquare(w, h);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.fillStyle = "#2a2478";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.drawImage(source, sx, sy, side, side, 0, 0, SIZE, SIZE);
  if ("close" in source) source.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}
