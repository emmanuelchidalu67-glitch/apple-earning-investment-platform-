import React from 'react';
import { useApp } from '../context/AppContext';
import { DiamondLogo } from './DiamondLogo';
import {
  X,
  MessageCircle,
  Send,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
} from 'lucide-react';

interface CommunityWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommunityWelcomeModal: React.FC<CommunityWelcomeModalProps> = ({ isOpen, onClose }) => {
  const { adminSettings } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 select-none">
      <div className="relative w-full max-w-[340px] bg-gradient-to-b from-[#091b38] via-[#071328] to-[#040c1a] border border-sky-400/40 rounded-3xl p-4 text-white shadow-2xl space-y-3.5">
        {/* Top Header with Close Button */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-300">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">
                Official Channels
              </h3>
              <p className="text-[10px] text-sky-300">Apple Card VIP Community</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Small Brand & Bonus Banner */}
        <div className="text-center py-1">
          <DiamondLogo size="sm" showTagline centered />
          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/40 text-[10px] font-semibold text-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>$0.52 (≈ ₦800) Welcome Bonus Active</span>
          </div>
        </div>

        {/* Compact WhatsApp & Telegram Links */}
        <div className="space-y-2">
          {/* WhatsApp Group */}
          <a
            href={adminSettings.whatsappGroupUrl || 'https://chat.whatsapp.com/AppleCardVIP'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-emerald-950/90 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                <MessageCircle className="w-4 h-4 fill-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  <span>WhatsApp VIP Group</span>
                  <ExternalLink className="w-2.5 h-2.5 text-emerald-400" />
                </p>
                <p className="text-[9px] text-emerald-300/80">Withdrawal proofs & live support</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-400 font-mono px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/30">
              JOIN
            </span>
          </a>

          {/* Telegram Channel */}
          <a
            href={adminSettings.telegramChannelUrl || 'https://t.me/AppleCardInvestment'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-2.5 rounded-2xl bg-gradient-to-r from-sky-950/90 to-slate-900 border border-sky-500/40 hover:border-sky-400 transition group"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#229ED9] text-white flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
                <Send className="w-4 h-4 fill-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white flex items-center gap-1">
                  <span>Telegram Channel</span>
                  <ExternalLink className="w-2.5 h-2.5 text-sky-400" />
                </p>
                <p className="text-[9px] text-sky-300/80">Daily yield alerts & promotions</p>
              </div>
            </div>
            <span className="text-[10px] font-extrabold text-sky-400 font-mono px-2 py-0.5 rounded-md bg-sky-950 border border-sky-500/30">
              JOIN
            </span>
          </a>
        </div>

        {/* Small Dismiss Button */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition shadow-md shadow-sky-500/20 active:scale-[0.98]"
        >
          <span>Continue to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
