import Link from "next/link";
import { ChartPie } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getCategoryBreakdown, getMemberBreakdown, getMonthSummary, getTrend } from "@/lib/queries";
import { currentMonth, formatCompact, formatMoney, isValidMonth } from "@/lib/format";
import { colorOf } from "@/lib/colors";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Avatar, Empty, MonthSwitcher, PageHeader } from "@/components/ui";
import { initials } from "@/lib/format";

type SP = Promise<{ m?: string; type?: string }>;

export default async function ReportsPage({ searchParams }: { searchParams: SP }) {
  const me = await requireUser();
  const sp = await searchParams;
  const month = isValidMonth(sp.m) ? sp.m : currentMonth();
  const type = sp.type === "Income" ? "Income" : "Expense";

  const [summary, breakdown, trend, members] = await Promise.all([
    getMonthSummary(me.tenantId, month),
    getCategoryBreakdown(me.tenantId, month, type),
    getTrend(me.tenantId, month, 6),
    getMemberBreakdown(me.tenantId, month),
  ]);
  const total = breakdown.reduce((s, b) => s + b.total, 0);

  // Biểu đồ tròn bằng conic-gradient
  let acc = 0;
  const stops = breakdown.map((b) => {
    const start = (acc / total) * 100;
    acc += b.total;
    return `${colorOf(b.color).solid} ${start}% ${(acc / total) * 100}%`;
  });
  const donut = total ? `conic-gradient(${stops.join(",")})` : "#e2e8f0";
  const maxTrend = Math.max(1, ...trend.flatMap((t) => [t.income, t.expense]));
  const saved = summary.income - summary.expense;

  return (
    <div>
      <PageHeader title="Báo cáo" />
      <div className="space-y-4 px-4">
        <MonthSwitcher month={month} basePath="/reports" params={type === "Income" ? { type } : {}} />

        <div className="grid grid-cols-2 gap-3">
          <div className="card p-4">
            <p className="text-[12px] text-slate-500">Tổng thu</p>
            <p className="text-lg font-bold tabular-nums text-income">{formatCompact(summary.income)}</p>
          </div>
          <div className="card p-4">
            <p className="text-[12px] text-slate-500">Tổng chi</p>
            <p className="text-lg font-bold tabular-nums text-expense">{formatCompact(summary.expense)}</p>
          </div>
          <div className="card col-span-2 flex items-center justify-between p-4">
            <div>
              <p className="text-[12px] text-slate-500">{saved >= 0 ? "Tiết kiệm được" : "Chi vượt thu"}</p>
              <p className={`text-lg font-bold tabular-nums ${saved >= 0 ? "text-income" : "text-expense"}`}>{formatMoney(saved)}</p>
            </div>
            {summary.income > 0 && (
              <span className={`rounded-full px-3 py-1 text-[13px] font-semibold ${saved >= 0 ? "bg-emerald-50 text-income" : "bg-rose-50 text-expense"}`}>
                {Math.round((saved / summary.income) * 100)}% thu nhập
              </span>
            )}
          </div>
        </div>

        {/* Theo danh mục */}
        <section className="card p-5">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
            {(["Expense", "Income"] as const).map((t) => (
              <Link
                key={t}
                href={`/reports?m=${month}${t === "Income" ? "&type=Income" : ""}`}
                className={`rounded-xl py-2 text-center text-[14px] font-semibold ${type === t ? "bg-white shadow-sm" : "text-slate-500"}`}
              >
                {t === "Expense" ? "Chi theo danh mục" : "Thu theo danh mục"}
              </Link>
            ))}
          </div>

          {total ? (
            <>
              <div className="mx-auto mb-5 flex h-44 w-44 items-center justify-center rounded-full" style={{ background: donut }}>
                <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full bg-white text-center">
                  <span className="text-[11px] text-slate-500">{type === "Expense" ? "Tổng chi" : "Tổng thu"}</span>
                  <span className="text-[15px] font-bold tabular-nums">{formatCompact(total)}</span>
                </div>
              </div>
              <ul className="space-y-3">
                {breakdown.map((b) => {
                  const pct = (b.total / total) * 100;
                  return (
                    <li key={b.categoryId}>
                      <Link href={`/transactions?m=${month}&q=${encodeURIComponent(b.name ?? "")}`} className="flex items-center gap-3">
                        <CategoryIcon icon={b.icon} color={b.color} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-2">
                            <p className="truncate text-[14px] font-medium">{b.name ?? "Không có danh mục"}</p>
                            <p className="shrink-0 text-[14px] font-semibold tabular-nums">{formatMoney(b.total)}</p>
                          </div>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: colorOf(b.color).solid }} />
                            </div>
                            <span className="w-10 text-right text-[11.5px] text-slate-400 tabular-nums">{pct.toFixed(pct < 10 ? 1 : 0)}%</span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <Empty icon={<ChartPie />} text="Chưa có dữ liệu trong tháng này" />
          )}
        </section>

        {/* Xu hướng 6 tháng */}
        <section className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">6 tháng gần nhất</h2>
            <div className="flex gap-3 text-[11.5px] text-slate-500">
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-emerald-500" /> Thu</span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-rose-500" /> Chi</span>
            </div>
          </div>
          <div className="flex h-40 items-end justify-between gap-2">
            {trend.map((t) => (
              <Link key={t.month} href={`/reports?m=${t.month}`} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="flex h-full w-full items-end justify-center gap-1">
                  <div className="w-3 rounded-t-md bg-emerald-500/90" style={{ height: `${(t.income / maxTrend) * 100}%` }} title={formatMoney(t.income)} />
                  <div className="w-3 rounded-t-md bg-rose-500/90" style={{ height: `${(t.expense / maxTrend) * 100}%` }} title={formatMoney(t.expense)} />
                </div>
                <span className={`text-[11px] ${t.month === month ? "font-bold text-ink" : "text-slate-400"}`}>T{Number(t.month.slice(5))}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Theo thành viên */}
        {members.length > 0 && (
          <section className="card p-5">
            <h2 className="mb-3 font-semibold">Theo thành viên</h2>
            <ul className="space-y-3">
              {members.map((m) => (
                <li key={m.createdBy} className="flex items-center gap-3">
                  <Avatar text={initials(m.createdBy)} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{m.createdBy}</p>
                    <p className="text-[12px] text-slate-400">{m.count} giao dịch</p>
                  </div>
                  <div className="text-right text-[13px] tabular-nums">
                    <p className="font-semibold text-expense">-{formatCompact(m.expense)}</p>
                    {m.income > 0 && <p className="text-income">+{formatCompact(m.income)}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
