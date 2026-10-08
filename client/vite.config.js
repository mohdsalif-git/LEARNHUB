import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    headers: {
      // Dev-only CSP: allows 'unsafe-eval' and 'unsafe-inline' for Vite HMR and source maps.
      // Strict production CSP without 'unsafe-eval' is enforced in vercel.json.
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' ws: http://localhost:5000 http://127.0.0.1:5000 https://learnhub-backend-eight.vercel.app https://api.razorpay.com https://lumberjack.razorpay.com https://lumberjack-rzp.razorpay.com; frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com https://api.razorpay.com https://checkout.razorpay.com; form-action 'self' https://api.razorpay.com; object-src 'none'; base-uri 'self';",
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});

