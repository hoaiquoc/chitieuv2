"use client";

import { useState } from "react";

const fmt = new Intl.NumberFormat("vi-VN");

function format(raw: string, allowNegative: boolean) {
  const neg = allowNegative && raw.trim().startsWith("-");
  const digits = raw.replace(/[^\d]/g, "").replace(/^0+(?=\d)/, "");
  if (!digits) return neg ? "-" : "";
  return (neg ? "-" : "") + fmt.format(Number(digits));
}

/** Ô nhập tiền tự thêm dấu chấm phân cách hàng nghìn. */
export function AmountInput({
  name, defaultValue, allowNegative = false, big = false, placeholder = "0", autoFocus, className, onValue,
}: {
  name: string;
  defaultValue?: number | null;
  allowNegative?: boolean;
  big?: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  onValue?: (n: number) => void;
}) {
  const [value, setValue] = useState(defaultValue ? format(String(defaultValue), allowNegative) : "");
  return (
    <div className="relative">
      <input
        name={name}
        inputMode={allowNegative ? "text" : "numeric"}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          const v = format(e.target.value, allowNegative);
          setValue(v);
          onValue?.(Number(v.replace(/[^\d-]/g, "")) || 0);
        }}
        className={
          className ??
          (big
            ? "w-full bg-transparent pr-8 text-right text-4xl font-bold tracking-tight outline-none placeholder:text-slate-300"
            : "input pr-10")
        }
      />
      <span className={`pointer-events-none absolute top-1/2 -translate-y-1/2 font-semibold text-slate-400 ${big ? "right-0 text-2xl" : "right-4"}`}>
        ₫
      </span>
    </div>
  );
}
