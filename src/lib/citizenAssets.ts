// Loads the skinned citizen characters (three/citizen.ts and the GLB library) only when they are wanted, and says when they are ready.

import { useEffect, useState } from "react";

let ready = false;
let pending: Promise<void> | null = null;

/** Start loading the citizens (safe to call many times). Resolves when the first model is parsed and the builder is registered. */
export function ensureCitizens(): Promise<void> {
  pending ??= import("../three/citizen")
    .then(m => m.loadCitizens())
    .then(() => { ready = true; })
    .catch(() => { pending = null; });   // offline or blocked: the classic figure is used, and we try again next time
  return pending;
}

/** `wanted`: the player's own look needs a citizen. Returns false until the assets are ready (always true when not wanted). */
export function useCitizenAssets(wanted: boolean): boolean {
  const [ok, setOk] = useState(ready);
  useEffect(() => {
    void ensureCitizens().then(() => setOk(ready));
  }, [wanted]);
  return wanted ? ok : true;
}
