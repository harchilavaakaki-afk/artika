import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thb.tildacdn.com",
      },
      {
        protocol: "https",
        hostname: "static.tildacdn.com",
      },
    ],
  },
};

export default nextConfig;
