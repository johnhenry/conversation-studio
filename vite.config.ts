import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), basicSsl()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  worker: {
    format: "es",
  },
  build: {
    sourcemap: true,
  },
  resolve: {
    alias: {
      "src:": path.resolve(__dirname, "./src"),
    }
  },
  server: {
    https: true,
    host: true
  }
});
