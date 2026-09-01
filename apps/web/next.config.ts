import type { NextConfig } from "next";
import { config as loadEnv } from "dotenv";

if (!process.env.MONGO_URI) loadEnv({ path: "../server/.env" });

const config: NextConfig = {
  transpilePackages: ["@typing/shared-types", "@typing/word-lists"],
  serverExternalPackages: ["argon2"],
  webpack(configuration) {
    configuration.resolve.extensionAlias = { ".js": [".ts", ".js"], ".mjs": [".mts", ".mjs"], ".cjs": [".cts", ".cjs"] };
    return configuration;
  },
};
export default config;
