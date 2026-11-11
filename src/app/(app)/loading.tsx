/** Khung chờ hiện ngay khi chuyển trang, trong lúc server lấy dữ liệu. */
export default function Loading() {
  return (
    <div className="animate-pulse space-y-5 px-4 pt-[max(env(safe-area-inset-top),16px)]" aria-busy="true" aria-label="Đang tải">
      <div className="flex items-center gap-3 py-1">
        <div className="h-11 w-11 rounded-full bg-slate-200/80" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-24 rounded-full bg-slate-200/80" />
          <div className="h-4 w-36 rounded-full bg-slate-200/80" />
        </div>
      </div>
      <div className="h-40 rounded-[28px] bg-brand-100/70" />
      <div className="card space-y-4 p-5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 w-2/3 rounded-full bg-slate-100" />
              <div className="h-3 w-1/3 rounded-full bg-slate-100" />
            </div>
            <div className="h-3.5 w-16 rounded-full bg-slate-100" />
          </div>
        ))}
      </div>
      <div className="card h-32" />
    </div>
  );
}
