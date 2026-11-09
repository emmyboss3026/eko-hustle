import { createClient } from "@supabase/supabase-js";  // Supabase client builder

// Where the values come from:
// - on your PC: VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in .env.local
// - on Vercel: the public NEXT_PUBLIC_ variables added by the Supabase integration
// Only PUBLIC values are read here. Secret keys never reach the browser.
// If they are missing, the game still works fully offline; accounts and the leaderboard are just hidden.
const env = import.meta.env;  // build-time environment values
const pick = (...values: (string | undefined)[]) => values.map(v => v?.trim()).find(v => v);  // first non-empty value from the list

const rawUrl = pick(env.VITE_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_URL);  // project URL from either variable name
const key = pick(  // public key from any of the variable names
  env.VITE_SUPABASE_ANON_KEY,
  env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

// The URL must be the project's base address, e.g. https://abcd.supabase.co.
// If the REST address (…/rest/v1/) was pasted by mistake, trim it back to the base.
const url = rawUrl?.replace(/\/rest\/v1\/?$/, "").replace(/\/+$/, "");  // trim a pasted REST address back to the base

export const supabase = url && key ? createClient(url, key) : null;  // client, or null when not configured
export const cloudEnabled = supabase !== null;  // true when accounts and cloud features are available
