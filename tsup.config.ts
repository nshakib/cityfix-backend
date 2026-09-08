import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  format: ["cjs"], // CJS output avoids ESM directory/extension import issues entirely
  target: "node18", // match Vercel's Node runtime version
  outDir: "dist",
  clean: true,
  bundle: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  skipNodeModulesBundle: true, // keep node_modules external — smaller bundle, avoids bundling native bindings (e.g. Prisma's engine)
  noExternal: [], // leave empty unless a specific package needs to be force-bundled
});