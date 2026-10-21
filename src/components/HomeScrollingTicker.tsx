import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, maskPhone } from '../utils/formatters';

interface TickerItem {
  id: string;
  type: 'yield' | 'withdrawal';
  icon: string;
  badge: string;
  title: string;
  detail: string;
  highlight: string;
  color: string;
}

export const HomeScrollingTicker: React.FC = () => {
  const { transactions, plans } = useApp();
  const [activeFilter, setActiveFilter] = useState<'all' | 'yields' | 'withdrawals'>('all');
  const [isPaused, setIsPaused] = useState(false);

  // Dynamic VIP Yield items from loaded plans
  const yieldItems: TickerItem[] = plans.map((plan) => {
    const dailyPercent = ((plan.dailyReturnKobo / plan.capitalKobo) * 100).toFixed(1);
    const usdDaily = ((plan.dailyReturnKobo / 100) / 1550).toFixed(2);
    return {
      id: `yield-${plan.id}`,
      type: 'yield',
      icon: '⚡',
      badge: `${plan.name}`,
      title: `Daily ROI: +${dailyPercent}%`,
      detail: `$${usdDaily} (≈ ${formatNaira(plan.dailyReturnKobo, false)})/day`,
      highlight: `${plan.badge}`,
      color: 'border-sky-500/30 text-sky-300 bg-sky-950/40',
    };
  });

  // Recent simulated + real Nigerian bank withdrawal feed
  const realCompletedWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal' && t.status === 'Completed')
    .map((t, idx) => ({
      id: `real-wth-${t.id}-${idx}`,
      type: 'withdrawal' as const,
      icon: '💸',
      badge: 'Disbursed',
      title: `${t.bankDetails?.bankName || 'Nigerian Bank'}`,
      detail: `$${((t.amountKobo / 100) / 1550).toFixed(2)} (≈ ${formatNaira(t.amountKobo, false)})`,
      highlight: 'Just now',
      color: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40',
    }));

  const simulatedWithdrawals: TickerItem[] = [
    {
      id: 'wth-1',
      type: 'withdrawal',
      icon: '💸',
      badge: 'Paid',
      title: `${maskPhone('08035298194')} · Access Bank`,
      detail: '$419.35 (≈ ₦650,000)',
      highlight: '1m ago',
      color: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40',
    },
    {
      id: 'wth-2',
      type: 'withdrawal',
      icon: '💸',
      badge: 'Paid',
      title: `${maskPhone('08129481023')} · Moniepoint`,
      detail: '$806.45 (≈ ₦1,250,000)',
      highlight: '3m ago',
      color: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40',
    },
    {
      id: 'wth-3',
      type: 'withdrawal',
      icon: '💸',
      badge: 'Paid',
      title: `${maskPhone('07064829105')} · Zenith Bank`,
      detail: '$1,548.39 (≈ ₦2,400,000)',
      highlight: '5m ago',
      color: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40',
    },
    {
      id: 'wth-4',
      type: 'withdrawal',
      icon: '💸',
      badge: 'Paid',
      title: `${maskPhone('09051839201')} · OPay`,
      detail: '$309.68 (≈ ₦480,000)',
      highlight: '8m ago',
      color: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40',
    },
    {
      id: 'wth-5',
      type: 'withdrawal',
      icon: '💸',
      badge: 'Paid',
      title: `${maskPhone('08144824491')} · GTBank`,
      detail: '$2,451.61 (≈ ₦3,800,000)',
      highlight: '12m ago',
      color: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40',
    },
    {
      id: 'wth-6',
      type: 'withdrawal',
      icon: '💸',
      badge: 'Paid',
      title: `${maskPhone('08023813319')} · First Bank`,
      detail: '$612.90 (≈ ₦950,000)',
      highlight: '15m ago',
      color: 'border-emerald-500/30 text-emerald-300 bg-emerald-950/40',
    },
    {
      id: 'wth-7',
      type: 'withdrawal',
      icon: '💸',
      badge: 'Paid',
      title: `${maskPhone('07081946620')} · USDT (BEP-20)`,
      detail: '$3,000.00 (≈ ₦4,650,000)',
      highlight: '19m ago',
      color: 'border-teal-500/30 text-teal-300 bg-teal-950/40',
    },
  ];

  // Combine items according to activeFilter
  const allWithdrawals = [...realCompletedWithdrawals, ...simulatedWithdrawals];

  let displayItems: TickerItem[] = [];
  if (activeFilter === 'yields') {
    displayItems = yieldItems;
  } else if (activeFilter === 'withdrawals') {
    displayItems = allWithdrawals;
  } else {
    // Interleave yields and withdrawals
    const maxLen = Math.max(yieldItems.length, allWithdrawals.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < yieldItems.length) displayItems.push(yieldItems[i]);
      if (i < allWithdrawals.length) displayItems.push(allWithdrawals[i]);
    }
  }

  // Duplicate items for continuous seamless infinite loop
  const tickerItems = [...displayItems, ...displayItems];

  return (
    <div className="rounded-2xl bg-gradient-to-r from-[#071733]/90 via-[#0a1f42]/90 to-[#0e172e]/90 border border-sky-500/30 shadow-[0_4px_20px_rgba(0,0,0,0.4)] overflow-hidden">
      {/* Top micro-bar: Live status & filter chips */}
      <div className="px-3 py-1.5 flex items-center justify-between border-b border-sky-500/15 bg-slate-950/40 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-extrabold uppercase tracking-wider text-emerald-400">
            Live Feed
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 hidden xs:inline">Settlement Stream</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition cursor-pointer ${
              activeFilter === 'all'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('yields')}
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition cursor-pointer ${
              activeFilter === 'yields'
                ? 'bg-sky-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Yields
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('withdrawals')}
            className={`px-2 py-0.5 rounded-full text-[9px] font-bold transition cursor-pointer ${
              activeFilter === 'withdrawals'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            💸 Payouts
          </button>
        </div>
      </div>

      {/* Scrolling Marquee Container */}
      <div
        className="relative py-2 overflow-hidden select-none"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Soft edge fade masks */}
        <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#071733] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-[#0e172e] to-transparent z-10 pointer-events-none" />

        <div
          className="flex gap-3 whitespace-nowrap will-change-transform"
          style={{
            animation: isPaused
              ? 'none'
              : `marquee ${Math.max(6, Math.round(displayItems.length * 0.3))}s linear infinite`,
          }}
        >
          {tickerItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-sm flex-shrink-0 ${item.color}`}
            >
              <span className="text-sm">{item.icon}</span>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="font-bold text-white tracking-tight">{item.title}</span>
                <span className="font-mono font-bold text-emerald-300">{item.detail}</span>
                <span className="px-1.5 py-0.2 rounded-md bg-white/10 text-[9px] font-semibold text-slate-300">
                  {item.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Marquee CSS Keyframes */}
      <style>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
};
