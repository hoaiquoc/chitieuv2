import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { ACCOUNT_TYPES, ASSET_TYPE, getAccount, getTransactions } from "@/lib/queries";
import { adjustBalance, deleteAccount } from "@/lib/actions";
import { formatMoney, formatQty } from "@/lib/format";
import { colorOf } from "@/lib/colors";
import { Empty, PageHeader } from "@/components/ui";
import { TxGroupedList } from "@/components/TxList";
import { AccountForm } from "@/components/AccountForm";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/ActionForm";
import { AmountInput } from "@/components/AmountInput";

export default async function AccountDetailPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const { tab = "history" } = await searchParams;
  const account = await getAccount(me.tenantId, id);
  if (!account) notFound();
  const txs = tab === "history" ? await getTransactions(me.tenantId, { accountId: id, limit: 100 }) : [];
  const c = colorOf(account.color);
  const tabs = [["history", "Lịch sử"], ["edit", "Chỉnh sửa"]];

  return (
    <div>
      <PageHeader title={account.name} subtitle={account.type} back="/accounts" />
      <div className="space-y-4 px-4">
        <div className="rounded-3xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${c.solid}, ${c.strong})` }}>
          <p className="text-[13px] text-white/75">{account.assetUnit ? "Số lượng hiện có" : "Số dư hiện tại"}</p>
          <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums">
            {account.assetUnit ? `${formatQty(account.quantity)} ${account.assetUnit}` : formatMoney(account.currentBalance)}
          </p>
          {account.assetCode && <p className="mt-1 text-[13px] text-white/75">Mã: {account.assetCode}</p>}
          <Link
            href={`/add?returnTo=${encodeURIComponent(`/accounts/${id}`)}`}
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3.5 py-1.5 text-[13px] font-semibold backdrop-blur"
          >
            <Plus size={16} /> Thêm giao dịch
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1">
          {tabs.map(([v, label]) => (
            <Link
              key={v}
              href={`/accounts/${id}?tab=${v}`}
              className={`rounded-xl py-2 text-center text-[14px] font-semibold ${tab === v ? "bg-white shadow-sm" : "text-slate-500"}`}
            >
              {label}
            </Link>
          ))}
        </div>

        {tab === "history" ? (
          txs.length ? (
            <TxGroupedList txs={txs} returnTo={`/accounts/${id}`} />
          ) : (
            <div className="card"><Empty icon={<Receipt />} text="Chưa có giao dịch" /></div>
          )
        ) : (
          <>
            <AccountForm account={account} types={ACCOUNT_TYPES} assetType={ASSET_TYPE} />

            {!account.assetUnit && (
              <ActionForm action={adjustBalance} className="card space-y-3 p-5">
                <input type="hidden" name="id" value={account.id} />
                <div>
                  <p className="font-semibold">Cân đối số dư</p>
                  <p className="text-[13px] text-slate-500">
                    Nhập số dư thực tế. Ứng dụng sẽ tạo giao dịch “Cân đối” cho phần chênh lệch.
                  </p>
                </div>
                <AmountInput name="actual" allowNegative defaultValue={account.currentBalance} />
                <SubmitButton className="btn btn-ghost w-full">Cân đối</SubmitButton>
              </ActionForm>
            )}

            <form action={deleteAccount} className="card space-y-2 p-5">
              <input type="hidden" name="id" value={account.id} />
              {account.txCount > 0 ? (
                <p className="text-[13px] text-slate-500">
                  Tài khoản có {account.txCount} giao dịch nên không thể xóa. Xóa hết giao dịch trước nếu muốn xóa tài khoản.
                </p>
              ) : (
                <ConfirmButton message={`Xóa tài khoản “${account.name}”?`}>
                  <Trash2 size={18} /> Xóa tài khoản
                </ConfirmButton>
              )}
            </form>
          </>
        )}
      </div>
    </div>
  );
}
