import Link from "next/link";
import {
  ArrowDownLeft, ArrowLeftRight, ArrowUpRight, BellRing, ChartPie, ChevronRight, Plus, Receipt, Settings,
} from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAccounts, getAlerts, getDailyExpense, getMonthSummary, getTransactions } from "@/lib/queries";
import { currentMonth, formatCompact, formatMoney, formatQty, PERIOD_LABEL } from "@/lib/format";
import { colorOf } from "@/lib/colors";
import { TxRow } from "@/components/TxList";
import { CategoryIcon } from "@/components/CategoryIcon";
import { PrivacyToggle } from "@/components/PrivacyToggle";
import { AccountIcon } from "@/components/AccountIcon";
import { InstallBanner } from "@/components/InstallApp";
import { Avatar, Empty } from "@/components/ui";

const DOW = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

export default async function HomePage() {
  const me = await requireUser();
  const month = currentMonth();
  const [accounts, summary, recent, alerts, week] = await Promise.all([
    getAccounts(me.tenantId),
    getMonthSummary(me.tenantId, month),
    getTransactions(me.tenantId, { limit: 6 }),
    getAlerts(me.tenantId),
    getDailyExpense(me.tenantId, 7),
  ]);
  const total = accounts.reduce((s, a) => s + a.currentBalance, 0);
  const net = summary.income - summary.expense;
  const hour = (new Date().getUTCHours() + 7) % 24;
  const greet = hour < 11 ? "Chào buổi sáng" : hour < 14 ? "Chào buổi trưa" : hour < 18 ? "Chào buổi chiều" : "Chào buổi tối";
  // Tài khoản: tiền mặt/ngân hàng nhiều tiền nhất lên trước, tài khoản vàng sau, số dư âm cuối
  const sortedAccounts = [...accounts].sort((x, y) => {
    const rank = (a: typeof x) => (a.assetUnit ? (a.quantity > 0 ? 1 : 3) : a.currentBalance > 0 ? 0 : a.currentBalance < 0 ? 2 : 3);
    return rank(x) - rank(y) || y.currentBalance - x.currentBalance || y.quantity - x.quantity;
  });
  const positiveTotal = accounts.filter((a) => !a.assetUnit && a.currentBalance > 0).reduce((s, a) => s + a.currentBalance, 0);
  const shownAccounts = sortedAccounts.slice(0, 4);
  const hiddenCount = sortedAccounts.length - shownAccounts.length;
  const weekTotal = week.reduce((s, d) => s + d.total, 0);
  const weekMax = Math.max(1, ...week.map((d) => d.total));

  return (
    <div className="space-y-6 px-4 pt-[max(env(safe-area-inset-top),16px)]">
      {/* Thanh trên */}
      <header className="flex items-center gap-3">
        <Link href="/settings" aria-label="Cài đặt">
          <Avatar text={me.avatar || me.fullName} size={44} />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] text-slate-500">{greet} 👋</p>
          <p className="truncate text-[17px] font-bold tracking-tight">{me.fullName}</p>
        </div>
        <Link
          href="/settings"
          aria-label="Cài đặt"
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm"
        >
          <Settings size={20} />
        </Link>
      </header>

      <InstallBanner />

      {/* Thẻ số dư */}
      <section
        className="relative overflow-hidden rounded-[28px] p-5 shadow-[0_12px_32px_rgba(238,107,158,.18)]"
        style={{ background: "linear-gradient(135deg, #ffd9e8 0%, #fde4f0 45%, #ece0ff 100%)" }}
      >
        <div aria-hidden className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-white/40" />
        <div aria-hidden className="absolute -bottom-16 -left-8 h-36 w-36 rounded-full bg-white/30" />

        <div className="relative">
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-[#a8577a]">Tổng số dư · {me.tenantName}</p>
            <PrivacyToggle className="-mr-1 flex h-9 w-9 items-center justify-center rounded-full text-[#a8577a] hover:bg-white/50" />
          </div>
          <p className="money mt-1 text-[32px] leading-tight font-bold tracking-tight tabular-nums">{formatMoney(total)}</p>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl bg-white/70 p-3 backdrop-blur">
              <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-income">
                  <ArrowDownLeft size={12} strokeWidth={2.5} />
                </span>
                Thu tháng này
              </p>
              <p className="money mt-1 text-[17px] font-bold tabular-nums text-income">{formatCompact(summary.income)}</p>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 backdrop-blur">
              <p className="flex items-center gap-1.5 text-[12px] text-slate-500">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-expense">
                  <ArrowUpRight size={12} strokeWidth={2.5} />
                </span>
                Chi tháng này
              </p>
              <p className="money mt-1 text-[17px] font-bold tabular-nums text-expense">{formatCompact(summary.expense)}</p>
            </div>
          </div>
          <p className="mt-3 text-center text-[12.5px] text-[#a8577a]">
            {net >= 0 ? "Tháng này dư " : "Tháng này chi vượt thu "}
            <span className="money font-semibold">{formatMoney(Math.abs(net))}</span>
          </p>
        </div>
      </section>

      {/* Thao tác nhanh */}
      <nav className="grid grid-cols-4 gap-2">
        {[
          { href: "/add?kind=Expense", label: "Chi tiêu", icon: ArrowUpRight, tone: "bg-red-50 text-expense" },
          { href: "/add?kind=Income", label: "Thu nhập", icon: ArrowDownLeft, tone: "bg-emerald-50 text-income" },
          { href: "/add?kind=Transfer", label: "Chuyển", icon: ArrowLeftRight, tone: "bg-sky-50 text-sky-600" },
          { href: "/reports", label: "Báo cáo", icon: ChartPie, tone: "bg-violet-50 text-violet-600" },
        ].map((a) => (
          <Link key={a.href} href={a.href} className="flex flex-col items-center gap-1.5 text-[12.5px] font-medium text-slate-600">
            <span className={`flex h-14 w-14 items-center justify-center rounded-[20px] bg-white shadow-sm transition active:scale-95`}>
              <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${a.tone}`}>
                <a.icon size={20} strokeWidth={2.2} />
              </span>
            </span>
            {a.label}
          </Link>
        ))}
      </nav>

      {/* Chi tiêu 7 ngày */}
      <section className="card p-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Chi tiêu 7 ngày qua</h2>
          <p className="money text-[14px] font-bold tabular-nums">{formatCompact(weekTotal)}</p>
        </div>
        <div className="mt-4 flex h-32 items-end gap-2">
          {week.map((d, i) => {
            const isToday = i === week.length - 1;
            const h = d.total ? Math.max(6, (d.total / weekMax) * 100) : 3;
            const [y, m, dd] = d.day.split("-").map(Number);
            const dow = DOW[new Date(Date.UTC(y, m - 1, dd)).getUTCDay()];
            return (
              <div key={d.day} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <span className={`money text-[10px] tabular-nums ${d.total ? "text-slate-500" : "text-transparent"}`}>
                  {formatCompact(d.total)}
                </span>
                <div
                  className={`w-full max-w-7 rounded-lg ${isToday ? "bg-brand-600" : d.total ? "bg-brand-200" : "bg-slate-100"}`}
                  style={{ height: `${h}%` }}
                />
                <span className={`text-[11px] ${isToday ? "font-bold text-brand-700" : "text-slate-400"}`}>{isToday ? "Nay" : dow}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tài khoản */}
      <section>
        <SectionHead title="Tài khoản" href="/accounts" link="Tất cả" />
        <div className="card overflow-hidden">
          {/* Thanh phân bổ: mỗi màu là phần tiền nằm ở một tài khoản */}
          {positiveTotal > 0 && (
            <div className="px-4 pt-4">
              <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-slate-100">
                {sortedAccounts
                  .filter((a) => !a.assetUnit && a.currentBalance > 0)
                  .map((a) => (
                    <span
                      key={a.id}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${(a.currentBalance / positiveTotal) * 100}%`, background: colorOf(a.color).solid }}
                    />
                  ))}
              </div>
            </div>
          )}

          <ul className="divide-y divide-slate-100">
            {shownAccounts.map((a) => {
              const share = !a.assetUnit && a.currentBalance > 0 ? Math.round((a.currentBalance / positiveTotal) * 100) : null;
              return (
                <li key={a.id}>
                  <Link href={`/accounts/${a.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-slate-50">
                    <AccountIcon type={a.type} color={a.color} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{a.name}</p>
                      <p className="truncate text-[12.5px] text-slate-400">{a.type}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className={`money text-[15px] font-semibold tabular-nums ${a.currentBalance < 0 ? "text-expense" : ""}`}>
                        {a.assetUnit ? `${formatQty(a.quantity)} ${a.assetUnit}` : formatMoney(a.currentBalance)}
                      </p>
                      {share !== null && (
                        <p className="flex items-center justify-end gap-1 text-[12px] text-slate-400 tabular-nums">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: colorOf(a.color).solid }} />
                          {share}% tổng
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="flex border-t border-slate-100 text-[13.5px] font-medium">
            {hiddenCount > 0 && (
              <Link href="/accounts" className="flex flex-1 items-center justify-center gap-1 border-r border-slate-100 py-3 text-slate-500 active:bg-slate-50">
                Xem thêm {hiddenCount} tài khoản
              </Link>
            )}
            <Link href="/accounts/new" className="flex flex-1 items-center justify-center gap-1.5 py-3 text-brand-700 active:bg-slate-50">
              <Plus size={16} /> Thêm tài khoản
            </Link>
          </div>
        </div>
      </section>

      {/* Hạn mức */}
      {alerts.length > 0 && (
        <section>
          <SectionHead title="Hạn mức chi tiêu" href="/settings/alerts" link="Sửa" />
          <div className="card divide-y divide-slate-100">
            {alerts.map((a) => {
              const pct = a.thresholdAmount ? Math.round((a.spent / a.thresholdAmount) * 100) : 0;
              const over = a.spent > a.thresholdAmount;
              const bar = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-400" : "bg-brand-500";
              const badge = pct >= 100 ? "bg-red-50 text-red-600" : pct >= 80 ? "bg-amber-50 text-amber-700" : "bg-brand-50 text-brand-700";
              return (
                <div key={a.id} className="p-4">
                  <div className="flex items-center gap-3">
                    {a.categoryId ? (
                      <CategoryIcon icon={a.categoryIcon} color={a.categoryColor} size={38} />
                    ) : (
                      <span className="flex h-[38px] w-[38px] items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                        <BellRing size={18} />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14.5px] font-semibold">{a.categoryName ?? "Tổng chi tiêu"}</p>
                      <p className="money text-[12.5px] text-slate-400">
                        {PERIOD_LABEL[a.period] ?? a.period} · {formatCompact(a.spent)} / {formatCompact(a.thresholdAmount)}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[12px] font-bold tabular-nums ${badge}`}>{pct}%</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${bar}`} style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                  <p className={`money mt-1.5 text-[12px] ${over ? "font-medium text-expense" : "text-slate-400"}`}>
                    {over ? `Đã vượt ${formatMoney(a.spent - a.thresholdAmount)}` : `Còn ${formatMoney(a.thresholdAmount - a.spent)}`}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Gần đây */}
      <section>
        <SectionHead title="Giao dịch gần đây" href="/transactions" link="Xem tất cả" />
        {recent.length ? (
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {recent.map((t) => (
              <TxRow key={t.id} tx={t} returnTo="/" showDate />
            ))}
          </div>
        ) : (
          <div className="card">
            <Empty
              icon={<Receipt />}
              text="Chưa có giao dịch nào"
              action={<Link href="/add" className="btn btn-primary">Thêm giao dịch đầu tiên</Link>}
            />
          </div>
        )}
      </section>
    </div>
  );
}

function SectionHead({ title, href, link }: { title: string; href: string; link: string }) {
  return (
    <div className="mb-2.5 flex items-center justify-between px-1">
      <h2 className="text-[16px] font-bold tracking-tight">{title}</h2>
      <Link href={href} className="flex items-center text-[13px] font-medium text-brand-700">
        {link} <ChevronRight size={16} />
      </Link>
    </div>
  );
}
