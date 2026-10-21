export type UserRole = 'user' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  countryCode: string;
  accountNumberId: string; // e.g. ACI-829104
  referralCode: string;
  referredBy?: string;
  avatarInitials: string;
  isVerified: boolean;
  welcomeBonusClaimed: boolean;
  registrationDate: string;
  withdrawalPinSet: boolean;
  role: UserRole;
  balanceKobo?: number;
  investedBalanceKobo?: number;
  totalEarnedKobo?: number;
  vipLevel?: number;
  spinBalance?: number; // User spin credits/tickets (admin editable)
  isWithdrawalBanned?: boolean;
  isSuspended?: boolean;
  whatsappPhone?: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  type?: 'bank' | 'bep20';
  bankName: string;
  bankCode: string;
  accountNumber: string; // NUBAN account number or BEP-20 address
  accountName: string;
  bep20Address?: string;
  network?: string;
  isDefault: boolean;
  createdAt: string;
}

export interface InvestmentPlan {
  id: string;
  vipTier: number; // 1 to 12
  name: string; // "APPLE CARD VIP 1"
  badge: string;
  capitalKobo: number; // In Kobo (1 Naira = 100 Kobo)
  dailyReturnKobo: number;
  durationDays: number;
  totalPayoutKobo: number;
  payoutSchedule: string; // "Daily payout"
  guaranteeBadge: string; // "100% Capital Guaranteed"
  status: 'active' | 'paused';
  popular?: boolean;
  description: string;
}

export interface UserInvestment {
  id: string;
  reference: string; // INV-2026-XXXX
  userId: string;
  planId: string;
  planName: string;
  vipTier: number;
  capitalKobo: number;
  dailyReturnKobo: number;
  durationDays: number;
  daysElapsed: number;
  totalPayoutKobo: number;
  earnedKobo: number;
  lastClaimDate: string;
  startDate: string;
  maturityDate: string;
  status: 'Active' | 'Pending' | 'Completed' | 'Cancelled';
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'investment'
  | 'daily_earning'
  | 'referral_bonus'
  | 'welcome_bonus'
  | 'topup_code'
  | 'airtime'
  | 'data'
  | 'electricity'
  | 'fee';

export type TransactionStatus = 'Pending' | 'Completed' | 'Failed' | 'Rejected';

export interface TransactionRecord {
  id: string;
  reference: string;
  userId: string;
  userEmail?: string;
  type: TransactionType;
  title: string;
  description: string;
  amountKobo: number;
  feeKobo?: number;
  status: TransactionStatus;
  date: string;
  paymentMethod?: string;
  senderName?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  metadata?: Record<string, any>;
}

export interface ReferralTierStats {
  tier: 1 | 2 | 3;
  percentage: number;
  membersCount: number;
  earningsKobo: number;
}

export interface TopUpCode {
  id: string;
  code: string;
  amountKobo: number;
  totalLimit: number;
  claimedCount: number;
  claimedUserIds: string[];
  expiryDate: string;
  description: string;
  status: 'active' | 'expired' | 'disabled';
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transaction' | 'system' | 'security' | 'reward';
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  target: string;
  details: string;
  reason?: string;
  timestamp: string;
}

export interface NigerianBank {
  name: string;
  code: string;
  slug: string;
}

export interface AdminSettings {
  withdrawalFeePercent: number; // default 15
  allowWeekendWithdrawals: boolean; // default false
  welcomeBonusKobo: number; // default 80000 (₦800)
  tier1CommissionPercent: number; // default 10
  tier2CommissionPercent: number; // default 2
  tier3CommissionPercent: number; // default 1
  whatsappGroupUrl: string;
  telegramChannelUrl: string;
  baseReferralUrl: string;
  usdtBep20Address: string;
  usdtExchangeRateNaira: number;
  depositBankName: string;
  depositAccountNumber: string;
  depositAccountName: string;
  wheelMinFriendInvestKobo: number; // 200,000 * 100
  wheelMinUserInvestKobo: number; // 500,000 * 100
}

export interface SpinPrizeItem {
  id: string;
  name: string;
  subtitle: string;
  category: 'machine' | 'bicycle' | 'fridge' | 'washing_machine' | 'power_bank' | 'try_again';
  color: string;
  iconName: string;
  marketValueNaira: number;
}

