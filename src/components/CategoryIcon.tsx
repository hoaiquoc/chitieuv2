import {
  ArrowLeftRight, Baby, Car, Coffee, Gamepad2, Gift, GraduationCap, HeartPulse, Home, Landmark,
  PawPrint, PiggyBank, Plane, Receipt, Scale, Shapes, Shirt, ShoppingCart, Smartphone, Utensils,
  Wallet, Zap, type LucideIcon,
} from "lucide-react";
import { colorOf } from "@/lib/colors";

export const ICONS: Record<string, LucideIcon> = {
  food: Utensils,
  shopping: ShoppingCart,
  utilities: Receipt,
  electric: Zap,
  home: Home,
  transport: Car,
  travel: Plane,
  health: HeartPulse,
  education: GraduationCap,
  entertainment: Gamepad2,
  coffee: Coffee,
  clothes: Shirt,
  phone: Smartphone,
  baby: Baby,
  pet: PawPrint,
  gift: Gift,
  salary: Wallet,
  savings: PiggyBank,
  bank: Landmark,
  transfer: ArrowLeftRight,
  CD: Scale,
  other: Shapes,
};

export const ICON_KEYS = Object.keys(ICONS).filter((k) => k !== "CD" && k !== "transfer");

export function CategoryIcon({
  icon, color, size = 40,
}: { icon?: string | null; color?: string | null; size?: number }) {
  const c = colorOf(color);
  const Icon = icon ? ICONS[icon] : undefined;
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-2xl font-semibold"
      style={{ width: size, height: size, background: c.soft, color: c.strong, fontSize: size * 0.32 }}
    >
      {Icon ? <Icon size={size * 0.5} strokeWidth={2} /> : (icon || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}
