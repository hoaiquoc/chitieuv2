import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cho phép build thử vào thư mục khác (NEXT_DIST_DIR=.next-test) để không đụng `npm run dev` đang chạy.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  serverExternalPackages: ["@libsql/client", "libsql"],
  // Service worker phải luôn được tải bản mới để cập nhật app
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
