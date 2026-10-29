import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, cloudEnabled } from "./supabase";
import { fetchProfile, type Profile } from "./cloud";
import { takeReturnStatus } from "./payments";
import { gemBalance } from "./gems";

type AccountState = {
  enabled: boolean;          // is Supabase set up at all?
  ready: boolean;            // have we checked for a session yet?
  profile: Profile | null;   // signed-in player, or null
  refresh: () => Promise<void>;
  notice: string | null;     // message after coming back from the payment page
  clearNotice: () => void;
};

const AccountContext = createContext<AccountState>({
  enabled: false,
  ready: true,
  profile: null,
  refresh: async () => {},
  notice: null,
  clearNotice: () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(!cloudEnabled);
  const [notice, setNotice] = useState<string | null>(null);
  const [returnStatus] = useState(takeReturnStatus);

  async function load(userId: string | undefined, email: string | undefined) {
    setProfile(userId ? await fetchProfile(userId, email ?? "") : null);
    setReady(true);
  }

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => load(data.session?.user.id, data.session?.user.email));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      void load(session?.user.id, session?.user.email);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Back from Bachs: the unlock arrives by webhook a few seconds later, so check a few times.
  useEffect(() => {
    if (returnStatus === "cancel" || returnStatus === "gems-cancel") {
      setNotice("pay.cancelled");
      return;
    }
    if (returnStatus === "gems-success" && supabase) {
      // Gems arrive by webhook a few seconds later: watch the balance go up
      setNotice("gems.arriving");
      let tries = 0;
      let stopped = false;
      let before = NaN; // the balance just before the player went to pay (saved by the gem shop)
      try {
        before = Number(sessionStorage.getItem("eko-hustle-gems-before") ?? "NaN");
      } catch {
        // ignore
      }
      const tick = async () => {
        if (stopped) return;
        const now = await gemBalance();
        if (now !== null && (Number.isNaN(before) ? now > 0 : now > before)) return setNotice("gems.arrived");
        if (++tries < 12) window.setTimeout(tick, 5000);
        else setNotice("gems.pending");
      };
      window.setTimeout(tick, 3000);
      return () => {
        stopped = true;
      };
    }
    if (returnStatus !== "success" || !supabase) return;
    setNotice("pay.received");
    let tries = 0;
    let stopped = false;
    const tick = async () => {
      if (stopped) return;
      const { data } = await supabase!.auth.getSession();
      const user = data.session?.user;
      if (user) {
        const p = await fetchProfile(user.id, user.email ?? "");
        setProfile(p);
        if (p.supporter) {
          setNotice("pay.unlocked");
          return;
        }
      }
      if (++tries < 12) window.setTimeout(tick, 5000);
      else setNotice("pay.pending");
    };
    void tick();
    return () => {
      stopped = true;
    };
  }, [returnStatus]);

  async function refresh() {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    await load(data.session?.user.id, data.session?.user.email);
  }

  return (
    <AccountContext.Provider
      value={{ enabled: cloudEnabled, ready, profile, refresh, notice, clearNotice: () => setNotice(null) }}
    >
      {children}
    </AccountContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAccount() {
  return useContext(AccountContext);
}
