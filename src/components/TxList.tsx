import Link from "next/link";
import { CategoryIcon } from "./CategoryIcon";
import { SwipeRow } from "./SwipeRow";
import { dayKey, dayLabel, formatMoney, formatQty, timeLabel } from "@/lib/format";
import type { Tx } from "@/lib/queries";

export function TxRow({ tx, returnTo, showDate }: { tx: Tx; returnTo?: string; showDate?: boolean }) {
  const income = tx.type === "Income";
  const href = `/transactions/${tx.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;
  const confirmText = tx.categoryId === "transfer" ? "Xóa giao dịch chuyển khoản này (cả 2 vế)?" : `Xóa “${tx.title}”?`;
  return (
    <SwipeRow id={tx.id} editHref={href} returnTo={returnTo ?? "/transactions"} confirmText={confirmText}>
    <Link href={href} draggable={false} className="flex items-center gap-3 px-4 py-3 transition active:bg-slate-50">
      <CategoryIcon icon={tx.categoryId === "transfer" ? "transfer" : tx.categoryIcon} color={tx.categoryColor} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium">{tx.title}</p>
        <p className="truncate text-[12.5px] text-slate-400">
          {tx.categoryName ?? "Không có danh mục"} · {tx.accountName ?? "?"} · {tx.createdBy}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`money text-[15px] font-semibold tabular-nums ${income ? "text-income" : "text-ink"}`}>
          {tx.amount === 0 && tx.assetQuantity
            ? `${income ? "+" : "-"}${formatQty(tx.assetQuantity)} ${tx.assetUnit ?? ""}`
            : `${income ? "+" : "-"}${formatMoney(tx.amount)}`}
        </p>
        <p className="text-[12px] text-slate-400">
          {showDate ? `${dayLabel(dayKey(tx.occurredAt)).replace(/^Thứ \d, |^Chủ nhật, /, "")} · ` : ""}
          {timeLabel(tx.occurredAt)}
        </p>
      </div>
    </Link>
    </SwipeRow>
  );
}

/** Danh sách giao dịch nhóm theo ngày (giờ Việt Nam). */
export function TxGroupedList({ txs, returnTo }: { txs: Tx[]; returnTo?: string }) {
  const groups = new Map<string, Tx[]>();
  for (const t of txs) {
    const k = dayKey(t.occurredAt);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }
  return (
    <div className="space-y-4">
      {[...groups].map(([key, list]) => {
        const net = list
          .filter((t) => t.categoryId !== "transfer")
          .reduce((s, t) => s + (t.type === "Income" ? t.amount : -t.amount), 0);
        return (
          <section key={key}>
            <div className="mb-1.5 flex items-baseline justify-between px-2">
              <h3 className="text-[13px] font-semibold text-slate-500">{dayLabel(key)}</h3>
              <span className={`text-[12.5px] font-medium tabular-nums ${net >= 0 ? "text-income" : "text-slate-400"}`}>
                {formatMoney(net, true)}
              </span>
            </div>
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {list.map((t) => (
                <TxRow key={t.id} tx={t} returnTo={returnTo} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
