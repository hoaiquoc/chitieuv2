import Link from "next/link";
import { BellRing, BookOpen, ChevronRight, KeyRound, LogOut, Shapes, Users } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { logout, renameBook } from "@/lib/actions";
import { Avatar, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { InstallRow } from "@/components/InstallApp";

export default async function SettingsPage() {
  const me = await requireUser();
  const items = [
    { href: "/settings/categories", icon: Shapes, label: "Danh mục thu chi", color: "bg-violet-100 text-violet-700" },
    { href: "/settings/alerts", icon: BellRing, label: "Hạn mức chi tiêu", color: "bg-amber-100 text-amber-700" },
    { href: "/settings/members", icon: Users, label: "Thành viên trong sổ", color: "bg-sky-100 text-sky-700" },
    { href: "/settings/password", icon: KeyRound, label: "Đổi mật khẩu", color: "bg-slate-100 text-slate-700" },
  ];
  return (
    <div>
      <PageHeader title="Cài đặt" back="/" />
      <div className="space-y-4 px-4">
        <div className="card flex items-center gap-4 p-5">
          <Avatar text={me.avatar || me.fullName} size={56} />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{me.fullName}</p>
            <p className="truncate text-[13px] text-slate-500">{me.email}</p>
            <span className="mt-1 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-[11.5px] font-semibold text-brand-700">
              {me.role === "Owner" ? "Chủ sổ" : "Thành viên"}
            </span>
          </div>
        </div>

        {me.role === "Owner" && (
          <ActionForm action={renameBook} className="card space-y-3 p-5">
            <label className="label flex items-center gap-2 !text-slate-700" htmlFor="bookName">
              <BookOpen size={16} /> Tên sổ chi tiêu
            </label>
            <div className="flex gap-2">
              <input id="bookName" name="name" defaultValue={me.tenantName} className="input" />
              <SubmitButton className="btn btn-ghost shrink-0">Lưu</SubmitButton>
            </div>
          </ActionForm>
        )}

        <div className="card divide-y divide-slate-100 overflow-hidden">
          {items.map((it) => (
            <Link key={it.href} href={it.href} className="flex items-center gap-3 px-4 py-3.5 active:bg-slate-50">
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${it.color}`}>
                <it.icon size={18} />
              </span>
              <span className="flex-1 font-medium">{it.label}</span>
              <ChevronRight size={18} className="text-slate-300" />
            </Link>
          ))}
        </div>

        <InstallRow />

        <form action={logout}>
          <button type="submit" className="btn btn-danger w-full">
            <LogOut size={18} /> Đăng xuất
          </button>
        </form>
      </div>
    </div>
  );
}
