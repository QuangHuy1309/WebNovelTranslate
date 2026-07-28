import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // 1. Cấu hình cho phép tải ảnh thật từ Backend ASP.NET Core của bạn
      {
        protocol: "http",
        hostname: "localhost",
        port: "5068",
        pathname: "/uploads/**",
      },
      // 2. Cấu hình cho phép tải ảnh dự phòng (placeholder) để không bị lỗi màn hình
      {
        protocol: "https",
        hostname: "placehold.co",
        port: "",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;