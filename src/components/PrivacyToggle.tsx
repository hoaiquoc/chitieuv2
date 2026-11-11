"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const KEY = "qlct-hide-money";

/** Nút ẩn/hiện số tiền. Các phần tử có class `money` sẽ bị làm mờ khi ẩn. */
export function PrivacyToggle({ className = "" }: { className?: string }) {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let v = false;
    try {
      v = localStorage.getItem(KEY) === "1";
    } catch {}
    setHidden(v);
    document.documentElement.toggleAttribute("data-hide-money", v);
  }, []);

  const toggle = () => {
    const v = !hidden;
    setHidden(v);
    document.documentElement.toggleAttribute("data-hide-money", v);
    try {
      localStorage.setItem(KEY, v ? "1" : "0");
    } catch {}
  };

  return (
    <button type="button" onClick={toggle} aria-label={hidden ? "Hiện số tiền" : "Ẩn số tiền"} className={className}>
      {hidden ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}
