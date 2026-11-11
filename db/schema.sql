-- Schema trống cho database mới (không có dữ liệu người dùng)
PRAGMA foreign_keys = OFF;

-- DROP TABLE IF EXISTS Accounts;
CREATE TABLE IF NOT EXISTS Accounts (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  initialBalance INTEGER NOT NULL,
  color TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')),
  tenantId TEXT NOT NULL DEFAULT 'tenant_default',
  assetCode TEXT NULL,
  assetQuantity REAL NULL,
  assetUnit TEXT NULL,
  balance INTEGER NOT NULL DEFAULT 0
);

-- DROP TABLE IF EXISTS Budgets;
CREATE TABLE IF NOT EXISTS Budgets (
  id TEXT NOT NULL PRIMARY KEY,
  tenantId TEXT NOT NULL,
  month TEXT NOT NULL,
  scopeType TEXT NOT NULL,
  scopeId TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')),
  updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now'))
);

-- DROP TABLE IF EXISTS Categories;
CREATE TABLE IF NOT EXISTS Categories (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')),
  tenantId TEXT NOT NULL DEFAULT 'tenant_default'
);

-- DROP TABLE IF EXISTS PasswordResetTokens;
CREATE TABLE IF NOT EXISTS PasswordResetTokens (
  token TEXT NOT NULL PRIMARY KEY,
  userId TEXT NOT NULL,
  tenantId TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  usedAt TEXT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now'))
);

-- DROP TABLE IF EXISTS Sessions;
CREATE TABLE IF NOT EXISTS Sessions (
  token TEXT NOT NULL PRIMARY KEY,
  userId TEXT NOT NULL,
  tenantId TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')),
  expiresAt TEXT NOT NULL
);

-- DROP TABLE IF EXISTS SpendingAlerts;
CREATE TABLE IF NOT EXISTS SpendingAlerts (
  id TEXT NOT NULL PRIMARY KEY,
  tenantId TEXT NOT NULL,
  period TEXT NOT NULL,
  thresholdAmount INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')),
  updatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')),
  categoryId TEXT NULL
);

-- DROP TABLE IF EXISTS Tenants;
CREATE TABLE IF NOT EXISTS Tenants (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  ownerEmail TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now'))
);

-- DROP TABLE IF EXISTS Transactions;
CREATE TABLE IF NOT EXISTS Transactions (
  id TEXT NOT NULL PRIMARY KEY,
  title TEXT NOT NULL,
  accountId TEXT NOT NULL,
  categoryId TEXT NOT NULL,
  amount INTEGER NOT NULL,
  type TEXT NOT NULL,
  occurredAt TEXT NOT NULL,
  note TEXT NULL,
  createdBy TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  tenantId TEXT NOT NULL DEFAULT 'tenant_default',
  adjustmentOfId TEXT NULL,
  adjustedById TEXT NULL,
  assetQuantity REAL NULL,
  assetUnit TEXT NULL
);

-- DROP TABLE IF EXISTS Users;
CREATE TABLE IF NOT EXISTS Users (
  id TEXT NOT NULL PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  fullName TEXT NOT NULL,
  role TEXT NOT NULL,
  avatar TEXT NOT NULL,
  spaces INTEGER NOT NULL,
  passwordHash TEXT NOT NULL,
  passwordSalt TEXT NOT NULL,
  passwordIterations INTEGER NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%d %H:%M:%f','now')),
  tenantId TEXT NOT NULL DEFAULT 'tenant_default',
  isActive INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS IX_Accounts_TenantId ON Accounts (tenantId);
CREATE UNIQUE INDEX IF NOT EXISTS UX_Budgets_Tenant_Month_Scope ON Budgets (tenantId, month, scopeType, scopeId);
CREATE INDEX IF NOT EXISTS IX_Budgets_Tenant_Month ON Budgets (tenantId, month);
CREATE INDEX IF NOT EXISTS IX_Categories_TenantId ON Categories (tenantId);
CREATE INDEX IF NOT EXISTS IX_Categories_Tenant_Type_Name ON Categories (tenantId, type, name);
CREATE INDEX IF NOT EXISTS IX_PasswordResetTokens_UserId ON PasswordResetTokens (userId);
CREATE INDEX IF NOT EXISTS IX_Sessions_UserId ON Sessions (userId);
CREATE INDEX IF NOT EXISTS IX_Sessions_TenantId ON Sessions (tenantId);
CREATE UNIQUE INDEX IF NOT EXISTS UX_SpendingAlerts_Tenant_Period_Category ON SpendingAlerts (tenantId, period, categoryId) WHERE categoryId IS NOT NULL;
CREATE INDEX IF NOT EXISTS IX_SpendingAlerts_Tenant_Category ON SpendingAlerts (tenantId, categoryId);
CREATE INDEX IF NOT EXISTS IX_Transactions_OccurredAt ON Transactions (occurredAt DESC);
CREATE INDEX IF NOT EXISTS IX_Transactions_Tenant_OccurredAt ON Transactions (tenantId, occurredAt DESC);

-- Dữ liệu hệ thống (bắt buộc): danh mục chuyển tiền và cân đối số dư
INSERT OR IGNORE INTO Tenants (id, name, ownerEmail) VALUES ('tenant_default', 'Mặc định', 'system@local');
INSERT OR IGNORE INTO Categories (id, name, type, icon, color, tenantId) VALUES
  ('transfer', 'Chuyển tiền', 'Expense', 'transfer', 'bg-slate-100 text-slate-700', 'tenant_default'),
  ('balance_income', 'Cân đối (Thu)', 'Income', 'CD', 'bg-amber-100 text-amber-800', 'tenant_default'),
  ('balance_expense', 'Cân đối (Chi)', 'Expense', 'CD', 'bg-amber-100 text-amber-800', 'tenant_default');
