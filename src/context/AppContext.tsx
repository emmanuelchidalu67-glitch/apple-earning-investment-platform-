import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
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
import { apiRequest, setInMemorySessionToken } from '../utils/api';

const ADMIN_EMAIL = 'emmanuelchidalu67@gmail.com';
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

interface CelebrationData {
  planName: string;
  capitalKobo: number;
  dailyYieldKobo: number;
}

interface AdminStats {
  totalActiveCapitalPoolKobo: number;
  totalUserBalancesKobo: number;
  totalUserEarnedKobo: number;
}

interface AppContextType {
  // Auth & Profile
  user: UserProfile | null;
  allUsers: UserProfile[];
  downlines: UserProfile[];
  downlineMaxInvestKobo: number;
  isAuthenticated: boolean;
  activeTab: 'home' | 'plans' | 'invest' | 'team' | 'profile' | 'admin';
  setActiveTab: (tab: 'home' | 'plans' | 'invest' | 'team' | 'profile' | 'admin') => void;
  authView: 'login' | 'signup' | 'forgot_password' | 'verify_otp' | null;
  setAuthView: (view: 'login' | 'signup' | 'forgot_password' | 'verify_otp' | null) => void;
  showSplash: boolean;
  setShowSplash: (show: boolean) => void;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    fullName: string;
    email: string;
    phone: string;
    countryCode: string;
    withdrawalPin: string;
    password?: string;
    referralCode?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  updateWithdrawalPin: (newPin: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  showCommunityModal: boolean;
  setShowCommunityModal: (show: boolean) => void;
  refreshState: () => Promise<void>;
  refreshAdminDashboard: () => Promise<void>;

  // Financial Balances (in Kobo)
  availableBalanceKobo: number;
  investedCapitalKobo: number;
  verifiedEarningsKobo: number;
  pendingWithdrawalKobo: number;
  liveAccruingKobo: number;
  totalLiveProfitKobo: number;
  perSecondYieldKobo: number;

  // Plans & Investments
  plans: InvestmentPlan[];
  userInvestments: UserInvestment[];
  investInPlan: (planId: string) => Promise<{ success: boolean; error?: string; reference?: string }>;

  // Subtle Canvas Celebration
  celebrationData: CelebrationData | null;
  dismissCelebration: () => void;

  // Transactions & History
  transactions: TransactionRecord[];
  publicFeedWithdrawals: TransactionRecord[];
  submitDeposit: (data: {
    amountKobo: number;
    senderName: string;
    senderReference?: string;
    paymentMethod: string;
  }) => Promise<{ success: boolean; reference: string; error?: string }>;
  submitWithdrawal: (data: {
    amountKobo: number;
    bankAccountId: string;
    withdrawalPin: string;
  }) => Promise<{ success: boolean; error?: string; reference?: string }>;

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
  }) => Promise<{ success: boolean; error?: string }>;
  deleteBankAccount: (id: string) => Promise<void>;
  setDefaultBankAccount: (id: string) => Promise<void>;

  // Top-Up Codes
  topUpCodes: TopUpCode[];
  redeemTopUpCode: (codeStr: string) => Promise<{ success: boolean; message: string; amountKobo?: number }>;

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
  }) => Promise<{ success: boolean; error?: string; reference?: string }>;
  buyDataBundle: (data: {
    network: string;
    phoneNumber: string;
    bundleName: string;
    amountKobo: number;
  }) => Promise<{ success: boolean; error?: string; reference?: string }>;
  payElectricityBill: (data: {
    disco: string;
    meterNumber: string;
    meterType: 'prepaid' | 'postpaid';
    amountKobo: number;
  }) => Promise<{ success: boolean; error?: string; token?: string; reference?: string }>;

  // Notifications
  notifications: NotificationItem[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Lucky Wheel
  recordWheelSpin: (wonPrizeTitle?: string, wonPrizeMessage?: string) => Promise<void>;

  // Admin Capabilities & System Controls
  adminSettings: AdminSettings;
  adminTransactions: TransactionRecord[];
  adminInvestments: UserInvestment[];
  adminBankAccounts: BankAccount[];
  adminTopUpCodes: TopUpCode[];
  adminStats: AdminStats;
  auditLogs: AuditLogItem[];
  updateAdminSettings: (updates: Partial<AdminSettings>) => Promise<void>;
  adminApproveDeposit: (transactionId: string) => Promise<{ success: boolean; error?: string }>;
  adminRejectDeposit: (transactionId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  adminApproveWithdrawal: (transactionId: string) => Promise<{ success: boolean; error?: string }>;
  adminRejectWithdrawal: (transactionId: string, reason: string) => Promise<{ success: boolean; error?: string }>;
  adminUpdatePlan: (planId: string, updates: Partial<InvestmentPlan>) => Promise<void>;
  adminCreateTopUpCode: (data: {
    code: string;
    amountKobo: number;
    totalLimit: number;
    expiryDate: string;
    description: string;
  }) => Promise<{ success: boolean; error?: string }>;
  adminToggleUserVerification: (userId: string) => Promise<void>;
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
  ) => Promise<{ success: boolean; error?: string }>;
  adminDeleteUserInvestments: (userId: string) => Promise<{ success: boolean; error?: string }>;
  adminDeleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  adminToggleUserWithdrawalBan: (userId: string) => Promise<{ success: boolean; error?: string }>;
  adminToggleUserSuspension: (userId: string) => Promise<{ success: boolean; error?: string }>;
  adminPublishNotification: (
    title: string,
    message: string,
    type?: NotificationItem['type']
  ) => Promise<{ success: boolean; error?: string }>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  withdrawalFeePercent: 15,
  allowWeekendWithdrawals: false,
  welcomeBonusKobo: 800 * 100,
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

const EMPTY_REFERRAL_STATS = (settings: AdminSettings) => ({
  tier1: {
    tier: 1 as const,
    percentage: settings.tier1CommissionPercent,
    membersCount: 0,
    earningsKobo: 0,
  },
  tier2: {
    tier: 2 as const,
    percentage: settings.tier2CommissionPercent,
    membersCount: 0,
    earningsKobo: 0,
  },
  tier3: {
    tier: 3 as const,
    percentage: settings.tier3CommissionPercent,
    membersCount: 0,
    earningsKobo: 0,
  },
  totalMembers: 0,
  pendingRewardsKobo: 0,
  verifiedRewardsKobo: 0,
});

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTabState] = useState<'home' | 'plans' | 'invest' | 'team' | 'profile' | 'admin'>('home');
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot_password' | 'verify_otp' | null>('signup');
  const [showCommunityModal, setShowCommunityModal] = useState<boolean>(false);
  const [celebrationData, setCelebrationData] = useState<CelebrationData | null>(null);

  // Public + Personal Hydrated States
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [plans, setPlans] = useState<InvestmentPlan[]>(INITIAL_INVESTMENT_PLANS);
  const [availableBalanceKobo, setAvailableBalanceKobo] = useState<number>(0);
  const [investedCapitalKobo, setInvestedCapitalKobo] = useState<number>(0);
  const [verifiedEarningsKobo, setVerifiedEarningsKobo] = useState<number>(0);
  const [pendingWithdrawalKobo, setPendingWithdrawalKobo] = useState<number>(0);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [topUpCodes, setTopUpCodes] = useState<TopUpCode[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [referralStats, setReferralStats] = useState(() => EMPTY_REFERRAL_STATS(DEFAULT_ADMIN_SETTINGS));
  const [downlines, setDownlines] = useState<UserProfile[]>([]);
  const [downlineMaxInvestKobo, setDownlineMaxInvestKobo] = useState<number>(0);
  const [publicFeedWithdrawals, setPublicFeedWithdrawals] = useState<TransactionRecord[]>([]);

  // Admin-only states (never populated unless authenticated user is ADMIN_EMAIL)
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [adminTransactions, setAdminTransactions] = useState<TransactionRecord[]>([]);
  const [adminInvestments, setAdminInvestments] = useState<UserInvestment[]>([]);
  const [adminBankAccounts, setAdminBankAccounts] = useState<BankAccount[]>([]);
  const [adminTopUpCodes, setAdminTopUpCodes] = useState<TopUpCode[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalActiveCapitalPoolKobo: 0,
    totalUserBalancesKobo: 0,
    totalUserEarnedKobo: 0,
  });

  // Live 1-second ticking clock for real-time yield counting
  const [liveClockMs, setLiveClockMs] = useState<number>(() => Date.now());
  const lastCycleRefreshRef = useRef<number>(0);

  const isSoleAdmin = Boolean(
    user && user.role === 'admin' && user.email?.toLowerCase() === ADMIN_EMAIL
  );

  const applyHydratedState = useCallback((state: any) => {
    if (!state || !state.user) return;
    const u: UserProfile = { ...state.user };
    if (u.email?.toLowerCase() !== ADMIN_EMAIL) {
      u.role = 'user';
    }
    setUser(u);
    setAuthView(null);
    setAvailableBalanceKobo(Number(state.availableBalanceKobo) || 0);
    setInvestedCapitalKobo(Number(state.investedCapitalKobo) || 0);
    setVerifiedEarningsKobo(Number(state.verifiedEarningsKobo) || 0);
    setPendingWithdrawalKobo(Number(state.pendingWithdrawalKobo) || 0);
    if (Array.isArray(state.plans)) setPlans(state.plans);
    if (Array.isArray(state.userInvestments)) setUserInvestments(state.userInvestments);
    if (Array.isArray(state.transactions)) setTransactions(state.transactions);
    if (Array.isArray(state.bankAccounts)) setBankAccounts(state.bankAccounts);
    if (Array.isArray(state.topUpCodes)) setTopUpCodes(state.topUpCodes);
    if (Array.isArray(state.notifications)) setNotifications(state.notifications);
    if (state.adminSettings) setAdminSettings(state.adminSettings);
    if (state.referralStats) setReferralStats(state.referralStats);
    if (Array.isArray(state.downlines)) setDownlines(state.downlines);
    setDownlineMaxInvestKobo(Number(state.downlineMaxInvestKobo) || 0);
    if (Array.isArray(state.publicFeedWithdrawals)) setPublicFeedWithdrawals(state.publicFeedWithdrawals);
  }, []);

  const applyAdminDashboardData = useCallback((adminData: any) => {
    if (!adminData) return;
    if (Array.isArray(adminData.allUsers)) setAllUsers(adminData.allUsers);
    if (Array.isArray(adminData.plans)) setPlans(adminData.plans);
    if (Array.isArray(adminData.userInvestments)) setAdminInvestments(adminData.userInvestments);
    if (Array.isArray(adminData.transactions)) setAdminTransactions(adminData.transactions);
    if (Array.isArray(adminData.bankAccounts)) setAdminBankAccounts(adminData.bankAccounts);
    if (Array.isArray(adminData.topUpCodes)) setAdminTopUpCodes(adminData.topUpCodes);
    if (Array.isArray(adminData.auditLogs)) setAuditLogs(adminData.auditLogs);
    if (adminData.adminSettings) setAdminSettings(adminData.adminSettings);
    if (adminData.stats) setAdminStats(adminData.stats);
  }, []);

  const clearAuthenticatedState = useCallback(() => {
    setInMemorySessionToken(null);
    setUser(null);
    setActiveTabState('home');
    setAuthView('signup');
    setAvailableBalanceKobo(0);
    setInvestedCapitalKobo(0);
    setVerifiedEarningsKobo(0);
    setPendingWithdrawalKobo(0);
    setUserInvestments([]);
    setTransactions([]);
    setBankAccounts([]);
    setTopUpCodes([]);
    setNotifications([]);
    setDownlines([]);
    setDownlineMaxInvestKobo(0);
    setAllUsers([]);
    setAdminTransactions([]);
    setAdminInvestments([]);
    setAdminBankAccounts([]);
    setAdminTopUpCodes([]);
    setAuditLogs([]);
    setAdminStats({
      totalActiveCapitalPoolKobo: 0,
      totalUserBalancesKobo: 0,
      totalUserEarnedKobo: 0,
    });
  }, []);

  const refreshState = useCallback(async () => {
    const res = await apiRequest('/api/state');
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      if (res.adminData) {
        applyAdminDashboardData(res.adminData);
      }
    }
  }, [applyHydratedState, applyAdminDashboardData]);

  const refreshAdminDashboard = useCallback(async () => {
    const res = await apiRequest('/api/admin/dashboard');
    if (res?.success && res.adminData) {
      applyAdminDashboardData(res.adminData);
    }
  }, [applyAdminDashboardData]);

  // Set activeTab with immediate admin dashboard fetch + non-admin guard
  const setActiveTab = useCallback(
    (tab: 'home' | 'plans' | 'invest' | 'team' | 'profile' | 'admin') => {
      if (tab === 'admin' && !isSoleAdmin) {
        setActiveTabState('home');
        return;
      }
      setActiveTabState(tab);
      if (tab === 'admin' && isSoleAdmin) {
        void refreshAdminDashboard();
      }
    },
    [isSoleAdmin, refreshAdminDashboard]
  );

  // Bootstrap public settings & restore authenticated cookie session on mount
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const pub = await apiRequest('/api/public/bootstrap');
      if (!cancelled && pub?.success) {
        if (pub.adminSettings) setAdminSettings(pub.adminSettings);
        if (Array.isArray(pub.plans)) setPlans(pub.plans);
        if (Array.isArray(pub.publicFeedWithdrawals)) setPublicFeedWithdrawals(pub.publicFeedWithdrawals);
      }

      const st = await apiRequest('/api/state');
      if (!cancelled && st?.success && st.state) {
        applyHydratedState(st.state);
        if (st.adminData) {
          applyAdminDashboardData(st.adminData);
        }
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [applyHydratedState, applyAdminDashboardData]);

  // Real-time Server-Sent Events subscription when authenticated
  useEffect(() => {
    if (!user) return;
    let source: EventSource | null = null;
    try {
      source = new EventSource('/api/events', { withCredentials: true });
      source.addEventListener('sync', () => {
        void refreshState();
        if (isSoleAdmin) {
          void refreshAdminDashboard();
        }
      });
    } catch {
      // Fallback polling below keeps UI fresh
    }

    return () => {
      source?.close();
    };
  }, [user?.id, isSoleAdmin, refreshState, refreshAdminDashboard]);

  // Fast background sync when Admin Portal is open (every 4s) so new registrations show instantly
  useEffect(() => {
    if (!isSoleAdmin || activeTab !== 'admin') return;
    const timer = setInterval(() => {
      void refreshAdminDashboard();
    }, 4000);
    return () => clearInterval(timer);
  }, [isSoleAdmin, activeTab, refreshAdminDashboard]);

  // Live 1-second yield ticking + automatic 24h cycle settlement refresh
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setLiveClockMs(now);

      if (user) {
        const dueInv = userInvestments.some((inv) => {
          if (inv.status !== 'Active') return false;
          const lastClaim = new Date(inv.lastClaimDate || inv.startDate).getTime();
          return now - lastClaim >= ONE_DAY_MS && inv.daysElapsed < inv.durationDays;
        });
        if (dueInv && now - lastCycleRefreshRef.current > 10000) {
          lastCycleRefreshRef.current = now;
          void refreshState();
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [user, userInvestments, refreshState]);

  // Calculate live fractional accruing yield across all active plans
  const activeUserInvs = userInvestments.filter((inv) => inv.status === 'Active');
  const liveAccruingKobo = activeUserInvs.reduce((sum, inv) => {
    const lastClaim = new Date(inv.lastClaimDate || inv.startDate).getTime();
    const elapsedInCycle = Math.min(ONE_DAY_MS, Math.max(0, liveClockMs - lastClaim));
    return sum + (inv.dailyReturnKobo * elapsedInCycle) / ONE_DAY_MS;
  }, 0);

  const perSecondYieldKobo = activeUserInvs.reduce((sum, inv) => {
    return sum + inv.dailyReturnKobo / 86400;
  }, 0);

  const totalLiveProfitKobo = verifiedEarningsKobo + liveAccruingKobo;

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  // ==========================================
  // AUTH ACTIONS
  // ==========================================
  const login = async (identifier: string, pass: string) => {
    const res = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password: pass }),
    });
    if (!res?.success || !res.state) {
      return { success: false, error: res?.error || 'Login failed. Please check your credentials.' };
    }
    if (res.sessionToken) {
      setInMemorySessionToken(res.sessionToken);
    }
    applyHydratedState(res.state);
    if (res.adminData) {
      applyAdminDashboardData(res.adminData);
    }
    setActiveTabState('home');
    setShowCommunityModal(true);
    return { success: true };
  };

  const signup = async (data: {
    fullName: string;
    email: string;
    phone: string;
    countryCode: string;
    withdrawalPin: string;
    password?: string;
    referralCode?: string;
  }) => {
    const res = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!res?.success || !res.state) {
      return { success: false, error: res?.error || 'Registration failed. Please try again.' };
    }
    if (res.sessionToken) {
      setInMemorySessionToken(res.sessionToken);
    }
    applyHydratedState(res.state);
    setActiveTabState('home');
    setShowCommunityModal(true);
    return { success: true };
  };

  const logout = async () => {
    await apiRequest('/api/auth/logout', { method: 'POST' });
    clearAuthenticatedState();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    const res = await apiRequest('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to update profile.' };
  };

  const updateWithdrawalPin = async (newPin: string) => {
    const res = await apiRequest('/api/profile/pin', {
      method: 'POST',
      body: JSON.stringify({ newPin }),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to update PIN.' };
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    const res = await apiRequest('/api/profile/password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to update password.' };
  };

  // ==========================================
  // INVESTMENTS & BANKING
  // ==========================================
  const investInPlan = async (planId: string) => {
    const res = await apiRequest('/api/investments', {
      method: 'POST',
      body: JSON.stringify({ planId }),
    });
    if (!res?.success) {
      return { success: false, error: res?.error || 'Failed to activate investment.' };
    }
    if (res.state) applyHydratedState(res.state);
    if (res.celebration) setCelebrationData(res.celebration);
    return { success: true, reference: res.reference };
  };

  const dismissCelebration = () => setCelebrationData(null);

  const submitDeposit = async (data: {
    amountKobo: number;
    senderName: string;
    senderReference?: string;
    paymentMethod: string;
  }) => {
    const res = await apiRequest('/api/deposits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      return { success: true, reference: res.reference };
    }
    return { success: false, reference: '', error: res?.error || 'Deposit submission failed.' };
  };

  const submitWithdrawal = async (data: {
    amountKobo: number;
    bankAccountId: string;
    withdrawalPin: string;
  }) => {
    const res = await apiRequest('/api/withdrawals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      return { success: true, reference: res.reference };
    }
    return { success: false, error: res?.error || 'Withdrawal submission failed.' };
  };

  const addBankAccount = async (data: {
    bankName: string;
    bankCode: string;
    accountNumber: string;
    accountName: string;
    type?: 'bank' | 'bep20';
    bep20Address?: string;
    network?: string;
  }) => {
    const res = await apiRequest('/api/banks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to add bank account.' };
  };

  const deleteBankAccount = async (id: string) => {
    const res = await apiRequest(`/api/banks/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
    }
  };

  const setDefaultBankAccount = async (id: string) => {
    const res = await apiRequest(`/api/banks/${encodeURIComponent(id)}/default`, {
      method: 'PATCH',
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
    }
  };

  const redeemTopUpCode = async (codeStr: string) => {
    const res = await apiRequest('/api/topup/redeem', {
      method: 'POST',
      body: JSON.stringify({ code: codeStr }),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
    }
    return {
      success: Boolean(res?.success),
      message: res?.message || res?.error || 'Unable to redeem code.',
      amountKobo: res?.amountKobo,
    };
  };

  // ==========================================
  // UTILITIES
  // ==========================================
  const buyAirtime = async (data: { network: string; phoneNumber: string; amountKobo: number }) => {
    const res = await apiRequest('/api/utilities/buy', {
      method: 'POST',
      body: JSON.stringify({ kind: 'airtime', ...data }),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      return { success: true, reference: res.reference };
    }
    return { success: false, error: res?.error || 'Airtime purchase failed.' };
  };

  const buyDataBundle = async (data: {
    network: string;
    phoneNumber: string;
    bundleName: string;
    amountKobo: number;
  }) => {
    const res = await apiRequest('/api/utilities/buy', {
      method: 'POST',
      body: JSON.stringify({ kind: 'data', ...data }),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      return { success: true, reference: res.reference };
    }
    return { success: false, error: res?.error || 'Data purchase failed.' };
  };

  const payElectricityBill = async (data: {
    disco: string;
    meterNumber: string;
    meterType: 'prepaid' | 'postpaid';
    amountKobo: number;
  }) => {
    const res = await apiRequest('/api/utilities/buy', {
      method: 'POST',
      body: JSON.stringify({ kind: 'electricity', ...data }),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
      return { success: true, reference: res.reference, token: res.token };
    }
    return { success: false, error: res?.error || 'Electricity payment failed.' };
  };

  // ==========================================
  // NOTIFICATIONS & LUCKY WHEEL
  // ==========================================
  const markNotificationAsRead = async (id: string) => {
    const res = await apiRequest(`/api/notifications/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
    }
  };

  const markAllNotificationsAsRead = async () => {
    const res = await apiRequest('/api/notifications/read-all', {
      method: 'POST',
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
    }
  };

  const recordWheelSpin = async (wonPrizeTitle?: string, wonPrizeMessage?: string) => {
    const res = await apiRequest('/api/wheel/spin', {
      method: 'POST',
      body: JSON.stringify({ wonPrizeTitle, wonPrizeMessage }),
    });
    if (res?.success && res.state) {
      applyHydratedState(res.state);
    }
  };

  // ==========================================
  // SOLE ADMIN OPERATIONS
  // ==========================================
  const updateAdminSettings = async (updates: Partial<AdminSettings>) => {
    const res = await apiRequest('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(updates),
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
    }
  };

  const adminApproveDeposit = async (transactionId: string) => {
    const res = await apiRequest(`/api/admin/deposits/${encodeURIComponent(transactionId)}/approve`, {
      method: 'POST',
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to approve deposit.' };
  };

  const adminRejectDeposit = async (transactionId: string, reason: string) => {
    const res = await apiRequest(`/api/admin/deposits/${encodeURIComponent(transactionId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to reject deposit.' };
  };

  const adminApproveWithdrawal = async (transactionId: string) => {
    const res = await apiRequest(`/api/admin/withdrawals/${encodeURIComponent(transactionId)}/approve`, {
      method: 'POST',
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to approve withdrawal.' };
  };

  const adminRejectWithdrawal = async (transactionId: string, reason: string) => {
    const res = await apiRequest(`/api/admin/withdrawals/${encodeURIComponent(transactionId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to reject withdrawal.' };
  };

  const adminUpdatePlan = async (planId: string, updates: Partial<InvestmentPlan>) => {
    const res = await apiRequest(`/api/admin/plans/${encodeURIComponent(planId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
    }
  };

  const adminCreateTopUpCode = async (data: {
    code: string;
    amountKobo: number;
    totalLimit: number;
    expiryDate: string;
    description: string;
  }) => {
    const res = await apiRequest('/api/admin/codes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to create promo code.' };
  };

  const adminUpdateUserFinancials = async (
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
    const res = await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to update user.' };
  };

  const adminToggleUserVerification = async (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return;
    await adminUpdateUserFinancials(userId, { isVerified: !target.isVerified } as any);
  };

  const adminToggleUserWithdrawalBan = async (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };
    return adminUpdateUserFinancials(userId, { isWithdrawalBanned: !target.isWithdrawalBanned });
  };

  const adminToggleUserSuspension = async (userId: string) => {
    const target = allUsers.find((u) => u.id === userId);
    if (!target) return { success: false, error: 'User not found.' };
    return adminUpdateUserFinancials(userId, { isSuspended: !target.isSuspended });
  };

  const adminDeleteUserInvestments = async (userId: string) => {
    const res = await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}/investments`, {
      method: 'DELETE',
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to delete user investments.' };
  };

  const adminDeleteUser = async (userId: string) => {
    const res = await apiRequest(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to delete user.' };
  };

  const adminPublishNotification = async (
    title: string,
    message: string,
    type: NotificationItem['type'] = 'system'
  ) => {
    const res = await apiRequest('/api/admin/broadcast', {
      method: 'POST',
      body: JSON.stringify({ title, message, type }),
    });
    if (res?.success) {
      if (res.state) applyHydratedState(res.state);
      if (res.adminData) applyAdminDashboardData(res.adminData);
      return { success: true };
    }
    return { success: false, error: res?.error || 'Failed to publish broadcast.' };
  };

  return (
    <AppContext.Provider
      value={{
        user,
        allUsers,
        downlines,
        downlineMaxInvestKobo,
        isAuthenticated: !!user,
        activeTab,
        setActiveTab,
        authView,
        setAuthView,
        showSplash,
        setShowSplash,
        login,
        signup,
        logout,
        updateProfile,
        updateWithdrawalPin,
        updatePassword,
        showCommunityModal,
        setShowCommunityModal,
        refreshState,
        refreshAdminDashboard,
        availableBalanceKobo,
        investedCapitalKobo,
        verifiedEarningsKobo,
        pendingWithdrawalKobo,
        liveAccruingKobo,
        totalLiveProfitKobo,
        perSecondYieldKobo,
        plans,
        userInvestments,
        investInPlan,
        celebrationData,
        dismissCelebration,
        transactions,
        publicFeedWithdrawals,
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
        recordWheelSpin,
        adminSettings,
        adminTransactions,
        adminInvestments,
        adminBankAccounts,
        adminTopUpCodes,
        adminStats,
        auditLogs,
        updateAdminSettings,
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
