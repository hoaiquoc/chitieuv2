"use client";

import { useState } from "react";
import { saveAccount } from "@/lib/actions";
import { COLOR_NAMES, colorName, colorOf } from "@/lib/colors";
import { ActionForm, SubmitButton } from "./ActionForm";
import { AmountInput } from "./AmountInput";
import type { Account } from "@/lib/queries";

export function AccountForm({ account, types, assetType }: { account?: Account; types: string[]; assetType: string }) {
  const [type, setType] = useState(account?.type ?? types[0]);
  const [color, setColor] = useState(account ? colorName(account.color) : "emerald");
  const allTypes = types.includes(type) ? types : [type, ...types];

  return (
    <ActionForm action={saveAccount} className="card space-y-4 p-5">
      {account && <input type="hidden" name="id" value={account.id} />}
      <input type="hidden" name="color" value={color} />
      <div>
        <label className="label" htmlFor="name">Tên tài khoản</label>
        <input id="name" name="name" required defaultValue={account?.name} className="input" placeholder="vd. Vietcombank, Ví tiền mặt" />
      </div>
      <div>
        <label className="label" htmlFor="type">Loại</label>
        <select id="type" name="type" value={type} onChange={(e) => setType(e.target.value)} className="input">
          {allTypes.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      {type === assetType ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="assetUnit">Đơn vị</label>
            <input id="assetUnit" name="assetUnit" defaultValue={account?.assetUnit ?? "chỉ"} className="input" placeholder="chỉ, gram, lượng" />
          </div>
          <div>
            <label className="label" htmlFor="assetCode">Mã (tùy chọn)</label>
            <input id="assetCode" name="assetCode" defaultValue={account?.assetCode ?? ""} className="input" placeholder="SJC9999" />
          </div>
          <input type="hidden" name="initialBalance" value={account?.initialBalance ?? 0} />
        </div>
      ) : (
        <div>
          <label className="label">Số dư ban đầu</label>
          <AmountInput name="initialBalance" allowNegative defaultValue={account?.initialBalance} />
          <p className="mt-1 text-[12px] text-slate-400">Số dư hiện tại = số dư ban đầu + thu − chi</p>
        </div>
      )}
      <div>
        <p className="label">Màu</p>
        <div className="flex flex-wrap gap-2">
          {COLOR_NAMES.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full transition ${color === c ? "scale-110 ring-2 ring-offset-2 ring-slate-800" : ""}`}
              style={{ background: colorOf(`bg-${c}-500`).solid }}
            />
          ))}
        </div>
      </div>
      <SubmitButton>{account ? "Lưu tài khoản" : "Tạo tài khoản"}</SubmitButton>
    </ActionForm>
  );
}
