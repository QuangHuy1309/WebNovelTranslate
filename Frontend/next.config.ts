import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowLocalIP: true, // <-- THÊM DÒNG NÀY VÀO ĐÂY
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "5068",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;