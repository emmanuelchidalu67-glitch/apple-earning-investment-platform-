import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, formatUsd, formatDate, koboToUsd, DEFAULT_USD_EXCHANGE_RATE } from '../utils/formatters';
import { DualCurrency } from './DualCurrency';
import { UserInvestment } from '../types';
import {
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  X,
  Layers,
  Sparkles,
  Zap,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Timer,
  Hourglass,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export const InvestTab: React.FC = () => {
  const {
    userInvestments,
    investedCapitalKobo,
    verifiedEarningsKobo,
    availableBalanceKobo,
    adminSettings,
    setActiveTab,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<'All' | 'Active' | 'Completed'>('All');
  const [selectedInvestment, setSelectedInvestment] = useState<UserInvestment | null>(null);
  const [chartMetric, setChartMetric] = useState<'both' | 'portfolio' | 'yield'>('both');

  // Live timer for 24-hour ticker and expiration countdown (updates every second)
  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const exchangeRate = adminSettings.usdtExchangeRateNaira || DEFAULT_USD_EXCHANGE_RATE;

  const filteredInvestments = userInvestments.filter((inv) => {
    if (statusFilter === 'All') return true;
    return inv.status === statusFilter;
  });

  // Calculate 7-day interactive line chart data in USD using Recharts
  const chartData = useMemo(() => {
    const dataPoints = [];
    const now = new Date();
    const activeInvestments = userInvestments.filter((i) => i.status === 'Active');
    const totalDailyReturnUsd =
      activeInvestments.reduce((sum, i) => sum + koboToUsd(i.dailyReturnKobo, exchangeRate), 0);
    const currentCapitalUsd = koboToUsd(investedCapitalKobo, exchangeRate);
    const baseBalanceUsd = koboToUsd(availableBalanceKobo, exchangeRate);

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateLabel =
        i === 0
          ? 'Today'
          : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

      // Daily yield earned or accrued in USD
      const dailyYieldUsd =
        totalDailyReturnUsd > 0
          ? Number(totalDailyReturnUsd.toFixed(2))
          : (currentCapitalUsd > 0 ? Number((currentCapitalUsd * 0.05).toFixed(2)) : 0);

      // Cumulative portfolio growth across 7 days in USD
      const daysAgo = 6 - i;
      const portfolioGrowth =
        currentCapitalUsd > 0
          ? Number((currentCapitalUsd + dailyYieldUsd * daysAgo).toFixed(2))
          : Number(baseBalanceUsd.toFixed(2));

      dataPoints.push({
        date: dateLabel,
        portfolio: portfolioGrowth,
        yieldEarnings: dailyYieldUsd,
        portfolioNaira: Math.round(portfolioGrowth * exchangeRate),
        yieldNaira: Math.round(dailyYieldUsd * exchangeRate),
      });
    }
    return dataPoints;
  }, [userInvestments, investedCapitalKobo, availableBalanceKobo, exchangeRate]);

  // Helper for 24-hour cycle ticker calculation
  const get24HourTicker = (inv: UserInvestment) => {
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    const startOrLast = new Date(inv.lastClaimDate || inv.startDate).getTime();
    const nextTarget = startOrLast + ONE_DAY_MS;
    const remainingMs = Math.max(0, nextTarget - currentTime);

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    const elapsedInCycle = ONE_DAY_MS - remainingMs;
    const cyclePercent = Math.min(100, Math.max(0, Math.round((elapsedInCycle / ONE_DAY_MS) * 100)));

    return {
      formatted: `${hours.toString().padStart(2, '0')}h ${minutes
        .toString()
        .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
      cyclePercent,
      isDue: remainingMs <= 0,
    };
  };

  // Helper for Plan Expiration Countdown Timer (remaining hours:minutes:seconds)
  const getExpirationCountdown = (maturityDateStr: string) => {
    const target = new Date(maturityDateStr).getTime();
    const remainingMs = Math.max(0, target - currentTime);
    const totalSecs = Math.floor(remainingMs / 1000);
    const days = Math.floor(totalSecs / (3600 * 24));
    const hours = Math.floor((totalSecs % (3600 * 24)) / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;
    const isExpired = remainingMs <= 0;

    return {
      isExpired,
      days,
      hours,
      minutes,
      seconds,
      formattedDaysHoursMinSec: `${days}d ${hours.toString().padStart(2, '0')}h ${minutes
        .toString()
        .padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`,
      totalHoursMinSec: `${(days * 24 + hours).toString().padStart(2, '0')}:${minutes
        .toString()
        .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    };
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      {/* Top Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-base font-extrabold text-white">My Portfolio Ledger</h2>
          <p className="text-[11px] text-sky-300 font-medium">Verified Active Yield Contracts</p>
        </div>
        <button
          onClick={() => setActiveTab('plans')}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-sky-500/20 cursor-pointer transition"
        >
          + New VIP Plan
        </button>
      </div>

      {/* 7-DAY INTERACTIVE LINE CHART (RECHARTS) IN USD WITH NAIRA SUB-LABEL */}
      <div className="rounded-3xl p-4 bg-gradient-to-br from-[#081836] via-[#0b2149] to-[#051126] border border-sky-400/30 shadow-xl space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                7-Day Growth & Daily Yield ($)
              </h3>
              <p className="text-[10px] text-sky-200/80">
                Interactive Portfolio Performance (1 USD ≈ ₦{exchangeRate.toLocaleString()})
              </p>
            </div>
          </div>

          {/* Metric Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px] font-bold">
            <button
              onClick={() => setChartMetric('both')}
              className={`px-2 py-1 rounded-lg transition ${
                chartMetric === 'both' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setChartMetric('portfolio')}
              className={`px-2 py-1 rounded-lg transition ${
                chartMetric === 'portfolio' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Portfolio
            </button>
            <button
              onClick={() => setChartMetric('yield')}
              className={`px-2 py-1 rounded-lg transition ${
                chartMetric === 'yield' ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Yield
            </button>
          </div>
        </div>

        {/* Recharts Container */}
        <div className="h-48 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fontSize: 9, fill: '#94a3b8' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
                tickFormatter={(val) => {
                  if (val >= 1000) return `$${(val / 1000).toFixed(1)}k`;
                  return `$${val}`;
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="p-2.5 rounded-xl bg-slate-950/95 border border-sky-500/40 shadow-2xl text-xs space-y-1.5">
                        <p className="font-bold text-slate-300 border-b border-slate-800 pb-1">{label}</p>
                        {payload.map((item, idx) => {
                          const isPortfolio = item.dataKey === 'portfolio';
                          const valNum = Number(item.value) || 0;
                          const nairaVal = Math.round(valNum * exchangeRate);
                          return (
                            <div key={idx} className="space-y-0.5 text-[11px]">
                              <div className="flex items-center justify-between gap-3">
                                <span style={{ color: item.color }} className="font-semibold">
                                  {item.name}:
                                </span>
                                <span className="font-mono font-bold text-white">
                                  ${valNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 text-right font-mono">
                                ≈ ₦{nairaVal.toLocaleString()}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {(chartMetric === 'both' || chartMetric === 'portfolio') && (
                <Line
                  type="monotone"
                  dataKey="portfolio"
                  name="Portfolio Growth ($)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#38bdf8' }}
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
              {(chartMetric === 'both' || chartMetric === 'yield') && (
                <Line
                  type="monotone"
                  dataKey="yieldEarnings"
                  name="Daily Yield ($)"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#10b981' }}
                  activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart Sub-legend */}
        <div className="flex justify-between items-center pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span>Capital Growth ($)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>24h Yield ($)</span>
            </span>
          </div>
          <span className="font-bold text-sky-300">Live Auto-Calculated</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="grid grid-cols-3 p-1 bg-slate-900 rounded-2xl border border-slate-800 text-xs font-bold">
        {(['All', 'Active', 'Completed'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`py-2 rounded-xl transition cursor-pointer ${
              statusFilter === filter
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {filter} ({userInvestments.filter((i) => filter === 'All' || i.status === filter).length})
          </button>
        ))}
      </div>

      {/* Investments List */}
      <div className="space-y-3.5">
        {filteredInvestments.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
            <TrendingUp className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-300">No {statusFilter.toLowerCase()} investments found</p>
            <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
              Activate an APPLE CARD VIP tier to generate automated daily payouts.
            </p>
            <button
              onClick={() => setActiveTab('plans')}
              className="mt-4 px-4 py-2 rounded-xl bg-sky-500 text-white font-bold text-xs cursor-pointer shadow-md"
            >
              Browse 12 VIP Plans
            </button>
          </div>
        ) : (
          filteredInvestments.map((inv) => {
            const progressPercent = Math.min(100, Math.round((inv.daysElapsed / inv.durationDays) * 100));
            const ticker24h = get24HourTicker(inv);
            const countdownExp = getExpirationCountdown(inv.maturityDate);

            return (
              <div
                key={inv.id}
                onClick={() => setSelectedInvestment(inv)}
                className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800/90 hover:border-sky-500/40 transition cursor-pointer shadow-lg space-y-3"
              >
                {/* Plan Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-white">{inv.planName}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.status === 'Active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </div>
                    <p className="font-mono text-[10px] text-sky-400 mt-0.5">{inv.reference}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">Working Capital</span>
                    <DualCurrency
                      kobo={inv.capitalKobo}
                      rate={exchangeRate}
                      showCents={true}
                      align="right"
                      usdClassName="text-xs font-black font-mono text-white"
                      nairaClassName="text-[10px] text-slate-400 font-mono"
                    />
                  </div>
                </div>

                {/* 24-HOUR REACH TICKER & COUNTING (Daily Yield Auto-credit cycle) */}
                {inv.status === 'Active' && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#071936] to-[#092247] border border-sky-400/30 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span className="text-[11px] font-extrabold uppercase tracking-wide text-sky-200">
                          24h Reach Ticker:
                        </span>
                      </div>
                      <div className="flex items-center gap-1 font-mono font-bold text-xs text-amber-300 bg-slate-950/80 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>{ticker24h.formatted}</span>
                      </div>
                    </div>

                    {/* Cycle Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-sky-500/20">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-1000"
                          style={{ width: `${ticker24h.cyclePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 font-medium">
                        <span>Cycle: {ticker24h.cyclePercent}% complete</span>
                        <span className="text-emerald-300 font-bold font-mono">
                          +{formatUsd(inv.dailyReturnKobo, true, exchangeRate)} (≈ +{formatNaira(inv.dailyReturnKobo, false)}) in 24h
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* VISUAL COUNTDOWN TIMER: REMAINING HOURS:MINUTES:SECONDS UNTIL EXPIRATION */}
                {inv.status === 'Active' && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-[#180e29] via-[#101938] to-[#081730] border border-purple-500/30 shadow-md space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-lg bg-pink-500/20 border border-pink-400/40 flex items-center justify-center text-pink-400">
                          <Timer className="w-3 h-3 animate-pulse" />
                        </div>
                        <span className="text-[10px] uppercase font-black tracking-wider text-pink-300">
                          Expiration Countdown
                        </span>
                      </div>

                      <span className="text-[9px] font-bold text-slate-400 uppercase">
                        Contract Closes In
                      </span>
                    </div>

                    {/* Digital Countdown Timer Display */}
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div className="p-1.5 rounded-xl bg-slate-950/80 border border-purple-500/20">
                        <span className="block font-mono text-xs font-black text-white">
                          {countdownExp.days.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">
                          Days
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-950/80 border border-purple-500/20">
                        <span className="block font-mono text-xs font-black text-amber-300">
                          {countdownExp.hours.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">
                          Hours
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-950/80 border border-purple-500/20">
                        <span className="block font-mono text-xs font-black text-sky-300">
                          {countdownExp.minutes.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">
                          Mins
                        </span>
                      </div>
                      <div className="p-1.5 rounded-xl bg-slate-950/80 border border-purple-500/20">
                        <span className="block font-mono text-xs font-black text-pink-400 animate-pulse">
                          {countdownExp.seconds.toString().padStart(2, '0')}
                        </span>
                        <span className="text-[8px] uppercase tracking-wider text-slate-400 font-semibold">
                          Secs
                        </span>
                      </div>
                    </div>

                    {/* Compact Hours:Minutes:Seconds string */}
                    <div className="flex justify-between items-center text-[10px] text-slate-400 pt-0.5 px-0.5">
                      <span className="text-slate-400">Total Remaining:</span>
                      <span className="font-mono font-bold text-pink-300 bg-black/40 px-2 py-0.5 rounded border border-pink-500/20">
                        {countdownExp.totalHoursMinSec} (H:M:S)
                      </span>
                    </div>
                  </div>
                )}

                {/* STARTING TIME & EXPIRATION TIME */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-[11px]">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Starting Time
                    </span>
                    <span className="font-mono text-slate-200 font-medium">
                      {formatDate(inv.startDate)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Expiration Time
                    </span>
                    <span className="font-mono text-sky-300 font-medium">
                      {formatDate(inv.maturityDate)}
                    </span>
                  </div>
                </div>

                {/* Overall Contract Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                    <span>
                      Day {inv.daysElapsed} of {inv.durationDays}
                    </span>
                    <span>{progressPercent}% Complete</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 via-blue-500 to-pink-500 rounded-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Accrued Profit & Automated Notice */}
                <div className="flex justify-between items-center pt-1 border-t border-slate-800/80">
                  <div>
                    <span className="text-[10px] text-slate-400">Total Accrued Profit</span>
                    <DualCurrency
                      kobo={inv.earnedKobo}
                      rate={exchangeRate}
                      prefix="+"
                      align="left"
                      usdClassName="text-xs font-black font-mono text-emerald-400"
                      nairaClassName="text-[10px] text-slate-400 font-mono"
                    />
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-sky-400 font-bold flex items-center gap-1 justify-end">
                      <Sparkles className="w-3 h-3 text-sky-400" />
                      <span>Auto-Credit 24h</span>
                    </span>
                    <span className="text-[9px] text-slate-400">Direct to Dashboard</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DETAILED INVESTMENT MODAL */}
      {selectedInvestment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#09172f] via-[#071328] to-[#040c1a] border border-sky-500/30 rounded-3xl p-6 text-white shadow-2xl my-auto space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{selectedInvestment.planName}</h4>
                  <p className="font-mono text-[10px] text-sky-400">{selectedInvestment.reference}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvestment(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Capital Invested:</span>
                <DualCurrency
                  kobo={selectedInvestment.capitalKobo}
                  rate={exchangeRate}
                  align="right"
                  usdClassName="font-bold font-mono text-white text-xs"
                  nairaClassName="text-[10px] text-slate-400 font-mono"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Daily Return:</span>
                <DualCurrency
                  kobo={selectedInvestment.dailyReturnKobo}
                  rate={exchangeRate}
                  prefix="+"
                  suffix=" / day"
                  align="right"
                  usdClassName="font-bold font-mono text-emerald-400 text-xs"
                  nairaClassName="text-[10px] text-slate-400 font-mono"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Contract Duration:</span>
                <span className="text-slate-200">{selectedInvestment.durationDays} Days</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Contract Value:</span>
                <DualCurrency
                  kobo={selectedInvestment.totalPayoutKobo}
                  rate={exchangeRate}
                  align="right"
                  usdClassName="font-bold font-mono text-sky-300 text-xs"
                  nairaClassName="text-[10px] text-slate-400 font-mono"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Accumulated Earnings:</span>
                <DualCurrency
                  kobo={selectedInvestment.earnedKobo}
                  rate={exchangeRate}
                  prefix="+"
                  align="right"
                  usdClassName="font-black font-mono text-emerald-400 text-xs"
                  nairaClassName="text-[10px] text-slate-400 font-mono"
                />
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Starting Time:</span>
                <span className="text-slate-300 font-mono">{formatDate(selectedInvestment.startDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expiration Time:</span>
                <span className="text-slate-300 font-mono">{formatDate(selectedInvestment.maturityDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span
                  className={`font-bold ${
                    selectedInvestment.status === 'Active' ? 'text-emerald-400' : 'text-slate-300'
                  }`}
                >
                  {selectedInvestment.status}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-emerald-400 inline mr-1" />
              Returns are calculated automatically every 24 hours and credited directly to your dashboard. No manual action is needed.
            </div>

            <button
              onClick={() => setSelectedInvestment(null)}
              className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
