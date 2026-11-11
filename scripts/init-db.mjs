// Nạp một file .sql vào database (Turso hoặc file local).
//   npm run db:init                 → tạo bảng trống (db/schema.sql)
//   npm run db:init -- ../turso.sql → nạp dữ liệu đã chuyển từ SQL Server (XÓA và tạo lại bảng)
import { readFileSync } from "node:fs";
import { getClient } from "./env.mjs";

const file = process.argv[2] || "db/schema.sql";
const sql = readFileSync(file, "utf8")
  .split(/\r?\n/)
  .filter((l) => !/^\s*(BEGIN|COMMIT)\s*;\s*$/i.test(l))
  .join("\n");

const db = getClient();
console.log(`→ Đang nạp ${file} ...`);
await db.executeMultiple(sql);
const r = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
for (const row of r.rows) {
  const c = await db.execute(`SELECT COUNT(*) AS n FROM "${row.name}"`);
  console.log(`   ${String(row.name).padEnd(22)} ${c.rows[0].n} dòng`);
}
console.log("✓ Xong");
