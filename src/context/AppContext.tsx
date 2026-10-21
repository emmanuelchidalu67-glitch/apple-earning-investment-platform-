import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
  InvestmentPlan,
  UserInvestment,
  TransactionRecord,
  BankAccount,
  TopUpCode,
  NotificationItem,
  AuditLogItem,
  ReferralTierStats,
  AdminSettings,
} from '../types';
import { INITIAL_INVESTMENT_PLANS } from '../data/plans';
import { generateReference } from '../utils/formatters';

interface CelebrationData {
  planName: string;
  capitalKobo: number;
  dailyYieldKobo: number;
}

interface AppContextType {
  // Auth & Profile
  user: UserProfile | null;
  allUsers: UserProfile[];
  isAuthenticated: boolean;
  activeTab: 'home' | 'plans' | 'invest' | 'team' | 'profile' | 'admin';
  setActiveTab: (tab: 'home' | 'plans' | 'invest' | 'team' | 'profile' | 'admin') => void;
  authView: 'login' | 'signup' | 'forgot_password' | 'verify_otp' | null;
  setAuthView: (view: 'login' | 'signup' | 'forgot_password' | 'verify_otp' | null) => void;
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
  login: (identifier: string, pass: string) => { success: boolean; error?: string };
  signup: (data: {
    fullName: string;
    email: string;
    phone: string;
    countryCode: string;
    withdrawalPin: string;
    password?: string;
    referralCode?: string;
  }) => { success: boolean; error?: string };
  verifyOtp: (code: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateWithdrawalPin: (newPin: string) => { success: boolean };
  showCommunityModal: boolean;
  setShowCommunityModal: (show: boolean) => void;

  // Financial Balances (in Kobo)
  availableBalanceKobo: number;
  investedCapitalKobo: number;
  verifiedEarningsKobo: number;
  pendingWithdrawalKobo: number;

  // Plans & Investments
  plans: InvestmentPlan[];
  userInvestments: UserInvestment[];
  investInPlan: (planId: string) => { success: boolean; error?: string; reference?: string };
  claimInvestmentYield: (investmentId: string) => { success: boolean; amountClaimedKobo?: number; error?: string };

  // Subtle Canvas Celebration
  celebrationData: CelebrationData | null;
  dismissCelebration: () => void;

  // Transactions & History
  transactions: TransactionRecord[];
  submitDeposit: (data: {
    amountKobo: number;
    senderName: string;
    senderReference?: string;
    paymentMethod: string;
  }) => { success: boolean; reference: string };
  submitWithdrawal: (data: {
    amountKobo: number;
    bankAccountId: string;
    withdrawalPin: string;
  }) => { success: boolean; error?: string; reference?: string };

  // Bank Accounts
  bankAccounts: BankAccount[];
  addBankAccount: (data: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    type?: 'bank' | 'bep20';
    bep20Address?: string;
    network?: string;
  }) => { success: boolean; error?: string };
  deleteBankAccount: (id: string) => void;
  setDefaultBankAccount: (id: string) => void;

  // Top-Up Codes
  topUpCodes: TopUpCode[];
  redeemTopUpCode: (codeStr: string) => { success: boolean; message: string; amountKobo?: number };

  // Team & Referrals (Real calculation starting at 0)
  referralStats: {
    tier1: ReferralTierStats;
    tier2: ReferralTierStats;
    tier3: ReferralTierStats;
    totalMembers: number;
    pendingRewardsKobo: number;
    verifiedRewardsKobo: number;
  };

  // Utility Payments
  buyAirtime: (data: {
    network: string;
    phoneNumber: string;
    amountKobo: number;
  }) => { success: boolean; error?: string; reference?: string };
  buyDataBundle: (data: {
    network: string;
    phoneNumber: string;
    bundleName: string;
    amountKobo: number;
  }) => { success: boolean; error?: string; reference?: string };
  payElectricityBill: (data: {
    disco: string;
    meterNumber: string;
    meterType: 'prepaid' | 'postpaid';
    amountKobo: number;
  }) => { success: boolean; error?: string; token?: string; reference?: string };

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  addNotification: (title: string, message: string, type?: NotificationItem['type']) => void;

  // Admin Capabilities & System Controls
  adminSettings: AdminSettings;
  updateAdminSettings: (updates: Partial<AdminSettings>) => void;
  auditLogs: AuditLogItem[];
  adminApproveDeposit: (transactionId: string) => { success: boolean };
  adminRejectDeposit: (transactionId: string, reason: string) => { success: boolean };
  adminApproveWithdrawal: (transactionId: string) => { success: boolean };
  adminRejectWithdrawal: (transactionId: string, reason: string) => { success: boolean };
  adminUpdatePlan: (planId: string, updates: Partial<InvestmentPlan>) => void;
  adminCreateTopUpCode: (data: {
    code: string;
    amountKobo: number;
    totalLimit: number;
    expiryDate: string;
    description: string;
  }) => { success: boolean; error?: string };
  adminToggleUserVerification: (userId: string) => void;
  adminUpdateUserFinancials: (
    userId: string,
    updates: {
      balanceKobo?: number;
      investedCapitalKobo?: number;
      totalEarnedKobo?: number;
      vipLevel?: number;
      spinBalance?: number;
      isWithdrawalBanned?: boolean;
      isSuspended?: boolean;
      fullName?: string;
      email?: string;
      phone?: string;
      role?: UserRole;
    }
  ) => { success: boolean };
  adminDeleteUserInvestments: (userId: string) => { success: boolean };
  adminDeleteUser: (userId: string) => { success: boolean };
  adminToggleUserWithdrawalBan: (userId: string) => { success: boolean };
  adminToggleUserSuspension: (userId: string) => { success: boolean };
  adminPublishNotification: (title: string, message: string, type?: NotificationItem['type']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Initial registered admin user
const INITIAL_ADMIN_USER: UserProfile = {
  id: 'usr-admin-01',
  fullName: 'Emmanuel Chidalu (Admin)',
  email: 'emmanuelchidalu67@gmail.com',
  phone: '08100241166',
  countryCode: '+234',
  accountNumberId: 'ACI-000001',
  referralCode: 'ADMIN2026',
  avatarInitials: 'EC',
  isVerified: true,
  welcomeBonusClaimed: true,
  registrationDate: '2026-10-01T08:00:00.000Z',
  withdrawalPinSet: true,
  role: 'admin',
};

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  withdrawalFeePercent: 15, // 15% as requested!
  allowWeekendWithdrawals: false, // No withdrawals on Sat and Sun by default
  welcomeBonusKobo: 800 * 100, // ₦800 = 80,000 kobo auto added
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
  wheelMinFriendInvestKobo: 200000 * 100, // ₦200,000
  wheelMinUserInvestKobo: 500000 * 100, // ₦500,000
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Authenticated user starts as NULL so user MUST register or sign in after splash!
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('aci_user');
    if (!saved) return null;
    try {
      const parsed: UserProfile = JSON.parse(saved);
      // STRICT ADMIN LOCK: Nobody except emmanuelchidalu67@gmail.com can ever have admin role
      if (parsed.email?.toLowerCase() !== 'emmanuelchidalu67@gmail.com') {
        parsed.role = 'user';
      }
      return parsed;
    } catch {
      return null;
    }
  });

  // Directory of all registered users (recorded for admin panel)
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('aci_all_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [INITIAL_ADMIN_USER];
      }
    }
    return [INITIAL_ADMIN_USER];
  });

  const [activeTab, setActiveTab] = useState<'home' | 'plans' | 'invest' | 'team' | 'profile' | 'admin'>('home');
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot_password' | 'verify_otp' | null>('signup');
  const [tempOtpUser, setTempOtpUser] = useState<UserProfile | null>(null);
  const [showCommunityModal, setShowCommunityModal] = useState<boolean>(false);

  // Canvas celebration state
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  // Admin Settings (15% withdrawal fee, weekend restrictions, etc.)
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(() => {
    const saved = localStorage.getItem('aci_admin_settings');
    return saved ? JSON.parse(saved) : DEFAULT_ADMIN_SETTINGS;
  });

  // Clean financial states starting at 0
  const [availableBalanceKobo, setAvailableBalanceKobo] = useState<number>(() => {
    const saved = localStorage.getItem('aci_bal');
    return saved !== null ? Number(saved) : 0;
  });

  const [pendingWithdrawalKobo, setPendingWithdrawalKobo] = useState<number>(() => {
    const saved = localStorage.getItem('aci_pending_wth');
    return saved !== null ? Number(saved) : 0;
  });

  const [plans, setPlans] = useState<InvestmentPlan[]>(() => {
    const saved = localStorage.getItem('aci_plans');
    return saved ? JSON.parse(saved) : INITIAL_INVESTMENT_PLANS;
  });

  // Initial user investments start EMPTY
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>(() => {
    const saved = localStorage.getItem('aci_investments');
    return saved ? JSON.parse(saved) : [];
  });

  // Initial transactions start EMPTY
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => {
    const saved = localStorage.getItem('aci_txs');
    return saved ? JSON.parse(saved) : [];
  });

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('aci_banks');
    return saved ? JSON.parse(saved) : [];
  });

  const [topUpCodes, setTopUpCodes] = useState<TopUpCode[]>(() => {
    const saved = localStorage.getItem('aci_topup_codes');
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: 'top-1',
            code: 'APPLE2026',
            amountKobo: 2500 * 100,
            totalLimit: 500,
            claimedCount: 0,
            claimedUserIds: [],
            expiryDate: '2026-12-31',
            description: 'Special Launch Promo Top-Up for verified diamond investors.',
            status: 'active',
          },
          {
            id: 'top-2',
            code: 'VIPWELCOME',
            amountKobo: 1500 * 100,
            totalLimit: 1000,
            claimedCount: 0,
            claimedUserIds: [],
            expiryDate: '2026-11-30',
            description: 'Executive community welcoming voucher.',
            status: 'active',
          },
        ];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('aci_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(() => {
    const saved = localStorage.getItem('aci_audit');
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('aci_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('aci_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('aci_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('aci_admin_settings', JSON.stringify(adminSettings));
  }, [adminSettings]);

  useEffect(() => {
    localStorage.setItem('aci_bal', availableBalanceKobo.toString());
  }, [availableBalanceKobo]);

  useEffect(() => {
    localStorage.setItem('aci_pending_wth', pendingWithdrawalKobo.toString());
  }, [pendingWithdrawalKobo]);

  useEffect(() => {
    localStorage.setItem('aci_plans', JSON.stringify(plans));
  }, [plans]);

  useEffect(() => {
    localStorage.setItem('aci_investments', JSON.stringify(userInvestments));
  }, [userInvestments]);

  useEffect(() => {
    localStorage.setItem('aci_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('aci_banks', JSON.stringify(bankAccounts));
  }, [bankAccounts]);

  useEffect(() => {
    localStorage.setItem('aci_topup_codes', JSON.stringify(topUpCodes));
  }, [topUpCodes]);

  useEffect(() => {
    localStorage.setItem('aci_notifications', JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem('aci_audit', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // AUTOMATED 24-HOUR INVESTMENT YIELD CREDITING ENGINE
  // Requirement: "no one can claim it is auto credit every 24hrs no user including the admin can claim until 24hrs it will credit instantly to the user dashboard"
  useEffect(() => {
    const processDailyAutoCredits = () => {
      const now = Date.now();
      const ONE_DAY_MS = 24 * 60 * 60 * 1000;

      setUserInvestments((prevInvestments) => {
        let hasChanges = false;
        let totalCreditedKobo = 0;
        const newTransactions: TransactionRecord[] = [];

        const updated = prevInvestments.map((inv) => {
          if (inv.status !== 'Active') return inv;

          const lastClaim = new Date(inv.lastClaimDate || inv.startDate).getTime();
          const elapsedMs = now - lastClaim;

          // If at least 24 hours have elapsed since start / last cycle
          if (elapsedMs >= ONE_DAY_MS) {
            hasChanges = true;
            const cyclesToCredit = Math.floor(elapsedMs / ONE_DAY_MS);
            const remainingDays = inv.durationDays - inv.daysElapsed;
            const daysToApply = Math.min(cyclesToCredit, remainingDays);

            if (daysToApply <= 0) return inv;

            const yieldToAdd = inv.dailyReturnKobo * daysToApply;
            const newDaysElapsed = inv.daysElapsed + daysToApply;
            const isCompleted = newDaysElapsed >= inv.durationDays;
            const newLastClaimDate = new Date(lastClaim + daysToApply * ONE_DAY_MS).toISOString();

            totalCreditedKobo += yieldToAdd;

            newTransactions.push({
              id: `tx-auto-${Date.now()}-${inv.id}`,
              reference: generateReference('AUTOPAY'),
              userId: inv.userId,
              type: 'daily_earning',
              title: `${inv.planName} 24h Automated Yield`,
              description: `Automated 24-hour cycle return (${daysToApply} day cycle) credited to dashboard.`,
              amountKobo: yieldToAdd,
              status: 'Completed',
              date: new Date().toISOString(),
            });

            return {
              ...inv,
              daysElapsed: newDaysElapsed,
              earnedKobo: inv.earnedKobo + yieldToAdd,
              lastClaimDate: newLastClaimDate,
              status: isCompleted ? ('Completed' as const) : ('Active' as const),
            };
          }
          return inv;
        });

        if (hasChanges && totalCreditedKobo > 0) {
          setAvailableBalanceKobo((prev) => prev + totalCreditedKobo);
          if (newTransactions.length > 0) {
            setTransactions((prev) => [...newTransactions, ...prev]);
          }
          addNotification(
            '24-Hour Investment Yield Auto-Credited',
            `₦${(totalCreditedKobo / 100).toLocaleString()} in automated daily returns has been deposited to your dashboard balance.`,
            'reward'
          );
        }

        return hasChanges ? updated : prevInvestments;
      });
    };

    processDailyAutoCredits();
    const interval = setInterval(processDailyAutoCredits, 30000);
    return () => clearInterval(interval);
  }, []);

  // Derived calculations with custom balance overrides from admin ledger
  const investedCapitalKobo =
    (user?.investedBalanceKobo !== undefined ? user.investedBalanceKobo : 0) +
    userInvestments
      .filter((inv) => (!user || inv.userId === user.id) && inv.status === 'Active')
      .reduce((sum, inv) => sum + inv.capitalKobo, 0);

  const verifiedEarningsKobo =
    (user?.totalEarnedKobo !== undefined ? user.totalEarnedKobo : 0) +
    userInvestments
      .filter((inv) => !user || inv.userId === user.id)
      .reduce((sum, inv) => sum + inv.earnedKobo, 0) +
    transactions
      .filter((tx) => (!user || tx.userId === user.id) && tx.status === 'Completed' && (tx.type === 'referral_bonus' || tx.type === 'topup_code'))
      .reduce((sum, tx) => sum + tx.amountKobo, 0);

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const addNotification = (title: string, message: string, type: NotificationItem['type'] = 'system') => {
    const newNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      userId: user?.id || 'guest',
      title,
      message,
      type,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  // AUTH: Login
  // Requirement: "any user that registers with emmanuelchidalu67@gmail.com and 241166 is the admin of the panel"
  const login = (identifier: string, pass: string) => {
    if (!identifier || !pass) {
      return { success: false, error: 'Please enter your email/phone and password.' };
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPass = pass.trim();

    // Check special admin credential
    if (cleanIdentifier === 'emmanuelchidalu67@gmail.com' && cleanPass === '241166') {
      const adminUser: UserProfile = {
        id: 'usr-admin-emmanuel',
        fullName: 'Emmanuel Chidalu (Admin)',
        email: 'emmanuelchidalu67@gmail.com',
        phone: '08100241166',
        countryCode: '+234',
        accountNumberId: 'ACI-000001',
        referralCode: 'EMMANUEL24',
        avatarInitials: 'EC',
        isVerified: true,
        welcomeBonusClaimed: true,
        registrationDate: '2026-10-01T08:00:00.000Z',
        withdrawalPinSet: true,
        role: 'admin',
      };
      setUser(adminUser);
      setAuthView(null);
      addNotification('Admin Login Authorized', 'Welcome back, Emmanuel Chidalu. Full administrative controls unlocked.');
      return { success: true };
    }

    // Regular user lookup from registered users
    const found = allUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanIdentifier ||
        u.phone.replace(/\D/g, '') === cleanIdentifier.replace(/\D/g, '')
    );

    if (found) {
      if (found.isSuspended) {
        return {
          success: false,
          error: 'This account has been suspended by administration. Contact official WhatsApp support.',
        };
      }
      setUser(found);
      if (found.balanceKobo !== undefined) setAvailableBalanceKobo(found.balanceKobo);
      setAuthView(null);
      addNotification('Login Successful', `Welcome back, ${found.fullName}! Portfolio loaded.`);
      return { success: true };
    }

    // If not in database yet, require proper password length
    if (pass.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    const fallbackUser: UserProfile = {
      id: `usr-${Date.now().toString(36)}`,
      fullName: cleanIdentifier.includes('@') ? cleanIdentifier.split('@')[0] : 'Investor',
      email: cleanIdentifier.includes('@') ? cleanIdentifier : `${cleanIdentifier}@applecard.ng`,
      phone: !cleanIdentifier.includes('@') ? cleanIdentifier : '08123456789',
      countryCode: '+234',
      accountNumberId: `ACI-${Math.floor(100000 + Math.random() * 900000)}`,
      referralCode: `APPLE${Math.floor(100 + Math.random() * 900)}`,
      avatarInitials: 'AI',
      isVerified: true,
      welcomeBonusClaimed: true,
      registrationDate: new Date().toISOString(),
      withdrawalPinSet: true,
      role: 'user',
    };

    setUser(fallbackUser);
    setAllUsers((prev) => [fallbackUser, ...prev.filter((u) => u.email !== fallbackUser.email)]);
    setAuthView(null);
    return { success: true };
  };

  // AUTH: Signup
  // Requirement:
  // "every user that registers should be recorded in the admin panel"
  // "any user that registers with emmanuelchidalu67@gmail.com and 241166 is the admin of the panel"
  const signup = (data: {
    fullName: string;
    email: string;
    phone: string;
    countryCode: string;
    withdrawalPin: string;
    password?: string;
    referralCode?: string;
  }) => {
    if (!data.fullName || !data.email || !data.phone || !data.withdrawalPin) {
      return { success: false, error: 'All fields are required.' };
    }

    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPassword = (data.password || '').trim();

    // STRICT ADMIN REQUIREMENT: Only emmanuelchidalu67@gmail.com with password 241166 is admin. No other user.
    const isAdmin = cleanEmail === 'emmanuelchidalu67@gmail.com' && cleanPassword === '241166';

    const bonusKobo = adminSettings.welcomeBonusKobo; // ₦800 = 80,000 kobo

    const newUser: UserProfile = {
      id: `usr-${Date.now().toString(36)}`,
      fullName: data.fullName.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      countryCode: data.countryCode,
      accountNumberId: `ACI-${Math.floor(100000 + Math.random() * 900000)}`,
      referralCode: data.fullName.split(' ')[0].toUpperCase() + Math.floor(10 + Math.random() * 90),
      referredBy: data.referralCode?.trim() || undefined,
      avatarInitials: data.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      isVerified: true,
      welcomeBonusClaimed: true,
      registrationDate: new Date().toISOString(),
      withdrawalPinSet: true,
      role: isAdmin ? 'admin' : 'user',
      balanceKobo: bonusKobo,
      investedBalanceKobo: 0,
      totalEarnedKobo: 0,
      vipLevel: 0,
      spinBalance: 0,
    };

    // Save user in allUsers and localStorage for instant live recording in admin panel
    setAllUsers((prev) => {
      const updated = [newUser, ...prev.filter((u) => u.email !== newUser.email)];
      localStorage.setItem('aci_all_users', JSON.stringify(updated));
      return updated;
    });

    setUser(newUser);
    localStorage.setItem('aci_user', JSON.stringify(newUser));
    setAvailableBalanceKobo(bonusKobo);
    setAuthView(null);

    // Record welcome bonus transaction
    const bonusTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: generateReference('REF'),
      userId: newUser.id,
      userEmail: newUser.email,
      type: 'welcome_bonus',
      title: '₦800 Welcome Bonus (Auto-Credited)',
      description: 'New account registration reward automatically deposited to your verified balance.',
      amountKobo: bonusKobo,
      status: 'Completed',
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [bonusTx, ...prev]);

    addNotification(
      '₦800 Welcome Bonus Auto-Credited',
      'Welcome to Apple Card Investment! Your ₦800 registration bonus was automatically added to your available balance.',
      'reward'
    );

    // Show community modal
    setShowCommunityModal(true);

    return { success: true };
  };

  // AUTH: OTP Verification & Auto Welcome Bonus Credit
  // Requirement: "in the welcome bonus auto add not user claim and make everything smooth working"
  // "every user that registers should be recorded in the admin panel"
  const verifyOtp = (code: string) => {
    if (code.length < 6) {
      return { success: false, error: 'Please enter the complete 6-digit OTP code.' };
    }
    if (tempOtpUser) {
      const bonusKobo = adminSettings.welcomeBonusKobo; // ₦800 = 80,000 kobo

      const verifiedUser: UserProfile = {
        ...tempOtpUser,
        isVerified: true,
        welcomeBonusClaimed: true, // auto claimed!
        balanceKobo: bonusKobo,
        investedBalanceKobo: 0,
        totalEarnedKobo: 0,
        vipLevel: 0,
        spinBalance: 0,
      };

      // Record in allUsers so admin panel sees every registered user instantly!
      setAllUsers((prev) => {
        const updated = [verifiedUser, ...prev.filter((u) => u.email !== verifiedUser.email)];
        localStorage.setItem('aci_all_users', JSON.stringify(updated));
        return updated;
      });
      setUser(verifiedUser);
      localStorage.setItem('aci_user', JSON.stringify(verifiedUser));
      setTempOtpUser(null);
      setAuthView(null);

      // Fresh user starts with exactly ₦800 Welcome Bonus, no fake access or investments
      setAvailableBalanceKobo(bonusKobo);

      // Record in financial ledger
      const bonusTx: TransactionRecord = {
        id: `tx-${Date.now()}`,
        reference: generateReference('REF'),
        userId: verifiedUser.id,
        userEmail: verifiedUser.email,
        type: 'welcome_bonus',
        title: '₦800 Welcome Bonus (Auto-Credited)',
        description: 'New account registration reward automatically deposited to your verified balance.',
        amountKobo: bonusKobo,
        status: 'Completed',
        date: new Date().toISOString(),
      };
      setTransactions((prev) => [bonusTx, ...prev]);

      addNotification(
        '₦800 Welcome Bonus Auto-Credited',
        'Welcome to Apple Card Investment! Your ₦800 registration bonus was automatically added to your available balance.',
        'reward'
      );

      // Automatically show Official WhatsApp group, Telegram channel, and explanation
      setShowCommunityModal(true);

      return { success: true };
    }
    return { success: false, error: 'Verification session expired. Please sign up again.' };
  };

  const logout = () => {
    setUser(null);
    setShowSplash(false);
    setAuthView('login');
  };

  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
  };

  const updateWithdrawalPin = (newPin: string) => {
    if (newPin.length !== 4) return { success: false };
    if (user) {
      const updated = { ...user, withdrawalPinSet: true };
      setUser(updated);
      setAllUsers((prev) => prev.map((u) => (u.id === user.id ? updated : u)));
      addNotification('Security PIN Updated', 'Your 4-digit withdrawal PIN was changed successfully.', 'security');
    }
    return { success: true };
  };

  // INVEST IN PLAN & Subtle Canvas Trigger
  // Requirement: "Implement a subtle canvas-based animation that triggers when a user successfully completes a new investment, providing positive reinforcement."
  const investInPlan = (planId: string) => {
    if (!user) return { success: false, error: 'Please log in to invest.' };
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return { success: false, error: 'Investment plan not found.' };

    if (availableBalanceKobo < plan.capitalKobo) {
      return {
        success: false,
        error: `Insufficient available balance. Required: ₦${(plan.capitalKobo / 100).toLocaleString()}. Please deposit first.`,
      };
    }

    // Deduct capital
    setAvailableBalanceKobo((prev) => prev - plan.capitalKobo);

    const ref = generateReference('INV');
    const startDate = new Date();
    const maturityDate = new Date();
    maturityDate.setDate(startDate.getDate() + plan.durationDays);

    const newInvestment: UserInvestment = {
      id: `inv-${Date.now()}`,
      reference: ref,
      userId: user.id,
      planId: plan.id,
      planName: plan.name,
      vipTier: plan.vipTier,
      capitalKobo: plan.capitalKobo,
      dailyReturnKobo: plan.dailyReturnKobo,
      durationDays: plan.durationDays,
      daysElapsed: 0,
      totalPayoutKobo: plan.totalPayoutKobo,
      earnedKobo: 0,
      lastClaimDate: startDate.toISOString(),
      startDate: startDate.toISOString(),
      maturityDate: maturityDate.toISOString(),
      status: 'Active',
    };

    setUserInvestments((prev) => [newInvestment, ...prev]);

    const tx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: ref,
      userId: user.id,
      userEmail: user.email,
      type: 'investment',
      title: `${plan.name} Activated`,
      description: `Invested capital of ₦${(plan.capitalKobo / 100).toLocaleString()} for ${plan.durationDays} days.`,
      amountKobo: plan.capitalKobo,
      status: 'Completed',
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);

    addNotification(
      'Investment Started',
      `You activated ${plan.name} with ₦${(plan.capitalKobo / 100).toLocaleString()}. Daily yield: ₦${(plan.dailyReturnKobo / 100).toLocaleString()}.`
    );

    // TRIGGER CANVAS CELEBRATION
    setCelebrationData({
      planName: plan.name,
      capitalKobo: plan.capitalKobo,
      dailyYieldKobo: plan.dailyReturnKobo,
    });

    return { success: true, reference: ref };
  };

  const dismissCelebration = () => {
    setCelebrationData(null);
  };

  // Claim Daily Yield from Active Investment
  const claimInvestmentYield = (investmentId: string) => {
    const inv = userInvestments.find((i) => i.id === investmentId);
    if (!inv) {
      return { success: false, error: 'Investment not found or already completed.' };
    }
    // Specific user rule: "in the invest no on can claim it is auto credit every 24hrs no user including the admin can claim until 24hrs it will credit instantly to the user dashboard"
    const lastClaim = new Date(inv.lastClaimDate || inv.startDate).getTime();
    const elapsedSince = Date.now() - lastClaim;
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;

    if (elapsedSince < ONE_DAY_MS) {
      const remainingMs = ONE_DAY_MS - elapsedSince;
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        success: false,
        error: `Yield is locked. Auto-credits to dashboard in ${hours}h ${minutes}m.`,
      };
    }

    const dailyKobo = inv.dailyReturnKobo;
    const newDaysElapsed = Math.min(inv.daysElapsed + 1, inv.durationDays);
    const newEarned = inv.earnedKobo + dailyKobo;
    const isCompleted = newDaysElapsed >= inv.durationDays;

    setUserInvestments((prev) =>
      prev.map((item) =>
        item.id === investmentId
          ? {
              ...item,
              daysElapsed: newDaysElapsed,
              earnedKobo: newEarned,
              lastClaimDate: new Date().toISOString(),
              status: isCompleted ? 'Completed' : 'Active',
            }
          : item
      )
    );

    setAvailableBalanceKobo((prev) => prev + dailyKobo);

    const tx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: generateReference('INV'),
      userId: user?.id || 'usr-default',
      userEmail: user?.email,
      type: 'daily_earning',
      title: `${inv.planName} Daily Payout`,
      description: `Cycle day ${newDaysElapsed}/${inv.durationDays} verified payout credited.`,
      amountKobo: dailyKobo,
      status: 'Completed',
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);

    addNotification(
      'Daily Payout Credited',
      `₦${(dailyKobo / 100).toLocaleString()} daily yield from ${inv.planName} added to your available balance.`
    );

    return { success: true, amountClaimedKobo: dailyKobo };
  };

  // Deposit Flow
  const submitDeposit = (data: {
    amountKobo: number;
    senderName: string;
    senderReference?: string;
    paymentMethod: string;
  }) => {
    const ref = generateReference('DEP');
    const depositTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: ref,
      userId: user?.id || 'usr-default',
      userEmail: user?.email,
      type: 'deposit',
      title: 'Bank Transfer Deposit',
      description: `Deposit via ${data.paymentMethod}. Sender: ${data.senderName}`,
      amountKobo: data.amountKobo,
      status: 'Pending',
      date: new Date().toISOString(),
      senderName: data.senderName,
      paymentMethod: data.paymentMethod,
      metadata: {
        senderReference: data.senderReference,
      },
    };
    setTransactions((prev) => [depositTx, ...prev]);
    addNotification(
      'Deposit Pending Verification',
      `Deposit request for ₦${(data.amountKobo / 100).toLocaleString()} (Ref: ${ref}) is pending bank reconciliation.`
    );
    return { success: true, reference: ref };
  };

  // Withdrawal Flow
  // Requirements:
  // "the withdrawal fees should be 15%"
  // "no withdrawals on Sat and Sunday and also everything admin should country it"
  const submitWithdrawal = (data: {
    amountKobo: number;
    bankAccountId: string;
    withdrawalPin: string;
  }) => {
    if (!user) return { success: false, error: 'Please log in to withdraw.' };
    if (user.isWithdrawalBanned) {
      return {
        success: false,
        error: 'Withdrawals for your account have been frozen by administration. Please contact customer support.',
      };
    }
    const bank = bankAccounts.find((b) => b.id === data.bankAccountId);
    if (!bank) return { success: false, error: 'Please select a valid destination bank account.' };

    // Weekend check: 0 is Sunday, 6 is Saturday
    const currentDay = new Date().getDay();
    const isWeekend = currentDay === 0 || currentDay === 6;
    if (isWeekend && !adminSettings.allowWeekendWithdrawals) {
      return {
        success: false,
        error: 'Withdrawals are closed on Saturdays and Sundays. Please request payout during standard Nigerian banking days (Monday - Friday).',
      };
    }

    const minKobo = 1000 * 100; // ₦1,000 min
    const maxKobo = 5000000 * 100; // ₦5,000,000 max

    if (data.amountKobo < minKobo) {
      return { success: false, error: 'Minimum withdrawal amount is ₦1,000.' };
    }
    if (data.amountKobo > maxKobo) {
      return { success: false, error: 'Maximum single withdrawal is ₦5,000,000.' };
    }
    if (availableBalanceKobo < data.amountKobo) {
      return { success: false, error: 'Insufficient available balance.' };
    }
    if (data.withdrawalPin.length !== 4) {
      return { success: false, error: 'Invalid 4-digit withdrawal PIN.' };
    }

    // Configurable fee percentage: 15% standard
    const feePercent = adminSettings.withdrawalFeePercent;
    const feeKobo = Math.round(data.amountKobo * (feePercent / 100));
    const netPayoutKobo = data.amountKobo - feeKobo;

    // Deduct from available balance, add to pending
    setAvailableBalanceKobo((prev) => prev - data.amountKobo);
    setPendingWithdrawalKobo((prev) => prev + data.amountKobo);

    const ref = generateReference(bank.type === 'bep20' ? 'BEP' : 'WTH');
    const isBep20 = bank.type === 'bep20';
    const withdrawalTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: ref,
      userId: user.id,
      userEmail: user.email,
      type: 'withdrawal',
      title: isBep20 ? 'USDT BEP-20 Withdrawal' : 'Bank Withdrawal Request',
      description: isBep20
        ? `USDT payout to ${bank.accountNumber.slice(0, 8)}...${bank.accountNumber.slice(-6)} (BEP-20)`
        : `Withdrawal to ${bank.bankName} (${bank.accountNumber})`,
      amountKobo: data.amountKobo,
      feeKobo: feeKobo,
      status: 'Pending',
      date: new Date().toISOString(),
      bankDetails: {
        bankName: bank.bankName,
        accountNumber: bank.accountNumber,
        accountName: bank.accountName,
      },
      metadata: {
        netPayoutKobo,
        feePercent,
        isBep20,
        usdtEstimate: isBep20
          ? ((netPayoutKobo / 100) / (adminSettings.usdtExchangeRateNaira || 1550)).toFixed(2)
          : undefined,
      },
    };

    setTransactions((prev) => [withdrawalTx, ...prev]);
    addNotification(
      'Withdrawal Submitted',
      isBep20
        ? `Withdrawal of ₦${(data.amountKobo / 100).toLocaleString()} (~$${((netPayoutKobo / 100) / (adminSettings.usdtExchangeRateNaira || 1550)).toFixed(2)} USDT) to your BEP-20 address is queued for settlement.`
        : `Withdrawal of ₦${(data.amountKobo / 100).toLocaleString()} (Net: ₦${(netPayoutKobo / 100).toLocaleString()} after ${feePercent}% processing fee) to ${bank.bankName} is queued for approval.`
    );

    return { success: true, reference: ref };
  };

  // Bank Accounts & BEP-20 Wallet Management
  const addBankAccount = (data: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    type?: 'bank' | 'bep20';
    bep20Address?: string;
    network?: string;
  }) => {
    if (!user) return { success: false, error: 'Please log in.' };
    const isBep20 = data.type === 'bep20';

    if (!isBep20 && data.accountNumber.length !== 10) {
      return { success: false, error: 'Nigerian account number must be exactly 10 digits.' };
    }
    if (isBep20 && (!data.accountNumber.startsWith('0x') || data.accountNumber.length < 25)) {
      return { success: false, error: 'BEP-20 address must be a valid BSC wallet starting with 0x.' };
    }
    if (!data.accountName.trim()) {
      return { success: false, error: isBep20 ? 'Please enter a wallet label/name.' : 'Please enter your account holder name.' };
    }

    const newAccount: BankAccount = {
      id: `bnk-${Date.now()}`,
      userId: user.id,
      type: data.type || 'bank',
      bankName: data.bankName,
      bankCode: data.bankCode,
      accountNumber: data.accountNumber.trim(),
      accountName: data.accountName.trim(),
      bep20Address: isBep20 ? data.accountNumber.trim() : undefined,
      network: isBep20 ? (data.network || 'BNB Smart Chain (BEP-20)') : undefined,
      isDefault: bankAccounts.length === 0,
      createdAt: new Date().toISOString(),
    };

    setBankAccounts((prev) => [...prev, newAccount]);
    addNotification(
      isBep20 ? 'BEP-20 Address Linked' : 'Bank Account Added',
      `${data.bankName} (${data.accountNumber.slice(0, 6)}...${data.accountNumber.slice(-4)}) successfully saved.`
    );
    return { success: true };
  };

  const deleteBankAccount = (id: string) => {
    setBankAccounts((prev) => prev.filter((b) => b.id !== id));
    addNotification('Bank Account Removed', 'Bank account was removed from your profile.');
  };

  const setDefaultBankAccount = (id: string) => {
    setBankAccounts((prev) =>
      prev.map((b) => ({ ...b, isDefault: b.id === id }))
    );
  };

  // Top-Up Code Redemption
  const redeemTopUpCode = (codeStr: string) => {
    if (!user) return { success: false, message: 'Please log in first.' };
    const cleanCode = codeStr.trim().toUpperCase();
    const target = topUpCodes.find((c) => c.code.toUpperCase() === cleanCode);

    if (!target) {
      return { success: false, message: 'Invalid top-up code. Please check and try again.' };
    }
    if (target.status !== 'active') {
      return { success: false, message: 'This top-up code has expired or is deactivated.' };
    }
    if (target.claimedUserIds.includes(user.id)) {
      return { success: false, message: 'You have already redeemed this code on your account.' };
    }
    if (target.claimedCount >= target.totalLimit) {
      return { success: false, message: 'This promo code has reached its maximum redemption limit.' };
    }

    setAvailableBalanceKobo((prev) => prev + target.amountKobo);

    setTopUpCodes((prev) =>
      prev.map((c) =>
        c.id === target.id
          ? {
              ...c,
              claimedCount: c.claimedCount + 1,
              claimedUserIds: [...c.claimedUserIds, user.id],
            }
          : c
      )
    );

    const ref = generateReference('TOP');
    const tx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: ref,
      userId: user.id,
      userEmail: user.email,
      type: 'topup_code',
      title: `Free Code: ${target.code}`,
      description: target.description,
      amountKobo: target.amountKobo,
      status: 'Completed',
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);

    addNotification(
      'Top-Up Code Redeemed',
      `Bonus ₦${(target.amountKobo / 100).toLocaleString()} credited to your balance from code ${target.code}!`
    );

    return {
      success: true,
      message: `₦${(target.amountKobo / 100).toLocaleString()} added to your balance!`,
      amountKobo: target.amountKobo,
    };
  };

  // REAL Team & Referrals Calculation starting at 0
  // Requirement: "I want to add remove everything in the team and also everything so it will be 0 .00 I want to make it real"
  const realDirectDownlines = user ? allUsers.filter((u) => u.referredBy === user.referralCode) : [];
  const referralTransactions = transactions.filter((t) => t.type === 'referral_bonus');
  const verifiedRefRewardsKobo = referralTransactions
    .filter((t) => t.status === 'Completed')
    .reduce((sum, t) => sum + t.amountKobo, 0);

  const referralStats = {
    tier1: {
      tier: 1 as const,
      percentage: adminSettings.tier1CommissionPercent,
      membersCount: realDirectDownlines.length,
      earningsKobo: verifiedRefRewardsKobo,
    },
    tier2: {
      tier: 2 as const,
      percentage: adminSettings.tier2CommissionPercent,
      membersCount: 0,
      earningsKobo: 0,
    },
    tier3: {
      tier: 3 as const,
      percentage: adminSettings.tier3CommissionPercent,
      membersCount: 0,
      earningsKobo: 0,
    },
    totalMembers: realDirectDownlines.length,
    pendingRewardsKobo: 0,
    verifiedRewardsKobo: verifiedRefRewardsKobo,
  };

  // Utility Payments
  const buyAirtime = (data: { network: string; phoneNumber: string; amountKobo: number }) => {
    if (!user) return { success: false, error: 'Please log in.' };
    if (availableBalanceKobo < data.amountKobo) {
      return { success: false, error: 'Insufficient balance to purchase airtime.' };
    }
    setAvailableBalanceKobo((prev) => prev - data.amountKobo);

    const ref = generateReference('BIL');
    const tx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: ref,
      userId: user.id,
      userEmail: user.email,
      type: 'airtime',
      title: `${data.network} Airtime Recharge`,
      description: `Airtime to ${data.phoneNumber}`,
      amountKobo: data.amountKobo,
      status: 'Completed',
      date: new Date().toISOString(),
      metadata: { network: data.network, phone: data.phoneNumber },
    };
    setTransactions((prev) => [tx, ...prev]);
    addNotification('Airtime Purchased', `₦${(data.amountKobo / 100).toLocaleString()} ${data.network} airtime sent to ${data.phoneNumber}.`);
    return { success: true, reference: ref };
  };

  const buyDataBundle = (data: {
    network: string;
    phoneNumber: string;
    bundleName: string;
    amountKobo: number;
  }) => {
    if (!user) return { success: false, error: 'Please log in.' };
    if (availableBalanceKobo < data.amountKobo) {
      return { success: false, error: 'Insufficient balance to purchase data.' };
    }
    setAvailableBalanceKobo((prev) => prev - data.amountKobo);

    const ref = generateReference('BIL');
    const tx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: ref,
      userId: user.id,
      userEmail: user.email,
      type: 'data',
      title: `${data.network} Data (${data.bundleName})`,
      description: `Data subscription for ${data.phoneNumber}`,
      amountKobo: data.amountKobo,
      status: 'Completed',
      date: new Date().toISOString(),
      metadata: { network: data.network, bundle: data.bundleName, phone: data.phoneNumber },
    };
    setTransactions((prev) => [tx, ...prev]);
    addNotification('Data Activated', `${data.network} ${data.bundleName} bundle activated for ${data.phoneNumber}.`);
    return { success: true, reference: ref };
  };

  const payElectricityBill = (data: {
    disco: string;
    meterNumber: string;
    meterType: 'prepaid' | 'postpaid';
    amountKobo: number;
  }) => {
    if (!user) return { success: false, error: 'Please log in.' };
    if (availableBalanceKobo < data.amountKobo) {
      return { success: false, error: 'Insufficient balance to pay electricity bill.' };
    }
    setAvailableBalanceKobo((prev) => prev - data.amountKobo);

    const token = `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ref = generateReference('BIL');
    const tx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: ref,
      userId: user.id,
      userEmail: user.email,
      type: 'electricity',
      title: `${data.disco} Electricity Bill`,
      description: `Meter #${data.meterNumber} (${data.meterType.toUpperCase()})`,
      amountKobo: data.amountKobo,
      status: 'Completed',
      date: new Date().toISOString(),
      metadata: { disco: data.disco, meterNumber: data.meterNumber, token },
    };
    setTransactions((prev) => [tx, ...prev]);
    addNotification('Electricity Bill Paid', `Token: ${token} generated for Meter ${data.meterNumber}.`);
    return { success: true, token, reference: ref };
  };

  // Admin Actions
  const adminApproveDeposit = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.type !== 'deposit') return { success: false };

    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'Completed' } : t))
    );

    // Credit user's available balance
    setAvailableBalanceKobo((prev) => prev + tx.amountKobo);

    const audit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      adminId: user?.id || 'admin',
      adminEmail: user?.email || 'emmanuelchidalu67@gmail.com',
      action: 'APPROVE_DEPOSIT',
      target: tx.reference,
      details: `Approved bank deposit of ₦${(tx.amountKobo / 100).toLocaleString()}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    addNotification(
      'Deposit Confirmed',
      `Deposit of ₦${(tx.amountKobo / 100).toLocaleString()} (Ref: ${tx.reference}) has been confirmed and credited to balance.`
    );

    return { success: true };
  };

  const adminRejectDeposit = (transactionId: string, reason: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.type !== 'deposit') return { success: false };

    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'Rejected' } : t))
    );

    const audit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      adminId: user?.id || 'admin',
      adminEmail: user?.email || 'emmanuelchidalu67@gmail.com',
      action: 'REJECT_DEPOSIT',
      target: tx.reference,
      details: `Rejected deposit of ₦${(tx.amountKobo / 100).toLocaleString()}`,
      reason,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    addNotification('Deposit Declined', `Deposit (Ref: ${tx.reference}) was rejected. Reason: ${reason}`);
    return { success: true };
  };

  const adminApproveWithdrawal = (transactionId: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.type !== 'withdrawal') return { success: false };

    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'Completed' } : t))
    );

    setPendingWithdrawalKobo((prev) => Math.max(0, prev - tx.amountKobo));

    const audit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      adminId: user?.id || 'admin',
      adminEmail: user?.email || 'emmanuelchidalu67@gmail.com',
      action: 'APPROVE_WITHDRAWAL',
      target: tx.reference,
      details: `Approved payout of ₦${(tx.amountKobo / 100).toLocaleString()} to ${tx.bankDetails?.bankName}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    addNotification(
      'Withdrawal Paid',
      `Withdrawal of ₦${(tx.amountKobo / 100).toLocaleString()} has been paid out successfully to your bank.`
    );

    return { success: true };
  };

  const adminRejectWithdrawal = (transactionId: string, reason: string) => {
    const tx = transactions.find((t) => t.id === transactionId);
    if (!tx || tx.type !== 'withdrawal') return { success: false };

    setTransactions((prev) =>
      prev.map((t) => (t.id === transactionId ? { ...t, status: 'Rejected' } : t))
    );

    setPendingWithdrawalKobo((prev) => Math.max(0, prev - tx.amountKobo));
    setAvailableBalanceKobo((prev) => prev + tx.amountKobo);

    const audit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      adminId: user?.id || 'admin',
      adminEmail: user?.email || 'emmanuelchidalu67@gmail.com',
      action: 'REJECT_WITHDRAWAL',
      target: tx.reference,
      details: `Rejected withdrawal of ₦${(tx.amountKobo / 100).toLocaleString()}. Funds restored to customer balance.`,
      reason,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    addNotification(
      'Withdrawal Refunded',
      `Withdrawal (Ref: ${tx.reference}) was rejected and ₦${(tx.amountKobo / 100).toLocaleString()} returned to your balance. Reason: ${reason}`
    );

    return { success: true };
  };

  const adminUpdatePlan = (planId: string, updates: Partial<InvestmentPlan>) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, ...updates } : p))
    );
  };

  const adminCreateTopUpCode = (data: {
    code: string;
    amountKobo: number;
    totalLimit: number;
    expiryDate: string;
    description: string;
  }) => {
    const cleanCode = data.code.trim().toUpperCase();
    if (topUpCodes.some((c) => c.code.toUpperCase() === cleanCode)) {
      return { success: false, error: 'A code with this exact text already exists.' };
    }

    const newCode: TopUpCode = {
      id: `top-${Date.now()}`,
      code: cleanCode,
      amountKobo: data.amountKobo,
      totalLimit: data.totalLimit,
      claimedCount: 0,
      claimedUserIds: [],
      expiryDate: data.expiryDate,
      description: data.description,
      status: 'active',
    };

    setTopUpCodes((prev) => [newCode, ...prev]);
    return { success: true };
  };

  const updateAdminSettings = (updates: Partial<AdminSettings>) => {
    setAdminSettings((prev) => ({ ...prev, ...updates }));
    const audit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      adminId: user?.id || 'admin',
      adminEmail: user?.email || 'emmanuelchidalu67@gmail.com',
      action: 'UPDATE_SYSTEM_SETTINGS',
      target: 'System Config',
      details: `Updated settings: ${JSON.stringify(updates)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  const adminToggleUserVerification = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isVerified: !u.isVerified } : u))
    );
    if (user && user.id === userId) {
      setUser((prev) => (prev ? { ...prev, isVerified: !prev.isVerified } : null));
    }
  };

  const adminUpdateUserFinancials = (
    userId: string,
    updates: {
      balanceKobo?: number;
      investedCapitalKobo?: number;
      totalEarnedKobo?: number;
      vipLevel?: number;
      spinBalance?: number;
      isWithdrawalBanned?: boolean;
      isSuspended?: boolean;
      fullName?: string;
      email?: string;
      phone?: string;
      role?: UserRole;
    }
  ) => {
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            ...updates,
            balanceKobo: updates.balanceKobo !== undefined ? updates.balanceKobo : u.balanceKobo,
            investedBalanceKobo: updates.investedCapitalKobo !== undefined ? updates.investedCapitalKobo : u.investedBalanceKobo,
            totalEarnedKobo: updates.totalEarnedKobo !== undefined ? updates.totalEarnedKobo : u.totalEarnedKobo,
            vipLevel: updates.vipLevel !== undefined ? updates.vipLevel : u.vipLevel,
            spinBalance: updates.spinBalance !== undefined ? updates.spinBalance : u.spinBalance,
            isWithdrawalBanned: updates.isWithdrawalBanned !== undefined ? updates.isWithdrawalBanned : u.isWithdrawalBanned,
            isSuspended: updates.isSuspended !== undefined ? updates.isSuspended : u.isSuspended,
          };
        }
        return u;
      })
    );

    // If currently logged-in user is updated, update live state too
    if (user && user.id === userId) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              ...updates,
              spinBalance: updates.spinBalance !== undefined ? updates.spinBalance : prev.spinBalance,
              investedBalanceKobo:
                updates.investedCapitalKobo !== undefined
                  ? updates.investedCapitalKobo
                  : prev.investedBalanceKobo,
              totalEarnedKobo:
                updates.totalEarnedKobo !== undefined
                  ? updates.totalEarnedKobo
                  : prev.totalEarnedKobo,
            }
          : null
      );
      if (updates.balanceKobo !== undefined) setAvailableBalanceKobo(updates.balanceKobo);
    }

    const audit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      adminId: user?.id || 'admin',
      adminEmail: user?.email || 'emmanuelchidalu67@gmail.com',
      action: 'UPDATE_USER_FINANCIALS',
      target: userId,
      details: `Admin updated balance/capital/VIP: ${JSON.stringify(updates)}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    return { success: true };
  };

  const adminDeleteUserInvestments = (userId: string) => {
    setUserInvestments((prev) => prev.filter((inv) => inv.userId !== userId));
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, investedBalanceKobo: 0 } : u))
    );
    if (user && user.id === userId) {
      setUser((prev) => (prev ? { ...prev, investedBalanceKobo: 0 } : null));
    }
    const audit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      adminId: user?.id || 'admin',
      adminEmail: user?.email || 'emmanuelchidalu67@gmail.com',
      action: 'DELETE_USER_INVESTMENTS',
      target: userId,
      details: `Admin deleted all active investments for user ${userId}`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
    return { success: true };
  };

  const adminDeleteUser = (userId: string) => {
    setAllUsers((prev) => prev.filter((u) => u.id !== userId));
    setUserInvestments((prev) => prev.filter((inv) => inv.userId !== userId));
    setTransactions((prev) => prev.filter((tx) => tx.userId !== userId));
    setBankAccounts((prev) => prev.filter((b) => b.userId !== userId));

    const audit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      adminId: user?.id || 'admin',
      adminEmail: user?.email || 'emmanuelchidalu67@gmail.com',
      action: 'DELETE_USER_PERMANENTLY',
      target: userId,
      details: `User ${userId} deleted permanently from the platform ledger.`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);

    // If deleting current user, logout
    if (user && user.id === userId) {
      logout();
    }
    return { success: true };
  };

  const adminToggleUserWithdrawalBan = (userId: string) => {
    let nextState = false;
    setAllUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          nextState = !u.isWithdrawalBanned;
          return { ...u, isWithdrawalBanned: nextState };
        }
        return u;
      })
    );
    if (user && user.id === userId) {
      setUser((prev) => (prev ? { ...prev, isWithdrawalBanned: !prev.isWithdrawalBanned } : null));
    }
    return { success: true };
  };

  const adminToggleUserSuspension = (userId: string) => {
    setAllUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isSuspended: !u.isSuspended } : u))
    );
    if (user && user.id === userId) {
      setUser((prev) => (prev ? { ...prev, isSuspended: !prev.isSuspended } : null));
    }
    return { success: true };
  };

  const adminPublishNotification = (title: string, message: string, type: NotificationItem['type'] = 'system') => {
    addNotification(title, message, type);
    const audit: AuditLogItem = {
      id: `aud-${Date.now()}`,
      adminId: user?.id || 'admin',
      adminEmail: user?.email || 'emmanuelchidalu67@gmail.com',
      action: 'PUBLISH_BROADCAST',
      target: 'All Investors',
      details: `Broadcast: "${title}"`,
      timestamp: new Date().toISOString(),
    };
    setAuditLogs((prev) => [audit, ...prev]);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        allUsers,
        isAuthenticated: !!user,
        activeTab,
        setActiveTab,
        authView,
        setAuthView,
        showSplash,
        setShowSplash,
        login,
        signup,
        verifyOtp,
        logout,
        updateProfile,
        updateWithdrawalPin,
        showCommunityModal,
        setShowCommunityModal,

        availableBalanceKobo,
        investedCapitalKobo,
        verifiedEarningsKobo,
        pendingWithdrawalKobo,

        plans,
        userInvestments,
        investInPlan,
        claimInvestmentYield,

        celebrationData,
        dismissCelebration,

        transactions,
        submitDeposit,
        submitWithdrawal,

        bankAccounts,
        addBankAccount,
        deleteBankAccount,
        setDefaultBankAccount,

        topUpCodes,
        redeemTopUpCode,

        referralStats,

        buyAirtime,
        buyDataBundle,
        payElectricityBill,

        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        addNotification,

        adminSettings,
        updateAdminSettings,
        auditLogs,
        adminApproveDeposit,
        adminRejectDeposit,
        adminApproveWithdrawal,
        adminRejectWithdrawal,
        adminUpdatePlan,
        adminCreateTopUpCode,
        adminToggleUserVerification,
        adminUpdateUserFinancials,
        adminDeleteUserInvestments,
        adminDeleteUser,
        adminToggleUserWithdrawalBan,
        adminToggleUserSuspension,
        adminPublishNotification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
