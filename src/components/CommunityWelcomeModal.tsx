import React from 'react';
import { useApp } from '../context/AppContext';
import { DiamondLogo } from './DiamondLogo';
import {
  X,
  MessageCircle,
  Send,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Gift,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

interface CommunityWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityWelcomeModal: React.FC<CommunityWelcomeModalProps> = ({ isOpen, onClose }) => {
  const { adminSettings, user } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#091b38] via-[#071328] to-[#040c1a] border border-sky-400/40 rounded-3xl p-6 text-white shadow-2xl my-auto space-y-4">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header with Dismiss / Remove Button */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-400 to-pink-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#071328] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-sky-300" />
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Official Investor Channels</h3>
              <p className="text-[10px] text-sky-300 font-medium">Apple Card Investment Community</p>
            </div>
          </div>
          {/* Requirement: "and a remove button" */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close and Remove"
            title="Remove and proceed to dashboard"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Brand Banner */}
        <div className="text-center py-2">
          <DiamondLogo size="sm" showTagline centered />
          <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>₦800 Welcome Bonus Auto-Credited</span>
          </div>
        </div>

        {/* Official Social Links (WhatsApp Group & Telegram Channel) */}
        <div className="space-y-2.5">
          {/* WhatsApp Group */}
          <a
            href={adminSettings.whatsappGroupUrl || 'https://chat.whatsapp.com/AppleCardVIP'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900/60 to-slate-900 border border-emerald-500/50 hover:border-emerald-400 transition shadow-lg shadow-emerald-950/40 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#25D366] text-white flex items-center justify-center shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-6 h-6 fill-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Join Official WhatsApp Group</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </p>
                <p className="text-[10px] text-emerald-200">
                  Daily withdrawal proofs, announcements & executive support
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-400 font-mono px-2 py-1 rounded-lg bg-emerald-950 border border-emerald-500/30">
              JOIN
            </span>
          </a>

          {/* Telegram Channel */}
          <a
            href={adminSettings.telegramChannelUrl || 'https://t.me/AppleCardInvestment'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-sky-950 via-blue-900/60 to-slate-900 border border-sky-500/50 hover:border-sky-400 transition shadow-lg shadow-sky-950/40 group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center shadow-md shadow-sky-500/30 group-hover:scale-105 transition-transform">
                <Send className="w-5 h-5 fill-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Official Telegram Channel</span>
                  <ExternalLink className="w-3 h-3 text-sky-400" />
                </p>
                <p className="text-[10px] text-sky-200">
                  Instant dividend alerts, system updates & VIP promotions
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-sky-400 font-mono px-2 py-1 rounded-lg bg-sky-950 border border-sky-500/30">
              JOIN
            </span>
          </a>
        </div>

        {/* Clear Concise Explanation on APPLE CARD INVESTMENT */}
        <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2 text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-300 uppercase tracking-wider">
            <TrendingUp className="w-4 h-4 text-sky-400" />
            <span>How Apple Card Investment Works</span>
          </div>

          <div className="space-y-1.5 text-[11px] text-slate-300 leading-relaxed">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 flex-shrink-0" />
              <p>
                <strong className="text-white">12 VIP Portfolios (VIP 1 - VIP 12):</strong> Activate cards from ₦3,000 up to ₦1,000,000 with 45-day contract terms.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
              <p>
                <strong className="text-white">Daily Verified Yield:</strong> Profits are calculated and credited automatically every 24 hours directly into your balance.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
              <p>
                <strong className="text-white">Fast Banking Withdrawals:</strong> 15% standard settlement fee. Processed Monday to Friday directly to any Nigerian bank.
              </p>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
              <p>
                <strong className="text-white">Dual Deposit Channels:</strong> Fund instantly via Nigerian Bank Transfer or Binance Smart Chain USDT (BEP-20).
              </p>
            </div>

            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0" />
              <p>
                <strong className="text-white">Lucky Wheel Rewards:</strong> Win physical appliances like Washing Machines, Bicycles, Refrigerators, and Power Banks!
              </p>
            </div>
          </div>
        </div>

        {/* Remove Button / Continue to Dashboard */}
        <button
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
        >
          <span>Dismiss & Enter Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
