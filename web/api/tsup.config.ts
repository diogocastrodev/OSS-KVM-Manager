import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/server.ts"],
  outDir: "dist",
  clean: true,
  target: "es2022",
  format: ["esm"],
  splitting: false,
});
