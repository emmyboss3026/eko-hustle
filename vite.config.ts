import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Google AdSense (H5 Games Ads): once VITE_ADSENSE_CLIENT=ca-pub-… is set, every build adds Google's
// site-verification tag to the page and publishes /ads.txt, both of which AdSense checks before approval.
function adsense(client: string | undefined): Plugin {
  const pub = client?.match(/^ca-(pub-\d{10,20})$/)?.[1];
  return {
    name: "eko-adsense",
    transformIndexHtml: () => (pub ? [{ tag: "meta", attrs: { name: "google-adsense-account", content: `ca-${pub}` }, injectTo: "head" }] : []),
    generateBundle() {
      if (pub) this.emitFile({ type: "asset", fileName: "ads.txt", source: `google.com, ${pub}, DIRECT, f08c47fec0942fa0\n` });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // The 3D room (Three.js) is one ~500 kB chunk that loads only when the Home tab opens.
  // The story text and each translation get their own chunks, so no file is too big for offline play
  // (the service worker only caches files up to 2 MB).
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("/src/data/story/")) return "story";
          if (id.includes("/src/i18n/de.")) return "lang-de";
          if (id.includes("/src/i18n/pcm.")) return "lang-pcm";
          if (id.includes("/src/i18n/en.")) return "lang-en";
          return undefined;
        },
      },
    },
  },
  // Only variables starting with these prefixes can reach the game in the browser.
  // NEXT_PUBLIC_ lets the game use the public values that Vercel's Supabase integration adds.
  // Never give a secret (service role, secret key, JWT secret, Postgres password) one of these prefixes.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [
    adsense(loadEnv(mode, process.cwd(), "VITE_").VITE_ADSENSE_CLIENT),
    react(),
    // Makes the game installable ("Add to Home screen") and playable offline
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        name: "Eko Hustle",
        short_name: "Eko Hustle",
        description: "A Lagos life simulator: furnish your room, survive NEPA and the go-slow, then japa or become a landlord.",
        theme_color: "#F2C200",
        background_color: "#DEDDD6",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Don't cache ads, payments or the database: those must always be live
        navigateFallbackDenylist: [/^\/(privacy|terms|refunds|cookies|imprint|credits)/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
            handler: "CacheFirst",
            options: { cacheName: "google-fonts", expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
        ],
      },
    }),
  ],
}));
