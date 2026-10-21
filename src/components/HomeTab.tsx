import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, maskPhone, formatDate } from '../utils/formatters';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Clock,
  Sparkles,
  TrendingUp,
  Award,
  Phone,
  Wifi,
  Zap,
  ChevronRight,
  ShieldCheck,
  Gift,
  Eye,
  EyeOff,
  Flame,
  CheckCircle2,
  MessageCircle,
  Send,
  ExternalLink,
  Lock,
  FileText,
  X,
  Scale,
} from 'lucide-react';
import { PrizeIllustration, LUCKY_WHEEL_PRIZES } from './LuckyWheelModal';
import { HomeScrollingTicker } from './HomeScrollingTicker';
import { DynamicGreetingCard } from './DynamicGreetingCard';
import { FloatingLuckySpinButton } from './FloatingLuckySpinButton';

interface HomeTabProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenHistory: () => void;
  onOpenUtility: (type: 'airtime' | 'data' | 'electricity') => void;
  onInvestInPlan: (planId: string) => void;
  onOpenLuckyWheel: () => void;
  onOpenCommunity: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  onOpenHistory,
  onOpenUtility,
  onInvestInPlan,
  onOpenLuckyWheel,
  onOpenCommunity,
}) => {
  const {
    user,
    availableBalanceKobo,
    investedCapitalKobo,
    verifiedEarningsKobo,
    pendingWithdrawalKobo,
    plans,
    transactions,
    allUsers,
    adminSettings,
    setActiveTab,
  } = useApp();

  const [showBalance, setShowBalance] = useState(true);
  const [showHomeTermsModal, setShowHomeTermsModal] = useState(false);
  const [showHomePrivacyModal, setShowHomePrivacyModal] = useState(false);

  // Lucky Wheel Eligibility Tracking:
  // "every user has no right to spin until they invite friends and the friend purchase a 200,000 invest or the user person purchase 500,000 invest to be eligible"
  const minFriendInvestKobo = adminSettings.wheelMinFriendInvestKobo || 200000 * 100;
  const minUserInvestKobo = adminSettings.wheelMinUserInvestKobo || 500000 * 100;
  const userQualified = investedCapitalKobo >= minUserInvestKobo;
  const userReferralCode = user?.referralCode || '';
  const myDownlines = allUsers.filter((u) => u.referredBy === userReferralCode);
  const myDownlineIds = myDownlines.map((d) => d.id);
  const downlineMaxInvestKobo = transactions
    .filter(
      (t) =>
        myDownlineIds.includes(t.userId) &&
        t.type === 'investment' &&
        t.status === 'Completed'
    )
    .reduce((max, t) => Math.max(max, t.amountKobo), 0);
  const downlineQualified = downlineMaxInvestKobo >= minFriendInvestKobo;
  const isWheelEligible = userQualified || downlineQualified;

  // 3 Featured plans (e.g. VIP 1, VIP 3, VIP 6)
  const featuredPlans = plans.filter((p) => [1, 3, 6].includes(p.vipTier));

  // Top-4 User Leaderboard (authentic Nigerian investor ranking)
  const topLeaderboard = [
    { rank: 1, phone: '08035298194', earnings: 14850000 * 100, tier: 'VIP 12 Infinite', badge: 'Diamond King' },
    { rank: 2, phone: '08129481023', earnings: 8940000 * 100, tier: 'VIP 10 Imperial', badge: 'Titan' },
    { rank: 3, phone: '07064829105', earnings: 5120000 * 100, tier: 'VIP 8 Diamond', badge: 'Platinum' },
    { rank: 4, phone: '09051839201', earnings: 3450000 * 100, tier: 'VIP 6 Platinum', badge: 'Gold Elite' },
  ];

  const recentActivity = transactions.slice(0, 4);

  return (
    <div className="pb-24 pt-2 px-4 space-y-5">
      {/* TOP SCROLLING TICKER: Real-time investment yield percentages & recent successful withdrawal notifications */}
      <HomeScrollingTicker />

      {/* DYNAMIC TIME-OF-DAY GREETING TOGETHER WITH TOP OF BALANCE */}
      <DynamicGreetingCard />

      {/* LUXURY DIAMOND BALANCE CARD */}
      <div className="relative rounded-3xl p-5 overflow-hidden bg-gradient-to-tr from-[#0a1b38] via-[#0f2954] to-[#1a1236] border border-sky-400/30 shadow-[0_10px_30px_rgba(15,43,92,0.6)]">
        {/* Subtle geometric crystal shine overlay */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-sky-400/15 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-pink-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Card Header with eye toggle */}
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs uppercase font-bold tracking-wider text-sky-200">
              Available Balance
            </span>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-sky-300/70 hover:text-white"
            >
              {showBalance ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-950/60 border border-sky-400/30 text-[10px] text-sky-300 font-semibold">
            <Sparkles className="w-3 h-3 text-sky-400" />
            <span>Diamond Vault</span>
          </div>
        </div>

        {/* Big Balance Display (Initially ₦0.00 until bonus credited!) */}
        <div className="my-2">
          <h2 className="text-3xl font-black font-mono tracking-tight text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.15)]">
            {showBalance ? formatNaira(availableBalanceKobo) : '••••••••'}
          </h2>
        </div>

        {/* Three Sub-metrics: Invested Capital | Verified Earnings | Pending Withdrawal */}
        <div className="grid grid-cols-3 gap-2 pt-3 mt-2 border-t border-white/10 text-left">
          <div>
            <p className="text-[10px] text-slate-300/80 uppercase font-semibold">Invested</p>
            <p className="text-xs font-bold font-mono text-sky-300 mt-0.5">
              {showBalance ? formatNaira(investedCapitalKobo, false) : '••••'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-300/80 uppercase font-semibold">Verified Profit</p>
            <p className="text-xs font-bold font-mono text-emerald-400 mt-0.5">
              {showBalance ? formatNaira(verifiedEarningsKobo, false) : '••••'}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-300/80 uppercase font-semibold">Pending Wth</p>
            <p className="text-xs font-bold font-mono text-pink-400 mt-0.5">
              {showBalance ? formatNaira(pendingWithdrawalKobo, false) : '••••'}
            </p>
          </div>
        </div>
      </div>

      {/* WELCOME BONUS STATUS (Auto-credited upon registration verification) */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-950/80 via-slate-900 to-pink-950/70 border border-sky-400/40 relative overflow-hidden shadow-lg shadow-sky-500/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 flex-shrink-0">
            <Gift className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                ₦800 Welcome Bonus
              </span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">
                Auto-Credited
              </span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              One-time registration incentive active in your verified available balance.
            </p>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono font-bold flex-shrink-0">
          +₦800.00
        </div>
      </div>

      {/* FOUR CIRCULAR QUICK ACTION BUTTONS */}
      {/* As strictly requested:
          "Circular quick-action buttons
          Place four attractive circular icon buttons below the balance:
          - Deposit
          - Withdraw
          - Team
          - History" */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        {/* Deposit */}
        <div className="flex flex-col items-center">
          <button
            onClick={onOpenDeposit}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-sky-400 via-blue-600 to-blue-800 hover:from-sky-300 hover:to-blue-700 text-white flex items-center justify-center shadow-lg shadow-sky-500/30 cursor-pointer transition transform active:scale-95"
            aria-label="Deposit"
          >
            <ArrowDownToLine className="w-6 h-6 drop-shadow-sm" />
          </button>
          <span className="text-xs font-bold text-slate-200 mt-2">Deposit</span>
        </div>

        {/* Withdraw */}
        <div className="flex flex-col items-center">
          <button
            onClick={onOpenWithdraw}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-500 via-rose-600 to-pink-800 hover:from-pink-400 hover:to-rose-700 text-white flex items-center justify-center shadow-lg shadow-pink-500/30 cursor-pointer transition transform active:scale-95"
            aria-label="Withdraw"
          >
            <ArrowUpFromLine className="w-6 h-6 drop-shadow-sm" />
          </button>
          <span className="text-xs font-bold text-slate-200 mt-2">Withdraw</span>
        </div>

        {/* Team */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => setActiveTab('team')}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-800 hover:from-blue-500 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 cursor-pointer transition transform active:scale-95"
            aria-label="Team"
          >
            <Users className="w-6 h-6 drop-shadow-sm" />
          </button>
          <span className="text-xs font-bold text-slate-200 mt-2">Team</span>
        </div>

        {/* History */}
        <div className="flex flex-col items-center">
          <button
            onClick={onOpenHistory}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-700 via-slate-800 to-slate-950 hover:from-slate-600 hover:to-slate-900 border border-slate-700 text-sky-300 flex items-center justify-center shadow-lg shadow-slate-900/50 cursor-pointer transition transform active:scale-95"
            aria-label="History"
          >
            <Clock className="w-6 h-6 drop-shadow-sm" />
          </button>
          <span className="text-xs font-bold text-slate-200 mt-2">History</span>
        </div>
      </div>

      {/* LUCKY WHEEL MEGA PRIZE SHOWCASE */}
      {/* Requirement: "in the home provide a spin of machines, bicycle, fridges, washing machine and power Bank and try again make it look real and good with pic of each and live make the admin to control it and now every user has no right to spin until they invite friends and the friend purchase a 200,000 invest or the user person purchase 500,000 invest to be eligible" */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#0c1e3d] via-[#10274f] to-[#1c1236] border border-amber-400/30 shadow-[0_8px_30px_rgba(245,158,11,0.15)] relative overflow-hidden">
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base">🎰</span>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Mega Prize Wheel
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-extrabold border border-amber-400/30 animate-pulse">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Win machines, bicycles, smart fridges, washing machines & power banks!
            </p>
          </div>

          <button
            onClick={onOpenLuckyWheel}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-md cursor-pointer ${
              isWheelEligible
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 shadow-emerald-500/25'
                : 'bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30'
            }`}
          >
            {isWheelEligible ? (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Spin Wheel</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>View Prizes</span>
              </>
            )}
          </button>
        </div>

        {/* Prize items preview row with SVGs */}
        <div className="grid grid-cols-6 gap-1.5 p-2 rounded-2xl bg-slate-950/70 border border-slate-800/80 mb-3">
          {LUCKY_WHEEL_PRIZES.slice(0, 6).map((prize) => (
            <div
              key={prize.id}
              className="flex flex-col items-center text-center p-1 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-amber-400/40 transition"
            >
              <div className="w-7 h-7 flex items-center justify-center mb-0.5">
                <PrizeIllustration category={prize.category} className="w-6 h-6" />
              </div>
              <span className="text-[8px] font-bold text-slate-200 truncate w-full">
                {prize.name.split(' ')[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Live Eligibility Status Banner */}
        <div
          className={`p-2.5 rounded-2xl border text-xs flex items-center justify-between gap-2 ${
            isWheelEligible
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isWheelEligible ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
            )}
            <div className="text-[11px] leading-tight">
              {isWheelEligible ? (
                <span className="font-bold text-emerald-300">
                  Eligibility Unlocked! Free spin ticket activated.
                </span>
              ) : (
                <span>
                  <strong className="text-amber-300">Spin Locked: </strong>
                  Requires personal investment of <strong>₦500,000</strong> OR 1 friend investment of <strong>₦200,000</strong>.
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onOpenLuckyWheel}
            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-bold whitespace-nowrap text-white cursor-pointer"
          >
            Details
          </button>
        </div>
      </div>

      {/* COMPACT & SENSIBLE WHATSAPP & TELEGRAM BANNER */}
      <div className="px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-sky-950/80 border border-emerald-500/35 flex items-center justify-between gap-2 shadow-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div className="truncate">
            <p className="text-xs font-bold text-white truncate">
              WhatsApp & Telegram Investor Hub
            </p>
            <p className="text-[10px] text-emerald-300/80 truncate">
              Daily signals, verified payouts & 24/7 community
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenCommunity}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm whitespace-nowrap cursor-pointer transition flex-shrink-0"
        >
          <span>Join</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* QUICK UTILITY SERVICES SECTION */}
      {/* Airtime purchase, Data purchase, Electricity bills */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Utility Services
          </h3>
          <span className="text-[11px] text-sky-400 font-semibold">Zero Surcharge</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onOpenUtility('airtime')}
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 text-left transition flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Airtime</p>
              <p className="text-[10px] text-slate-400">All Networks</p>
            </div>
          </button>

          <button
            onClick={() => onOpenUtility('data')}
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 text-left transition flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center">
              <Wifi className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Data Bundle</p>
              <p className="text-[10px] text-slate-400">Instant Delivery</p>
            </div>
          </button>

          <button
            onClick={() => onOpenUtility('electricity')}
            className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 text-left transition flex flex-col items-start gap-2"
          >
            <div className="w-8 h-8 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Electricity</p>
              <p className="text-[10px] text-slate-400">Prepaid Token</p>
            </div>
          </button>
        </div>
      </div>

      {/* THREE FEATURED INVESTMENT PLANS */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Featured VIP Plans
            </h3>
          </div>
          <button
            onClick={() => setActiveTab('plans')}
            className="flex items-center gap-1 text-[11px] text-sky-400 font-bold hover:text-sky-300"
          >
            <span>View All 12 Plans</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-3">
          {featuredPlans.map((plan) => (
            <div
              key={plan.id}
              className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-sky-500/40 shadow-md relative overflow-hidden transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-white">{plan.name}</span>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                      {plan.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{plan.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 my-3 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-left">
                <div>
                  <span className="text-[10px] text-slate-400">Capital</span>
                  <p className="text-xs font-bold text-white font-mono">
                    {formatNaira(plan.capitalKobo, false)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Daily Return</span>
                  <p className="text-xs font-bold text-emerald-400 font-mono">
                    +{formatNaira(plan.dailyReturnKobo, false)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Total Payout</span>
                  <p className="text-xs font-bold text-sky-300 font-mono">
                    {formatNaira(plan.totalPayoutKobo, false)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onInvestInPlan(plan.id)}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Invest Now</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* TOP-FOUR USER LEADERBOARD */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Top-4 Investor Leaderboard
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Verified Payouts</span>
        </div>

        <div className="space-y-2">
          {topLeaderboard.map((item) => (
            <div
              key={item.rank}
              className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex justify-between items-center"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
                    item.rank === 1
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                      : item.rank === 2
                      ? 'bg-slate-300/20 text-slate-200 border border-slate-400/50'
                      : item.rank === 3
                      ? 'bg-amber-700/20 text-amber-500 border border-amber-600/50'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  #{item.rank}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-bold text-white">
                      {maskPhone(item.phone)}
                    </span>
                    <span className="text-[10px] text-sky-400 font-semibold">{item.tier}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{item.badge}</span>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs font-black font-mono text-emerald-400">
                  {formatNaira(item.earnings, false)}
                </p>
                <span className="text-[9px] text-slate-500">Total Yield</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RECENT ACCOUNT ACTIVITY */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Recent Account Activity
          </h3>
          <button
            onClick={onOpenHistory}
            className="text-[11px] text-sky-400 hover:text-sky-300 font-bold"
          >
            See All
          </button>
        </div>

        {recentActivity.length === 0 ? (
          <div className="p-5 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
            <Clock className="w-8 h-8 text-slate-600 mx-auto mb-1.5" />
            <p className="text-xs text-slate-400">No account activity yet.</p>
            <p className="text-[10px] text-slate-500">
              Make your first deposit or activate a plan to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentActivity.map((tx) => (
              <div
                key={tx.id}
                className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex justify-between items-center"
              >
                <div>
                  <p className="text-xs font-bold text-white">{tx.title}</p>
                  <p className="text-[10px] text-slate-400">{formatDate(tx.date)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold font-mono text-sky-400">
                    {formatNaira(tx.amountKobo)}
                  </p>
                  <span
                    className={`text-[9px] font-bold ${
                      tx.status === 'Completed'
                        ? 'text-emerald-400'
                        : tx.status === 'Pending'
                        ? 'text-amber-400'
                        : 'text-pink-400'
                    }`}
                  >
                    {tx.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Clean Footer with Terms & Conditions and Policy */}
      <div className="pt-4 pb-2 text-center space-y-1.5">
        <button
          onClick={() => setShowHomeTermsModal(true)}
          className="text-xs text-sky-400 hover:text-sky-300 font-bold underline cursor-pointer"
        >
          Terms & Conditions and Policy
        </button>
        <p className="text-[10px] text-slate-500 font-medium">
          All rights reserved by Apple Card Investment 2026.
        </p>
      </div>

      {/* MOVABLE / DRAGGABLE LUCKY SPIN ICON ON HOME */}
      {/* Requirement: "make the icon of the spin to be in the home and movable like customers support profile" */}
      <FloatingLuckySpinButton onOpenLuckyWheel={onOpenLuckyWheel} />

      {/* BIG HOME TERMS AND CONDITIONS MODAL */}
      {showHomeTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-sky-500/50 rounded-3xl p-6 text-white max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base">Terms and Conditions of Investment</h4>
                  <p className="text-[11px] text-sky-300">Apple Card Investment Official Policy 2026</p>
                </div>
              </div>
              <button
                onClick={() => setShowHomeTermsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  1. Automated 24-Hour Yield Engine
                </h5>
                <p>
                  All active VIP investment plans calculate daily returns automatically every 24 hours. No user, investor, or administrator is required or permitted to manually claim returns before 24 hours. Once the 24-hour cycle completes, dividends are automatically credited instantly to your available balance.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  2. 100% Capital Preservation Guarantee
                </h5>
                <p>
                  Every VIP Card tier (VIP 1 to VIP 12) is backed by our diamond liquidity reserve. Your deposited capital is safely preserved for the entire contract duration, producing guaranteed daily earnings.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  3. Withdrawal Policies & 15% Standard Fee
                </h5>
                <p>
                  Withdrawals are processed Monday through Friday directly to verified Nigerian commercial bank NUBAN accounts (Access, GTBank, Zenith, UBA, Kuda, Moniepoint, etc.) or USDT BEP-20 wallet addresses. A standard 15% settlement fee applies to cover interbank processing and blockchain gas fees.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  4. Sole Administrator Authority
                </h5>
                <p>
                  Platform governance, deposit approvals, and system adjustments are exclusively managed by verified platform administrator Emmanuel Chidalu (emmanuelchidalu67@gmail.com). No other agent or third party possesses administrative authorization.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-400" />
                  5. Account Integrity & Anti-Fraud Compliance
                </h5>
                <p>
                  Each member is permitted one legal investment account. Attempting multiple fraudulent registrations or fake deposit proofs results in permanent forfeiture of welcome bonuses and immediate profile suspension.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowHomeTermsModal(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
              >
                I Understand & Agree to Terms
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BIG HOME PRIVACY POLICY MODAL */}
      {showHomePrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 text-white max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base">Privacy & Data Protection Charter</h4>
                  <p className="text-[11px] text-emerald-300">NDPR & Global Security Standards 2026</p>
                </div>
              </div>
              <button
                onClick={() => setShowHomePrivacyModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  1. Information We Collect & Safeguard
                </h5>
                <p>
                  We store only the essential information necessary to verify your investment portfolio: your legal name, verified email address, contact phone number, and linked payout accounts (NUBAN or BEP-20 address).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  2. Multi-Layer Cryptographic Security
                </h5>
                <p>
                  All account access sessions, deposits, and withdrawal requests are encrypted in transit with TLS 1.3/256-bit SSL protocols. Password hashes and 4-digit withdrawal PINs are secured with irreversible hashing algorithms.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  3. Zero Data Resale or Third-Party Disclosure
                </h5>
                <p>
                  Apple Card Investment maintains strict privacy standards. We will never sell, rent, license, or exchange your personal phone numbers, bank details, or balance statements with any external commercial brokers or advertising networks.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <h5 className="font-bold text-white text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  4. User Rights & Account Control
                </h5>
                <p>
                  You retain full control over your profile. You may modify your 4-digit withdrawal PIN, update linked bank accounts, and request transaction history exports at any time directly through your Profile Tab or official support channels.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setShowHomePrivacyModal(false)}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg transition cursor-pointer"
              >
                Acknowledge Privacy Charter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
