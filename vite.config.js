import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/upload": {
        target: "http://localhost:8000",
        changeOrigin: true,
        bypass: (req) => {
          // If browser is requesting HTML page (e.g. navigation or page refresh), serve index.html
          if (req.headers.accept && req.headers.accept.includes("text/html")) {
            return "/index.html";
          }
        },
      },
      "/optimize": {
        target: "http://localhost:8000",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes("text/html")) {
            return "/index.html";
          }
        },
      },
      "/analytics": {
        target: "http://localhost:8000",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes("text/html")) {
            return "/index.html";
          }
        },
      },
      "/simulate": {
        target: "http://localhost:8000",
        changeOrigin: true,
        bypass: (req) => {
          if (req.headers.accept && req.headers.accept.includes("text/html")) {
            return "/index.html";
          }
        },
      },
      "/health": "http://localhost:8000",
    },
  },
});
