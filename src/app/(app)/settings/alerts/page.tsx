import { BellRing, Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { getAlerts, getCategories } from "@/lib/queries";
import { deleteAlert, saveAlert } from "@/lib/actions";
import { formatMoney, PERIOD_LABEL } from "@/lib/format";
import { CategoryIcon } from "@/components/CategoryIcon";
import { ActionForm, SubmitButton } from "@/components/ActionForm";
import { AmountInput } from "@/components/AmountInput";
import { Empty, PageHeader, Progress } from "@/components/ui";

export default async function AlertsPage() {
  const me = await requireUser();
  const [alerts, categories] = await Promise.all([getAlerts(me.tenantId), getCategories(me.tenantId)]);
  const expenseCats = categories.filter((c) => c.type === "Expense");

  return (
    <div>
      <PageHeader title="Hạn mức chi tiêu" back="/settings" />
      <div className="space-y-5 px-4">
        <ActionForm action={saveAlert} className="card space-y-4 p-5" resetOnOk>
          <div>
            <p className="font-semibold">Đặt hạn mức</p>
            <p className="text-[13px] text-slate-500">Trang chủ sẽ hiển thị tiến độ và báo khi chi vượt hạn mức.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="period">Chu kỳ</label>
              <select id="period" name="period" className="input" defaultValue="month">
                <option value="day">Theo ngày</option>
                <option value="week">Theo tuần</option>
                <option value="month">Theo tháng</option>
              </select>
            </div>
            <div>
              <label className="label" htmlFor="categoryId">Áp dụng cho</label>
              <select id="categoryId" name="categoryId" className="input" defaultValue="">
                <option value="">Tổng chi tiêu</option>
                {expenseCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Hạn mức</label>
            <AmountInput name="thresholdAmount" />
          </div>
          <SubmitButton>Lưu hạn mức</SubmitButton>
        </ActionForm>

        <section>
          <h2 className="section-title mb-2">Đang áp dụng</h2>
          <div className="card divide-y divide-slate-100 overflow-hidden">
            {alerts.length === 0 && <Empty icon={<BellRing />} text="Chưa có hạn mức nào" />}
            {alerts.map((a) => (
              <div key={a.id} className="space-y-2 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  {a.categoryId ? (
                    <CategoryIcon icon={a.categoryIcon} color={a.categoryColor} size={36} />
                  ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-slate-100 text-slate-500"><BellRing size={18} /></span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.categoryName ?? "Tổng chi tiêu"}</p>
                    <p className="text-[12px] text-slate-400">
                      {PERIOD_LABEL[a.period]}: {formatMoney(a.spent)} / {formatMoney(a.thresholdAmount)}
                    </p>
                  </div>
                  <form action={deleteAlert}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" aria-label="Xóa" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 size={17} />
                    </button>
                  </form>
                </div>
                <Progress value={a.spent} max={a.thresholdAmount} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
