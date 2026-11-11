"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, ChevronRight, Download, EllipsisVertical, PlusSquare, Share, Smartphone, X } from "lucide-react";
import { INSTALL_EVENT } from "./PwaRegister";

type Env = { standalone: boolean; ios: boolean; canPrompt: boolean; installed: boolean };

const DISMISS_KEY = "qlct-install-dismissed";
const DISMISS_DAYS = 14;

function readEnv(): Env {
  const nav = navigator as Navigator & { standalone?: boolean };
  const standalone = window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let installed = false;
  try {
    installed = localStorage.getItem("qlct-installed") === "1";
  } catch {}
  return { standalone, ios, canPrompt: !!window.__qlctInstallPrompt, installed };
}

function useInstallEnv() {
  const [env, setEnv] = useState<Env | null>(null);
  useEffect(() => {
    const update = () => setEnv(readEnv());
    update();
    window.addEventListener(INSTALL_EVENT, update);
    return () => window.removeEventListener(INSTALL_EVENT, update);
  }, []);
  return env;
}

/** Mở hộp thoại cài của Chrome; trả về false nếu trình duyệt không hỗ trợ (iOS, Firefox...). */
async function promptInstall(): Promise<boolean> {
  const p = window.__qlctInstallPrompt;
  if (!p) return false;
  await p.prompt();
  await p.userChoice.catch(() => null);
  window.__qlctInstallPrompt = null;
  window.dispatchEvent(new Event(INSTALL_EVENT));
  return true;
}

/** Banner gợi ý cài app (trang Tổng quan). Ẩn khi đã cài, đang chạy như app, hoặc đã bấm đóng. */
export function InstallBanner() {
  const env = useInstallEnv();
  const [dismissed, setDismissed] = useState(true);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    try {
      const t = Number(localStorage.getItem(DISMISS_KEY) || 0);
      setDismissed(Date.now() - t < DISMISS_DAYS * 86400000);
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!env || env.standalone || env.installed || dismissed || !(env.canPrompt || env.ios)) return null;

  const close = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  };

  return (
    <>
      <div className="flex items-center gap-3 rounded-3xl bg-white p-3 pr-2 shadow-sm ring-1 ring-brand-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-2xl" />
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold">Cài app lên điện thoại</p>
          <p className="text-[12px] leading-snug text-slate-500">Mở nhanh từ màn hình chính, toàn màn hình</p>
        </div>
        <button
          type="button"
          onClick={async () => {
            if (!(await promptInstall())) setGuide(true);
          }}
          className="btn btn-primary shrink-0 px-3.5 py-2 text-[13px]"
        >
          Cài đặt
        </button>
        <button type="button" onClick={close} aria-label="Đóng" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100">
          <X size={16} />
        </button>
      </div>
      {guide && <InstallGuide ios={env.ios} onClose={() => setGuide(false)} />}
    </>
  );
}

/** Mục "Cài app" trong trang Cài đặt — luôn hiện (trừ khi đang mở như app). */
export function InstallRow() {
  const env = useInstallEnv();
  const [guide, setGuide] = useState(false);
  if (!env) return null;

  if (env.standalone) {
    return (
      <div className="card flex items-center gap-3 px-4 py-3.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={18} />
        </span>
        <span className="flex-1 font-medium">Đang dùng dạng app</span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          if (!(await promptInstall())) setGuide(true);
        }}
        className="card flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-slate-50"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
          <Download size={18} />
        </span>
        <span className="flex-1">
          <span className="block font-medium">Cài app lên điện thoại</span>
          <span className="block text-[12.5px] text-slate-400">Thêm biểu tượng ra màn hình chính</span>
        </span>
        <ChevronRight size={18} className="text-slate-300" />
      </button>
      {guide && <InstallGuide ios={env.ios} onClose={() => setGuide(false)} />}
    </>
  );
}

/** Tấm hướng dẫn cài thủ công (iPhone/iPad hoặc trình duyệt không có hộp thoại cài). */
function InstallGuide({ ios, onClose }: { ios: boolean; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const steps = ios
    ? [
        { icon: <Share size={18} />, text: <>Bấm nút <b>Chia sẻ</b> ở thanh dưới cùng của Safari</> },
        { icon: <PlusSquare size={18} />, text: <>Kéo xuống, chọn <b>Thêm vào MH chính</b></> },
        { icon: <CheckCircle2 size={18} />, text: <>Bấm <b>Thêm</b> ở góc phải. Biểu tượng app sẽ xuất hiện trên màn hình chính</> },
      ]
    : [
        { icon: <EllipsisVertical size={18} />, text: <>Mở <b>menu ⋮</b> của trình duyệt (góc trên bên phải)</> },
        { icon: <Smartphone size={18} />, text: <>Chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b></> },
        { icon: <CheckCircle2 size={18} />, text: <>Xác nhận <b>Cài đặt</b>. Biểu tượng app sẽ xuất hiện trên màn hình chính</> },
      ];

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Hướng dẫn cài app">
      <button type="button" aria-label="Đóng" onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-md rounded-t-[32px] bg-white px-6 pt-3 pb-[max(env(safe-area-inset-bottom),24px)] shadow-2xl">
        <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-slate-200" />
        <div className="mb-5 flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon-192.png" alt="" className="h-14 w-14 rounded-2xl" />
          <div>
            <p className="text-lg font-bold tracking-tight">Cài Sổ Chi Tiêu</p>
            <p className="text-[13px] text-slate-500">{ios ? "Trên iPhone / iPad" : "Trên trình duyệt này"}</p>
          </div>
        </div>
        <ol className="space-y-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">{s.icon}</span>
              <p className="pt-1 text-[14px] leading-snug text-slate-700">
                <span className="mr-1 font-semibold text-brand-700">{i + 1}.</span>
                {s.text}
              </p>
            </li>
          ))}
        </ol>
        {ios && (
          <p className="mt-4 text-center text-[12px] text-slate-400">
            Nếu không thấy nút Chia sẻ, hãy mở trang này bằng <b>Safari</b>.
          </p>
        )}
        <button type="button" onClick={onClose} className="btn btn-ghost mt-5 w-full">Đã hiểu</button>
      </div>
    </div>,
    document.body,
  );
}
