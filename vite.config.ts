import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), "transform-optional-chaining"],
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
  }
});
