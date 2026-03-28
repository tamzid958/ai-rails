import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@airails/shared", "@prisma/client"],
};

export default nextConfig;
