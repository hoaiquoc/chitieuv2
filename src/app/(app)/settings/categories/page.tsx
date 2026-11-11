import Link from "next/link";
import { Trash2 } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { all } from "@/lib/db";
import { deleteCategory } from "@/lib/actions";
import { CategoryIcon } from "@/components/CategoryIcon";
import { CategoryForm } from "@/components/CategoryForm";
import { PageHeader } from "@/components/ui";
import type { Category } from "@/lib/queries";

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const me = await requireUser();
  const { edit } = await searchParams;
  const cats = await all<Category & { used: number }>(
    `SELECT c.id, c.name, c.type, c.icon, c.color, c.tenantId,
            (SELECT COUNT(*) FROM Transactions t WHERE t.categoryId = c.id AND t.tenantId = c.tenantId) AS used
     FROM Categories c WHERE c.tenantId = ? ORDER BY c.name`,
    [me.tenantId],
  );
  const editing = cats.find((c) => c.id === edit);

  return (
    <div>
      <PageHeader title="Danh mục" back="/settings" />
      <div className="space-y-5 px-4">
        <CategoryForm category={editing} />

        {(["Expense", "Income"] as const).map((type) => (
          <section key={type}>
            <h2 className="section-title mb-2">{type === "Expense" ? "Khoản chi" : "Khoản thu"}</h2>
            <div className="card divide-y divide-slate-100 overflow-hidden">
              {cats
                .filter((c) => c.type === type)
                .map((c) => (
                  <div key={c.id} className={`flex items-center gap-3 px-4 py-3 ${c.id === edit ? "bg-brand-50" : ""}`}>
                    <Link href={`/settings/categories?edit=${c.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <CategoryIcon icon={c.icon} color={c.color} size={36} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.name}</p>
                        <p className="text-[12px] text-slate-400">{c.used} giao dịch</p>
                      </div>
                    </Link>
                    {c.used === 0 && (
                      <form action={deleteCategory}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" aria-label="Xóa" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                          <Trash2 size={17} />
                        </button>
                      </form>
                    )}
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
