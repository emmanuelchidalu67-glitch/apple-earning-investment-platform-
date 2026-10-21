import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, formatUsd, maskPhone, DEFAULT_USD_EXCHANGE_RATE } from '../utils/formatters';
import { DualCurrency } from './DualCurrency';
import {
  Users,
  Copy,
  Check,
  Award,
  Sparkles,
  Share2,
  TrendingUp,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export const TeamTab: React.FC = () => {
  const { user, referralStats, allUsers, adminSettings } = useApp();

  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const exchangeRate = adminSettings.usdtExchangeRateNaira || DEFAULT_USD_EXCHANGE_RATE;

  const referralCode = user?.referralCode || 'APPLE77';
  const referralLink = `https://applecard.ng/register?ref=${referralCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Real registered downlines
  const directDownlines = user ? allUsers.filter((u) => u.referredBy === referralCode) : [];

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      {/* Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-950 via-[#0a1a36] to-pink-950 border border-sky-500/30 text-white relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-extrabold uppercase tracking-wider">
            3-Tier Syndicate Team
          </h2>
        </div>
        <p className="text-xs text-slate-300">
          Earn unstoppable referral commissions across three generations of verified investor downlines.
        </p>
      </div>

      {/* Referral Link & Code Card */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Your Invitation Code
          </span>
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800 mt-1">
            <span className="font-mono text-lg font-black text-sky-400 tracking-widest">
              {referralCode}
            </span>
            <button
              onClick={copyCode}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-xs font-bold"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Direct Shareable URL
          </span>
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded-2xl border border-slate-800 mt-1">
            <span className="font-mono text-xs text-slate-300 truncate max-w-[200px]">
              {referralLink}
            </span>
            <button
              onClick={copyLink}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overall Team & Earnings Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Total Team Size</p>
          <p className="text-2xl font-black font-mono text-white mt-1">
            {referralStats.totalMembers}
          </p>
          <p className="text-[10px] text-sky-400 mt-0.5">3-tier network</p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Verified Rewards</p>
          <DualCurrency
            kobo={referralStats.verifiedRewardsKobo}
            rate={exchangeRate}
            showCents={true}
            usdClassName="text-2xl font-black font-mono text-emerald-400 mt-1"
            nairaClassName="text-[10px] font-mono text-slate-400"
          />
          <p className="text-[10px] text-emerald-400 mt-0.5">Paid into balance</p>
        </div>
      </div>

      {/* 3 Referral Tiers Breakdown */}
      <div>
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
          3-Tier Commission Structure
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {/* Tier 1 */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-sky-500/40 text-center space-y-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-bold">
              Tier 1 • 10%
            </span>
            <p className="text-lg font-black text-white font-mono mt-1">
              {referralStats.tier1.membersCount}
            </p>
            <p className="text-[10px] text-slate-400">Direct Investors</p>
            <div className="pt-1 border-t border-slate-800">
              <DualCurrency
                kobo={referralStats.tier1.earningsKobo}
                rate={exchangeRate}
                align="center"
                usdClassName="text-xs font-bold text-emerald-400 font-mono"
                nairaClassName="text-[9px] font-mono text-slate-400"
              />
            </div>
          </div>

          {/* Tier 2 */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
              Tier 2 • 2%
            </span>
            <p className="text-lg font-black text-white font-mono mt-1">
              {referralStats.tier2.membersCount}
            </p>
            <p className="text-[10px] text-slate-400">Level 2 Network</p>
            <div className="pt-1 border-t border-slate-800">
              <DualCurrency
                kobo={referralStats.tier2.earningsKobo}
                rate={exchangeRate}
                align="center"
                usdClassName="text-xs font-bold text-emerald-400 font-mono"
                nairaClassName="text-[9px] font-mono text-slate-400"
              />
            </div>
          </div>

          {/* Tier 3 */}
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-bold">
              Tier 3 • 1%
            </span>
            <p className="text-lg font-black text-white font-mono mt-1">
              {referralStats.tier3.membersCount}
            </p>
            <p className="text-[10px] text-slate-400">Level 3 Network</p>
            <div className="pt-1 border-t border-slate-800">
              <DualCurrency
                kobo={referralStats.tier3.earningsKobo}
                rate={exchangeRate}
                align="center"
                usdClassName="text-xs font-bold text-emerald-400 font-mono"
                nairaClassName="text-[9px] font-mono text-slate-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real Downlines Section */}
      <div>
        <div className="flex justify-between items-center mb-2.5">
          <div className="flex items-center gap-1.5">
            <Users className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Your Registered Downlines ({directDownlines.length})
            </h3>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">Tier 1 • 10% Earned</span>
        </div>

        {directDownlines.length === 0 ? (
          <div className="p-6 text-center bg-slate-900/40 rounded-3xl border border-slate-800 space-y-2">
            <Users className="w-9 h-9 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-300">No Team Members Yet</p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Share your referral link or code <span className="font-mono text-sky-400 font-bold">{referralCode}</span> with investors. When they register and activate any VIP card, you receive instant 10% cash commission credited to your balance.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {directDownlines.map((member) => (
              <div
                key={member.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-xs">
                    {member.avatarInitials}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{member.fullName}</p>
                    <p className="text-[10px] font-mono text-slate-400">{maskPhone(member.phone)}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold">
                    Active Downline
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Joined: {member.registrationDate.slice(0, 10)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compliance & Disclosures */}
      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1 leading-relaxed">
        <p className="font-bold text-slate-300 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          <span>Referral Program Compliance</span>
        </p>
        <p>
          Commissions are awarded only on verified deposit activations. Fake profiles, duplicate IP registrations, and unverified accounts are automatically screened and disqualified.
        </p>
      </div>
    </div>
  );
};
