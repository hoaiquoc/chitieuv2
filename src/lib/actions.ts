"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InStatement } from "@libsql/client";
import { batch, one, run } from "./db";
import { createSession, destroySession, hashPassword, requireUser, verifyPassword } from "./auth";
import { fromLocalInput, initials, nowDb, parseAmount } from "./format";
import { ASSET_TYPE, getAccounts, SYSTEM_CATEGORIES } from "./queries";
import { accountColorClass, categoryColorClass, COLOR_NAMES } from "./colors";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/** Đồng bộ cột balance / assetQuantity trong Accounts (giữ tương thích với dữ liệu cũ). */
function recomputeStmt(tenantId: string): InStatement {
  return {
    sql: `UPDATE Accounts SET
      balance = initialBalance + COALESCE((SELECT SUM(CASE WHEN type = 'Income' THEN amount ELSE -amount END)
                FROM Transactions WHERE accountId = Accounts.id AND status = 'Completed'), 0),
      assetQuantity = CASE WHEN assetUnit IS NULL THEN assetQuantity ELSE
                COALESCE((SELECT SUM(CASE WHEN type = 'Income' THEN COALESCE(assetQuantity, 0) ELSE -COALESCE(assetQuantity, 0) END)
                FROM Transactions WHERE accountId = Accounts.id AND status = 'Completed'), 0) END
      WHERE tenantId = ?`,
    args: [tenantId],
  };
}

function done(path = "/"): never {
  revalidatePath("/", "layout");
  redirect(path);
}

function safeReturn(v: string, fallback: string) {
  return v.startsWith("/") && !v.startsWith("//") ? v : fallback;
}

// ───────────────────────── Đăng nhập / đăng ký ─────────────────────────

export async function login(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!email || !password) return { error: "Nhập email và mật khẩu" };
  const u = await one<{ id: string; tenantId: string; passwordHash: string; passwordSalt: string; passwordIterations: number }>(
    "SELECT id, tenantId, passwordHash, passwordSalt, passwordIterations FROM Users WHERE lower(email) = ?",
    [email],
  );
  if (!u || !(await verifyPassword(password, u.passwordHash, u.passwordSalt, u.passwordIterations))) {
    return { error: "Email hoặc mật khẩu không đúng" };
  }
  await createSession(u.id, u.tenantId);
  redirect("/");
}

const DEFAULT_CATEGORIES: [string, "Expense" | "Income", string, string][] = [
  ["Ăn uống", "Expense", "food", "orange"],
  ["Đi chợ", "Expense", "shopping", "violet"],
  ["Đi lại", "Expense", "transport", "sky"],
  ["Hóa đơn", "Expense", "utilities", "indigo"],
  ["Tiền nhà", "Expense", "home", "slate"],
  ["Mua sắm", "Expense", "clothes", "pink"],
  ["Sức khỏe", "Expense", "health", "rose"],
  ["Giải trí", "Expense", "entertainment", "fuchsia"],
  ["Phát sinh khác", "Expense", "other", "amber"],
  ["Tiền lương", "Income", "salary", "emerald"],
  ["Thưởng", "Income", "gift", "lime"],
  ["Thu khác", "Income", "other", "cyan"],
];

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, "email").toLowerCase();
  const fullName = str(fd, "fullName");
  const bookName = str(fd, "bookName") || "Sổ chi tiêu";
  const password = String(fd.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Email không hợp lệ" };
  if (!fullName) return { error: "Nhập tên của bạn" };
  if (password.length < 6) return { error: "Mật khẩu tối thiểu 6 ký tự" };
  if (await one("SELECT 1 FROM Users WHERE lower(email) = ?", [email])) return { error: "Email đã được sử dụng" };

  const tenantId = randomUUID();
  const userId = randomUUID();
  const now = nowDb();
  const pw = await hashPassword(password);
  const stmts: InStatement[] = [
    { sql: "INSERT INTO Tenants (id, name, ownerEmail, createdAt) VALUES (?, ?, ?, ?)", args: [tenantId, bookName, email, now] },
    {
      sql: `INSERT INTO Users (id, email, fullName, role, avatar, spaces, passwordHash, passwordSalt, passwordIterations, createdAt, tenantId, isActive)
            VALUES (?, ?, ?, 'Owner', ?, 1, ?, ?, ?, ?, ?, 1)`,
      args: [userId, email, fullName, initials(fullName), pw.hash, pw.salt, pw.iterations, now, tenantId],
    },
    {
      sql: "INSERT INTO Accounts (id, name, type, initialBalance, color, createdAt, tenantId, balance) VALUES (?, 'Tiền mặt', 'Ví cá nhân', 0, 'bg-emerald-500', ?, ?, 0)",
      args: [randomUUID(), now, tenantId],
    },
    ...DEFAULT_CATEGORIES.map(([name, type, icon, color]) => ({
      sql: "INSERT INTO Categories (id, name, type, icon, color, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [`cat-${randomUUID().slice(0, 8)}`, name, type, icon, categoryColorClass(color), now, tenantId],
    })),
  ];
  await batch(stmts);
  await createSession(userId, tenantId);
  redirect("/");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function changePassword(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("next") ?? "");
  if (next.length < 6) return { error: "Mật khẩu mới tối thiểu 6 ký tự" };
  const u = await one<{ passwordHash: string; passwordSalt: string; passwordIterations: number }>(
    "SELECT passwordHash, passwordSalt, passwordIterations FROM Users WHERE id = ?",
    [me.id],
  );
  if (!u || !(await verifyPassword(current, u.passwordHash, u.passwordSalt, u.passwordIterations))) {
    return { error: "Mật khẩu hiện tại không đúng" };
  }
  const pw = await hashPassword(next);
  await run("UPDATE Users SET passwordHash = ?, passwordSalt = ?, passwordIterations = ? WHERE id = ?", [
    pw.hash, pw.salt, pw.iterations, me.id,
  ]);
  return { ok: "Đã đổi mật khẩu" };
}

// ───────────────────────── Giao dịch ─────────────────────────

export async function saveTransaction(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const id = str(fd, "id");
  const kind = str(fd, "kind");
  const amount = parseAmount(fd.get("amount"));
  const occurredAt = fromLocalInput(str(fd, "occurredAt"));
  const note = str(fd, "note");
  const quantity = Number(str(fd, "quantity").replace(",", ".")) || 0;
  const accounts = await getAccounts(me.tenantId);
  const account = accounts.find((a) => a.id === str(fd, "accountId"));

  if (!occurredAt) return { error: "Thời gian không hợp lệ" };
  if (!account) return { error: "Chọn tài khoản" };
  const isAsset = !!account.assetUnit;
  if (!isAsset && amount <= 0) return { error: "Nhập số tiền lớn hơn 0" };
  if (isAsset && quantity <= 0 && amount <= 0) return { error: `Nhập số lượng (${account.assetUnit})` };

  if (kind === "Transfer") {
    if (id) return { error: "Không sửa được giao dịch chuyển tiền, hãy xóa và tạo lại" };
    const to = accounts.find((a) => a.id === str(fd, "toAccountId"));
    if (!to || to.id === account.id) return { error: "Chọn tài khoản nhận khác tài khoản chuyển" };
    if (amount <= 0) return { error: "Nhập số tiền lớn hơn 0" };
    const ins = (txId: string, title: string, accId: string, type: string) => ({
      sql: `INSERT INTO Transactions (id, title, accountId, categoryId, amount, type, occurredAt, note, createdBy, status, tenantId)
            VALUES (?, ?, ?, 'transfer', ?, ?, ?, ?, ?, 'Completed', ?)`,
      args: [txId, title, accId, amount, type, occurredAt, note, me.fullName, me.tenantId],
    });
    await batch([
      ins(randomUUID(), str(fd, "title") || `Chuyển tiền tới ${to.name}`, account.id, "Expense"),
      ins(randomUUID(), str(fd, "title") || `Nhận chuyển tiền từ ${account.name}`, to.id, "Income"),
      recomputeStmt(me.tenantId),
    ]);
    done(safeReturn(str(fd, "returnTo"), "/transactions"));
  }

  if (kind !== "Income" && kind !== "Expense") return { error: "Loại giao dịch không hợp lệ" };
  const category = await one<{ id: string; name: string; type: string }>(
    "SELECT id, name, type FROM Categories WHERE id = ? AND (tenantId = ? OR id IN ('transfer','balance_income','balance_expense'))",
    [str(fd, "categoryId"), me.tenantId],
  );
  if (!category) return { error: "Chọn danh mục" };
  const title = str(fd, "title") || category.name;
  const qty = isAsset && quantity > 0 ? quantity : null;
  const unit = qty ? account.assetUnit : null;

  if (id) {
    const r = await run(
      `UPDATE Transactions SET title = ?, accountId = ?, categoryId = ?, amount = ?, type = ?, occurredAt = ?, note = ?,
              assetQuantity = ?, assetUnit = ?
       WHERE id = ? AND tenantId = ?`,
      [title, account.id, category.id, amount, kind, occurredAt, note, qty, unit, id, me.tenantId],
    );
    if (!r.rowsAffected) return { error: "Không tìm thấy giao dịch" };
    await batch([recomputeStmt(me.tenantId)]);
  } else {
    await batch([
      {
        sql: `INSERT INTO Transactions (id, title, accountId, categoryId, amount, type, occurredAt, note, createdBy, status, tenantId, assetQuantity, assetUnit)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Completed', ?, ?, ?)`,
        args: [randomUUID(), title, account.id, category.id, amount, kind, occurredAt, note, me.fullName, me.tenantId, qty, unit],
      },
      recomputeStmt(me.tenantId),
    ]);
  }
  done(safeReturn(str(fd, "returnTo"), "/transactions"));
}

export async function deleteTransaction(fd: FormData) {
  const me = await requireUser();
  const id = str(fd, "id");
  const tx = await one<{ id: string; categoryId: string; amount: number; type: string; occurredAt: string }>(
    "SELECT id, categoryId, amount, type, occurredAt FROM Transactions WHERE id = ? AND tenantId = ?",
    [id, me.tenantId],
  );
  if (!tx) done("/transactions");
  const stmts: InStatement[] = [{ sql: "DELETE FROM Transactions WHERE id = ? AND tenantId = ?", args: [id, me.tenantId] }];
  if (tx!.categoryId === "transfer") {
    // Xóa luôn vế còn lại của giao dịch chuyển tiền
    stmts.push({
      sql: `DELETE FROM Transactions WHERE id = (
              SELECT id FROM Transactions WHERE tenantId = ? AND categoryId = 'transfer' AND id <> ?
                AND occurredAt = ? AND amount = ? AND type <> ? LIMIT 1)`,
      args: [me.tenantId, id, tx!.occurredAt, tx!.amount, tx!.type],
    });
  }
  stmts.push(recomputeStmt(me.tenantId));
  await batch(stmts);
  done(safeReturn(str(fd, "returnTo"), "/transactions"));
}

// ───────────────────────── Tài khoản ─────────────────────────

export async function saveAccount(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const type = str(fd, "type") || "Tiền mặt";
  const color = COLOR_NAMES.includes(str(fd, "color")) ? str(fd, "color") : "emerald";
  const rawInitial = str(fd, "initialBalance");
  const initial = parseAmount(rawInitial) * (rawInitial.startsWith("-") ? -1 : 1);
  const isAsset = type === ASSET_TYPE;
  const assetUnit = isAsset ? str(fd, "assetUnit") || "chỉ" : null;
  const assetCode = isAsset ? str(fd, "assetCode") || null : null;
  if (!name) return { error: "Nhập tên tài khoản" };

  if (id) {
    await batch([
      {
        sql: "UPDATE Accounts SET name = ?, type = ?, color = ?, initialBalance = ?, assetUnit = ?, assetCode = ? WHERE id = ? AND tenantId = ?",
        args: [name, type, accountColorClass(color), initial, assetUnit, assetCode, id, me.tenantId],
      },
      recomputeStmt(me.tenantId),
    ]);
    done(`/accounts/${id}`);
  }
  await run(
    `INSERT INTO Accounts (id, name, type, initialBalance, color, createdAt, tenantId, assetCode, assetQuantity, assetUnit, balance)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), name, type, initial, accountColorClass(color), nowDb(), me.tenantId, assetCode, isAsset ? 0 : null, assetUnit, initial],
  );
  done("/accounts");
}

export async function deleteAccount(fd: FormData) {
  const me = await requireUser();
  const id = str(fd, "id");
  const used = await one("SELECT 1 FROM Transactions WHERE accountId = ? LIMIT 1", [id]);
  if (!used) await run("DELETE FROM Accounts WHERE id = ? AND tenantId = ?", [id, me.tenantId]);
  done("/accounts");
}

export async function adjustBalance(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const id = str(fd, "id");
  const raw = str(fd, "actual");
  const actual = parseAmount(raw) * (raw.startsWith("-") ? -1 : 1);
  const acc = (await getAccounts(me.tenantId)).find((a) => a.id === id);
  if (!acc) return { error: "Không tìm thấy tài khoản" };
  const diff = actual - acc.currentBalance;
  if (diff === 0) return { ok: "Số dư đã khớp, không cần cân đối" };
  await batch([
    {
      sql: `INSERT INTO Transactions (id, title, accountId, categoryId, amount, type, occurredAt, note, createdBy, status, tenantId)
            VALUES (?, 'Cân đối số dư', ?, ?, ?, ?, ?, '', ?, 'Completed', ?)`,
      args: [randomUUID(), id, diff > 0 ? "balance_income" : "balance_expense", Math.abs(diff),
        diff > 0 ? "Income" : "Expense", nowDb(), me.fullName, me.tenantId],
    },
    recomputeStmt(me.tenantId),
  ]);
  revalidatePath("/", "layout");
  return { ok: "Đã cân đối số dư" };
}

// ───────────────────────── Danh mục ─────────────────────────

export async function saveCategory(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const id = str(fd, "id");
  const name = str(fd, "name");
  const type = str(fd, "type") === "Income" ? "Income" : "Expense";
  const icon = str(fd, "icon") || "other";
  const color = COLOR_NAMES.includes(str(fd, "color")) ? str(fd, "color") : "slate";
  if (!name) return { error: "Nhập tên danh mục" };
  if (SYSTEM_CATEGORIES.includes(id)) return { error: "Không sửa được danh mục hệ thống" };
  if (id) {
    await run("UPDATE Categories SET name = ?, type = ?, icon = ?, color = ? WHERE id = ? AND tenantId = ?", [
      name, type, icon, categoryColorClass(color), id, me.tenantId,
    ]);
  } else {
    await run("INSERT INTO Categories (id, name, type, icon, color, createdAt, tenantId) VALUES (?, ?, ?, ?, ?, ?, ?)", [
      `cat-${randomUUID().slice(0, 8)}`, name, type, icon, categoryColorClass(color), nowDb(), me.tenantId,
    ]);
  }
  done("/settings/categories");
}

export async function deleteCategory(fd: FormData) {
  const me = await requireUser();
  const id = str(fd, "id");
  const used = await one("SELECT 1 FROM Transactions WHERE categoryId = ? AND tenantId = ? LIMIT 1", [id, me.tenantId]);
  if (!used && !SYSTEM_CATEGORIES.includes(id)) {
    await batch([
      { sql: "DELETE FROM SpendingAlerts WHERE categoryId = ? AND tenantId = ?", args: [id, me.tenantId] },
      { sql: "DELETE FROM Categories WHERE id = ? AND tenantId = ?", args: [id, me.tenantId] },
    ]);
  }
  done("/settings/categories");
}

// ───────────────────────── Cảnh báo chi tiêu ─────────────────────────

export async function saveAlert(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  const period = ["day", "week", "month"].includes(str(fd, "period")) ? str(fd, "period") : "month";
  const threshold = parseAmount(fd.get("thresholdAmount"));
  const categoryId = str(fd, "categoryId") || null;
  if (threshold <= 0) return { error: "Nhập hạn mức lớn hơn 0" };
  const existing = await one<{ id: string }>(
    "SELECT id FROM SpendingAlerts WHERE tenantId = ? AND period = ? AND categoryId IS ?",
    [me.tenantId, period, categoryId],
  );
  const now = nowDb();
  if (existing) {
    await run("UPDATE SpendingAlerts SET thresholdAmount = ?, updatedAt = ? WHERE id = ?", [threshold, now, existing.id]);
  } else {
    await run(
      "INSERT INTO SpendingAlerts (id, tenantId, period, thresholdAmount, createdAt, updatedAt, categoryId) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [randomUUID(), me.tenantId, period, threshold, now, now, categoryId],
    );
  }
  revalidatePath("/", "layout");
  return { ok: existing ? "Đã cập nhật hạn mức" : "Đã thêm cảnh báo" };
}

export async function deleteAlert(fd: FormData) {
  const me = await requireUser();
  await run("DELETE FROM SpendingAlerts WHERE id = ? AND tenantId = ?", [str(fd, "id"), me.tenantId]);
  done("/settings/alerts");
}

// ───────────────────────── Thành viên ─────────────────────────

export async function addMember(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  if (me.role !== "Owner") return { error: "Chỉ chủ sổ mới thêm được thành viên" };
  const email = str(fd, "email").toLowerCase();
  const fullName = str(fd, "fullName");
  const password = String(fd.get("password") ?? "");
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Email không hợp lệ" };
  if (!fullName) return { error: "Nhập tên thành viên" };
  if (password.length < 6) return { error: "Mật khẩu tối thiểu 6 ký tự" };
  if (await one("SELECT 1 FROM Users WHERE lower(email) = ?", [email])) return { error: "Email đã được sử dụng" };
  const pw = await hashPassword(password);
  await run(
    `INSERT INTO Users (id, email, fullName, role, avatar, spaces, passwordHash, passwordSalt, passwordIterations, createdAt, tenantId, isActive)
     VALUES (?, ?, ?, 'Editor', ?, 1, ?, ?, ?, ?, ?, 1)`,
    [randomUUID(), email, fullName, initials(fullName), pw.hash, pw.salt, pw.iterations, nowDb(), me.tenantId],
  );
  revalidatePath("/settings/members");
  return { ok: `Đã thêm ${fullName}. Gửi email + mật khẩu cho họ để đăng nhập.` };
}

export async function removeMember(fd: FormData) {
  const me = await requireUser();
  const id = str(fd, "id");
  if (me.role === "Owner" && id !== me.id) {
    await batch([
      { sql: "DELETE FROM Sessions WHERE userId = ? AND tenantId = ?", args: [id, me.tenantId] },
      { sql: "DELETE FROM Users WHERE id = ? AND tenantId = ? AND role <> 'Owner'", args: [id, me.tenantId] },
    ]);
  }
  done("/settings/members");
}

export async function renameBook(_: FormState, fd: FormData): Promise<FormState> {
  const me = await requireUser();
  if (me.role !== "Owner") return { error: "Chỉ chủ sổ mới đổi được tên" };
  const name = str(fd, "name");
  if (!name) return { error: "Nhập tên sổ" };
  await run("UPDATE Tenants SET name = ? WHERE id = ?", [name, me.tenantId]);
  revalidatePath("/", "layout");
  return { ok: "Đã đổi tên sổ" };
}
