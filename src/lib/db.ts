import "server-only";
import type { Client, InArgs, InStatement } from "@libsql/client";

let clientPromise: Promise<Client> | undefined;

/**
 * Kết nối database.
 * - Turso (libsql:// hoặc https://): dùng client "web" chỉ gọi HTTP, không cần file native —
 *   tránh lỗi thiếu module `@libsql/linux-x64-gnu` khi chạy trên Vercel.
 * - File local (file:local.db): dùng client Node (cần native), chỉ dùng khi chạy trên máy.
 */
function getClient(): Promise<Client> {
  if (!clientPromise) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN || undefined;
    if (!url) {
      throw new Error(
        "Thiếu biến môi trường TURSO_DATABASE_URL. Trên Vercel: Settings → Environment Variables, thêm TURSO_DATABASE_URL và TURSO_AUTH_TOKEN rồi Redeploy.",
      );
    }
    clientPromise = (
      url.startsWith("file:")
        ? import("@libsql/client").then((m) => m.createClient({ url, authToken }))
        : import("@libsql/client/web").then((m) => m.createClient({ url, authToken }))
    ).catch((e) => {
      clientPromise = undefined; // cho phép thử lại ở request sau
      throw e;
    });
  }
  return clientPromise;
}

type Row = Record<string, unknown>;

/** Chạy SELECT, trả về mảng object thuần (truyền được sang Client Component). */
export async function all<T = Row>(sql: string, args: InArgs = []): Promise<T[]> {
  const rs = await (await getClient()).execute({ sql, args });
  return rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])) as T);
}

export async function one<T = Row>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}

export async function run(sql: string, args: InArgs = []) {
  return (await getClient()).execute({ sql, args });
}

/** Chạy nhiều câu lệnh trong 1 transaction. */
export async function batch(statements: InStatement[]) {
  return (await getClient()).batch(statements, "write");
}
