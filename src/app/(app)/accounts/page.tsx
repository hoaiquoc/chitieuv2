import Link from "next/link";
import { Plus, WalletCards } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAccounts } from "@/lib/queries";
import { formatMoney, formatQty } from "@/lib/format";
import { AccountIcon } from "@/components/AccountIcon";
import { Empty, PageHeader } from "@/components/ui";

export default async function AccountsPage() {
  const me = await requireUser();
  const accounts = await getAccounts(me.tenantId);
  const total = accounts.reduce((s, a) => s + a.currentBalance, 0);
  const groups = new Map<string, typeof accounts>();
  for (const a of accounts) {
    if (!groups.has(a.type)) groups.set(a.type, []);
    groups.get(a.type)!.push(a);
  }

  return (
    <div>
      <PageHeader
        title="Tài khoản"
        right={
          <Link href="/accounts/new" aria-label="Thêm tài khoản" className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white shadow-md shadow-brand-500/30">
            <Plus size={20} />
          </Link>
        }
      />
      <div className="space-y-5 px-4">
        <div
          className="rounded-[28px] p-5 shadow-[0_12px_32px_rgba(238,107,158,.16)]"
          style={{ background: "linear-gradient(135deg, #ffd9e8 0%, #fde4f0 45%, #ece0ff 100%)" }}
        >
          <p className="text-[13px] font-medium text-[#a8577a]">Tổng tài sản</p>
          <p className="money mt-1 text-3xl font-bold tracking-tight tabular-nums">{formatMoney(total)}</p>
          <p className="mt-1 text-[13px] text-[#a8577a]">{accounts.length} tài khoản</p>
        </div>

        {!accounts.length && (
          <div className="card">
            <Empty icon={<WalletCards />} text="Chưa có tài khoản" action={<Link href="/accounts/new" className="btn btn-primary">Tạo tài khoản</Link>} />
          </div>
        )}

        {[...groups].map(([type, list]) => (
          <section key={type}>
            <h2 className="section-title mb-2">{type}</h2>
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {list.map((a) => {
                return (
                  <Link key={a.id} href={`/accounts/${a.id}`} className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-50">
                    <AccountIcon type={a.type} color={a.color} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{a.name}</p>
                      <p className="text-[12.5px] text-slate-400">{a.txCount} giao dịch</p>
                    </div>
                    <p className={`money font-semibold tabular-nums ${a.currentBalance < 0 ? "text-expense" : ""}`}>
                      {a.assetUnit ? `${formatQty(a.quantity)} ${a.assetUnit}` : formatMoney(a.currentBalance)}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
