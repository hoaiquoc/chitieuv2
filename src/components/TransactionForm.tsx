"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { saveTransaction } from "@/lib/actions";
import { ActionForm, SubmitButton } from "./ActionForm";
import { AmountInput } from "./AmountInput";
import { CategoryIcon } from "./CategoryIcon";
import { formatMoney, formatQty } from "@/lib/format";
import type { Account, Category, Tx } from "@/lib/queries";

type Kind = "Expense" | "Income" | "Transfer";

const KINDS: { v: Kind; label: string; active: string }[] = [
  { v: "Expense", label: "Chi tiêu", active: "bg-white text-expense shadow-sm" },
  { v: "Income", label: "Thu nhập", active: "bg-white text-income shadow-sm" },
  { v: "Transfer", label: "Chuyển khoản", active: "bg-white text-sky-700 shadow-sm" },
];

export function TransactionForm({
  accounts, categories, tx, defaultTime, returnTo, initialKind = "Expense", transfer,
}: {
  accounts: Account[];
  categories: Category[];
  tx?: Tx;
  defaultTime: string;
  returnTo: string;
  initialKind?: Kind;
  /** Khi sửa chuyển khoản: tài khoản nguồn và đích (lấy từ 2 vế). */
  transfer?: { fromId: string; toId: string };
}) {
  const isTransferTx = tx?.categoryId === "transfer";
  const [kind, setKind] = useState<Kind>(isTransferTx ? "Transfer" : (tx?.type ?? initialKind));
  const [accountId, setAccountId] = useState(
    transfer?.fromId ?? tx?.accountId ?? accounts.find((a) => !a.assetUnit)?.id ?? accounts[0]?.id ?? "",
  );
  const [toAccountId, setToAccountId] = useState(
    transfer?.toId ?? accounts.find((a) => a.id !== (transfer?.fromId ?? tx?.accountId) && !a.assetUnit)?.id ?? "",
  );
  const [categoryId, setCategoryId] = useState(tx?.categoryId ?? "");
  const account = accounts.find((a) => a.id === accountId);

  const cats = useMemo(() => {
    const list = categories.filter((c) => c.type === kind);
    // Giữ danh mục hệ thống (vd. Cân đối) nếu giao dịch đang sửa dùng nó
    if (tx && !list.some((c) => c.id === tx.categoryId) && tx.categoryName && kind === tx.type) {
      list.unshift({ id: tx.categoryId, name: tx.categoryName, type: tx.type, icon: tx.categoryIcon ?? "", color: tx.categoryColor ?? "", tenantId: "" });
    }
    return list;
  }, [categories, kind, tx]);

  const selectedCat = cats.some((c) => c.id === categoryId) ? categoryId : "";

  if (!accounts.length) {
    return (
      <div className="card m-4 p-6 text-center">
        <p className="mb-4 text-slate-500">Bạn cần tạo ít nhất một tài khoản (ví, ngân hàng...) trước.</p>
        <Link href="/accounts/new" className="btn btn-primary">Tạo tài khoản</Link>
      </div>
    );
  }

  return (
    <ActionForm action={saveTransaction} className="space-y-4 px-4">
      {tx && <input type="hidden" name="id" value={tx.id} />}
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="categoryId" value={selectedCat} />
      <input type="hidden" name="returnTo" value={returnTo} />

      {!tx && (
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1">
          {KINDS.map((k) => (
            <button
              key={k.v}
              type="button"
              onClick={() => setKind(k.v)}
              className={`rounded-xl py-2.5 text-[14px] font-semibold transition ${kind === k.v ? k.active : "text-slate-500"}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      {isTransferTx && (
        <p className="rounded-2xl bg-sky-50 px-4 py-3 text-[13px] text-sky-800">
          Chuyển khoản gồm 2 giao dịch (trừ tiền ở tài khoản chuyển, cộng ở tài khoản nhận). Sửa ở đây sẽ cập nhật cả hai.
        </p>
      )}

      <div className="card p-5">
        <p className="label">Số tiền</p>
        <AmountInput name="amount" big autoFocus={!tx} defaultValue={tx?.amount} />
        {account?.assetUnit && kind !== "Transfer" && (
          <div className="mt-4 border-t border-slate-100 pt-4">
            <label className="label" htmlFor="quantity">
              Số lượng ({account.assetUnit}) · hiện có {formatQty(account.quantity)} {account.assetUnit}
            </label>
            <input
              id="quantity"
              name="quantity"
              inputMode="decimal"
              defaultValue={tx?.assetQuantity ?? ""}
              className="input"
              placeholder="vd. 1,5"
            />
          </div>
        )}
      </div>

      <div className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="title">Nội dung</label>
          <input
            id="title"
            name="title"
            defaultValue={isTransferTx ? "" : (tx?.title ?? "")}
            className="input"
            placeholder={isTransferTx ? "Để trống = giữ nội dung cũ" : kind === "Transfer" ? "Chuyển tiền" : "vd. Ăn trưa, đi chợ..."}
          />
        </div>

        {kind === "Transfer" ? (
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
            <AccountSelect label="Từ" name="accountId" accounts={accounts} value={accountId} onChange={setAccountId} />
            <span className="mb-3.5 text-slate-400"><ArrowRight size={18} /></span>
            <AccountSelect label="Đến" name="toAccountId" accounts={accounts.filter((a) => a.id !== accountId)} value={toAccountId} onChange={setToAccountId} />
          </div>
        ) : (
          <AccountSelect label="Tài khoản" name="accountId" accounts={accounts} value={accountId} onChange={setAccountId} showBalance />
        )}

        <div>
          <label className="label" htmlFor="occurredAt">Thời gian</label>
          <input id="occurredAt" name="occurredAt" type="datetime-local" defaultValue={defaultTime} required className="input" />
        </div>
      </div>

      {kind !== "Transfer" && (
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="label !mb-0">Danh mục</p>
            <Link href="/settings/categories" className="flex items-center gap-1 text-[13px] font-medium text-brand-700">
              <Plus size={14} /> Thêm
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {cats.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl p-2 text-center transition ${
                  selectedCat === c.id ? "bg-brand-50 ring-2 ring-brand-500" : "hover:bg-slate-50"
                }`}
              >
                <CategoryIcon icon={c.icon} color={c.color} size={40} />
                <span className="line-clamp-2 text-[11.5px] leading-tight text-slate-600">{c.name}</span>
              </button>
            ))}
          </div>
          {!cats.length && <p className="text-sm text-slate-400">Chưa có danh mục. Bấm “Thêm” để tạo.</p>}
        </div>
      )}

      <div className="card p-5">
        <label className="label" htmlFor="note">Ghi chú</label>
        <textarea id="note" name="note" rows={2} defaultValue={tx?.note ?? ""} className="input resize-none" placeholder="Không bắt buộc" />
      </div>

      <div className="sticky bottom-0 -mx-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent px-4 pt-4 pb-[max(env(safe-area-inset-bottom),16px)]">
        <SubmitButton>{tx ? "Lưu thay đổi" : "Lưu giao dịch"}</SubmitButton>
      </div>
    </ActionForm>
  );
}

function AccountSelect({
  label, name, accounts, value, onChange, showBalance,
}: {
  label: string;
  name: string;
  accounts: Account[];
  value: string;
  onChange: (v: string) => void;
  showBalance?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className="label" htmlFor={name}>{label}</label>
      <select id={name} name={name} value={value} onChange={(e) => onChange(e.target.value)} className="input appearance-none">
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
            {showBalance ? ` · ${a.assetUnit ? `${formatQty(a.quantity)} ${a.assetUnit}` : formatMoney(a.currentBalance)}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
