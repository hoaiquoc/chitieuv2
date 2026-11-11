import { requireUser } from "@/lib/auth";
import { getAccounts, getCategories } from "@/lib/queries";
import { toLocalInput } from "@/lib/format";
import { PageHeader } from "@/components/ui";
import { TransactionForm } from "@/components/TransactionForm";

export default async function AddPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; kind?: string }> }) {
  const me = await requireUser();
  const { returnTo, kind } = await searchParams;
  const back = returnTo?.startsWith("/") ? returnTo : "/";
  const initialKind = kind === "Income" || kind === "Transfer" ? kind : "Expense";
  const [accounts, categories] = await Promise.all([getAccounts(me.tenantId), getCategories(me.tenantId)]);
  return (
    <div>
      <PageHeader title="Thêm giao dịch" back={back} />
      <TransactionForm
        accounts={accounts}
        categories={categories}
        defaultTime={toLocalInput()}
        returnTo={back}
        initialKind={initialKind}
      />
    </div>
  );
}
