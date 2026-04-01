import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  envDir: path.resolve(__dirname, ".."),
  plugins: [
    tailwindcss(),
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  resolve: {
    alias: {
      "@/icons": path.resolve(__dirname, "./src/assets/icons/index"),
      "@/icons/*": path.resolve(__dirname, "./src/assets/icons/*"),
      "@/apis": path.resolve(__dirname, "./src/api/*"),
      "@/commons": path.resolve(__dirname, "./src/commons"),
    },
  },
});
