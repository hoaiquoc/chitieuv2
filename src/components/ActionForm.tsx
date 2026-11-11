"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef } from "react";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import type { FormState } from "@/lib/actions";

const PendingCtx = createContext(false);

/**
 * Form gọi Server Action mà không bị React reset khi có lỗi validate.
 * Hiện thông báo lỗi / thành công ngay dưới form.
 */
export function ActionForm({
  action, children, className, resetOnOk = false,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
  resetOnOk?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok && resetOnOk) ref.current?.reset();
  }, [state, resetOnOk]);

  return (
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        startTransition(() => formAction(fd));
      }}
    >
      <PendingCtx.Provider value={pending}>{children}</PendingCtx.Provider>
      {state?.error && (
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} className="shrink-0" /> {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} className="shrink-0" /> {state.ok}
        </p>
      )}
    </form>
  );
}

export function SubmitButton({ children, className = "btn btn-primary w-full" }: { children: React.ReactNode; className?: string }) {
  const pending = useContext(PendingCtx);
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  );
}

/** Nút submit có hộp thoại xác nhận (dùng trong <form action={serverAction}>). */
export function ConfirmButton({
  children, message, className = "btn btn-danger w-full",
}: { children: React.ReactNode; message: string; className?: string }) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
