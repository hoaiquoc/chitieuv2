"use client";

import { useState } from "react";
import Link from "next/link";
import { saveCategory } from "@/lib/actions";
import { COLOR_NAMES, colorName, colorOf } from "@/lib/colors";
import { ActionForm, SubmitButton } from "./ActionForm";
import { CategoryIcon, ICON_KEYS } from "./CategoryIcon";
import type { Category } from "@/lib/queries";

export function CategoryForm({ category }: { category?: Category }) {
  const [type, setType] = useState<"Expense" | "Income">(category?.type ?? "Expense");
  const [icon, setIcon] = useState(category?.icon ?? "other");
  const [color, setColor] = useState(category ? colorName(category.color) : "violet");
  const [name, setName] = useState(category?.name ?? "");
  const icons = ICON_KEYS.includes(icon) ? ICON_KEYS : [icon, ...ICON_KEYS];

  return (
    <ActionForm action={saveCategory} className="card space-y-4 p-5" key={category?.id ?? "new"}>
      {category && <input type="hidden" name="id" value={category.id} />}
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="icon" value={icon} />
      <input type="hidden" name="color" value={color} />

      <div className="flex items-center justify-between">
        <p className="font-semibold">{category ? "Sửa danh mục" : "Thêm danh mục"}</p>
        {category && <Link href="/settings/categories" className="text-[13px] font-medium text-slate-500">Hủy</Link>}
      </div>

      <div className="flex items-center gap-3">
        <CategoryIcon icon={icon} color={`bg-${color}-100`} size={48} />
        <input name="name" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="Tên danh mục" />
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
        {(["Expense", "Income"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`rounded-xl py-2 text-[14px] font-semibold ${type === t ? "bg-white shadow-sm" : "text-slate-500"}`}
          >
            {t === "Expense" ? "Khoản chi" : "Khoản thu"}
          </button>
        ))}
      </div>

      <div>
        <p className="label">Biểu tượng</p>
        <div className="grid grid-cols-7 gap-1.5">
          {icons.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setIcon(k)}
              className={`flex items-center justify-center rounded-xl p-1 ${icon === k ? "ring-2 ring-slate-800" : ""}`}
            >
              <CategoryIcon icon={k} color={`bg-${color}-100`} size={36} />
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="label">Màu</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_NAMES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              className={`h-7 w-7 rounded-full transition ${color === c ? "scale-110 ring-2 ring-slate-800 ring-offset-2" : ""}`}
              style={{ background: colorOf(`bg-${c}-500`).solid }}
            />
          ))}
        </div>
      </div>

      <SubmitButton>{category ? "Lưu danh mục" : "Thêm danh mục"}</SubmitButton>
    </ActionForm>
  );
}
