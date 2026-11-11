import { requireUser } from "@/lib/auth";
import { ACCOUNT_TYPES, ASSET_TYPE } from "@/lib/queries";
import { PageHeader } from "@/components/ui";
import { AccountForm } from "@/components/AccountForm";

export default async function NewAccountPage() {
  await requireUser();
  return (
    <div>
      <PageHeader title="Tài khoản mới" back="/accounts" />
      <div className="px-4">
        <AccountForm types={ACCOUNT_TYPES} assetType={ASSET_TYPE} />
      </div>
    </div>
  );
}
