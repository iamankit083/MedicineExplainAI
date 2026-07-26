import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tailwindcss(),
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    tanstackStart({
      server: {
        entry: "src/server.ts",
      },
    }),
    // Compiles the server build into deploy-target output (e.g. Vercel Functions).
    // Without this, TanStack Start has nothing to hand Vercel and every route 404s.
    // Explicit "vercel" preset ensures process.env is populated normally at runtime.
    nitro({ config: { preset: "vercel" } }),
    viteReact(),
  ],
});
