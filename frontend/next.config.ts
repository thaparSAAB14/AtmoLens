import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from the backend API
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/api/maps/image/**",
      },
    ],
  },
  // Proxy API requests to the Python backend during development
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
