import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images for potential legacy or fallback links. Vercel Blob URLs handle their own hostnames.
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/api/maps/image/**",
      },
      // Note: Add Vercel Blob domain here if you prefer using next/image for blob served maps
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      }
    ],
  },
};

export default nextConfig;
