import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/rhabbit.svg", "icons/apple-touch-icon.png"],
      manifest: {
        name: "Rhabbit",
        short_name: "Rhabbit",
        description: "A calm, friendly habit tracker. Take it one hop at a time.",
        theme_color: "#0b0d12",
        background_color: "#0b0d12",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
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
