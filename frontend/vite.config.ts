import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:7860",
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
    allowedHosts: ["spellbee.pawanpatra.com", "support.pawanpatra.com", "localhost"],
  },
});
