import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: false,
      manifest: {
        id: "/",
        name: "Rhabbit",
        short_name: "Rhabbit",
        description: "A calm, friendly habit tracker. Take it one hop at a time.",
        theme_color: "#FCFAF5",
        background_color: "#FCFAF5",
        display: "standalone",
        display_override: ["window-controls-overlay", "standalone"],
        start_url: "/",
        scope: "/",
        categories: ["lifestyle", "productivity", "health"],
        shortcuts: [
          { name: "Today", short_name: "Today", url: "/" },
          { name: "Progress", short_name: "Progress", url: "/insights" },
        ],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/rhabbit-monochrome.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "monochrome",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // Manifest icons are added automatically; excluding them here avoids
        // duplicate precache entries while keeping the remaining artwork cached.
        globIgnores: ["icons/icon-*.png", "icons/rhabbit-monochrome.svg"],
        navigateFallback: "/index.html",
        // Never serve the SPA shell for Firebase auth helpers
        navigateFallbackDenylist: [/^\/__/],
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
          sheetjs: ["xlsx"],
        },
      },
    },
  },
});
