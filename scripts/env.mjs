// Đọc .env.local / .env (không cần thư viện dotenv)
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@libsql/client";

for (const f of [".env.local", ".env"]) {
  if (!existsSync(f)) continue;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

export function getClient() {
  const url = process.env.TURSO_DATABASE_URL || "file:local.db";
  console.log(`→ Database: ${url}`);
  return createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN || undefined });
}
