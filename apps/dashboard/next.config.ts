import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  transpilePackages: ["@repo/shared", "@repo/types", "@repo/db"],
};

export default nextConfig;
