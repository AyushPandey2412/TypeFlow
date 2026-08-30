import type { NextConfig } from "next";

const config: NextConfig = { transpilePackages: ["@typing/shared-types", "@typing/word-lists"] };
export default config;
