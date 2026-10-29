// Rewarded ads with Google's H5 Games Ads (Ad Placement API).
// Rules we follow (Google policy): the player must choose to watch, each ad is offered one at a time,
// and the reward is stated up front ("Watch an ad: +₦3,000").
//
// Set VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX in .env once Google approves you for H5 Games Ads.
// Without it, a pretend "test ad" runs in development so you can try the flow, and the button is hidden in production.

const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;

type AdBreakInfo = { breakStatus: string };
type AdBreakFn = (o: Record<string, unknown>) => void;
declare global {
  interface Window {
    adsbygoogle?: unknown[];
    adBreak?: AdBreakFn;
    adConfig?: AdBreakFn;
  }
}

export const adsAvailable = Boolean(client) || import.meta.env.DEV;
let started = false;

export function initAds() {
  if (!client || started) return;
  started = true;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
  s.crossOrigin = "anonymous";
  s.dataset.adClient = client;
  if (import.meta.env.DEV) s.dataset.adbreakTest = "on"; // Google's test ads while developing
  document.head.appendChild(s);
  window.adsbygoogle = window.adsbygoogle || [];
  window.adBreak = window.adConfig = o => {
    window.adsbygoogle!.push(o);
  };
  window.adConfig({ preloadAdBreaks: "on", sound: "on" });
}

// Show one rewarded ad. Calls exactly one of: onReward (watched to the end) or onNoReward (skipped / no ad available).
export function showRewardedAd(onReward: () => void, onNoReward: (reason: string) => void) {
  if (!client) {
    if (import.meta.env.DEV) {
      // Pretend ad, so you can test the flow before Google approval
      window.setTimeout(onReward, 1500);
      return;
    }
    onNoReward("Ads aren't available right now.");
    return;
  }
  initAds();
  let rewarded = false;
  window.adBreak?.({
    type: "reward",
    name: "daily-cash",
    beforeReward: (showAdFn: () => void) => showAdFn(),
    adViewed: () => {
      rewarded = true;
      onReward();
    },
    adDismissed: () => {},
    adBreakDone: (info: AdBreakInfo) => {
      if (!rewarded) onNoReward(info.breakStatus === "dismissed" ? "Ad closed early, so no reward." : "No ad available right now. Try again later.");
    },
  });
}
