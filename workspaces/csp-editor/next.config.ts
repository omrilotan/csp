import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

// Here we use the @cloudflare/next-on-pages next-dev module to allow us to
// use bindings during local development (when running the application with
// `next dev`). This function is only necessary during development and
// has no impact outside of that. For more information see:
// https://github.com/cloudflare/next-on-pages/blob/main/internal-packages/next-dev/README.md
setupDevPlatform().catch(console.error);

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	reactStrictMode: true,
	transpilePackages: ["content-security-policy-manager"],
	webpack: (config) => {
		// Handle importing TS files between workspaces
		config.module.rules.push({
			test: /\.ts$|\.tsx$/,
			include: [/workspaces\/content-security-policy-manager/],
			use: [
				{
					loader: "ts-loader",
					options: {
						transpileOnly: true,
					},
				},
			],
		});

		return config;
	},
};

export default nextConfig;
