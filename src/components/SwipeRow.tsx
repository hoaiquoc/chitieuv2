"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { deleteTransaction } from "@/lib/actions";
import { ConfirmButton } from "./ActionForm";

const OPEN = 148; // độ rộng vùng nút Sửa + Xóa
const OPEN_EVENT = "qlct-swipe-open";

/**
 * Dòng giao dịch vuốt sang trái để hiện nút Sửa / Xóa.
 * Vuốt dọc vẫn cuộn trang bình thường (touch-action: pan-y); mỗi lúc chỉ mở 1 dòng.
 */
export function SwipeRow({
  id, editHref, returnTo, confirmText, children,
}: {
  id: string;
  editHref: string;
  returnTo: string;
  confirmText: string;
  children: React.ReactNode;
}) {
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; base: number; axis: "x" | "y" | null } | null>(null);
  const swiped = useRef(false);

  // Mở dòng này thì đóng các dòng khác
  useEffect(() => {
    const onOpen = (e: Event) => {
      if ((e as CustomEvent<string>).detail !== id) setX(0);
    };
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, [id]);

  const end = () => {
    const s = start.current;
    start.current = null;
    setDragging(false);
    if (s?.axis === "x") setX((cur) => (cur < -OPEN / 2 ? -OPEN : 0));
  };

  const open = x !== 0;

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-y-0 right-0 flex" style={{ width: OPEN }} aria-hidden={!open}>
        <Link
          href={editHref}
          tabIndex={open ? 0 : -1}
          className="flex w-1/2 flex-col items-center justify-center gap-1 bg-slate-100 text-[12px] font-semibold text-slate-700"
        >
          <Pencil size={18} /> Sửa
        </Link>
        <form action={deleteTransaction} className="w-1/2">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="returnTo" value={returnTo} />
          <ConfirmButton
            message={confirmText}
            className="flex h-full w-full flex-col items-center justify-center gap-1 bg-red-500 text-[12px] font-semibold text-white"
          >
            <Trash2 size={18} /> Xóa
          </ConfirmButton>
        </form>
      </div>

      <div
        className="relative touch-pan-y bg-white select-none"
        style={{ transform: `translateX(${x}px)`, transition: dragging ? "none" : "transform .25s cubic-bezier(.2,.8,.2,1)" }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          start.current = { x: e.clientX, y: e.clientY, base: x, axis: null };
          swiped.current = false;
        }}
        onPointerMove={(e) => {
          const s = start.current;
          if (!s) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          if (!s.axis) {
            if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
            s.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
            if (s.axis === "x") {
              e.currentTarget.setPointerCapture(e.pointerId);
              setDragging(true);
              window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
            }
          }
          if (s.axis !== "x") return;
          swiped.current = true;
          setX(Math.max(-OPEN - 24, Math.min(0, s.base + dx)));
        }}
        onPointerUp={end}
        onPointerCancel={end}
        onClickCapture={(e) => {
          // Vừa vuốt xong, hoặc dòng đang mở → chạm chỉ để đóng, không mở trang sửa
          if (swiped.current || open) {
            e.preventDefault();
            e.stopPropagation();
            if (!swiped.current) setX(0);
            swiped.current = false;
          }
        }}
      >
        {children}
      </div>
    </div>
  );
}
