// Giờ trong DB lưu theo UTC dạng "YYYY-MM-DD HH:MM:SS.fffffff".
// Việt Nam cố định UTC+7 (không có giờ mùa hè) nên quy đổi bằng offset cố định.
const VN_OFFSET = 7 * 60 * 60 * 1000;

const moneyFmt = new Intl.NumberFormat("vi-VN");

export function formatMoney(n: number, withSign = false): string {
  const s = moneyFmt.format(Math.abs(Math.round(n))) + " ₫";
  if (n < 0) return "-" + s;
  return withSign && n > 0 ? "+" + s : s;
}

/** 1.250.000 → "1,25 tr" */
export function formatCompact(n: number): string {
  const a = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (a >= 1e9) return sign + (a / 1e9).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " tỷ";
  if (a >= 1e6) return sign + (a / 1e6).toLocaleString("vi-VN", { maximumFractionDigits: 1 }) + " tr";
  if (a >= 1e3) return sign + Math.round(a / 1e3) + "k";
  return sign + a;
}

export function formatQty(n: number): string {
  return n.toLocaleString("vi-VN", { maximumFractionDigits: 3 });
}

export function dbToDate(s: string): Date {
  return new Date(s.replace(" ", "T").slice(0, 23) + "Z");
}

export function dateToDb(d: Date): string {
  return d.toISOString().replace("T", " ").replace("Z", "") + "0000";
}

export function nowDb(): string {
  return dateToDb(new Date());
}

/** Các thành phần ngày giờ theo giờ Việt Nam. */
export function vnParts(d: Date) {
  const v = new Date(d.getTime() + VN_OFFSET);
  return {
    y: v.getUTCFullYear(),
    m: v.getUTCMonth() + 1,
    d: v.getUTCDate(),
    hh: v.getUTCHours(),
    mm: v.getUTCMinutes(),
    dow: v.getUTCDay(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");

/** Mốc UTC (dạng chuỗi DB) của 0h ngày y-m-d giờ VN. */
function vnMidnightDb(y: number, m: number, d: number): string {
  return dateToDb(new Date(Date.UTC(y, m - 1, d) - VN_OFFSET));
}

export function currentMonth(): string {
  const p = vnParts(new Date());
  return `${p.y}-${pad(p.m)}`;
}

export function isValidMonth(s: string | undefined): s is string {
  return !!s && /^\d{4}-(0[1-9]|1[0-2])$/.test(s);
}

export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export function monthRange(ym: string): { from: string; to: string } {
  const [y, m] = ym.split("-").map(Number);
  return { from: vnMidnightDb(y, m, 1), to: vnMidnightDb(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1) };
}

export function monthLabel(ym: string): string {
  const [y, m] = ym.split("-");
  return `Tháng ${Number(m)}/${y}`;
}

/** Khoảng thời gian hiện tại cho cảnh báo chi tiêu: ngày / tuần (bắt đầu thứ 2) / tháng. */
export function periodRange(period: string): { from: string; to: string } {
  const p = vnParts(new Date());
  if (period === "day") {
    const start = Date.UTC(p.y, p.m - 1, p.d) - VN_OFFSET;
    return { from: dateToDb(new Date(start)), to: dateToDb(new Date(start + 86400000)) };
  }
  if (period === "week") {
    const back = (p.dow + 6) % 7;
    const start = Date.UTC(p.y, p.m - 1, p.d - back) - VN_OFFSET;
    return { from: dateToDb(new Date(start)), to: dateToDb(new Date(start + 7 * 86400000)) };
  }
  return monthRange(`${p.y}-${pad(p.m)}`);
}

export const PERIOD_LABEL: Record<string, string> = { day: "Hôm nay", week: "Tuần này", month: "Tháng này" };

const DOW = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];

/** Khóa nhóm theo ngày giờ VN: "2026-11-10" */
export function dayKey(dbDate: string): string {
  const p = vnParts(dbToDate(dbDate));
  return `${p.y}-${pad(p.m)}-${pad(p.d)}`;
}

export function dayLabel(key: string): string {
  const today = vnParts(new Date());
  const todayKey = `${today.y}-${pad(today.m)}-${pad(today.d)}`;
  const y = vnParts(new Date(Date.now() - 86400000));
  const yKey = `${y.y}-${pad(y.m)}-${pad(y.d)}`;
  if (key === todayKey) return "Hôm nay";
  if (key === yKey) return "Hôm qua";
  const [yy, mm, dd] = key.split("-").map(Number);
  const dow = new Date(Date.UTC(yy, mm - 1, dd)).getUTCDay();
  return `${DOW[dow]}, ${dd}/${mm}${yy !== today.y ? "/" + yy : ""}`;
}

export function timeLabel(dbDate: string): string {
  const p = vnParts(dbToDate(dbDate));
  return `${pad(p.hh)}:${pad(p.mm)}`;
}

export function dateTimeLabel(dbDate: string): string {
  const p = vnParts(dbToDate(dbDate));
  return `${pad(p.hh)}:${pad(p.mm)} ${pad(p.d)}/${pad(p.m)}/${p.y}`;
}

/** Giá trị cho <input type="datetime-local"> theo giờ VN. */
export function toLocalInput(dbDate?: string): string {
  const p = vnParts(dbDate ? dbToDate(dbDate) : new Date());
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.hh)}:${pad(p.mm)}`;
}

export function fromLocalInput(v: string): string | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  return dateToDb(new Date(Date.UTC(y, mo - 1, d, h, mi) - VN_OFFSET));
}

/** "1.250.000" → 1250000 */
export function parseAmount(v: FormDataEntryValue | null): number {
  const n = Number(String(v ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const s = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2);
  return s.toUpperCase();
}
