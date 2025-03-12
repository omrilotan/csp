import { defineConfig } from "tsup";

export default defineConfig({
	target: "esnext",
	format: ["esm", "cjs"],
	splitting: false,
	sourcemap: true,
	clean: false,
	dts: true,
	platform: "neutral",
});
