import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAccounts, getCategories, getTransaction } from "@/lib/queries";
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

  return (
    <div className="pb-6">
      <PageHeader
        title={isTransfer ? "Chuyển khoản" : tx.type === "Income" ? "Khoản thu" : "Khoản chi"}
        subtitle={`${tx.createdBy} · ${dateTimeLabel(tx.occurredAt)}`}
        back={back}
      />
      <TransactionForm accounts={accounts} categories={categories} tx={tx} defaultTime={toLocalInput(tx.occurredAt)} returnTo={back} />
      <form action={deleteTransaction} className="mt-3 px-4">
        <input type="hidden" name="id" value={tx.id} />
        <input type="hidden" name="returnTo" value={back} />
        <ConfirmButton message={isTransfer ? "Xóa cả 2 vế của giao dịch chuyển khoản này?" : "Xóa giao dịch này?"}>
          <Trash2 size={18} /> Xóa giao dịch
        </ConfirmButton>
      </form>
    </div>
  );
}
