import { Coins, CreditCard, Goal, HandCoins, Landmark, Smartphone, Wallet, type LucideIcon } from "lucide-react";
import { colorOf } from "@/lib/colors";

/** Icon theo loại tài khoản (tên loại lưu trong DB bằng tiếng Việt). */
export function accountTypeIcon(type: string): LucideIcon {
  const t = type.toLowerCase();
  if (t.includes("ngân hàng")) return Landmark;
  if (t.includes("vàng")) return Coins;
  if (t.includes("thẻ")) return CreditCard;
  if (t.includes("điện tử")) return Smartphone;
  if (t.includes("mục tiêu") || t.includes("tiết kiệm")) return Goal;
  if (t.includes("tiền mặt")) return HandCoins;
  return Wallet;
}

export function AccountIcon({ type, color, size = 40 }: { type: string; color: string; size?: number }) {
  const Icon = accountTypeIcon(type);
  const c = colorOf(color);
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-2xl"
      style={{ width: size, height: size, background: c.soft, color: c.strong }}
    >
      <Icon size={size * 0.5} strokeWidth={2} />
    </span>
  );
}
