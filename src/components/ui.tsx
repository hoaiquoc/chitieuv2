import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { monthLabel, shiftMonth } from "@/lib/format";

export function PageHeader({
  title, back, right, subtitle,
}: { title: string; back?: string; right?: React.ReactNode; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-2 bg-slate-50/85 px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 backdrop-blur-xl">
      {back && (
        <Link href={back} aria-label="Quay lại" className="-ml-1 flex h-10 w-10 items-center justify-center rounded-full text-slate-600 hover:bg-slate-200/60">
          <ChevronLeft size={24} />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold tracking-tight">{title}</h1>
        {subtitle && <p className="truncate text-[13px] text-slate-500">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

export function MonthSwitcher({ month, basePath, params = {} }: { month: string; basePath: string; params?: Record<string, string> }) {
  const href = (m: string) => {
    const q = new URLSearchParams({ ...params, m });
    return `${basePath}?${q}`;
  };
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-1 shadow-sm">
      <Link href={href(shiftMonth(month, -1))} aria-label="Tháng trước" className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100">
        <ChevronLeft size={20} />
      </Link>
      <span className="text-[15px] font-semibold">{monthLabel(month)}</span>
      <Link href={href(shiftMonth(month, 1))} aria-label="Tháng sau" className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100">
        <ChevronRight size={20} />
      </Link>
    </div>
  );
}

export function Avatar({ text, size = 36, className = "" }: { text: string; size?: number; className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-200 to-[#e9d5ff] font-semibold text-[#9d2f62] ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {text.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function Progress({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const color = pct >= 100 ? "bg-rose-500" : pct >= 80 ? "bg-amber-500" : "bg-brand-500";
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Empty({ icon, text, action }: { icon: React.ReactNode; text: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-slate-400">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">{icon}</div>
      <p className="text-sm">{text}</p>
      {action}
    </div>
  );
}
