# Sổ Chi Tiêu

Ứng dụng web quản lý thu chi gia đình, giao diện cho điện thoại. Có thể "Thêm vào màn hình chính" để dùng như app.
Stack: Next.js 15 + Turso (SQLite trên cloud) + Tailwind CSS. Deploy được lên Vercel.

## Tính năng
- Đăng nhập, đăng ký sổ mới. Nhiều thành viên dùng chung một sổ (Chủ sổ / Thành viên).
- Ghi khoản chi, khoản thu và chuyển khoản giữa các tài khoản.
- Tài khoản: tiền mặt, ngân hàng, ví điện tử, tiết kiệm vàng (tính theo chỉ/gram). Có chức năng cân đối số dư.
- Hạn mức chi tiêu theo ngày, tuần hoặc tháng, cho tổng chi hoặc từng danh mục.
- Báo cáo: biểu đồ theo danh mục, xu hướng 6 tháng, chi tiêu theo từng thành viên.

## Chạy trên máy

```bash
npm install
cp .env.example .env.local        # đặt TURSO_DATABASE_URL=file:local.db để chạy không cần Turso
npm run db:init -- ../turso.sql   # nạp dữ liệu cũ; hoặc `npm run db:init` để tạo database trống
npm run dev                       # http://localhost:3000
```

## Đưa lên Turso + Vercel

1. **Tạo database Turso và nạp dữ liệu.** Turso CLI chạy trên macOS/Linux/WSL:
   ```bash
   turso db create quanlychitieu
   turso db shell quanlychitieu < ../turso.sql
   turso db show quanlychitieu --url       # → TURSO_DATABASE_URL
   turso db tokens create quanlychitieu    # → TURSO_AUTH_TOKEN
   ```
   Nếu không dùng CLI: tạo database trên trang app.turso.tech, ghi URL và token vào `.env.local`, rồi chạy
   `npm run db:init -- ../turso.sql`.

2. **Deploy lên Vercel.**
   - Đẩy thư mục `App` lên GitHub, vào vercel.com → *Add New Project* → chọn repo.
     Nếu repo chứa cả thư mục cha thì đặt *Root Directory* = `App`.
   - Thêm 2 biến môi trường `TURSO_DATABASE_URL` và `TURSO_AUTH_TOKEN` → *Deploy*.
   - Hoặc deploy bằng CLI: `npx vercel` rồi `npx vercel env add ...` và `npx vercel --prod`.

## Mật khẩu người dùng cũ
App kiểm tra mật khẩu PBKDF2 (120.000 vòng; thử SHA-256, SHA-512 và SHA-1). Nếu một tài khoản cũ không đăng nhập được:
```bash
npm run db:reset-password -- email@domain.com MatKhauMoi
```

## Ghi chú dữ liệu
- Giờ được lưu theo UTC và hiển thị theo giờ Việt Nam (UTC+7).
- Số dư = `initialBalance` + tổng thu − tổng chi. Cột `Accounts.balance` được cập nhật lại sau mỗi lần ghi.
- Danh mục hệ thống `transfer`, `balance_income` và `balance_expense` không được tính vào báo cáo thu chi.
