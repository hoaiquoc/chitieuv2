// Đặt lại mật khẩu cho 1 người dùng:
//   npm run db:reset-password -- email@domain.com MatKhauMoi
import { pbkdf2Sync, randomBytes } from "node:crypto";
import { getClient } from "./env.mjs";

const [email, password] = process.argv.slice(2);
if (!email || !password) {
  console.error("Cách dùng: npm run db:reset-password -- <email> <mật khẩu mới>");
  process.exit(1);
}
const salt = randomBytes(16);
const iterations = 120000;
const hash = pbkdf2Sync(password, salt, iterations, 32, "sha256");
const db = getClient();
const r = await db.execute({
  sql: "UPDATE Users SET passwordHash = ?, passwordSalt = ?, passwordIterations = ? WHERE lower(email) = lower(?)",
  args: [hash.toString("base64"), salt.toString("base64"), iterations, email],
});
console.log(r.rowsAffected ? `✓ Đã đặt lại mật khẩu cho ${email}` : `✗ Không tìm thấy ${email}`);
