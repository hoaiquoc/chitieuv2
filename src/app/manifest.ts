import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sổ Chi Tiêu",
    short_name: "Chi Tiêu",
    description: "Ghi chép thu chi cho cả gia đình",
    lang: "vi",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fdf2f7",
    theme_color: "#f8fafc",
    categories: ["finance", "productivity"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Nhấn giữ biểu tượng app trên Android sẽ hiện các lối tắt này
    shortcuts: [
      { name: "Thêm khoản chi", short_name: "Chi tiêu", url: "/add?kind=Expense", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Thêm khoản thu", short_name: "Thu nhập", url: "/add?kind=Income", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Báo cáo", url: "/reports", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
