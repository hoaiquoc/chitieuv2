import "server-only";
import { all, one } from "./db";
import { dateToDb, monthRange, periodRange, shiftMonth, vnParts } from "./format";

export const ASSET_TYPE = "Tiết kiệm vàng";
export const ACCOUNT_TYPES = ["Ví cá nhân", "Tiền mặt", "Tài khoản ngân hàng", "Ví điện tử", "Thẻ tín dụng", "Ngân sách mục tiêu", ASSET_TYPE];

/** Danh mục hệ thống: không tính vào thống kê thu/chi. */
export const SYSTEM_CATEGORIES = ["transfer", "balance_income", "balance_expense"];
const NOT_SYSTEM = `t.categoryId NOT IN ('transfer','balance_income','balance_expense')`;

export type Account = {
  id: string;
  name: string;
  type: string;
  color: string;
  initialBalance: number;
  assetCode: string | null;
  assetUnit: string | null;
  currentBalance: number;
  quantity: number;
  txCount: number;
};

export type Category = {
  id: string;
  name: string;
  type: "Income" | "Expense";
  icon: string;
  color: string;
  tenantId: string;
};

export type Tx = {
  id: string;
  title: string;
  accountId: string;
  categoryId: string;
  amount: number;
  type: "Income" | "Expense";
  occurredAt: string;
  note: string | null;
  createdBy: string;
  assetQuantity: number | null;
  assetUnit: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  accountName: string | null;
};

export async function getAccounts(tenantId: string) {
  return all<Account>(
    `SELECT a.id, a.name, a.type, a.color, a.initialBalance, a.assetCode, a.assetUnit,
       a.initialBalance + COALESCE(SUM(CASE WHEN t.type = 'Income' THEN t.amount ELSE -t.amount END), 0) AS currentBalance,
       COALESCE(SUM(CASE WHEN t.type = 'Income' THEN COALESCE(t.assetQuantity, 0) ELSE -COALESCE(t.assetQuantity, 0) END), 0) AS quantity,
       COUNT(t.id) AS txCount
     FROM Accounts a
     LEFT JOIN Transactions t ON t.accountId = a.id AND t.status = 'Completed'
     WHERE a.tenantId = ?
     GROUP BY a.id
     ORDER BY a.createdAt`,
    [tenantId],
  );
}

export async function getAccount(tenantId: string, id: string) {
  return (await getAccounts(tenantId)).find((a) => a.id === id);
}

export async function getCategories(tenantId: string) {
  return all<Category>(
    "SELECT id, name, type, icon, color, tenantId FROM Categories WHERE tenantId = ? ORDER BY type DESC, name",
    [tenantId],
  );
}

const TX_SELECT = `
  SELECT t.id, t.title, t.accountId, t.categoryId, t.amount, t.type, t.occurredAt, t.note, t.createdBy,
         t.assetQuantity, t.assetUnit,
         c.name AS categoryName, c.icon AS categoryIcon, c.color AS categoryColor, a.name AS accountName
  FROM Transactions t
  LEFT JOIN Categories c ON c.id = t.categoryId
  LEFT JOIN Accounts a ON a.id = t.accountId`;

export async function getTransactions(
  tenantId: string,
  opts: { month?: string; accountId?: string; type?: string; q?: string; categoryId?: string; limit?: number } = {},
) {
  const where = ["t.tenantId = ?", "t.status = 'Completed'"];
  const args: (string | number)[] = [tenantId];
  if (opts.month) {
    const r = monthRange(opts.month);
    where.push("t.occurredAt >= ? AND t.occurredAt < ?");
    args.push(r.from, r.to);
  }
  if (opts.accountId) {
    where.push("t.accountId = ?");
    args.push(opts.accountId);
  }
  if (opts.categoryId) {
    where.push("t.categoryId = ?");
    args.push(opts.categoryId);
  }
  if (opts.type === "Income" || opts.type === "Expense") {
    where.push("t.type = ?");
    args.push(opts.type);
  }
  if (opts.q) {
    where.push("(t.title LIKE ? OR t.note LIKE ? OR c.name LIKE ?)");
    const like = `%${opts.q}%`;
    args.push(like, like, like);
  }
  const limit = opts.limit ? ` LIMIT ${Math.floor(opts.limit)}` : "";
  return all<Tx>(`${TX_SELECT} WHERE ${where.join(" AND ")} ORDER BY t.occurredAt DESC, t.rowid DESC${limit}`, args);
}

export async function getTransaction(tenantId: string, id: string) {
  return one<Tx>(`${TX_SELECT} WHERE t.tenantId = ? AND t.id = ?`, [tenantId, id]);
}

export async function getMonthSummary(tenantId: string, month: string) {
  const r = monthRange(month);
  const row = await one<{ income: number; expense: number }>(
    `SELECT COALESCE(SUM(CASE WHEN t.type = 'Income' THEN t.amount END), 0) AS income,
            COALESCE(SUM(CASE WHEN t.type = 'Expense' THEN t.amount END), 0) AS expense
     FROM Transactions t
     WHERE t.tenantId = ? AND t.status = 'Completed' AND t.occurredAt >= ? AND t.occurredAt < ? AND ${NOT_SYSTEM}`,
    [tenantId, r.from, r.to],
  );
  return { income: row?.income ?? 0, expense: row?.expense ?? 0 };
}

export async function getCategoryBreakdown(tenantId: string, month: string, type: "Income" | "Expense") {
  const r = monthRange(month);
  return all<{ categoryId: string; name: string | null; icon: string | null; color: string | null; total: number; count: number }>(
    `SELECT t.categoryId, c.name, c.icon, c.color, SUM(t.amount) AS total, COUNT(*) AS count
     FROM Transactions t
     LEFT JOIN Categories c ON c.id = t.categoryId
     WHERE t.tenantId = ? AND t.status = 'Completed' AND t.type = ? AND t.occurredAt >= ? AND t.occurredAt < ? AND ${NOT_SYSTEM}
     GROUP BY t.categoryId
     HAVING SUM(t.amount) > 0
     ORDER BY total DESC`,
    [tenantId, type, r.from, r.to],
  );
}

export async function getMemberBreakdown(tenantId: string, month: string) {
  const r = monthRange(month);
  return all<{ createdBy: string; expense: number; income: number; count: number }>(
    `SELECT t.createdBy,
            COALESCE(SUM(CASE WHEN t.type = 'Expense' THEN t.amount END), 0) AS expense,
            COALESCE(SUM(CASE WHEN t.type = 'Income' THEN t.amount END), 0) AS income,
            COUNT(*) AS count
     FROM Transactions t
     WHERE t.tenantId = ? AND t.status = 'Completed' AND t.occurredAt >= ? AND t.occurredAt < ? AND ${NOT_SYSTEM}
     GROUP BY t.createdBy ORDER BY expense DESC`,
    [tenantId, r.from, r.to],
  );
}

/** Tổng chi theo từng ngày (giờ VN) trong `days` ngày gần nhất, tính cả hôm nay. */
export async function getDailyExpense(tenantId: string, days = 7) {
  const today = vnParts(new Date());
  const keys = Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.UTC(today.y, today.m - 1, today.d - (days - 1 - i)));
    return d.toISOString().slice(0, 10);
  });
  const from = dateToDb(new Date(Date.parse(keys[0] + "T00:00:00Z") - 7 * 3600000));
  const rows = await all<{ day: string; total: number }>(
    `SELECT substr(datetime(substr(t.occurredAt, 1, 19), '+7 hours'), 1, 10) AS day, SUM(t.amount) AS total
     FROM Transactions t
     WHERE t.tenantId = ? AND t.status = 'Completed' AND t.type = 'Expense' AND t.occurredAt >= ? AND ${NOT_SYSTEM}
     GROUP BY day`,
    [tenantId, from],
  );
  const map = new Map(rows.map((r) => [r.day, r.total]));
  return keys.map((day) => ({ day, total: map.get(day) ?? 0 }));
}

export async function getTrend(tenantId: string, month: string, months = 6) {
  const list = Array.from({ length: months }, (_, i) => shiftMonth(month, i - months + 1));
  return Promise.all(list.map(async (m) => ({ month: m, ...(await getMonthSummary(tenantId, m)) })));
}

export type AlertProgress = {
  id: string;
  period: string;
  thresholdAmount: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  spent: number;
};

export async function getAlerts(tenantId: string): Promise<AlertProgress[]> {
  const alerts = await all<Omit<AlertProgress, "spent">>(
    `SELECT s.id, s.period, s.thresholdAmount, s.categoryId, c.name AS categoryName, c.icon AS categoryIcon, c.color AS categoryColor
     FROM SpendingAlerts s LEFT JOIN Categories c ON c.id = s.categoryId
     WHERE s.tenantId = ?
     ORDER BY CASE s.period WHEN 'day' THEN 1 WHEN 'week' THEN 2 ELSE 3 END, s.createdAt`,
    [tenantId],
  );
  return Promise.all(
    alerts.map(async (a) => {
      const r = periodRange(a.period);
      const args: string[] = [tenantId, r.from, r.to];
      let cond = NOT_SYSTEM;
      if (a.categoryId) {
        cond = "t.categoryId = ?";
        args.push(a.categoryId);
      }
      const row = await one<{ spent: number }>(
        `SELECT COALESCE(SUM(t.amount), 0) AS spent FROM Transactions t
         WHERE t.tenantId = ? AND t.status = 'Completed' AND t.type = 'Expense'
           AND t.occurredAt >= ? AND t.occurredAt < ? AND ${cond}`,
        args,
      );
      return { ...a, spent: row?.spent ?? 0 };
    }),
  );
}

export async function getMembers(tenantId: string) {
  return all<{ id: string; email: string; fullName: string; role: string; avatar: string; createdAt: string }>(
    "SELECT id, email, fullName, role, avatar, createdAt FROM Users WHERE tenantId = ? ORDER BY CASE role WHEN 'Owner' THEN 0 ELSE 1 END, createdAt",
    [tenantId],
  );
}
