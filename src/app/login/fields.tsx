"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Ô nhập có icon phía trước; type="password" có nút hiện/ẩn. */
export function Field({
  id, label, icon, type = "text", ...rest
}: { id: string; label: string; icon: React.ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";
  return (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="group relative">
        <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-slate-400 transition group-focus-within:text-brand-600">{icon}</span>
        <input id={id} name={id} type={isPw && show ? "text" : type} className={`input bg-slate-50 pl-11 focus:bg-white ${isPw ? "pr-12" : ""}`} {...rest} />
        {isPw && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
