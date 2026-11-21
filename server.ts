import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import crypto from 'node:crypto';
import {
  ADMIN_EMAIL,
  db,
  hashSecret,
  verifySecret,
  signToken,
  verifyToken,
  sanitizeUser,
  getAdminSettings,
  saveAdminSettings,
  getAllPlans,
  generateServerRef,
  runAutoYieldSync,
  addAuditLog,
  addNotificationRow,
  getUserHydratedState,
  getAdminDashboardData,
} from './src/server/db';
import { UserProfile } from './src/types';

interface AuthRequest extends Request {
  authUser?: UserProfile;
}

interface SseClient {
  id: string;
  userId: string;
  isAdmin: boolean;
  res: Response;
}

const sseClients = new Set<SseClient>();

function broadcastSyncEvent(reason: string, targetUserId?: string) {
  const payload = JSON.stringify({ reason, targetUserId: targetUserId || null, ts: Date.now() });
  for (const client of sseClients) {
    if (client.isAdmin || !targetUserId || client.userId === targetUserId || targetUserId === 'all') {
      try {
        client.res.write(`event: sync\ndata: ${payload}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  }
  return out;
}

function setSessionCookie(req: Request, res: Response, token: string) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const maxAge = 60 * 60 * 24 * 30; // 30 days
  const parts = [
    `aci_session=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) {
    parts.push('Secure');
    parts.push('Partitioned');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(req: Request, res: Response) {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const parts = [
    'aci_session=',
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    isHttps ? 'SameSite=None' : 'SameSite=Lax',
  ];
  if (isHttps) {
    parts.push('Secure');
    parts.push('Partitioned');
  }
  res.setHeader('Set-Cookie', parts.join('; '));
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const t = authHeader.slice(7).trim();
    if (t) return t;
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.aci_session) return cookies.aci_session;
  return null;
}

function getAuthenticatedUserFromReq(req: Request): UserProfile | null {
  const token = extractToken(req);
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.userId);
  if (!row) return null;
  const user = sanitizeUser(row);
  if (user.isSuspended) return null;
  return user;
}

function requireCsrfHeader(req: Request, res: Response, next: NextFunction) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const hasCustomHeader = req.headers['x-requested-with'] === 'AppleCardApp';
  if (hasCustomHeader) return next();
  // Allow same-origin JSON API requests from curl/tests or browser fetch if content-type is json
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (!origin) return next(); // non-browser client like curl
  try {
    const originHost = new URL(origin).host;
    if (originHost === host) return next();
  } catch {}
  return res.status(403).json({ success: false, error: 'Invalid request origin.' });
}

function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const user = getAuthenticatedUserFromReq(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
  }
  req.authUser = user;
  return next();
}

function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  const user = getAuthenticatedUserFromReq(req);
  if (!user) {
    return res.status(401).json({ success: false, error: 'Authentication required.' });
  }
  if (user.role !== 'admin' || user.email.toLowerCase() !== ADMIN_EMAIL) {
    return res.status(403).json({ success: false, error: 'Administrator privileges required.' });
  }
  req.authUser = user;
  return next();
}

function normalizePhoneDigits(phone: string): string {
  return (phone || '').replace(/\D/g, '');
}

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);

  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));
  app.use('/api', requireCsrfHeader);

  // Background 24h yield auto-credit sweep every 30 seconds
  setInterval(() => {
    try {
      const res = runAutoYieldSync();
      if (res.updatedCount > 0) {
        for (const uid of res.creditedUserIds) {
          broadcastSyncEvent('auto_yield', uid);
        }
      }
    } catch (err) {
      console.error('Auto-yield sync error:', err);
    }
  }, 30000);

  // ==========================================
  // PUBLIC CONFIG / HEALTH
  // ==========================================
  app.get('/api/public/bootstrap', (req: Request, res: Response) => {
    const adminSettings = getAdminSettings();
    const plans = getAllPlans();
    const publicFeedWithdrawals = db
      .prepare("SELECT id, reference, userId, type, title, amountKobo, status, date FROM transactions WHERE type = 'withdrawal' AND status = 'Completed' ORDER BY date DESC LIMIT 10")
      .all()
      .map((r: any) => ({
        id: r.id,
        reference: r.reference,
        userId: r.userId,
        type: r.type,
        title: r.title,
        description: '',
        amountKobo: Number(r.amountKobo),
        status: r.status,
        date: r.date,
      }));
    res.json({ success: true, adminSettings, plans, publicFeedWithdrawals });
  });

  // ==========================================
  // REAL-TIME SSE STREAM
  // ==========================================
  app.get('/api/events', (req: Request, res: Response) => {
    const user = getAuthenticatedUserFromReq(req);
    if (!user) {
      return res.status(401).end();
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client: SseClient = {
      id: crypto.randomUUID(),
      userId: user.id,
      isAdmin: user.role === 'admin' && user.email.toLowerCase() === ADMIN_EMAIL,
      res,
    };
    sseClients.add(client);

    res.write(`event: connected\ndata: ${JSON.stringify({ userId: user.id, role: user.role })}\n\n`);

    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(client);
    });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================
  app.post('/api/auth/signup', (req: Request, res: Response) => {
    const {
      fullName,
      email,
      phone,
      countryCode,
      withdrawalPin,
      password,
      referralCode,
    } = req.body || {};

    const cleanName = String(fullName || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').trim();
    const cleanCountryCode = String(countryCode || '+234').trim();
    const cleanPin = String(withdrawalPin || '').trim();
    const cleanPassword = String(password || '').trim();
    const cleanReferredBy = referralCode ? String(referralCode).trim().toUpperCase() : null;

    if (!cleanName || !cleanEmail || !cleanPhone || !cleanPin || !cleanPassword) {
      return res.status(400).json({ success: false, error: 'All registration fields are required.' });
    }
    if (!cleanEmail.includes('@')) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
    }
    if (cleanPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
    }
    if (!/^\d{4}$/.test(cleanPin)) {
      return res.status(400).json({ success: false, error: 'Withdrawal PIN must be exactly 4 numeric digits.' });
    }

    // Prevent registering over the locked admin email or duplicate accounts
    const existingByEmail = db.prepare('SELECT id FROM users WHERE lower(email) = ?').get(cleanEmail);
    if (existingByEmail) {
      return res.status(409).json({
        success: false,
        error: 'This email address is already registered. Please log in instead.',
      });
    }

    const digits = normalizePhoneDigits(cleanPhone);
    const allUsersPhone = db.prepare('SELECT id, phone FROM users').all() as { id: string; phone: string }[];
    const phoneTaken = allUsersPhone.some((u) => {
      const uDigits = normalizePhoneDigits(u.phone);
      return uDigits === digits || (digits.length >= 10 && uDigits.slice(-10) === digits.slice(-10));
    });
    if (phoneTaken) {
      return res.status(409).json({
        success: false,
        error: 'This phone number is already registered. Please log in instead.',
      });
    }

    const adminSettings = getAdminSettings();
    const bonusKobo = adminSettings.welcomeBonusKobo;
    const rate = adminSettings.usdtExchangeRateNaira || 1550;
    const bonusUsd = ((bonusKobo / 100) / rate).toFixed(2);

    const userId = `usr-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`;
    const accountNumberId = `ACI-${crypto.randomInt(100000, 999999)}`;
    const firstWord = (cleanName.split(/\s+/)[0] || 'USER').replace(/[^a-zA-Z]/g, '').toUpperCase().slice(0, 6) || 'USER';
    let generatedRefCode = `${firstWord}${crypto.randomInt(100, 999)}`;
    while (db.prepare('SELECT id FROM users WHERE referralCode = ?').get(generatedRefCode)) {
      generatedRefCode = `${firstWord}${crypto.randomInt(1000, 9999)}`;
    }

    const avatarInitials =
      cleanName
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'AI';

    const nowIso = new Date().toISOString();
    // STRICT ADMIN LOCK: Only ADMIN_EMAIL can ever be admin; new signups are always 'user'
    const role: 'user' | 'admin' = 'user';

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare(`
        INSERT INTO users (
          id, fullName, email, phone, countryCode, accountNumberId, referralCode, referredBy,
          avatarInitials, isVerified, welcomeBonusClaimed, registrationDate, withdrawalPinSet,
          passwordHash, withdrawalPinHash, role, balanceKobo, investedBalanceKobo, totalEarnedKobo,
          vipLevel, spinBalance, isWithdrawalBanned, isSuspended, whatsappPhone, lastLoginAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, 1, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, ?, ?)
      `).run(
        userId,
        cleanName,
        cleanEmail,
        cleanPhone,
        cleanCountryCode,
        accountNumberId,
        generatedRefCode,
        cleanReferredBy,
        avatarInitials,
        nowIso,
        hashSecret(cleanPassword),
        hashSecret(cleanPin),
        role,
        bonusKobo,
        cleanPhone,
        nowIso
      );

      db.prepare(`
        INSERT INTO transactions (
          id, reference, userId, userEmail, type, title, description, amountKobo, feeKobo, status, date
        ) VALUES (?, ?, ?, ?, 'welcome_bonus', ?, ?, ?, NULL, 'Completed', ?)
      `).run(
        `tx-welcome-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        generateServerRef('REF'),
        userId,
        cleanEmail,
        `$${bonusUsd} Welcome Bonus (Auto-Credited)`,
        `New account registration reward ($${bonusUsd} ≈ ₦${(bonusKobo / 100).toLocaleString()}) automatically deposited to your verified balance.`,
        bonusKobo,
        nowIso
      );

      addNotificationRow({
        userId,
        title: `Welcome Bonus Auto-Credited ($${bonusUsd})`,
        message: `Welcome to Apple Card Investment, ${cleanName}! Your $${bonusUsd} (≈ ₦${(bonusKobo / 100).toLocaleString()}) registration bonus has been credited to your balance.`,
        type: 'reward',
      });

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Signup DB error:', err);
      return res.status(500).json({ success: false, error: 'Failed to create account. Please try again.' });
    }

    const token = signToken({
      userId,
      email: cleanEmail,
      role,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });
    setSessionCookie(req, res, token);

    // Notify Admin Panel immediately via SSE!
    broadcastSyncEvent('user_registered', userId);

    const state = getUserHydratedState(userId);
    return res.status(201).json({
      success: true,
      sessionToken: token,
      state,
    });
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { identifier, password } = req.body || {};
    const cleanIdentifier = String(identifier || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    if (!cleanIdentifier || !cleanPass) {
      return res.status(400).json({ success: false, error: 'Please enter your email/phone and password.' });
    }

    let userRow: any = db.prepare('SELECT * FROM users WHERE lower(email) = ?').get(cleanIdentifier);

    if (!userRow) {
      const digits = normalizePhoneDigits(cleanIdentifier);
      if (digits.length >= 6) {
        const candidates = db.prepare('SELECT * FROM users').all() as any[];
        userRow = candidates.find((u) => {
          const uDigits = normalizePhoneDigits(u.phone);
          return uDigits === digits || (digits.length >= 10 && uDigits.slice(-10) === digits.slice(-10));
        });
      }
    }

    if (!userRow) {
      return res.status(401).json({ success: false, error: 'Invalid credentials. Account not found.' });
    }

    if (!verifySecret(cleanPass, userRow.passwordHash)) {
      return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
    }

    if (Boolean(userRow.isSuspended)) {
      return res.status(403).json({
        success: false,
        error: 'This account has been suspended by administration. Contact official WhatsApp support.',
      });
    }

    const nowIso = new Date().toISOString();
    db.prepare('UPDATE users SET lastLoginAt = ? WHERE id = ?').run(nowIso, userRow.id);

    const user = sanitizeUser({ ...userRow, lastLoginAt: nowIso });
    addNotificationRow({
      userId: user.id,
      title: user.role === 'admin' ? 'Admin Login Authorized' : 'Login Successful',
      message:
        user.role === 'admin'
          ? 'Welcome back, Emmanuel Chidalu. Full administrative controls unlocked.'
          : `Welcome back, ${user.fullName}! Your portfolio is synchronized.`,
      type: 'security',
    });

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      iat: Date.now(),
      exp: Date.now() + 1000 * 60 * 60 * 24 * 30,
    });
    setSessionCookie(req, res, token);

    const state = getUserHydratedState(user.id);
    const adminData = user.role === 'admin' && user.email.toLowerCase() === ADMIN_EMAIL ? getAdminDashboardData() : null;

    broadcastSyncEvent('user_login', user.id);

    return res.json({
      success: true,
      sessionToken: token,
      state,
      adminData,
    });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    clearSessionCookie(req, res);
    return res.json({ success: true });
  });

  // ==========================================
  // HYDRATED USER STATE & PROFILE
  // ==========================================
  app.get('/api/state', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const state = getUserHydratedState(authUser.id);
    if (!state) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }
    const adminData =
      authUser.role === 'admin' && authUser.email.toLowerCase() === ADMIN_EMAIL
        ? getAdminDashboardData()
        : null;
    return res.json({ success: true, state, adminData });
  });

  app.patch('/api/profile', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const { fullName, phone, whatsappPhone } = req.body || {};

    const cleanName = fullName !== undefined ? String(fullName).trim() : authUser.fullName;
    const cleanPhone = phone !== undefined ? String(phone).trim() : authUser.phone;
    const cleanWa = whatsappPhone !== undefined ? String(whatsappPhone).trim() : authUser.whatsappPhone || cleanPhone;

    if (!cleanName) {
      return res.status(400).json({ success: false, error: 'Full name cannot be empty.' });
    }

    const avatarInitials =
      cleanName
        .split(/\s+/)
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || authUser.avatarInitials;

    db.prepare('UPDATE users SET fullName = ?, phone = ?, whatsappPhone = ?, avatarInitials = ? WHERE id = ?').run(
      cleanName,
      cleanPhone,
      cleanWa,
      avatarInitials,
      authUser.id
    );

    broadcastSyncEvent('profile_updated', authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, state });
  });

  app.post('/api/profile/pin', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const newPin = String(req.body?.newPin || '').trim();
    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ success: false, error: 'New PIN must be exactly 4 numeric digits.' });
    }
    db.prepare('UPDATE users SET withdrawalPinHash = ?, withdrawalPinSet = 1 WHERE id = ?').run(
      hashSecret(newPin),
      authUser.id
    );
    addNotificationRow({
      userId: authUser.id,
      title: 'Security PIN Updated',
      message: 'Your 4-digit withdrawal PIN was changed successfully.',
      type: 'security',
    });
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, state });
  });

  app.post('/api/profile/password', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const currentPassword = String(req.body?.currentPassword || '').trim();
    const newPassword = String(req.body?.newPassword || '').trim();
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'New password must be at least 6 characters.' });
    }
    const row = db.prepare('SELECT passwordHash FROM users WHERE id = ?').get(authUser.id) as { passwordHash: string } | undefined;
    if (!row || !verifySecret(currentPassword, row.passwordHash)) {
      return res.status(400).json({ success: false, error: 'Current password is incorrect.' });
    }
    db.prepare('UPDATE users SET passwordHash = ? WHERE id = ?').run(hashSecret(newPassword), authUser.id);
    addNotificationRow({
      userId: authUser.id,
      title: 'Password Updated',
      message: 'Your account login password has been updated securely.',
      type: 'security',
    });
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, state });
  });

  // ==========================================
  // INVESTMENTS & 3-TIER REFERRAL COMMISSIONS
  // ==========================================
  app.post('/api/investments', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const planId = String(req.body?.planId || '').trim();

    const planRow = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId) as any;
    if (!planRow) {
      return res.status(404).json({ success: false, error: 'Investment plan not found.' });
    }
    if (planRow.status === 'paused') {
      return res.status(400).json({ success: false, error: 'This VIP plan is currently paused by administration.' });
    }

    const capitalKobo = Number(planRow.capitalKobo);
    const dailyReturnKobo = Number(planRow.dailyReturnKobo);
    const durationDays = Number(planRow.durationDays);
    const totalPayoutKobo = Number(planRow.totalPayoutKobo);
    const vipTier = Number(planRow.vipTier);

    const adminSettings = getAdminSettings();
    const rate = adminSettings.usdtExchangeRateNaira || 1550;
    const ref = generateServerRef('INV');
    const startDate = new Date();
    const maturityDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const nowIso = startDate.toISOString();

    let createdInvId = '';
    const creditedUplines: string[] = [];

    db.exec('BEGIN IMMEDIATE');
    try {
      const freshUser = db.prepare('SELECT * FROM users WHERE id = ?').get(authUser.id) as any;
      if (!freshUser) {
        db.exec('ROLLBACK');
        return res.status(404).json({ success: false, error: 'User account not found.' });
      }
      const currentBal = Number(freshUser.balanceKobo);
      if (currentBal < capitalKobo) {
        db.exec('ROLLBACK');
        const reqUsd = ((capitalKobo / 100) / rate).toFixed(2);
        return res.status(400).json({
          success: false,
          error: `Insufficient available balance. Required: $${reqUsd} (≈ ₦${(capitalKobo / 100).toLocaleString()}). Please deposit first.`,
        });
      }

      db.prepare(`
        UPDATE users
        SET balanceKobo = balanceKobo - ?,
            investedBalanceKobo = investedBalanceKobo + ?,
            vipLevel = MAX(vipLevel, ?)
        WHERE id = ?
      `).run(capitalKobo, capitalKobo, vipTier, authUser.id);

      createdInvId = `inv-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`;
      db.prepare(`
        INSERT INTO investments (
          id, reference, userId, planId, planName, vipTier, capitalKobo, dailyReturnKobo,
          durationDays, daysElapsed, totalPayoutKobo, earnedKobo, lastClaimDate, startDate, maturityDate, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, 0, ?, ?, ?, 'Active')
      `).run(
        createdInvId,
        ref,
        authUser.id,
        planRow.id,
        planRow.name,
        vipTier,
        capitalKobo,
        dailyReturnKobo,
        durationDays,
        totalPayoutKobo,
        nowIso,
        nowIso,
        maturityDate.toISOString()
      );

      const capUsd = ((capitalKobo / 100) / rate).toFixed(2);
      const dailyUsd = ((dailyReturnKobo / 100) / rate).toFixed(2);

      db.prepare(`
        INSERT INTO transactions (
          id, reference, userId, userEmail, type, title, description, amountKobo, feeKobo, status, date
        ) VALUES (?, ?, ?, ?, 'investment', ?, ?, ?, NULL, 'Completed', ?)
      `).run(
        `tx-inv-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        ref,
        authUser.id,
        freshUser.email,
        `${planRow.name} Activated`,
        `Invested capital of $${capUsd} (≈ ₦${(capitalKobo / 100).toLocaleString()}) for ${durationDays} days.`,
        capitalKobo,
        nowIso
      );

      addNotificationRow({
        userId: authUser.id,
        title: 'Investment Started',
        message: `You activated ${planRow.name} with $${capUsd} (≈ ₦${(capitalKobo / 100).toLocaleString()}). Daily yield: $${dailyUsd}.`,
        type: 'transaction',
      });

      // Multi-tier referral commissions: Tier 1 (10%), Tier 2 (2%), Tier 3 (1%)
      const tierRates = [
        { tier: 1 as const, pct: adminSettings.tier1CommissionPercent || 10 },
        { tier: 2 as const, pct: adminSettings.tier2CommissionPercent || 2 },
        { tier: 3 as const, pct: adminSettings.tier3CommissionPercent || 1 },
      ];

      let currentRefCode: string | null = freshUser.referredBy || null;
      for (const tierInfo of tierRates) {
        if (!currentRefCode) break;
        const upline = db.prepare('SELECT * FROM users WHERE referralCode = ?').get(currentRefCode) as any;
        if (!upline || upline.id === authUser.id) break;

        const commKobo = Math.round(capitalKobo * (tierInfo.pct / 100));
        if (commKobo > 0) {
          db.prepare('UPDATE users SET balanceKobo = balanceKobo + ?, totalEarnedKobo = totalEarnedKobo + ? WHERE id = ?').run(
            commKobo,
            commKobo,
            upline.id
          );
          const commUsd = ((commKobo / 100) / rate).toFixed(2);
          db.prepare(`
            INSERT INTO transactions (
              id, reference, userId, userEmail, type, title, description, amountKobo, feeKobo, status, date, metadataJson
            ) VALUES (?, ?, ?, ?, 'referral_bonus', ?, ?, ?, NULL, 'Completed', ?, ?)
          `).run(
            `tx-ref-${Date.now()}-${tierInfo.tier}-${crypto.randomBytes(2).toString('hex')}`,
            generateServerRef('REF'),
            upline.id,
            upline.email,
            `Tier ${tierInfo.tier} Referral Commission (${tierInfo.pct}%)`,
            `${tierInfo.pct}% commission from ${freshUser.fullName}'s ${planRow.name} activation.`,
            commKobo,
            nowIso,
            JSON.stringify({ tier: tierInfo.tier, fromUserId: authUser.id, planName: planRow.name })
          );

          addNotificationRow({
            userId: upline.id,
            title: `Tier ${tierInfo.tier} Referral Bonus Earned`,
            message: `You earned $${commUsd} (≈ ₦${(commKobo / 100).toLocaleString()}) (${tierInfo.pct}%) from your network's VIP investment.`,
            type: 'reward',
          });
          creditedUplines.push(upline.id);
        }
        currentRefCode = upline.referredBy || null;
      }

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Investment error:', err);
      return res.status(500).json({ success: false, error: 'Failed to activate investment.' });
    }

    broadcastSyncEvent('investment_created', authUser.id);
    for (const uid of creditedUplines) {
      broadcastSyncEvent('referral_bonus', uid);
    }

    const state = getUserHydratedState(authUser.id);
    return res.json({
      success: true,
      reference: ref,
      celebration: {
        planName: planRow.name,
        capitalKobo,
        dailyYieldKobo: dailyReturnKobo,
      },
      state,
    });
  });

  // ==========================================
  // DEPOSITS & WITHDRAWALS
  // ==========================================
  app.post('/api/deposits', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const amountKobo = Math.round(Number(req.body?.amountKobo) || 0);
    const senderName = String(req.body?.senderName || '').trim();
    const senderReference = req.body?.senderReference ? String(req.body.senderReference).trim() : undefined;
    const paymentMethod = String(req.body?.paymentMethod || 'Bank Transfer').trim();

    if (!Number.isFinite(amountKobo) || amountKobo < 1000 * 100 || amountKobo > 10000000 * 100) {
      return res.status(400).json({ success: false, error: 'Deposit must be between ₦1,000 and ₦10,000,000.' });
    }
    if (!senderName) {
      return res.status(400).json({ success: false, error: 'Sender name is required.' });
    }

    const adminSettings = getAdminSettings();
    const rate = adminSettings.usdtExchangeRateNaira || 1550;
    const usdVal = ((amountKobo / 100) / rate).toFixed(2);
    const ref = generateServerRef('DEP');
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO transactions (
        id, reference, userId, userEmail, type, title, description, amountKobo, feeKobo, status, date, paymentMethod, senderName, metadataJson
      ) VALUES (?, ?, ?, ?, 'deposit', ?, ?, ?, NULL, 'Pending', ?, ?, ?, ?)
    `).run(
      `tx-dep-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      ref,
      authUser.id,
      authUser.email,
      paymentMethod.includes('USDT') ? 'USDT (BEP-20) Deposit' : 'Bank Transfer Deposit',
      `Deposit via ${paymentMethod}. Sender: ${senderName}`,
      amountKobo,
      nowIso,
      paymentMethod,
      senderName,
      JSON.stringify({ senderReference })
    );

    addNotificationRow({
      userId: authUser.id,
      title: 'Deposit Pending Verification',
      message: `Deposit request for $${usdVal} (≈ ₦${(amountKobo / 100).toLocaleString()}, Ref: ${ref}) is pending bank reconciliation.`,
      type: 'transaction',
    });

    broadcastSyncEvent('deposit_submitted', authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, reference: ref, state });
  });

  app.post('/api/withdraw/validate', (req: Request, res: Response) => {
    const { amountKobo, overrideWeekend } = req.body || {};
    const adminSettings = getAdminSettings();
    const serverNow = new Date();
    const serverDay = serverNow.getDay();
    const isWeekend = serverDay === 0 || serverDay === 6;

    if (isWeekend && !adminSettings.allowWeekendWithdrawals && !overrideWeekend) {
      return res.status(403).json({
        success: false,
        isWeekend: true,
        serverDay: serverDay === 0 ? 'Sunday' : 'Saturday',
        serverTime: serverNow.toISOString(),
        error:
          'Withdrawals are strictly closed on Saturdays and Sundays in accordance with Nigerian banking settlement clearing cycles. Automated disbursements resume Monday at 08:00 AM WAT.',
      });
    }

    const feePercent = adminSettings.withdrawalFeePercent;
    const feeKobo = Math.round((Number(amountKobo) || 0) * (feePercent / 100));
    const netPayoutKobo = Math.max(0, (Number(amountKobo) || 0) - feeKobo);

    return res.json({
      success: true,
      allowed: true,
      serverTime: serverNow.toISOString(),
      feePercent,
      feeKobo,
      netPayoutKobo,
      message: 'Server withdrawal validation passed. Banking window open.',
    });
  });

  app.post('/api/withdrawals', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const amountKobo = Math.round(Number(req.body?.amountKobo) || 0);
    const bankAccountId = String(req.body?.bankAccountId || '').trim();
    const withdrawalPin = String(req.body?.withdrawalPin || '').trim();

    if (authUser.isWithdrawalBanned) {
      return res.status(403).json({
        success: false,
        error: 'Withdrawals for your account have been frozen by administration. Please contact customer support.',
      });
    }

    const adminSettings = getAdminSettings();
    const currentDay = new Date().getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;
    if (isWeekend && !adminSettings.allowWeekendWithdrawals) {
      return res.status(403).json({
        success: false,
        error: 'Withdrawals are closed on Saturdays and Sundays. Please request payout during standard banking days (Monday - Friday).',
      });
    }

    const minKobo = 1000 * 100;
    const maxKobo = 5000000 * 100;
    if (!Number.isFinite(amountKobo) || amountKobo < minKobo) {
      return res.status(400).json({ success: false, error: 'Minimum withdrawal amount is ₦1,000 ($0.65).' });
    }
    if (amountKobo > maxKobo) {
      return res.status(400).json({ success: false, error: 'Maximum single withdrawal is ₦5,000,000.' });
    }
    if (!/^\d{4}$/.test(withdrawalPin)) {
      return res.status(400).json({ success: false, error: 'Invalid 4-digit withdrawal PIN.' });
    }

    const bankRow = db
      .prepare('SELECT * FROM bank_accounts WHERE id = ? AND userId = ?')
      .get(bankAccountId, authUser.id) as any;
    if (!bankRow) {
      return res.status(400).json({ success: false, error: 'Please select a valid destination bank account.' });
    }

    const feePercent = adminSettings.withdrawalFeePercent;
    const feeKobo = Math.round(amountKobo * (feePercent / 100));
    const netPayoutKobo = amountKobo - feeKobo;
    const isBep20 = bankRow.type === 'bep20';
    const ref = generateServerRef(isBep20 ? 'BEP' : 'WTH');
    const rate = adminSettings.usdtExchangeRateNaira || 1550;
    const nowIso = new Date().toISOString();

    db.exec('BEGIN IMMEDIATE');
    try {
      const freshUser = db.prepare('SELECT balanceKobo, withdrawalPinHash FROM users WHERE id = ?').get(authUser.id) as any;
      if (!freshUser || !verifySecret(withdrawalPin, freshUser.withdrawalPinHash)) {
        db.exec('ROLLBACK');
        return res.status(401).json({ success: false, error: 'Incorrect 4-digit withdrawal PIN.' });
      }
      if (Number(freshUser.balanceKobo) < amountKobo) {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Insufficient available balance.' });
      }

      db.prepare('UPDATE users SET balanceKobo = balanceKobo - ? WHERE id = ?').run(amountKobo, authUser.id);

      const bankDetails = {
        bankName: bankRow.bankName,
        accountNumber: bankRow.accountNumber,
        accountName: bankRow.accountName,
      };
      const metadata = {
        netPayoutKobo,
        feePercent,
        isBep20,
        usdtEstimate: isBep20 ? ((netPayoutKobo / 100) / rate).toFixed(2) : undefined,
      };

      db.prepare(`
        INSERT INTO transactions (
          id, reference, userId, userEmail, type, title, description, amountKobo, feeKobo, status, date, bankDetailsJson, metadataJson
        ) VALUES (?, ?, ?, ?, 'withdrawal', ?, ?, ?, ?, 'Pending', ?, ?, ?)
      `).run(
        `tx-wth-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        ref,
        authUser.id,
        authUser.email,
        isBep20 ? 'USDT BEP-20 Withdrawal' : 'Bank Withdrawal Request',
        isBep20
          ? `USDT payout to ${bankRow.accountNumber.slice(0, 8)}...${bankRow.accountNumber.slice(-6)} (BEP-20)`
          : `Withdrawal to ${bankRow.bankName} (${bankRow.accountNumber})`,
        amountKobo,
        feeKobo,
        nowIso,
        JSON.stringify(bankDetails),
        JSON.stringify(metadata)
      );

      const usdGross = ((amountKobo / 100) / rate).toFixed(2);
      const usdNet = ((netPayoutKobo / 100) / rate).toFixed(2);
      addNotificationRow({
        userId: authUser.id,
        title: 'Withdrawal Submitted',
        message: isBep20
          ? `Withdrawal of $${usdGross} (~$${usdNet} USDT net) to your BEP-20 address is queued for settlement.`
          : `Withdrawal of $${usdGross} (Net: $${usdNet} after ${feePercent}% fee) to ${bankRow.bankName} is queued for approval.`,
        type: 'transaction',
      });

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Withdrawal error:', err);
      return res.status(500).json({ success: false, error: 'Failed to submit withdrawal.' });
    }

    broadcastSyncEvent('withdrawal_submitted', authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, reference: ref, state });
  });

  // ==========================================
  // BANK ACCOUNTS
  // ==========================================
  app.post('/api/banks', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const { bankName, bankCode, accountNumber, accountName, type, bep20Address, network } = req.body || {};
    const cleanNum = String(accountNumber || '').trim();
    const cleanName = String(accountName || '').trim();
    const isBep20 = type === 'bep20';

    if (!isBep20 && cleanNum.length !== 10) {
      return res.status(400).json({ success: false, error: 'Nigerian account number must be exactly 10 digits.' });
    }
    if (isBep20 && (!cleanNum.startsWith('0x') || cleanNum.length < 25)) {
      return res.status(400).json({ success: false, error: 'BEP-20 address must be a valid BSC wallet starting with 0x.' });
    }
    if (!cleanName) {
      return res.status(400).json({
        success: false,
        error: isBep20 ? 'Please enter a wallet label/name.' : 'Please enter your account holder name.',
      });
    }

    const existingCount = db
      .prepare('SELECT COUNT(*) as cnt FROM bank_accounts WHERE userId = ?')
      .get(authUser.id) as { cnt: number };

    db.prepare(`
      INSERT INTO bank_accounts (
        id, userId, type, bankName, bankCode, accountNumber, accountName, bep20Address, network, isDefault, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `bnk-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
      authUser.id,
      isBep20 ? 'bep20' : 'bank',
      String(bankName || ''),
      String(bankCode || ''),
      cleanNum,
      cleanName,
      isBep20 ? String(bep20Address || cleanNum) : null,
      isBep20 ? String(network || 'BNB Smart Chain (BEP-20)') : null,
      existingCount.cnt === 0 ? 1 : 0,
      new Date().toISOString()
    );

    addNotificationRow({
      userId: authUser.id,
      title: isBep20 ? 'BEP-20 Address Linked' : 'Bank Account Added',
      message: `${bankName} (${cleanNum.slice(0, 6)}...${cleanNum.slice(-4)}) successfully saved.`,
      type: 'security',
    });

    broadcastSyncEvent('banks_updated', authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, state });
  });

  app.delete('/api/banks/:id', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    db.prepare('DELETE FROM bank_accounts WHERE id = ? AND userId = ?').run(req.params.id, authUser.id);
    addNotificationRow({
      userId: authUser.id,
      title: 'Bank Account Removed',
      message: 'Bank account was removed from your profile.',
      type: 'security',
    });
    broadcastSyncEvent('banks_updated', authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, state });
  });

  app.patch('/api/banks/:id/default', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    db.prepare('UPDATE bank_accounts SET isDefault = CASE WHEN id = ? THEN 1 ELSE 0 END WHERE userId = ?').run(
      req.params.id,
      authUser.id
    );
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, state });
  });

  // ==========================================
  // TOP-UP CODE REDEMPTION
  // ==========================================
  app.post('/api/topup/redeem', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const cleanCode = String(req.body?.code || '').trim().toUpperCase();
    if (!cleanCode) {
      return res.status(400).json({ success: false, message: 'Please enter a valid code.' });
    }

    const adminSettings = getAdminSettings();
    const rate = adminSettings.usdtExchangeRateNaira || 1550;
    let rewardKobo = 0;

    db.exec('BEGIN IMMEDIATE');
    try {
      const codeRow = db.prepare('SELECT * FROM topup_codes WHERE upper(code) = ?').get(cleanCode) as any;
      if (!codeRow) {
        db.exec('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Invalid top-up code. Please check and try again.' });
      }
      if (codeRow.status !== 'active') {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, message: 'This top-up code has expired or is deactivated.' });
      }
      const claimedIds: string[] = JSON.parse(codeRow.claimedUserIdsJson || '[]');
      if (claimedIds.includes(authUser.id)) {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, message: 'You have already redeemed this code on your account.' });
      }
      if (Number(codeRow.claimedCount) >= Number(codeRow.totalLimit)) {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, message: 'This promo code has reached its maximum redemption limit.' });
      }

      rewardKobo = Number(codeRow.amountKobo);
      claimedIds.push(authUser.id);

      db.prepare('UPDATE topup_codes SET claimedCount = claimedCount + 1, claimedUserIdsJson = ? WHERE id = ?').run(
        JSON.stringify(claimedIds),
        codeRow.id
      );
      db.prepare('UPDATE users SET balanceKobo = balanceKobo + ? WHERE id = ?').run(rewardKobo, authUser.id);

      const usdVal = ((rewardKobo / 100) / rate).toFixed(2);
      db.prepare(`
        INSERT INTO transactions (
          id, reference, userId, userEmail, type, title, description, amountKobo, feeKobo, status, date
        ) VALUES (?, ?, ?, ?, 'topup_code', ?, ?, ?, NULL, 'Completed', ?)
      `).run(
        `tx-top-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        generateServerRef('TOP'),
        authUser.id,
        authUser.email,
        `Free Code: ${codeRow.code}`,
        codeRow.description,
        rewardKobo,
        new Date().toISOString()
      );

      addNotificationRow({
        userId: authUser.id,
        title: 'Top-Up Code Redeemed',
        message: `Bonus $${usdVal} (≈ ₦${(rewardKobo / 100).toLocaleString()}) credited to your balance from code ${codeRow.code}!`,
        type: 'reward',
      });

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Redeem error:', err);
      return res.status(500).json({ success: false, message: 'Failed to redeem code.' });
    }

    const usdVal = ((rewardKobo / 100) / rate).toFixed(2);
    broadcastSyncEvent('topup_redeemed', authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({
      success: true,
      message: `$${usdVal} (≈ ₦${(rewardKobo / 100).toLocaleString()}) added to your balance!`,
      amountKobo: rewardKobo,
      state,
    });
  });

  // ==========================================
  // UTILITIES (AIRTIME, DATA, ELECTRICITY)
  // ==========================================
  app.post('/api/utilities/buy', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const { kind, network, phoneNumber, bundleName, disco, meterNumber, meterType, amountKobo } = req.body || {};
    const amtKobo = Math.round(Number(amountKobo) || 0);

    if (!Number.isFinite(amtKobo) || amtKobo <= 0) {
      return res.status(400).json({ success: false, error: 'Invalid payment amount.' });
    }
    if (!['airtime', 'data', 'electricity'].includes(kind)) {
      return res.status(400).json({ success: false, error: 'Invalid utility service type.' });
    }

    const ref = generateServerRef('BIL');
    const nowIso = new Date().toISOString();
    const token =
      kind === 'electricity'
        ? `${crypto.randomInt(1000, 9999)}-${crypto.randomInt(1000, 9999)}-${crypto.randomInt(1000, 9999)}-${crypto.randomInt(1000, 9999)}`
        : undefined;

    db.exec('BEGIN IMMEDIATE');
    try {
      const freshUser = db.prepare('SELECT balanceKobo FROM users WHERE id = ?').get(authUser.id) as any;
      if (!freshUser || Number(freshUser.balanceKobo) < amtKobo) {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Insufficient balance for this utility payment.' });
      }

      db.prepare('UPDATE users SET balanceKobo = balanceKobo - ? WHERE id = ?').run(amtKobo, authUser.id);

      let title = '';
      let description = '';
      let metadata: Record<string, any> = {};

      if (kind === 'airtime') {
        title = `${network} Airtime Recharge`;
        description = `Airtime to ${phoneNumber}`;
        metadata = { network, phone: phoneNumber };
      } else if (kind === 'data') {
        title = `${network} Data (${bundleName})`;
        description = `Data subscription for ${phoneNumber}`;
        metadata = { network, bundle: bundleName, phone: phoneNumber };
      } else {
        title = `${disco} Electricity Bill`;
        description = `Meter #${meterNumber} (${String(meterType || 'prepaid').toUpperCase()})`;
        metadata = { disco, meterNumber, token };
      }

      db.prepare(`
        INSERT INTO transactions (
          id, reference, userId, userEmail, type, title, description, amountKobo, feeKobo, status, date, metadataJson
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 'Completed', ?, ?)
      `).run(
        `tx-bil-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`,
        ref,
        authUser.id,
        authUser.email,
        kind,
        title,
        description,
        amtKobo,
        nowIso,
        JSON.stringify(metadata)
      );

      addNotificationRow({
        userId: authUser.id,
        title: kind === 'electricity' ? 'Electricity Bill Paid' : kind === 'data' ? 'Data Activated' : 'Airtime Purchased',
        message:
          kind === 'electricity'
            ? `Token: ${token} generated for Meter ${meterNumber}.`
            : kind === 'data'
            ? `${network} ${bundleName} bundle activated for ${phoneNumber}.`
            : `${network} airtime sent to ${phoneNumber}.`,
        type: 'transaction',
      });

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Utility payment error:', err);
      return res.status(500).json({ success: false, error: 'Failed to process utility payment.' });
    }

    broadcastSyncEvent('utility_paid', authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, reference: ref, token, state });
  });

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  app.post('/api/notifications/read-all', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    db.prepare('UPDATE notifications SET isRead = 1 WHERE userId = ?').run(authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, state });
  });

  app.post('/api/notifications/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    db.prepare('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?').run(req.params.id, authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, state });
  });

  app.post('/api/wheel/spin', requireAuth, (req: AuthRequest, res: Response) => {
    const authUser = req.authUser!;
    const { wonPrizeTitle, wonPrizeMessage } = req.body || {};
    db.exec('BEGIN IMMEDIATE');
    try {
      const fresh = db.prepare('SELECT spinBalance FROM users WHERE id = ?').get(authUser.id) as { spinBalance: number } | undefined;
      if (fresh && Number(fresh.spinBalance) > 0) {
        db.prepare('UPDATE users SET spinBalance = MAX(0, spinBalance - 1) WHERE id = ?').run(authUser.id);
      }
      if (wonPrizeTitle && wonPrizeMessage) {
        addNotificationRow({
          userId: authUser.id,
          title: String(wonPrizeTitle),
          message: String(wonPrizeMessage),
          type: 'reward',
        });
      }
      db.exec('COMMIT');
    } catch {
      db.exec('ROLLBACK');
    }
    broadcastSyncEvent('wheel_spun', authUser.id);
    const state = getUserHydratedState(authUser.id);
    return res.json({ success: true, state });
  });

  // ==========================================
  // STRICTLY LOCKED ADMIN ROUTES
  // ==========================================
  app.get('/api/admin/dashboard', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminData = getAdminDashboardData();
    return res.json({ success: true, adminData });
  });

  app.post('/api/admin/deposits/:id/approve', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const txId = req.params.id;
    const adminSettings = getAdminSettings();
    const rate = adminSettings.usdtExchangeRateNaira || 1550;

    let targetUserId = '';
    db.exec('BEGIN IMMEDIATE');
    try {
      const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any;
      if (!tx || tx.type !== 'deposit' || tx.status !== 'Pending') {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Deposit transaction not found or already processed.' });
      }
      targetUserId = tx.userId;
      const amtKobo = Number(tx.amountKobo);
      const usdVal = ((amtKobo / 100) / rate).toFixed(2);

      db.prepare("UPDATE transactions SET status = 'Completed' WHERE id = ?").run(txId);
      db.prepare('UPDATE users SET balanceKobo = balanceKobo + ? WHERE id = ?').run(amtKobo, tx.userId);

      addAuditLog({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: 'APPROVE_DEPOSIT',
        target: tx.reference,
        details: `Approved deposit of $${usdVal} (≈ ₦${(amtKobo / 100).toLocaleString()}) for user ${tx.userEmail || tx.userId}`,
      });

      addNotificationRow({
        userId: tx.userId,
        title: 'Deposit Confirmed',
        message: `Your deposit of $${usdVal} (≈ ₦${(amtKobo / 100).toLocaleString()}, Ref: ${tx.reference}) has been verified and credited to your balance.`,
        type: 'transaction',
      });

      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      console.error('Approve deposit error:', err);
      return res.status(500).json({ success: false, error: 'Failed to approve deposit.' });
    }

    broadcastSyncEvent('deposit_approved', targetUserId);
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.post('/api/admin/deposits/:id/reject', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const txId = req.params.id;
    const reason = String(req.body?.reason || 'Payment verification failed').trim();

    let targetUserId = '';
    db.exec('BEGIN IMMEDIATE');
    try {
      const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any;
      if (!tx || tx.type !== 'deposit' || tx.status !== 'Pending') {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Deposit not found or already processed.' });
      }
      targetUserId = tx.userId;
      db.prepare("UPDATE transactions SET status = 'Rejected' WHERE id = ?").run(txId);
      addAuditLog({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: 'REJECT_DEPOSIT',
        target: tx.reference,
        details: `Rejected deposit of ₦${(Number(tx.amountKobo) / 100).toLocaleString()}`,
        reason,
      });
      addNotificationRow({
        userId: tx.userId,
        title: 'Deposit Declined',
        message: `Deposit (Ref: ${tx.reference}) was rejected. Reason: ${reason}`,
        type: 'system',
      });
      db.exec('COMMIT');
    } catch {
      db.exec('ROLLBACK');
      return res.status(500).json({ success: false, error: 'Failed to reject deposit.' });
    }

    broadcastSyncEvent('deposit_rejected', targetUserId);
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.post('/api/admin/withdrawals/:id/approve', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const txId = req.params.id;
    const rate = getAdminSettings().usdtExchangeRateNaira || 1550;

    let targetUserId = '';
    db.exec('BEGIN IMMEDIATE');
    try {
      const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any;
      if (!tx || tx.type !== 'withdrawal' || tx.status !== 'Pending') {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Withdrawal not found or already processed.' });
      }
      targetUserId = tx.userId;
      const amtKobo = Number(tx.amountKobo);
      const usdVal = ((amtKobo / 100) / rate).toFixed(2);

      db.prepare("UPDATE transactions SET status = 'Completed' WHERE id = ?").run(txId);
      addAuditLog({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: 'APPROVE_WITHDRAWAL',
        target: tx.reference,
        details: `Approved payout of $${usdVal} (≈ ₦${(amtKobo / 100).toLocaleString()})`,
      });
      addNotificationRow({
        userId: tx.userId,
        title: 'Withdrawal Paid',
        message: `Withdrawal of $${usdVal} (≈ ₦${(amtKobo / 100).toLocaleString()}) has been paid out successfully.`,
        type: 'transaction',
      });
      db.exec('COMMIT');
    } catch {
      db.exec('ROLLBACK');
      return res.status(500).json({ success: false, error: 'Failed to approve withdrawal.' });
    }

    broadcastSyncEvent('withdrawal_approved', targetUserId);
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.post('/api/admin/withdrawals/:id/reject', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const txId = req.params.id;
    const reason = String(req.body?.reason || 'Account verification mismatch').trim();
    const rate = getAdminSettings().usdtExchangeRateNaira || 1550;

    let targetUserId = '';
    db.exec('BEGIN IMMEDIATE');
    try {
      const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any;
      if (!tx || tx.type !== 'withdrawal' || tx.status !== 'Pending') {
        db.exec('ROLLBACK');
        return res.status(400).json({ success: false, error: 'Withdrawal not found or already processed.' });
      }
      targetUserId = tx.userId;
      const amtKobo = Number(tx.amountKobo);
      const usdVal = ((amtKobo / 100) / rate).toFixed(2);

      db.prepare("UPDATE transactions SET status = 'Rejected' WHERE id = ?").run(txId);
      db.prepare('UPDATE users SET balanceKobo = balanceKobo + ? WHERE id = ?').run(amtKobo, tx.userId);

      addAuditLog({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: 'REJECT_WITHDRAWAL',
        target: tx.reference,
        details: `Rejected withdrawal of $${usdVal} and refunded customer balance.`,
        reason,
      });
      addNotificationRow({
        userId: tx.userId,
        title: 'Withdrawal Refunded',
        message: `Withdrawal (Ref: ${tx.reference}) was declined and $${usdVal} (≈ ₦${(amtKobo / 100).toLocaleString()}) returned to your balance. Reason: ${reason}`,
        type: 'system',
      });
      db.exec('COMMIT');
    } catch {
      db.exec('ROLLBACK');
      return res.status(500).json({ success: false, error: 'Failed to reject withdrawal.' });
    }

    broadcastSyncEvent('withdrawal_rejected', targetUserId);
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.patch('/api/admin/users/:id', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const targetId = req.params.id;
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(targetId) as any;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }

    const body = req.body || {};
    const fullName = body.fullName !== undefined ? String(body.fullName).trim() : existing.fullName;
    const email = body.email !== undefined ? String(body.email).trim().toLowerCase() : existing.email;
    const phone = body.phone !== undefined ? String(body.phone).trim() : existing.phone;
    // STRICT ADMIN LOCK: Only ADMIN_EMAIL can ever hold 'admin' role
    const role = email === ADMIN_EMAIL ? 'admin' : 'user';

    const balanceKobo =
      body.balanceKobo !== undefined ? Math.max(0, Math.round(Number(body.balanceKobo))) : Number(existing.balanceKobo);
    const investedBalanceKobo =
      body.investedCapitalKobo !== undefined
        ? Math.max(0, Math.round(Number(body.investedCapitalKobo)))
        : body.investedBalanceKobo !== undefined
        ? Math.max(0, Math.round(Number(body.investedBalanceKobo)))
        : Number(existing.investedBalanceKobo);
    const totalEarnedKobo =
      body.totalEarnedKobo !== undefined
        ? Math.max(0, Math.round(Number(body.totalEarnedKobo)))
        : Number(existing.totalEarnedKobo);
    const vipLevel = body.vipLevel !== undefined ? Math.max(0, Math.min(12, Math.round(Number(body.vipLevel)))) : Number(existing.vipLevel);
    const spinBalance = body.spinBalance !== undefined ? Math.max(0, Math.round(Number(body.spinBalance))) : Number(existing.spinBalance);
    const isVerified = body.isVerified !== undefined ? (body.isVerified ? 1 : 0) : existing.isVerified;
    const isWithdrawalBanned =
      body.isWithdrawalBanned !== undefined ? (body.isWithdrawalBanned ? 1 : 0) : existing.isWithdrawalBanned;
    const isSuspended = body.isSuspended !== undefined ? (body.isSuspended ? 1 : 0) : existing.isSuspended;

    db.prepare(`
      UPDATE users
      SET fullName = ?, email = ?, phone = ?, role = ?, balanceKobo = ?, investedBalanceKobo = ?,
          totalEarnedKobo = ?, vipLevel = ?, spinBalance = ?, isVerified = ?,
          isWithdrawalBanned = ?, isSuspended = ?
      WHERE id = ?
    `).run(
      fullName,
      email,
      phone,
      role,
      balanceKobo,
      investedBalanceKobo,
      totalEarnedKobo,
      vipLevel,
      spinBalance,
      isVerified,
      isWithdrawalBanned,
      isSuspended,
      targetId
    );

    addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'UPDATE_USER_FINANCIALS',
      target: targetId,
      details: `Updated user ${email}: bal=${balanceKobo}, cap=${investedBalanceKobo}, earned=${totalEarnedKobo}, vip=${vipLevel}`,
    });

    broadcastSyncEvent('admin_user_updated', targetId);
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.delete('/api/admin/users/:id/investments', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const targetId = req.params.id;
    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('DELETE FROM investments WHERE userId = ?').run(targetId);
      db.prepare('UPDATE users SET investedBalanceKobo = 0 WHERE id = ?').run(targetId);
      addAuditLog({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: 'DELETE_USER_INVESTMENTS',
        target: targetId,
        details: `Admin deleted all active investments for user ${targetId}`,
      });
      db.exec('COMMIT');
    } catch {
      db.exec('ROLLBACK');
      return res.status(500).json({ success: false, error: 'Failed to delete user investments.' });
    }
    broadcastSyncEvent('user_investments_deleted', targetId);
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.delete('/api/admin/users/:id', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const targetId = req.params.id;
    const existing = db.prepare('SELECT email FROM users WHERE id = ?').get(targetId) as { email?: string } | undefined;
    if (!existing) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    if (String(existing.email || '').toLowerCase() === ADMIN_EMAIL) {
      return res.status(400).json({ success: false, error: 'Cannot delete the sole master administrator account.' });
    }

    db.exec('BEGIN IMMEDIATE');
    try {
      db.prepare('DELETE FROM investments WHERE userId = ?').run(targetId);
      db.prepare('DELETE FROM transactions WHERE userId = ?').run(targetId);
      db.prepare('DELETE FROM bank_accounts WHERE userId = ?').run(targetId);
      db.prepare('DELETE FROM notifications WHERE userId = ?').run(targetId);
      db.prepare('DELETE FROM users WHERE id = ?').run(targetId);

      addAuditLog({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: 'DELETE_USER_PERMANENTLY',
        target: targetId,
        details: `User ${existing.email} (${targetId}) deleted permanently from SQLite database.`,
      });
      db.exec('COMMIT');
    } catch {
      db.exec('ROLLBACK');
      return res.status(500).json({ success: false, error: 'Failed to delete user.' });
    }

    broadcastSyncEvent('user_deleted', targetId);
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.patch('/api/admin/plans/:id', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const planId = req.params.id;
    const existing = db.prepare('SELECT * FROM plans WHERE id = ?').get(planId) as any;
    if (!existing) return res.status(404).json({ success: false, error: 'Plan not found.' });

    const dailyReturnKobo =
      req.body?.dailyReturnKobo !== undefined ? Math.max(0, Math.round(Number(req.body.dailyReturnKobo))) : Number(existing.dailyReturnKobo);
    const durationDays =
      req.body?.durationDays !== undefined ? Math.max(1, Math.round(Number(req.body.durationDays))) : Number(existing.durationDays);
    const totalPayoutKobo =
      req.body?.totalPayoutKobo !== undefined
        ? Math.max(0, Math.round(Number(req.body.totalPayoutKobo)))
        : dailyReturnKobo * durationDays;
    const status = req.body?.status === 'paused' ? 'paused' : req.body?.status === 'active' ? 'active' : existing.status;

    db.prepare('UPDATE plans SET dailyReturnKobo = ?, durationDays = ?, totalPayoutKobo = ?, status = ? WHERE id = ?').run(
      dailyReturnKobo,
      durationDays,
      totalPayoutKobo,
      status,
      planId
    );

    addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'UPDATE_PLAN_TERMS',
      target: planId,
      details: `Updated ${existing.name}: daily=${dailyReturnKobo}, duration=${durationDays}d`,
    });

    broadcastSyncEvent('plans_updated');
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.post('/api/admin/codes', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const code = String(req.body?.code || '').trim().toUpperCase();
    const amountKobo = Math.round(Number(req.body?.amountKobo) || 0);
    const totalLimit = Math.max(1, Math.round(Number(req.body?.totalLimit) || 100));
    const expiryDate = String(req.body?.expiryDate || '2026-12-31').trim();
    const description = String(req.body?.description || 'Executive VIP incentive').trim();

    if (!code || amountKobo <= 0) {
      return res.status(400).json({ success: false, error: 'Valid code and positive reward amount are required.' });
    }
    const existing = db.prepare('SELECT id FROM topup_codes WHERE upper(code) = ?').get(code);
    if (existing) {
      return res.status(409).json({ success: false, error: 'A code with this exact text already exists.' });
    }

    db.prepare(`
      INSERT INTO topup_codes (id, code, amountKobo, totalLimit, claimedCount, claimedUserIdsJson, expiryDate, description, status)
      VALUES (?, ?, ?, ?, 0, '[]', ?, ?, 'active')
    `).run(`top-${Date.now()}`, code, amountKobo, totalLimit, expiryDate, description);

    addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'CREATE_TOPUP_CODE',
      target: code,
      details: `Issued promo code ${code} (${amountKobo} kobo, limit ${totalLimit})`,
    });

    broadcastSyncEvent('codes_updated');
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.get('/api/admin/settings', (req: Request, res: Response) => {
    const adminSettings = getAdminSettings();
    const now = new Date();
    return res.json({
      settings: adminSettings,
      serverTime: now.toISOString(),
      isWeekend: now.getDay() === 0 || now.getDay() === 6,
    });
  });

  app.post('/api/admin/settings', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const updates = req.body || {};
    const nextSettings = saveAdminSettings(updates);

    addAuditLog({
      adminId: adminUser.id,
      adminEmail: adminUser.email,
      action: 'UPDATE_SYSTEM_SETTINGS',
      target: 'System Config',
      details: `Updated platform settings`,
    });

    broadcastSyncEvent('settings_updated');
    return res.json({
      success: true,
      settings: nextSettings,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  app.post('/api/admin/broadcast', requireAdmin, (req: AuthRequest, res: Response) => {
    const adminUser = req.authUser!;
    const title = String(req.body?.title || '').trim();
    const message = String(req.body?.message || '').trim();
    const type = ['system', 'reward', 'security', 'transaction'].includes(req.body?.type)
      ? req.body.type
      : 'system';

    if (!title || !message) {
      return res.status(400).json({ success: false, error: 'Title and message are required.' });
    }

    // Record for every registered user individually so read/unread is isolated per user!
    const allUserRows = db.prepare('SELECT id FROM users').all() as { id: string }[];
    db.exec('BEGIN IMMEDIATE');
    try {
      for (const row of allUserRows) {
        addNotificationRow({
          userId: row.id,
          title,
          message,
          type,
        });
      }
      addAuditLog({
        adminId: adminUser.id,
        adminEmail: adminUser.email,
        action: 'PUBLISH_BROADCAST',
        target: 'All Investors',
        details: `Broadcast: "${title}" to ${allUserRows.length} users`,
      });
      db.exec('COMMIT');
    } catch {
      db.exec('ROLLBACK');
      return res.status(500).json({ success: false, error: 'Failed to publish broadcast.' });
    }

    broadcastSyncEvent('broadcast_published', 'all');
    return res.json({
      success: true,
      state: getUserHydratedState(adminUser.id),
      adminData: getAdminDashboardData(),
    });
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`APPLE CARD INVESTMENT server running on port ${port}`);
  });
}

startServer();
