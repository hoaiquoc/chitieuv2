import { ArrowDownLeft, ShoppingCart, Utensils } from "lucide-react";

/** Khung chung cho trang đăng nhập / đăng ký: phần minh họa phía trên + tấm form phía dưới. */
export function AuthShell({
  title, subtitle, children, compact = false,
}: { title: string; subtitle: string; children: React.ReactNode; compact?: boolean }) {
  return (
    <main className="flex min-h-dvh flex-col bg-[#fde7f0]">
      <Hero compact={compact} />
      <section className="relative z-10 -mt-8 flex-1 rounded-t-[32px] bg-white px-6 pt-8 pb-[max(env(safe-area-inset-bottom),32px)] shadow-[0_-12px_40px_rgba(201,74,126,.14)]">
        <div className="mx-auto mb-6 h-1 w-10 rounded-full bg-slate-200" />
        <h1 className="text-[26px] leading-tight font-bold tracking-tight text-ink">{title}</h1>
        <p className="mt-1.5 mb-7 text-[15px] text-slate-500">{subtitle}</p>
        {children}
      </section>
    </main>
  );
}

function Hero({ compact }: { compact: boolean }) {
  return (
    <div
      className={`relative overflow-hidden px-6 pt-[max(env(safe-area-inset-top),20px)] text-ink ${compact ? "pb-14" : "pb-16"}`}
      style={{
        background:
          "radial-gradient(120% 80% at 100% 0%, #fbcfe1 0%, transparent 60%), radial-gradient(90% 70% at 0% 100%, #eadcff 0%, transparent 60%), #fdeef4",
      }}
    >
      {/* Lưới mờ trang trí */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[.08]"
        style={{
          backgroundImage: "linear-gradient(#c94a7e 1px, transparent 1px), linear-gradient(90deg, #c94a7e 1px, transparent 1px)",
          backgroundSize: "28px 28px",
          maskImage: "linear-gradient(to bottom, #000 30%, transparent)",
        }}
      />

      <div className="relative flex items-center gap-2.5 pt-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon.svg" alt="" className="h-9 w-9 rounded-xl ring-2 ring-white" />
        <span className="text-[17px] font-semibold tracking-tight">Sổ Chi Tiêu</span>
      </div>

      {!compact && <BalanceIllustration />}
      {compact && (
        <p className="relative mt-6 max-w-[16rem] text-[15px] leading-relaxed text-[#a8577a]">
          Ghi chép thu chi cho cả gia đình, gọn gàng trên điện thoại.
        </p>
      )}
    </div>
  );
}

/** Thẻ số dư minh họa (chỉ để trang trí). */
function BalanceIllustration() {
  const bars = [38, 62, 45, 80, 54, 92, 70];
  return (
    <div aria-hidden className="relative mx-auto mt-8 h-[214px] max-w-[320px] origin-top select-none [@media(max-height:720px)]:mt-4 [@media(max-height:720px)]:-mb-[64px] [@media(max-height:720px)]:scale-[.7]">
      {/* Thẻ chính */}
      <div className="absolute inset-x-3 top-0 rounded-[26px] bg-white/75 p-5 ring-1 ring-white shadow-[0_10px_30px_rgba(201,74,126,.12)] backdrop-blur-md">
        <p className="text-[12px] text-[#a8577a]">Tổng số dư</p>
        <p className="mt-0.5 text-[26px] font-bold tracking-tight tabular-nums">12.450.000 ₫</p>
        <div className="mt-4 flex h-16 items-end gap-2">
          {bars.map((h, i) => (
            <span
              key={i}
              className={`flex-1 rounded-t-md ${i === bars.length - 2 ? "bg-brand-600" : "bg-brand-200"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>

      {/* Giao dịch nổi */}
      <Chip className="top-[132px] -left-1 rotate-[-4deg]" icon={<ArrowDownLeft size={15} />} tone="bg-emerald-100 text-emerald-700" label="Tiền lương" amount="+15.000.000" positive />
      <Chip className="top-[150px] -right-1 rotate-[3deg]" icon={<ShoppingCart size={15} />} tone="bg-violet-100 text-violet-700" label="Đi chợ" amount="-440.000" />
      <Chip className="top-[188px] left-12 rotate-[-1deg] scale-90" icon={<Utensils size={15} />} tone="bg-orange-100 text-orange-700" label="Ăn uống" amount="-85.000" />
    </div>
  );
}

function Chip({
  className, icon, tone, label, amount, positive,
}: { className: string; icon: React.ReactNode; tone: string; label: string; amount: string; positive?: boolean }) {
  return (
    <div className={`absolute flex items-center gap-2 rounded-2xl bg-white py-2 pr-3.5 pl-2 text-ink shadow-[0_10px_30px_rgba(201,74,126,.18)] ${className}`}>
      <span className={`flex h-7 w-7 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <span className="text-[12px] leading-tight">
        <span className="block text-slate-500">{label}</span>
        <span className={`block font-semibold tabular-nums ${positive ? "text-income" : ""}`}>{amount}</span>
      </span>
    </div>
  );
}
