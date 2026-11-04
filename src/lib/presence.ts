// Tells your friends where you are (at home, in the streets, or at a place) every 45 seconds while you are signed in and playing.
import { useEffect, useRef } from "react";
import { touchPresence } from "./friends";

const BEAT_MS = 45_000;

/** `label` is "home", "street" or a place id like "buka". Signed-in players only. */
export function usePresence(userId: string | null, label: string) {
  const last = useRef(label);
  last.current = label;
  useEffect(() => {
    if (!userId) return;
    const id = setInterval(() => void touchPresence(last.current), BEAT_MS);
    return () => clearInterval(id);
  }, [userId]);
  // a change of place is told at once, so a friend sees you arrive
  useEffect(() => {
    if (userId) void touchPresence(label);
  }, [userId, label]);
}
