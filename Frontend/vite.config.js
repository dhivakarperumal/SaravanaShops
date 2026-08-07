import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  const backendUrl =
    env.VITE_BACKEND_URL || "http://localhost:5002";

  return defineConfig({
    plugins: [react(), tailwindcss()],

    server: {
      port: 5173,

      proxy: {
        "/api": {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
        },

        "/proxy-uploads": {
          target: "https://saravanashoppings.qtechx.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) =>
            path.replace(/^\/proxy-uploads/, "/uploads"),
        },
      },
    },
  });
};