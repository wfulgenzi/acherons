import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv, type Plugin } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function hostPermissionPatternFromAppBase(appBase: string): string {
  try {
    const u = new URL(appBase);
    return `${u.origin}/*`;
  } catch {
    return "http://localhost:3000/*";
  }
}

/**
 * Writes `dist/manifest.json` from the repo `manifest.json`, setting
 * `host_permissions` to the origin of `VITE_APP_BASE` for this build mode.
 */
function writeExtensionManifest(hostPermission: string): Plugin {
  const manifestSrc = path.resolve(__dirname, "manifest.json");
  return {
    name: "write-extension-manifest",
    closeBundle() {
      const manifestDest = path.resolve(__dirname, "dist/manifest.json");
      const raw = fs.readFileSync(manifestSrc, "utf8");
      const manifest = JSON.parse(raw) as { host_permissions?: string[] };
      manifest.host_permissions = [hostPermission];
      fs.writeFileSync(manifestDest, JSON.stringify(manifest, null, 2) + "\n");
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, "VITE_");
  const appBase =
    typeof env.VITE_APP_BASE === "string" && env.VITE_APP_BASE.length > 0
      ? env.VITE_APP_BASE.replace(/\/$/, "")
      : "http://localhost:3000";
  const hostPermission = hostPermissionPatternFromAppBase(appBase);

  return {
    plugins: [
      tailwindcss(),
      react(),
      writeExtensionManifest(hostPermission),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: path.resolve(__dirname, "pages/popup.html"),
          background: path.resolve(__dirname, "src/background/index.ts"),
          offscreen: path.resolve(__dirname, "pages/offscreen.html"),
        },
        output: {
          entryFileNames: "[name].js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    },
  };
});
