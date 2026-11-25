import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

export default ({ mode }) => {
  const projectRoot = fileURLToPath(new URL(".", import.meta.url));
  const env = loadEnv(mode, projectRoot, "");

  if (!env.VITE_GOOGLE_CLIENT_ID) {
    throw new Error(
      "VITE_GOOGLE_CLIENT_ID is required to build or run the frontend."
    );
  }

  const backendUrl = env.VITE_BACKEND_URL || "http://localhost:5002";

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
          target: "https://saravanashoppings.com",
          changeOrigin: true,
          secure: true,
          rewrite: (path) =>
            path.replace(/^\/proxy-uploads/, "/uploads"),
        },
      },
    },
  });
};