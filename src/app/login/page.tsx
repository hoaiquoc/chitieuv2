import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { login } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AuthShell } from "./AuthShell";
import { Field } from "./fields";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <AuthShell title="Đăng nhập" subtitle="Chào mừng trở lại! Tiếp tục ghi chép chi tiêu nhé.">
      <ActionForm action={login} className="space-y-4">
        <Field id="email" label="Email" icon={<Mail size={18} />} type="email" autoComplete="email" inputMode="email" required placeholder="ban@email.com" />
        <Field id="password" label="Mật khẩu" icon={<Lock size={18} />} type="password" autoComplete="current-password" required placeholder="Nhập mật khẩu" />
        <div className="pt-2">
          <SubmitButton className="btn btn-primary w-full py-3.5">
            Đăng nhập <ArrowRight size={18} />
          </SubmitButton>
        </div>
      </ActionForm>

      <div className="my-7 flex items-center gap-3 text-[12px] text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> Chưa có tài khoản? <span className="h-px flex-1 bg-slate-200" />
      </div>
      <Link href="/register" className="btn btn-ghost w-full py-3.5">
        Tạo sổ chi tiêu mới
      </Link>
    </AuthShell>
  );
}
