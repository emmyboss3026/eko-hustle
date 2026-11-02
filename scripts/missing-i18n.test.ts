// Lists game content that has no German or Pidgin text yet (for translators).
// Run: MISSING_OUT=/path/file.json npx vitest run scripts/missing-i18n.test.ts
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { contentEntries } from "../src/i18n/text";
import { de } from "../src/i18n/de";
import { pcm } from "../src/i18n/pcm";

it("lists missing translations", () => {
  const out = process.env.MISSING_OUT;
  if (!out) return;
  const missing = contentEntries().filter(([k]) => !(k in de) || !(k in pcm));
  writeFileSync(out, JSON.stringify(Object.fromEntries(missing), null, 1));
});
