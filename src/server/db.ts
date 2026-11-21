import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  UserProfile,
  InvestmentPlan,
  UserInvestment,
  TransactionRecord,
  BankAccount,
  TopUpCode,
  NotificationItem,
  AuditLogItem,
  AdminSettings,
} from '../types';
import { INITIAL_INVESTMENT_PLANS } from '../data/plans';

export const ADMIN_EMAIL = 'emmanuelchidalu67@gmail.com';

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  withdrawalFeePercent: 15,
  allowWeekendWithdrawals: false,
  welcomeBonusKobo: 800 * 100, // ₦800 = 80,000 kobo (~$0.52 USD)
  tier1CommissionPercent: 10,
  tier2CommissionPercent: 2,
  tier3CommissionPercent: 1,
  whatsappGroupUrl: 'https://chat.whatsapp.com/AppleCardVIPInvestors',
  telegramChannelUrl: 'https://t.me/AppleCardInvestmentOfficial',
  baseReferralUrl: 'https://applecardinvestment.ng/ref/',
  usdtBep20Address: '0x71C8F8b2B7A8c2b535B48B96602e1c942FdB7a61',
  usdtExchangeRateNaira: 1550,
  depositBankName: 'Moniepoint Microfinance Bank',
  depositAccountNumber: '8129940182',
  depositAccountName: 'APPLE CARD INVESTMENT TECH NIGERIA',
  wheelMinFriendInvestKobo: 200000 * 100,
  wheelMinUserInvestKobo: 500000 * 100,
};

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'applecard.db');
const SECRET_PATH = path.join(DATA_DIR, '.session_secret');

function loadOrCreateSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.trim().length >= 16) {
    return process.env.SESSION_SECRET.trim();
  }
  if (fs.existsSync(SECRET_PATH)) {
    const existing = fs.readFileSync(SECRET_PATH, 'utf8').trim();
    if (existing.length >= 32) return existing;
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(SECRET_PATH, generated, { mode: 0o600 });
  return generated;
}

export const SESSION_SECRET = loadOrCreateSessionSecret();

export const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize normalized schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    fullName TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    countryCode TEXT NOT NULL,
    accountNumberId TEXT UNIQUE NOT NULL,
    referralCode TEXT UNIQUE NOT NULL,
    referredBy TEXT,
    avatarInitials TEXT NOT NULL,
    isVerified INTEGER NOT NULL DEFAULT 1,
    welcomeBonusClaimed INTEGER NOT NULL DEFAULT 1,
    registrationDate TEXT NOT NULL,
    withdrawalPinSet INTEGER NOT NULL DEFAULT 1,
    passwordHash TEXT NOT NULL,
    withdrawalPinHash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    balanceKobo INTEGER NOT NULL DEFAULT 0,
    investedBalanceKobo INTEGER NOT NULL DEFAULT 0,
    totalEarnedKobo INTEGER NOT NULL DEFAULT 0,
    vipLevel INTEGER NOT NULL DEFAULT 0,
    spinBalance INTEGER NOT NULL DEFAULT 0,
    isWithdrawalBanned INTEGER NOT NULL DEFAULT 0,
    isSuspended INTEGER NOT NULL DEFAULT 0,
    whatsappPhone TEXT,
    lastLoginAt TEXT
  );

  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    vipTier INTEGER NOT NULL,
    name TEXT NOT NULL,
    badge TEXT NOT NULL,
    capitalKobo INTEGER NOT NULL,
    dailyReturnKobo INTEGER NOT NULL,
    durationDays INTEGER NOT NULL,
    totalPayoutKobo INTEGER NOT NULL,
    payoutSchedule TEXT NOT NULL,
    guaranteeBadge TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active',
    popular INTEGER NOT NULL DEFAULT 0,
    description TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    reference TEXT UNIQUE NOT NULL,
    userId TEXT NOT NULL,
    planId TEXT NOT NULL,
    planName TEXT NOT NULL,
    vipTier INTEGER NOT NULL,
    capitalKobo INTEGER NOT NULL,
    dailyReturnKobo INTEGER NOT NULL,
    durationDays INTEGER NOT NULL,
    daysElapsed INTEGER NOT NULL DEFAULT 0,
    totalPayoutKobo INTEGER NOT NULL,
    earnedKobo INTEGER NOT NULL DEFAULT 0,
    lastClaimDate TEXT NOT NULL,
    startDate TEXT NOT NULL,
    maturityDate TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Active'
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    reference TEXT NOT NULL,
    userId TEXT NOT NULL,
    userEmail TEXT,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    amountKobo INTEGER NOT NULL,
    feeKobo INTEGER,
    status TEXT NOT NULL,
    date TEXT NOT NULL,
    paymentMethod TEXT,
    senderName TEXT,
    bankDetailsJson TEXT,
    metadataJson TEXT
  );

  CREATE TABLE IF NOT EXISTS bank_accounts (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank',
    bankName TEXT NOT NULL,
    bankCode TEXT NOT NULL,
    accountNumber TEXT NOT NULL,
    accountName TEXT NOT NULL,
    bep20Address TEXT,
    network TEXT,
    isDefault INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS topup_codes (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    amountKobo INTEGER NOT NULL,
    totalLimit INTEGER NOT NULL,
    claimedCount INTEGER NOT NULL DEFAULT 0,
    claimedUserIdsJson TEXT NOT NULL DEFAULT '[]',
    expiryDate TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'system',
    isRead INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    settingsJson TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    adminId TEXT NOT NULL,
    adminEmail TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT NOT NULL,
    reason TEXT,
    timestamp TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_investments_user ON investments(userId);
  CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(userId);
  CREATE INDEX IF NOT EXISTS idx_banks_user ON bank_accounts(userId);
  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);
`);

export function hashSecret(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifySecret(plain: string, stored: string): boolean {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hexHash] = stored.split(':');
  if (!salt || !hexHash) return false;
  try {
    const derived = crypto.scryptSync(plain, salt, 64);
    const storedBuf = Buffer.from(hexHash, 'hex');
    if (derived.length !== storedBuf.length) return false;
    return crypto.timingSafeEqual(derived, storedBuf);
  } catch {
    return false;
  }
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

export function signToken(payload: SessionPayload): string {
  const encoded = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifyToken(token: string): SessionPayload | null {
  if (!token || !token.includes('.')) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  if (!encoded || !sig) return null;
  try {
    const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest();
    const receivedSig = Buffer.from(sig, 'base64url');
    if (expectedSig.length !== receivedSig.length) return null;
    if (!crypto.timingSafeEqual(expectedSig, receivedSig)) return null;
    const decoded = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    if (!decoded.userId || !decoded.email || decoded.exp < Date.now()) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function generateServerRef(
  prefix: 'DEP' | 'WTH' | 'INV' | 'REF' | 'BIL' | 'TOP' | 'AUTOPAY' | 'BEP'
): string {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const rand = crypto.randomInt(1000, 9999);
  return `${prefix}-${ts}-${rand}`;
}

export function sanitizeUser(row: any): UserProfile {
  const emailLower = String(row.email || '').toLowerCase();
  const safeRole = emailLower === ADMIN_EMAIL ? 'admin' : 'user';
  return {
    id: row.id,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone,
    countryCode: row.countryCode,
    accountNumberId: row.accountNumberId,
    referralCode: row.referralCode,
    referredBy: row.referredBy || undefined,
    avatarInitials: row.avatarInitials,
    isVerified: Boolean(row.isVerified),
    welcomeBonusClaimed: Boolean(row.welcomeBonusClaimed),
    registrationDate: row.registrationDate,
    withdrawalPinSet: Boolean(row.withdrawalPinSet),
    role: safeRole,
    balanceKobo: Number(row.balanceKobo) || 0,
    investedBalanceKobo: Number(row.investedBalanceKobo) || 0,
    totalEarnedKobo: Number(row.totalEarnedKobo) || 0,
    vipLevel: Number(row.vipLevel) || 0,
    spinBalance: Number(row.spinBalance) || 0,
    isWithdrawalBanned: Boolean(row.isWithdrawalBanned),
    isSuspended: Boolean(row.isSuspended),
    whatsappPhone: row.whatsappPhone || undefined,
    lastLoginAt: row.lastLoginAt || undefined,
  };
}

function mapPlanRow(row: any): InvestmentPlan {
  return {
    id: row.id,
    vipTier: Number(row.vipTier),
    name: row.name,
    badge: row.badge,
    capitalKobo: Number(row.capitalKobo),
    dailyReturnKobo: Number(row.dailyReturnKobo),
    durationDays: Number(row.durationDays),
    totalPayoutKobo: Number(row.totalPayoutKobo),
    payoutSchedule: row.payoutSchedule,
    guaranteeBadge: row.guaranteeBadge,
    status: row.status === 'paused' ? 'paused' : 'active',
    popular: Boolean(row.popular),
    description: row.description,
  };
}

function mapInvestmentRow(row: any): UserInvestment {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.userId,
    planId: row.planId,
    planName: row.planName,
    vipTier: Number(row.vipTier),
    capitalKobo: Number(row.capitalKobo),
    dailyReturnKobo: Number(row.dailyReturnKobo),
    durationDays: Number(row.durationDays),
    daysElapsed: Number(row.daysElapsed),
    totalPayoutKobo: Number(row.totalPayoutKobo),
    earnedKobo: Number(row.earnedKobo),
    lastClaimDate: row.lastClaimDate,
    startDate: row.startDate,
    maturityDate: row.maturityDate,
    status: row.status,
  };
}

function mapTransactionRow(row: any): TransactionRecord {
  let bankDetails: TransactionRecord['bankDetails'] | undefined;
  let metadata: Record<string, any> | undefined;
  try {
    if (row.bankDetailsJson) bankDetails = JSON.parse(row.bankDetailsJson);
  } catch {}
  try {
    if (row.metadataJson) metadata = JSON.parse(row.metadataJson);
  } catch {}
  return {
    id: row.id,
    reference: row.reference,
    userId: row.userId,
    userEmail: row.userEmail || undefined,
    type: row.type,
    title: row.title,
    description: row.description,
    amountKobo: Number(row.amountKobo),
    feeKobo: row.feeKobo !== null && row.feeKobo !== undefined ? Number(row.feeKobo) : undefined,
    status: row.status,
    date: row.date,
    paymentMethod: row.paymentMethod || undefined,
    senderName: row.senderName || undefined,
    bankDetails,
    metadata,
  };
}

function mapBankRow(row: any): BankAccount {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type === 'bep20' ? 'bep20' : 'bank',
    bankName: row.bankName,
    bankCode: row.bankCode,
    accountNumber: row.accountNumber,
    accountName: row.accountName,
    bep20Address: row.bep20Address || undefined,
    network: row.network || undefined,
    isDefault: Boolean(row.isDefault),
    createdAt: row.createdAt,
  };
}

function mapCodeRow(row: any): TopUpCode {
  let claimedUserIds: string[] = [];
  try {
    claimedUserIds = JSON.parse(row.claimedUserIdsJson || '[]');
  } catch {}
  return {
    id: row.id,
    code: row.code,
    amountKobo: Number(row.amountKobo),
    totalLimit: Number(row.totalLimit),
    claimedCount: Number(row.claimedCount),
    claimedUserIds,
    expiryDate: row.expiryDate,
    description: row.description,
    status: row.status,
  };
}

function mapNotificationRow(row: any): NotificationItem {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    message: row.message,
    type: row.type,
    isRead: Boolean(row.isRead),
    createdAt: row.createdAt,
  };
}

function mapAuditRow(row: any): AuditLogItem {
  return {
    id: row.id,
    adminId: row.adminId,
    adminEmail: row.adminEmail,
    action: row.action,
    target: row.target,
    details: row.details,
    reason: row.reason || undefined,
    timestamp: row.timestamp,
  };
}

// Seed initial defaults safely if empty
function bootstrapDatabase() {
  // 1. Admin Settings
  const settingsCount = db.prepare('SELECT COUNT(*) as cnt FROM admin_settings').get() as { cnt: number };
  if (settingsCount.cnt === 0) {
    db.prepare('INSERT INTO admin_settings (id, settingsJson) VALUES (1, ?)').run(
      JSON.stringify(DEFAULT_ADMIN_SETTINGS)
    );
  }

  // 2. Plans VIP 1 - 12
  const planCount = db.prepare('SELECT COUNT(*) as cnt FROM plans').get() as { cnt: number };
  if (planCount.cnt === 0) {
    const insertPlan = db.prepare(`
      INSERT INTO plans (id, vipTier, name, badge, capitalKobo, dailyReturnKobo, durationDays, totalPayoutKobo, payoutSchedule, guaranteeBadge, status, popular, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of INITIAL_INVESTMENT_PLANS) {
      insertPlan.run(
        p.id,
        p.vipTier,
        p.name,
        p.badge,
        p.capitalKobo,
        p.dailyReturnKobo,
        p.durationDays,
        p.totalPayoutKobo,
        p.payoutSchedule,
        p.guaranteeBadge,
        p.status,
        p.popular ? 1 : 0,
        p.description
      );
    }
  }

  // 3. Default Top-Up Codes
  const codeCount = db.prepare('SELECT COUNT(*) as cnt FROM topup_codes').get() as { cnt: number };
  if (codeCount.cnt === 0) {
    const insertCode = db.prepare(`
      INSERT INTO topup_codes (id, code, amountKobo, totalLimit, claimedCount, claimedUserIdsJson, expiryDate, description, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertCode.run(
      'top-1',
      'APPLE2026',
      2500 * 100,
      500,
      0,
      '[]',
      '2026-12-31',
      'Special Launch Promo Top-Up for verified diamond investors.',
      'active'
    );
    insertCode.run(
      'top-2',
      'VIPWELCOME',
      1500 * 100,
      1000,
      0,
      '[]',
      '2026-11-30',
      'Executive community welcoming voucher.',
      'active'
    );
  }

  // 4. Sole Locked Admin Account (emmanuelchidalu67@gmail.com)
  const adminExists = db
    .prepare('SELECT id FROM users WHERE lower(email) = ?')
    .get(ADMIN_EMAIL) as { id: string } | undefined;

  if (!adminExists) {
    const initialAdminPass = (process.env.ADMIN_PASSCODE || '241166').trim();
    db.prepare(`
      INSERT INTO users (
        id, fullName, email, phone, countryCode, accountNumberId, referralCode, referredBy,
        avatarInitials, isVerified, welcomeBonusClaimed, registrationDate, withdrawalPinSet,
        passwordHash, withdrawalPinHash, role, balanceKobo, investedBalanceKobo, totalEarnedKobo,
        vipLevel, spinBalance, isWithdrawalBanned, isSuspended, whatsappPhone, lastLoginAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'usr-admin-emmanuel',
      'Emmanuel Chidalu (Admin)',
      ADMIN_EMAIL,
      '08100241166',
      '+234',
      'ACI-000001',
      'EMMANUEL24',
      null,
      'EC',
      1,
      1,
      '2026-10-01T08:00:00.000Z',
      1,
      hashSecret(initialAdminPass),
      hashSecret('2411'),
      'admin',
      0,
      0,
      0,
      12,
      0,
      0,
      0,
      '08100241166',
      null
    );
  }

  // Enforce sole admin lock: ensure no other email has admin role
  db.prepare("UPDATE users SET role = 'user' WHERE lower(email) != ? AND role != 'user'").run(ADMIN_EMAIL);
}

bootstrapDatabase();

export function getAdminSettings(): AdminSettings {
  const row = db.prepare('SELECT settingsJson FROM admin_settings WHERE id = 1').get() as { settingsJson: string } | undefined;
  if (!row) return { ...DEFAULT_ADMIN_SETTINGS };
  try {
    return { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(row.settingsJson) };
  } catch {
    return { ...DEFAULT_ADMIN_SETTINGS };
  }
}

export function saveAdminSettings(updates: Partial<AdminSettings>): AdminSettings {
  const next = { ...getAdminSettings(), ...updates };
  db.prepare('UPDATE admin_settings SET settingsJson = ? WHERE id = 1').run(JSON.stringify(next));
  return next;
}

export function getAllPlans(): InvestmentPlan[] {
  const rows = db.prepare('SELECT * FROM plans ORDER BY vipTier ASC').all();
  return rows.map(mapPlanRow);
}

export function addNotificationRow(entry: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationItem['type'];
}): NotificationItem {
  const id = `notif-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
  const createdAt = new Date().toISOString();
  const type = entry.type || 'system';
  db.prepare(`
    INSERT INTO notifications (id, userId, title, message, type, isRead, createdAt)
    VALUES (?, ?, ?, ?, ?, 0, ?)
  `).run(id, entry.userId, entry.title, entry.message, type, createdAt);
  return {
    id,
    userId: entry.userId,
    title: entry.title,
    message: entry.message,
    type,
    isRead: false,
    createdAt,
  };
}

export function addAuditLog(entry: {
  adminId: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  reason?: string;
}): AuditLogItem {
  const id = `aud-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
  const timestamp = new Date().toISOString();
  db.prepare(`
    INSERT INTO audit_logs (id, adminId, adminEmail, action, target, details, reason, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, entry.adminId, entry.adminEmail, entry.action, entry.target, entry.details, entry.reason || null, timestamp);
  return {
    id,
    adminId: entry.adminId,
    adminEmail: entry.adminEmail,
    action: entry.action,
    target: entry.target,
    details: entry.details,
    reason: entry.reason,
    timestamp,
  };
}

// Automated 24-hour yield credit engine inside SQLite transaction
export function runAutoYieldSync(): { creditedUserIds: string[]; updatedCount: number } {
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const activeRows = db.prepare("SELECT * FROM investments WHERE status = 'Active'").all();
  const creditedUserIds = new Set<string>();
  let updatedCount = 0;

  if (activeRows.length === 0) {
    return { creditedUserIds: [], updatedCount: 0 };
  }

  const updateInvStmt = db.prepare(`
    UPDATE investments
    SET daysElapsed = ?, earnedKobo = ?, lastClaimDate = ?, status = ?
    WHERE id = ?
  `);
  const creditUserStmt = db.prepare(`
    UPDATE users
    SET balanceKobo = balanceKobo + ?,
        totalEarnedKobo = totalEarnedKobo + ?,
        investedBalanceKobo = MAX(0, investedBalanceKobo - ?)
    WHERE id = ?
  `);
  const insertTxStmt = db.prepare(`
    INSERT INTO transactions (id, reference, userId, userEmail, type, title, description, amountKobo, feeKobo, status, date, paymentMethod, senderName, bankDetailsJson, metadataJson)
    VALUES (?, ?, ?, ?, 'daily_earning', ?, ?, ?, NULL, 'Completed', ?, NULL, NULL, NULL, NULL)
  `);
  const getUserEmailStmt = db.prepare('SELECT email FROM users WHERE id = ?');

  db.exec('BEGIN IMMEDIATE');
  try {
    for (const row of activeRows) {
      const inv = mapInvestmentRow(row);
      const lastClaim = new Date(inv.lastClaimDate || inv.startDate).getTime();
      const elapsedMs = now - lastClaim;
      if (elapsedMs < ONE_DAY_MS) continue;

      const cyclesToCredit = Math.floor(elapsedMs / ONE_DAY_MS);
      const remainingDays = Math.max(0, inv.durationDays - inv.daysElapsed);
      const daysToApply = Math.min(cyclesToCredit, remainingDays);
      if (daysToApply <= 0) continue;

      const yieldToAdd = inv.dailyReturnKobo * daysToApply;
      const newDaysElapsed = inv.daysElapsed + daysToApply;
      const isCompleted = newDaysElapsed >= inv.durationDays;
      const newLastClaimDate = new Date(lastClaim + daysToApply * ONE_DAY_MS).toISOString();
      const capitalReleased = isCompleted ? inv.capitalKobo : 0;

      updateInvStmt.run(
        newDaysElapsed,
        inv.earnedKobo + yieldToAdd,
        newLastClaimDate,
        isCompleted ? 'Completed' : 'Active',
        inv.id
      );

      creditUserStmt.run(yieldToAdd, yieldToAdd, capitalReleased, inv.userId);

      const uRow = getUserEmailStmt.get(inv.userId) as { email?: string } | undefined;
      const txId = `tx-auto-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const rate = getAdminSettings().usdtExchangeRateNaira || 1550;
      const usdVal = ((yieldToAdd / 100) / rate).toFixed(2);

      insertTxStmt.run(
        txId,
        generateServerRef('AUTOPAY'),
        inv.userId,
        uRow?.email || null,
        `${inv.planName} 24h Automated Yield`,
        `Automated 24-hour cycle return (${daysToApply} day cycle) credited to balance.`,
        yieldToAdd,
        new Date().toISOString()
      );

      addNotificationRow({
        userId: inv.userId,
        title: '24-Hour Investment Yield Auto-Credited',
        message: `$${usdVal} (≈ ₦${(yieldToAdd / 100).toLocaleString()}) in automated daily returns from ${inv.planName} has been credited to your available balance.`,
        type: 'reward',
      });

      creditedUserIds.add(inv.userId);
      updatedCount += 1;
    }
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  return { creditedUserIds: Array.from(creditedUserIds), updatedCount };
}

export function getUserHydratedState(userId: string) {
  runAutoYieldSync();

  const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!userRow) return null;
  const user = sanitizeUser(userRow);
  const adminSettings = getAdminSettings();
  const plans = getAllPlans();

  const userInvestments = db
    .prepare('SELECT * FROM investments WHERE userId = ? ORDER BY startDate DESC')
    .all(userId)
    .map(mapInvestmentRow);

  const transactions = db
    .prepare('SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC')
    .all(userId)
    .map(mapTransactionRow);

  const bankAccounts = db
    .prepare('SELECT * FROM bank_accounts WHERE userId = ? ORDER BY isDefault DESC, createdAt DESC')
    .all(userId)
    .map(mapBankRow);

  const notifications = db
    .prepare("SELECT * FROM notifications WHERE userId = ? OR userId = 'all' ORDER BY createdAt DESC LIMIT 100")
    .all(userId)
    .map(mapNotificationRow);

  const topUpCodes = db
    .prepare("SELECT * FROM topup_codes WHERE status = 'active'")
    .all()
    .map(mapCodeRow);

  // Pending withdrawal sum strictly for this user
  const pendingRow = db
    .prepare("SELECT COALESCE(SUM(amountKobo), 0) as total FROM transactions WHERE userId = ? AND type = 'withdrawal' AND status = 'Pending'")
    .get(userId) as { total: number };

  // Compute real 3-tier referral network & earnings
  const tier1UsersRaw = db
    .prepare('SELECT * FROM users WHERE referredBy = ? ORDER BY registrationDate DESC')
    .all(user.referralCode);
  const tier1Users = tier1UsersRaw.map(sanitizeUser);
  const tier1Codes = tier1Users.map((u) => u.referralCode);

  let tier2Users: UserProfile[] = [];
  if (tier1Codes.length > 0) {
    const placeholders = tier1Codes.map(() => '?').join(',');
    tier2Users = db
      .prepare(`SELECT * FROM users WHERE referredBy IN (${placeholders})`)
      .all(...tier1Codes)
      .map(sanitizeUser);
  }
  const tier2Codes = tier2Users.map((u) => u.referralCode);

  let tier3Users: UserProfile[] = [];
  if (tier2Codes.length > 0) {
    const placeholders = tier2Codes.map(() => '?').join(',');
    tier3Users = db
      .prepare(`SELECT * FROM users WHERE referredBy IN (${placeholders})`)
      .all(...tier2Codes)
      .map(sanitizeUser);
  }

  const downlineMembers = [...tier1Users, ...tier2Users, ...tier3Users];
  const downlineIds = downlineMembers.map((m) => m.id);
  let downlineMaxInvestKobo = 0;
  if (tier1Users.length > 0) {
    const t1Ids = tier1Users.map((u) => u.id);
    const placeholders = t1Ids.map(() => '?').join(',');
    const maxRow = db
      .prepare(`SELECT COALESCE(MAX(amountKobo), 0) as maxAmt FROM transactions WHERE userId IN (${placeholders}) AND type = 'investment' AND status = 'Completed'`)
      .get(...t1Ids) as { maxAmt: number };
    downlineMaxInvestKobo = Number(maxRow?.maxAmt || 0);
  }

  // Referral bonus breakdown
  const refTxs = transactions.filter((t) => t.type === 'referral_bonus' && t.status === 'Completed');
  let t1Earn = 0;
  let t2Earn = 0;
  let t3Earn = 0;
  for (const r of refTxs) {
    const tier = r.metadata?.tier || 1;
    if (tier === 2) t2Earn += r.amountKobo;
    else if (tier === 3) t3Earn += r.amountKobo;
    else t1Earn += r.amountKobo;
  }

  const referralStats = {
    tier1: {
      tier: 1 as const,
      percentage: adminSettings.tier1CommissionPercent,
      membersCount: tier1Users.length,
      earningsKobo: t1Earn,
    },
    tier2: {
      tier: 2 as const,
      percentage: adminSettings.tier2CommissionPercent,
      membersCount: tier2Users.length,
      earningsKobo: t2Earn,
    },
    tier3: {
      tier: 3 as const,
      percentage: adminSettings.tier3CommissionPercent,
      membersCount: tier3Users.length,
      earningsKobo: t3Earn,
    },
    totalMembers: downlineMembers.length,
    pendingRewardsKobo: 0,
    verifiedRewardsKobo: t1Earn + t2Earn + t3Earn,
  };

  // Safe subset of users for Team / Wheel checks (never leaks private hashes or unrelated emails unless admin)
  const sanitizedDownlines = tier1Users.map((d) => ({
    ...d,
    email: '', // mask email in non-admin team view
  }));

  // Public ticker completed withdrawals (masked)
  const publicFeedWithdrawals = db
    .prepare("SELECT id, reference, userId, type, title, amountKobo, status, date FROM transactions WHERE type = 'withdrawal' AND status = 'Completed' ORDER BY date DESC LIMIT 10")
    .all()
    .map(mapTransactionRow);

  return {
    user,
    availableBalanceKobo: user.balanceKobo || 0,
    investedCapitalKobo: user.investedBalanceKobo || 0,
    verifiedEarningsKobo: user.totalEarnedKobo || 0,
    pendingWithdrawalKobo: Number(pendingRow?.total || 0),
    plans,
    userInvestments,
    transactions,
    bankAccounts,
    topUpCodes,
    notifications,
    adminSettings,
    referralStats,
    downlines: sanitizedDownlines,
    downlineMaxInvestKobo,
    publicFeedWithdrawals,
    downlineIds,
  };
}

export function getAdminDashboardData() {
  runAutoYieldSync();

  const allUsers = db
    .prepare('SELECT * FROM users ORDER BY registrationDate DESC')
    .all()
    .map(sanitizeUser);
  const plans = getAllPlans();
  const userInvestments = db
    .prepare('SELECT * FROM investments ORDER BY startDate DESC')
    .all()
    .map(mapInvestmentRow);
  const transactions = db
    .prepare('SELECT * FROM transactions ORDER BY date DESC')
    .all()
    .map(mapTransactionRow);
  const bankAccounts = db
    .prepare('SELECT * FROM bank_accounts ORDER BY createdAt DESC')
    .all()
    .map(mapBankRow);
  const topUpCodes = db
    .prepare('SELECT * FROM topup_codes ORDER BY id DESC')
    .all()
    .map(mapCodeRow);
  const auditLogs = db
    .prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200')
    .all()
    .map(mapAuditRow);
  const notifications = db
    .prepare('SELECT * FROM notifications ORDER BY createdAt DESC LIMIT 200')
    .all()
    .map(mapNotificationRow);
  const adminSettings = getAdminSettings();

  const totalActiveCapitalPoolKobo = allUsers.reduce((sum, u) => sum + (u.investedBalanceKobo || 0), 0);
  const totalUserBalancesKobo = allUsers.reduce((sum, u) => sum + (u.balanceKobo || 0), 0);
  const totalUserEarnedKobo = allUsers.reduce((sum, u) => sum + (u.totalEarnedKobo || 0), 0);

  return {
    allUsers,
    plans,
    userInvestments,
    transactions,
    bankAccounts,
    topUpCodes,
    auditLogs,
    notifications,
    adminSettings,
    stats: {
      totalActiveCapitalPoolKobo,
      totalUserBalancesKobo,
      totalUserEarnedKobo,
    },
  };
}
