import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { mkdirSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";

const ROOT = __dirname;
const SRC = resolve(ROOT, "src");
const MANIFEST_BASE = resolve(ROOT, "browser");

function manifestPlugin(target: "chrome" | "firefox") {
  return {
    name: "axis-manifest-plugin",
    closeBundle() {
      const manifestPath = resolve(MANIFEST_BASE, `manifest.${target}.json`);
      const manifest = readFileSync(manifestPath, "utf-8");
      const outDir = resolve(ROOT, "dist", target);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(resolve(outDir, "manifest.json"), manifest);

      // Copy icons after manifest so they exist for packaging.
      const icons = [
        "icon-16.png",
        "icon-32.png",
        "icon-48.png",
        "icon-128.png",
      ];
      for (const icon of icons) {
        copyFileSync(
          resolve(ROOT, "public", icon),
          resolve(outDir, icon),
        );
      }
    },
  };
}

export default defineConfig(({ mode }) => {
  const target = mode === "firefox" ? "firefox" : "chrome";

  return {
    root: ROOT,
    plugins: [react(), manifestPlugin(target)],
    publicDir: resolve(ROOT, "public"),
    build: {
      outDir: resolve(ROOT, "dist", target),
      emptyOutDir: true,
      sourcemap: true,
      rollupOptions: {
        input: {
          popup: resolve(SRC, "popup/index.html"),
          options: resolve(SRC, "options/index.html"),
          background: resolve(SRC, "background/index.ts"),
          content: resolve(SRC, "content/index.ts"),
        },
        output: {
          entryFileNames: (chunk) => {
            if (chunk.name === "background") return "[name].js";
            if (chunk.name === "content") return "content/[name].js";
            return "assets/[name]-[hash].js";
          },
          chunkFileNames: "assets/[name]-[hash].js",
          assetFileNames: "assets/[name]-[hash][extname]",
        },
      },
    },
    resolve: {
      alias: {
        "@axis": resolve(SRC),
        "@": resolve(ROOT, "../src"),
      },
    },
  };
});

