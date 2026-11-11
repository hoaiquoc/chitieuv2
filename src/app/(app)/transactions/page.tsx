import Link from "next/link";
import { Receipt, Search } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAccounts, getTransactions, SYSTEM_CATEGORIES } from "@/lib/queries";
import { currentMonth, formatMoney, isValidMonth } from "@/lib/format";
import { TxGroupedList } from "@/components/TxList";
import { Empty, MonthSwitcher, PageHeader } from "@/components/ui";

type SP = Promise<{ m?: string; type?: string; q?: string; account?: string }>;

export default async function TransactionsPage({ searchParams }: { searchParams: SP }) {
  const me = await requireUser();
  const sp = await searchParams;
  const month = isValidMonth(sp.m) ? sp.m : currentMonth();
  const type = sp.type === "Income" || sp.type === "Expense" ? sp.type : "";
  const q = (sp.q ?? "").trim();
  const accountId = sp.account ?? "";

  const [txs, accounts] = await Promise.all([
    getTransactions(me.tenantId, { month, type, q, accountId }),
    getAccounts(me.tenantId),
  ]);
  const stat = txs.filter((t) => !SYSTEM_CATEGORIES.includes(t.categoryId));
  const income = stat.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
  const expense = stat.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);

  const params: Record<string, string> = {};
  if (type) params.type = type;
  if (q) params.q = q;
  if (accountId) params.account = accountId;
  const link = (over: Record<string, string>) => {
    const p = new URLSearchParams({ ...params, m: month, ...over });
    for (const [k, v] of [...p]) if (!v) p.delete(k);
    return `/transactions?${p}`;
  };
  const returnTo = link({});

  return (
    <div>
      <PageHeader title="Giao dịch" />
      <div className="space-y-3 px-4">
        <MonthSwitcher month={month} basePath="/transactions" params={params} />

        <form action="/transactions" className="relative">
          <input type="hidden" name="m" value={month} />
          {type && <input type="hidden" name="type" value={type} />}
          {accountId && <input type="hidden" name="account" value={accountId} />}
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400" />
          <input name="q" defaultValue={q} placeholder="Tìm theo nội dung, danh mục..." className="input pl-11" type="search" />
        </form>

        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {[
            ["", "Tất cả"],
            ["Expense", "Chi"],
            ["Income", "Thu"],
          ].map(([v, label]) => (
            <Link key={v} href={link({ type: v })} className={`chip ${type === v ? "chip-active" : ""}`}>
              {label}
            </Link>
          ))}
          <span className="mx-1 w-px shrink-0 bg-slate-200" />
          {accounts.map((a) => (
            <Link
              key={a.id}
              href={link({ account: accountId === a.id ? "" : a.id })}
              className={`chip shrink-0 ${accountId === a.id ? "chip-active" : ""}`}
            >
              {a.name}
            </Link>
          ))}
        </div>

        <div className="card overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div className="px-4 py-3">
              <p className="text-[12px] text-slate-500">Tổng thu</p>
              <p className="money text-[16px] font-bold tabular-nums text-income">{formatMoney(income)}</p>
            </div>
            <div className="px-4 py-3">
              <p className="text-[12px] text-slate-500">Tổng chi</p>
              <p className="money text-[16px] font-bold tabular-nums text-expense">{formatMoney(expense)}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/60 px-4 py-2.5 text-[13px]">
            <span className="text-slate-500">Chênh lệch</span>
            <span className={`money font-semibold tabular-nums ${income - expense >= 0 ? "text-income" : "text-expense"}`}>
              {formatMoney(income - expense, true)}
            </span>
          </div>
        </div>

        {txs.length > 0 && (
          <p className="px-1 text-center text-[12px] text-slate-400">Chạm để xem · vuốt sang trái để sửa hoặc xóa</p>
        )}

        <div className="pt-1">
          {txs.length ? (
            <TxGroupedList txs={txs} returnTo={returnTo} />
          ) : (
            <div className="card">
              <Empty icon={<Receipt />} text={q ? `Không tìm thấy “${q}”` : "Không có giao dịch trong tháng này"} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
