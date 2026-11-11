"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartPie, House, ListOrdered, Plus, WalletCards } from "lucide-react";

const TABS = [
  { href: "/", label: "Tổng quan", icon: House },
  { href: "/transactions", label: "Giao dịch", icon: ListOrdered },
  null,
  { href: "/accounts", label: "Tài khoản", icon: WalletCards },
  { href: "/reports", label: "Báo cáo", icon: ChartPie },
] as const;

export function BottomNav() {
  const path = usePathname();
  if (path.startsWith("/add") || /^\/transactions\/[^/]+/.test(path)) return null;
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-3 pb-[max(env(safe-area-inset-bottom),12px)]">
      <div className="relative grid grid-cols-5 items-center rounded-[28px] border border-white/60 bg-white/90 px-1 py-1.5 shadow-[0_8px_32px_rgba(15,23,42,.12)] backdrop-blur-xl">
        {TABS.map((t, i) => {
          if (!t)
            return (
              <div key={i} className="flex justify-center">
                <Link
                  href="/add"
                  aria-label="Thêm giao dịch"
                  className="-mt-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/40 ring-4 ring-slate-50 transition active:scale-95"
                >
                  <Plus size={28} strokeWidth={2.5} />
                </Link>
              </div>
            );
          const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition ${
                active ? "text-brand-700" : "text-slate-400"
              }`}
            >
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
