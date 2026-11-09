// Tells your friends where you are (at home, in the streets, or at a place) every 45 seconds while you are signed in and playing.
import { useEffect, useRef } from "react";  // React hooks
import { touchPresence } from "./friends";  // tells the server where you are

const BEAT_MS = 45_000;  // send a heartbeat every 45 seconds

/** `label` is "home", "street" or a place id like "buka". Signed-in players only. */
export function usePresence(userId: string | null, label: string) {  // report the player's place while signed in
  const last = useRef(label);  // remember the latest place without re-running effects
  last.current = label;  // keep that memory current
  useEffect(() => {
    if (!userId) return;  // only signed-in players report
    const id = setInterval(() => void touchPresence(last.current), BEAT_MS);  // send the place on a timer
    return () => clearInterval(id);  // stop the timer on cleanup
  }, [userId]);  // restart when the player changes
  // a change of place is told at once, so a friend sees you arrive
  useEffect(() => {
    if (userId) void touchPresence(label);  // report a place change right away
  }, [userId, label]);
}
