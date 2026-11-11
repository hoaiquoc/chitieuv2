import { UserMinus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getMembers } from "@/lib/queries";
import { addMember, removeMember } from "@/lib/actions";
import { ActionForm, ConfirmButton, SubmitButton } from "@/components/ActionForm";
import { Avatar, PageHeader } from "@/components/ui";

export default async function MembersPage() {
  const me = await requireUser();
  const members = await getMembers(me.tenantId);
  const isOwner = me.role === "Owner";

  return (
    <div>
      <PageHeader title="Thành viên" subtitle={me.tenantName} back="/settings" />
      <div className="space-y-5 px-4">
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 px-4 py-3.5">
              <Avatar text={m.avatar || m.fullName} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {m.fullName} {m.id === me.id && <span className="text-slate-400">(bạn)</span>}
                </p>
                <p className="truncate text-[12.5px] text-slate-400">{m.email}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold ${m.role === "Owner" ? "bg-brand-50 text-brand-700" : "bg-slate-100 text-slate-600"}`}>
                {m.role === "Owner" ? "Chủ sổ" : "Thành viên"}
              </span>
              {isOwner && m.role !== "Owner" && (
                <form action={removeMember}>
                  <input type="hidden" name="id" value={m.id} />
                  <ConfirmButton
                    message={`Xóa ${m.fullName} khỏi sổ? Giao dịch họ đã ghi vẫn được giữ lại.`}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <UserMinus size={17} />
                  </ConfirmButton>
                </form>
              )}
            </div>
          ))}
        </div>

        {isOwner ? (
          <ActionForm action={addMember} className="card space-y-4 p-5" resetOnOk>
            <div>
              <p className="font-semibold">Thêm thành viên</p>
              <p className="text-[13px] text-slate-500">Thành viên dùng chung sổ, ghi được thu chi và xem báo cáo.</p>
            </div>
            <input name="fullName" required className="input" placeholder="Tên hiển thị" />
            <input name="email" type="email" required className="input" placeholder="Email đăng nhập" />
            <input name="password" type="text" required minLength={6} className="input" placeholder="Mật khẩu ban đầu (≥ 6 ký tự)" />
            <SubmitButton>Thêm thành viên</SubmitButton>
          </ActionForm>
        ) : (
          <p className="px-1 text-[13px] text-slate-500">Chỉ chủ sổ mới thêm hoặc xóa được thành viên.</p>
        )}
      </div>
    </div>
  );
}
