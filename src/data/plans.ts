import { InvestmentPlan } from '../types';

export const INITIAL_INVESTMENT_PLANS: InvestmentPlan[] = [
  {
    id: 'vip-1',
    vipTier: 1,
    name: 'APPLE CARD VIP 1',
    badge: 'Diamond Starter',
    capitalKobo: 3000 * 100, // ₦3,000
    dailyReturnKobo: 710 * 100, // ₦710
    durationDays: 45,
    totalPayoutKobo: 710 * 45 * 100, // ₦31,950
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    popular: true,
    description: 'Entry-level diamond yield card designed for testing portfolio growth.'
  },
  {
    id: 'vip-2',
    vipTier: 2,
    name: 'APPLE CARD VIP 2',
    badge: 'Sapphire Growth',
    capitalKobo: 6000 * 100, // ₦6,000
    dailyReturnKobo: 1450 * 100, // ₦1,450
    durationDays: 45,
    totalPayoutKobo: 1450 * 45 * 100, // ₦65,250
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    description: 'Accelerated double-tier investment with continuous daily capital distribution.'
  },
  {
    id: 'vip-3',
    vipTier: 3,
    name: 'APPLE CARD VIP 3',
    badge: 'Emerald Standard',
    capitalKobo: 10000 * 100, // ₦10,000
    dailyReturnKobo: 2450 * 100, // ₦2,450
    durationDays: 45,
    totalPayoutKobo: 2450 * 45 * 100, // ₦110,250
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    popular: true,
    description: 'High-performing intermediate tier with steady liquidity yield.'
  },
  {
    id: 'vip-4',
    vipTier: 4,
    name: 'APPLE CARD VIP 4',
    badge: 'Ruby Premier',
    capitalKobo: 20000 * 100, // ₦20,000
    dailyReturnKobo: 5000 * 100, // ₦5,000
    durationDays: 45,
    totalPayoutKobo: 5000 * 45 * 100, // ₦225,000
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    description: 'High momentum yield card delivering ₦5,000 credited automatically every 24 hours.'
  },
  {
    id: 'vip-5',
    vipTier: 5,
    name: 'APPLE CARD VIP 5',
    badge: 'Topaz Pro',
    capitalKobo: 30000 * 100, // ₦30,000
    dailyReturnKobo: 7600 * 100, // ₦7,600
    durationDays: 45,
    totalPayoutKobo: 7600 * 45 * 100, // ₦342,000
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    description: 'Pro investor asset yielding consistent compound portfolio increments.'
  },
  {
    id: 'vip-6',
    vipTier: 6,
    name: 'APPLE CARD VIP 6',
    badge: 'Platinum Elite',
    capitalKobo: 50000 * 100, // ₦50,000
    dailyReturnKobo: 13000 * 100, // ₦13,000
    durationDays: 45,
    totalPayoutKobo: 13000 * 45 * 100, // ₦585,000
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    popular: true,
    description: 'Top-tier portfolio engine favored by community syndicate leaders.'
  },
  {
    id: 'vip-7',
    vipTier: 7,
    name: 'APPLE CARD VIP 7',
    badge: 'Titanium Vault',
    capitalKobo: 100000 * 100, // ₦100,000
    dailyReturnKobo: 26500 * 100, // ₦26,500
    durationDays: 45,
    totalPayoutKobo: 26500 * 45 * 100, // ₦1,192,500
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    description: 'Generates six-figure bi-weekly returns with priority withdrawal routing.'
  },
  {
    id: 'vip-8',
    vipTier: 8,
    name: 'APPLE CARD VIP 8',
    badge: 'Diamond Black',
    capitalKobo: 200000 * 100, // ₦200,000
    dailyReturnKobo: 54000 * 100, // ₦54,000
    durationDays: 45,
    totalPayoutKobo: 54000 * 45 * 100, // ₦2,430,000
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    description: 'Institutional-grade investment tier with dedicated VIP relationship manager.'
  },
  {
    id: 'vip-9',
    vipTier: 9,
    name: 'APPLE CARD VIP 9',
    badge: 'Royal Obsidian',
    capitalKobo: 300000 * 100, // ₦300,000
    dailyReturnKobo: 82000 * 100, // ₦82,000
    durationDays: 45,
    totalPayoutKobo: 82000 * 45 * 100, // ₦3,690,000
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    description: 'Ultra-yield card structured for high net worth portfolio allocation.'
  },
  {
    id: 'vip-10',
    vipTier: 10,
    name: 'APPLE CARD VIP 10',
    badge: 'Imperial Crown',
    capitalKobo: 500000 * 100, // ₦500,000
    dailyReturnKobo: 140000 * 100, // ₦140,000
    durationDays: 45,
    totalPayoutKobo: 140000 * 45 * 100, // ₦6,300,000
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    description: 'Premier elite membership unlocking ₦140,000 daily with zero withdrawal wait times.'
  },
  {
    id: 'vip-11',
    vipTier: 11,
    name: 'APPLE CARD VIP 11',
    badge: 'Diamond Sovereign',
    capitalKobo: 750000 * 100, // ₦750,000
    dailyReturnKobo: 215000 * 100, // ₦215,000
    durationDays: 45,
    totalPayoutKobo: 215000 * 45 * 100, // ₦9,675,000
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    description: 'Exceptional wealth creation card for high-level partners.'
  },
  {
    id: 'vip-12',
    vipTier: 12,
    name: 'APPLE CARD VIP 12',
    badge: 'Unstoppable Diamond Infinite',
    capitalKobo: 1000000 * 100, // ₦1,000,000
    dailyReturnKobo: 295000 * 100, // ₦295,000
    durationDays: 45,
    totalPayoutKobo: 295000 * 45 * 100, // ₦13,275,000
    payoutSchedule: 'Every 24 Hours (Daily)',
    guaranteeBadge: '100% Capital Guaranteed',
    status: 'active',
    description: 'The pinnacle of Apple Card Investment. Unstoppable wealth velocity and prestige.'
  }
];
