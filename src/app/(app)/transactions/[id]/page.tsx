import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { findTransferPair, getAccounts, getCategories, getTransaction } from "@/lib/queries";
import { deleteTransaction } from "@/lib/actions";
import { dateTimeLabel, toLocalInput } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { TransactionForm } from "@/components/TransactionForm";
import { ConfirmButton } from "@/components/ActionForm";

export default async function EditTxPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const { returnTo } = await searchParams;
  const back = returnTo?.startsWith("/") ? returnTo : "/transactions";
  const [tx, accounts, categories] = await Promise.all([
    getTransaction(me.tenantId, id),
    getAccounts(me.tenantId),
    getCategories(me.tenantId),
  ]);
  if (!tx) notFound();
  const isTransfer = tx.categoryId === "transfer";

  // Chuyển khoản: xác định tài khoản nguồn (vế Chi) và đích (vế Thu)
  let transfer: { fromId: string; toId: string } | undefined;
  if (isTransfer) {
    const pair = await findTransferPair(me.tenantId, tx);
    const other = pair?.accountId ?? accounts.find((a) => a.id !== tx.accountId)?.id ?? "";
    transfer = tx.type === "Expense" ? { fromId: tx.accountId, toId: other } : { fromId: other, toId: tx.accountId };
  }
  const confirmText = isTransfer ? "Xóa giao dịch chuyển khoản này (cả 2 vế)?" : `Xóa “${tx.title}”?`;

  return (
    <div className="pb-6">
      <PageHeader
        title={isTransfer ? "Sửa chuyển khoản" : tx.type === "Income" ? "Sửa khoản thu" : "Sửa khoản chi"}
        subtitle={`${tx.createdBy} · ${dateTimeLabel(tx.occurredAt)}`}
        back={back}
        right={
          <form action={deleteTransaction}>
            <input type="hidden" name="id" value={tx.id} />
            <input type="hidden" name="returnTo" value={back} />
            <ConfirmButton
              message={confirmText}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 active:scale-95"
            >
              <Trash2 size={19} />
              <span className="sr-only">Xóa giao dịch</span>
            </ConfirmButton>
          </form>
        }
      />
      <TransactionForm
        accounts={accounts}
        categories={categories}
        tx={tx}
        transfer={transfer}
        defaultTime={toLocalInput(tx.occurredAt)}
        returnTo={back}
      />
      <form action={deleteTransaction} className="mt-1 px-4">
        <input type="hidden" name="id" value={tx.id} />
        <input type="hidden" name="returnTo" value={back} />
        <ConfirmButton message={confirmText}>
          <Trash2 size={18} /> Xóa giao dịch
        </ConfirmButton>
      </form>
    </div>
  );
}
