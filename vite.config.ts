import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// Served under the rugby hub at /rota (docs/adr/0003, docs/research/hub-rota-pwa.md).
// The hub strips trailing slashes, so the service worker scope is '/rota', allowed by a header in vercel.json.
// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: "/rota/",
  build: { outDir: "dist/rota" }, // files live under /rota on the upstream too
  server: {
    host: "::",
    port: 8080,
  },
  preview: {
    headers: { "Service-Worker-Allowed": "/rota" }, // as vercel.json sends it, so the /rota scope registers locally
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "prompt", // never a surprise reload pitchside; the coach taps Reload
      scope: "/rota",
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      manifest: {
        id: "/rota",
        name: "Festival Rota",
        short_name: "Rota",
        description: "Plan who plays each half at a festival, inside the RFU Half Game Rule.",
        start_url: "/rota",
        scope: "/rota",
        display: "standalone",
        background_color: "#f5f2e8",
        theme_color: "#f5f2e8",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        navigateFallback: "/rota/index.html",
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
  },
}));
