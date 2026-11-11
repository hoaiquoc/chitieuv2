import "server-only";
import { createClient, type Client, type InArgs, type InStatement } from "@libsql/client";

let client: Client | undefined;

function getClient(): Client {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL;
    if (!url) throw new Error("Thiếu biến môi trường TURSO_DATABASE_URL");
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
  }
  return client;
}

type Row = Record<string, unknown>;

/** Chạy SELECT, trả về mảng object thuần (truyền được sang Client Component). */
export async function all<T = Row>(sql: string, args: InArgs = []): Promise<T[]> {
  const rs = await getClient().execute({ sql, args });
  return rs.rows.map((r) => Object.fromEntries(rs.columns.map((c, i) => [c, r[i]])) as T);
}

export async function one<T = Row>(sql: string, args: InArgs = []): Promise<T | undefined> {
  return (await all<T>(sql, args))[0];
}

export async function run(sql: string, args: InArgs = []) {
  return getClient().execute({ sql, args });
}

/** Chạy nhiều câu lệnh trong 1 transaction. */
export async function batch(statements: InStatement[]) {
  return getClient().batch(statements, "write");
}
