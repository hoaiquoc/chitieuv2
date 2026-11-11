// DB lưu màu dạng class Tailwind ("bg-rose-500", "bg-sky-100 text-sky-700").
// Đọc tên màu ra rồi dùng inline style để không phụ thuộc vào việc Tailwind sinh class động.
const PALETTE: Record<string, [soft: string, strong: string, solid: string]> = {
  slate: ["#f1f5f9", "#334155", "#64748b"],
  gray: ["#f3f4f6", "#374151", "#6b7280"],
  red: ["#fee2e2", "#b91c1c", "#ef4444"],
  orange: ["#ffedd5", "#c2410c", "#f97316"],
  amber: ["#fef3c7", "#92400e", "#f59e0b"],
  yellow: ["#fef9c3", "#a16207", "#eab308"],
  lime: ["#ecfccb", "#4d7c0f", "#84cc16"],
  green: ["#dcfce7", "#15803d", "#22c55e"],
  emerald: ["#d1fae5", "#047857", "#10b981"],
  teal: ["#ccfbf1", "#0f766e", "#14b8a6"],
  cyan: ["#cffafe", "#0e7490", "#06b6d4"],
  sky: ["#e0f2fe", "#0369a1", "#0ea5e9"],
  blue: ["#dbeafe", "#1d4ed8", "#3b82f6"],
  indigo: ["#e0e7ff", "#4338ca", "#6366f1"],
  violet: ["#ede9fe", "#6d28d9", "#8b5cf6"],
  purple: ["#f3e8ff", "#7e22ce", "#a855f7"],
  fuchsia: ["#fae8ff", "#a21caf", "#d946ef"],
  pink: ["#fce7f3", "#be185d", "#ec4899"],
  rose: ["#ffe4e6", "#be123c", "#f43f5e"],
};

export const COLOR_NAMES = Object.keys(PALETTE).filter((c) => c !== "gray");

export function colorName(cls: string | null | undefined): string {
  const m = String(cls ?? "").match(/(?:bg|text)-([a-z]+)-\d+/);
  return m && PALETTE[m[1]] ? m[1] : "slate";
}

export function colorOf(cls: string | null | undefined) {
  const [soft, strong, solid] = PALETTE[colorName(cls)];
  return { soft, strong, solid };
}

export const categoryColorClass = (name: string) => `bg-${name}-100 text-${name}-700`;
export const accountColorClass = (name: string) => `bg-${name}-500`;
