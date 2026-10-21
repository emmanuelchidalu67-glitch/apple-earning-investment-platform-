import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, formatUsd, DEFAULT_USD_EXCHANGE_RATE } from '../utils/formatters';
import { DualCurrency } from './DualCurrency';
import { InvestmentPlan } from '../types';
import {
  Layers,
  Sparkles,
  TrendingUp,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  CheckCircle2,
  X,
  Lock,
} from 'lucide-react';

interface PlansTabProps {
  onInvestInPlan: (planId: string) => void;
}

export const PlansTab: React.FC<PlansTabProps> = ({ onInvestInPlan }) => {
  const { plans, availableBalanceKobo, adminSettings } = useApp();

  const [selectedPlanForReview, setSelectedPlanForReview] = useState<InvestmentPlan | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const exchangeRate = adminSettings.usdtExchangeRateNaira || DEFAULT_USD_EXCHANGE_RATE;

  const handleOpenReview = (plan: InvestmentPlan) => {
    setErrorMessage(null);
    setAgreedTerms(false);
    setSelectedPlanForReview(plan);
  };

  const handleConfirmInvestment = () => {
    if (!selectedPlanForReview) return;
    if (!agreedTerms) {
      setErrorMessage('Please confirm agreement to activate this investment contract.');
      return;
    }
    if (availableBalanceKobo < selectedPlanForReview.capitalKobo) {
      setErrorMessage(
        `Insufficient available balance. Required: ${formatUsd(
          selectedPlanForReview.capitalKobo,
          true,
          exchangeRate
        )} (≈ ${formatNaira(selectedPlanForReview.capitalKobo, false)}). Please deposit first.`
      );
      return;
    }

    onInvestInPlan(selectedPlanForReview.id);
    setSelectedPlanForReview(null);
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-950 via-[#0a1b38] to-purple-950 border border-sky-500/30 text-white relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Layers className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-extrabold uppercase tracking-wider">
            APPLE CARD VIP TIERS (1 - 12)
          </h2>
        </div>
        <p className="text-xs text-slate-300">
          Where Your Money Is Growing Unstoppable. Structured 45-day high-yield portfolios with daily verified payouts directly into your wallet.
        </p>
        <div className="flex items-center gap-2 mt-3 text-[11px] text-sky-300 font-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-400" /> 45 Days Duration
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Daily Yield Settlements ($)
          </span>
        </div>
      </div>

      {/* 12 Investment Plans Grid / Cards */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const isAffordable = availableBalanceKobo >= plan.capitalKobo;

          return (
            <div
              key={plan.id}
              className={`p-4 rounded-3xl border transition-all duration-200 relative overflow-hidden shadow-lg ${
                plan.popular
                  ? 'bg-gradient-to-b from-[#0b1e3e] to-[#071328] border-sky-400/50 shadow-sky-500/10'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Popular tag */}
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-l from-pink-600 to-sky-600 px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                  POPULAR CHOICE
                </div>
              )}

              {/* Title & Badge */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-pink-500 p-0.5 flex items-center justify-center">
                      <div className="w-full h-full bg-[#0a1628] rounded-[10px] flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-sky-400" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white">{plan.name}</h3>
                      <span className="text-[10px] font-semibold text-sky-300">{plan.badge}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-2">{plan.description}</p>
                </div>
              </div>

              {/* Financial Metrics Card - USD Primary with Naira Sub-label */}
              <div className="grid grid-cols-3 gap-2 my-3 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-left">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Capital</span>
                  <DualCurrency
                    kobo={plan.capitalKobo}
                    rate={exchangeRate}
                    showCents={false}
                    usdClassName="text-sm font-black text-white font-mono mt-0.5"
                    nairaClassName="text-[10px] font-mono text-slate-400"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Daily Yield</span>
                  <DualCurrency
                    kobo={plan.dailyReturnKobo}
                    rate={exchangeRate}
                    prefix="+"
                    showCents={true}
                    usdClassName="text-sm font-black text-emerald-400 font-mono mt-0.5"
                    nairaClassName="text-[10px] font-mono text-slate-400"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Payout</span>
                  <DualCurrency
                    kobo={plan.totalPayoutKobo}
                    rate={exchangeRate}
                    showCents={false}
                    usdClassName="text-sm font-black text-sky-300 font-mono mt-0.5"
                    nairaClassName="text-[10px] font-mono text-slate-400"
                  />
                </div>
              </div>

              {/* Payout Schedule & Capital Guarantee */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 py-1 px-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>{plan.payoutSchedule}</span>
                </span>
                <span className="flex items-center gap-1 font-semibold text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{plan.guaranteeBadge}</span>
                </span>
              </div>

              {/* Invest Button */}
              <button
                onClick={() => handleOpenReview(plan)}
                className={`w-full mt-3 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98] ${
                  isAffordable
                    ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white shadow-sky-500/25'
                    : 'bg-slate-800 hover:bg-slate-700 text-sky-300 border border-sky-500/30'
                }`}
              >
                <span>
                  Invest Now — {formatUsd(plan.capitalKobo, false, exchangeRate)} (≈ {formatNaira(plan.capitalKobo, false)})
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* INVESTMENT CONFIRMATION & RISK REVIEW MODAL */}
      {selectedPlanForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#09172f] via-[#071328] to-[#040c1a] border border-sky-500/30 rounded-3xl p-6 text-white shadow-2xl my-auto space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Investment Review</h4>
                  <p className="text-[11px] text-sky-300">{selectedPlanForReview.name}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPlanForReview(null)}
                className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-xs text-pink-200">
                <AlertTriangle className="w-4 h-4 text-pink-400 flex-shrink-0" />
                <p>{errorMessage}</p>
              </div>
            )}

            {/* Terms Summary with Dual Currency */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Required Capital:</span>
                <DualCurrency
                  kobo={selectedPlanForReview.capitalKobo}
                  rate={exchangeRate}
                  align="right"
                  usdClassName="font-bold font-mono text-white text-sm"
                  nairaClassName="text-[10px] text-slate-400 font-mono"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Daily Verified Yield:</span>
                <DualCurrency
                  kobo={selectedPlanForReview.dailyReturnKobo}
                  rate={exchangeRate}
                  prefix="+"
                  suffix=" / day"
                  align="right"
                  usdClassName="font-bold font-mono text-emerald-400"
                  nairaClassName="text-[10px] text-slate-400 font-mono"
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Contract Duration:</span>
                <span className="font-semibold text-sky-300">
                  {selectedPlanForReview.durationDays} Days (Maturity settlement)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Projected Payout:</span>
                <DualCurrency
                  kobo={selectedPlanForReview.totalPayoutKobo}
                  rate={exchangeRate}
                  align="right"
                  usdClassName="font-black font-mono text-sky-300 text-sm"
                  nairaClassName="text-[10px] text-slate-400 font-mono"
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400">Your Current Balance:</span>
                <DualCurrency
                  kobo={availableBalanceKobo}
                  rate={exchangeRate}
                  align="right"
                  usdClassName="font-mono font-bold text-white"
                  nairaClassName="text-[10px] text-slate-400 font-mono"
                />
              </div>
            </div>

            {/* Guarantee & Contract Terms */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 text-[11px] text-slate-300 space-y-1.5">
              <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Diamond Contract Guarantee</span>
              </p>
              <p>
                By proceeding, you authorize the debit of {formatUsd(selectedPlanForReview.capitalKobo, false, exchangeRate)} (≈ {formatNaira(selectedPlanForReview.capitalKobo, false)}) from your verified balance. Earnings accrue automatically every 24 hours for {selectedPlanForReview.durationDays} continuous days.
              </p>
              <p className="text-slate-400">
                Capital and payouts are 100% verified and protected under Apple Card investment treasury provisions.
              </p>
            </div>

            {/* Checkbox */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="contract-ack"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700"
              />
              <label htmlFor="contract-ack" className="text-xs text-slate-300 leading-tight">
                I agree to activate {selectedPlanForReview.name} and receive my daily yield schedule ({formatUsd(selectedPlanForReview.dailyReturnKobo, true, exchangeRate)} / ≈ {formatNaira(selectedPlanForReview.dailyReturnKobo, false)}/day).
              </label>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedPlanForReview(null)}
                className="w-1/3 py-3 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmInvestment}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 text-white text-xs font-bold uppercase tracking-wider shadow-md shadow-sky-500/25"
              >
                Confirm & Activate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
