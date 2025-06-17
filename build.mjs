import * as esbuild from "esbuild";

const ctx = await esbuild.context({
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  bundle: true,
});

await ctx.watch();
