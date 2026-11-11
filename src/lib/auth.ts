import "server-only";
import { pbkdf2, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, run } from "./db";
import { dateToDb, nowDb } from "./format";

const pbkdf2Async = promisify(pbkdf2);
const COOKIE = "qlct_session";
const SESSION_DAYS = 30;
export const ITERATIONS = 120000;

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatar: string;
  tenantId: string;
  tenantName: string;
};

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = await pbkdf2Async(password, salt, ITERATIONS, 32, "sha256");
  return { hash: hash.toString("base64"), salt: salt.toString("base64"), iterations: ITERATIONS };
}

/**
 * Kiểm tra mật khẩu PBKDF2. Hệ thống cũ không ghi rõ thuật toán, nên thử lần lượt
 * các biến thể phổ biến (SHA-256 trước). Dừng ngay khi khớp.
 */
export async function verifyPassword(password: string, hashB64: string, saltB64: string, iterations: number) {
  const expected = Buffer.from(hashB64, "base64");
  const saltBytes = Buffer.from(saltB64, "base64");
  const variants: [Buffer | string, string][] = [
    [saltBytes, "sha256"],
    [saltB64, "sha256"],
    [saltBytes, "sha512"],
    [saltBytes, "sha1"],
    [saltB64, "sha512"],
    [saltB64, "sha1"],
  ];
  for (const [salt, digest] of variants) {
    const got = await pbkdf2Async(password, salt, iterations || ITERATIONS, expected.length, digest);
    if (got.length === expected.length && timingSafeEqual(got, expected)) return true;
  }
  return false;
}

export async function createSession(userId: string, tenantId: string) {
  const token = `token-${randomUUID()}`;
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  await run("INSERT INTO Sessions (token, userId, tenantId, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)", [
    token, userId, tenantId, nowDb(), dateToDb(expires),
  ]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await run("DELETE FROM Sessions WHERE token = ?", [token]);
  jar.delete(COOKIE);
}

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const u = await one<CurrentUser>(
    `SELECT u.id, u.email, u.fullName, u.role, u.avatar, s.tenantId, t.name AS tenantName
     FROM Sessions s
     JOIN Users u ON u.id = s.userId
     JOIN Tenants t ON t.id = s.tenantId
     WHERE s.token = ? AND s.expiresAt > ?`,
    [token, nowDb()],
  );
  return u ?? null;
});

export async function requireUser(): Promise<CurrentUser> {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}
