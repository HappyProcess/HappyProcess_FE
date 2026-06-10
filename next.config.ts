import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://34.50.23.177:8080/api/:path*",
      },
    ];
  },
};

export default nextConfig;
