import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen, Lock, Mail, User } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { register } from "@/lib/actions";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AuthShell } from "../login/AuthShell";
import { Field } from "../login/fields";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/");
  return (
    <AuthShell compact title="Tạo sổ chi tiêu" subtitle="Chỉ mất 30 giây. Sau đó bạn có thể mời cả nhà cùng ghi chép.">
      <ActionForm action={register} className="space-y-4">
        <Field id="fullName" label="Tên của bạn" icon={<User size={18} />} required autoComplete="name" placeholder="Nguyễn Văn A" />
        <Field id="bookName" label="Tên sổ" icon={<BookOpen size={18} />} placeholder="Sổ chi tiêu gia đình" />
        <Field id="email" label="Email" icon={<Mail size={18} />} type="email" autoComplete="email" inputMode="email" required placeholder="ban@email.com" />
        <Field id="password" label="Mật khẩu" icon={<Lock size={18} />} type="password" autoComplete="new-password" required minLength={6} placeholder="Tối thiểu 6 ký tự" />
        <div className="pt-2">
          <SubmitButton className="btn btn-primary w-full py-3.5">
            Tạo sổ <ArrowRight size={18} />
          </SubmitButton>
        </div>
      </ActionForm>
      <p className="mt-6 text-center text-sm text-slate-500">
        Đã có tài khoản? <Link href="/login" className="font-semibold text-brand-700">Đăng nhập</Link>
      </p>
    </AuthShell>
  );
}
