import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  // The 3D room (Three.js) is one ~500 kB chunk that loads only when the Home tab opens.
  build: { chunkSizeWarningLimit: 600 },
  // Only variables starting with these prefixes can reach the game in the browser.
  // NEXT_PUBLIC_ lets the game use the public values that Vercel's Supabase integration adds.
  // Never give a secret (service role, secret key, JWT secret, Postgres password) one of these prefixes.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  plugins: [
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
        navigateFallbackDenylist: [/^\/privacy/, /^\/terms/],
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
});
