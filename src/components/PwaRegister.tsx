"use client";

import { useEffect } from "react";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __qlctInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export const INSTALL_EVENT = "qlct-install-change";

/**
 * Đăng ký service worker và giữ lại sự kiện `beforeinstallprompt` (Android/Chrome)
 * để nút "Cài app" ở bất kỳ trang nào cũng gọi được hộp thoại cài đặt.
 */
export function PwaRegister() {
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      window.__qlctInstallPrompt = e as BeforeInstallPromptEvent;
      window.dispatchEvent(new Event(INSTALL_EVENT));
    };
    const onInstalled = () => {
      window.__qlctInstallPrompt = null;
      try {
        localStorage.setItem("qlct-installed", "1");
      } catch {}
      window.dispatchEvent(new Event(INSTALL_EVENT));
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  return null;
}
