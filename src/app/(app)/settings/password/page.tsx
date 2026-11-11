import { requireUser } from "@/lib/auth";
import { changePassword } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { PageHeader } from "@/components/ui";

export default async function PasswordPage() {
  await requireUser();
  return (
    <div>
      <PageHeader title="Đổi mật khẩu" back="/settings" />
      <div className="px-4">
        <ActionForm action={changePassword} className="card space-y-4 p-5" resetOnOk>
          <div>
            <label className="label" htmlFor="current">Mật khẩu hiện tại</label>
            <input id="current" name="current" type="password" autoComplete="current-password" required className="input" />
          </div>
          <div>
            <label className="label" htmlFor="next">Mật khẩu mới</label>
            <input id="next" name="next" type="password" autoComplete="new-password" required minLength={6} className="input" />
          </div>
          <SubmitButton>Đổi mật khẩu</SubmitButton>
        </ActionForm>
      </div>
    </div>
  );
}
