import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/davet", destination: "/davet.html" },
    ];
  },
};

export default nextConfig;
