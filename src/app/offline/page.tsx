import { WifiOff } from "lucide-react";

export const dynamic = "force-static";
export const metadata = { title: "Mất kết nối · Sổ Chi Tiêu" };

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-5 px-8 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-brand-100 text-brand-700">
        <WifiOff size={36} />
      </span>
      <div>
        <h1 className="text-xl font-bold tracking-tight">Không có kết nối mạng</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-500">
          Sổ Chi Tiêu cần Internet để lấy dữ liệu mới nhất. Kiểm tra Wi-Fi hoặc 4G rồi thử lại nhé.
        </p>
      </div>
      {/* Thẻ <a> để tải lại hẳn trang, không dùng điều hướng phía client */}
      <a href="/" className="btn btn-primary px-8">Thử lại</a>
    </main>
  );
}
