import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira } from '../utils/formatters';
import {
  X,
  Gift,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface TopUpCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopUpCodeModal: React.FC<TopUpCodeModalProps> = ({ isOpen, onClose }) => {
  const { topUpCodes, redeemTopUpCode, transactions, user } = useApp();

  const [inputCode, setInputCode] = useState('');
  const [resultMessage, setResultMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleRedeem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;

    const res = redeemTopUpCode(inputCode);
    if (res.success) {
      setResultMessage({ type: 'success', text: res.message });
      setInputCode('');
    } else {
      setResultMessage({ type: 'error', text: res.message });
    }
  };

  // Find user's previous redemptions from transaction history
  const previousRedemptions = transactions.filter((t) => t.type === 'topup_code');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#09172f] via-[#071328] to-[#040c1a] border border-sky-500/25 rounded-3xl p-6 text-white shadow-2xl my-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Free Top-Up Code</h3>
              <p className="text-[11px] text-sky-300 font-medium">Instant Capital Voucher Redemption</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Redeem Form */}
        <div className="py-4 space-y-4">
          <form onSubmit={handleRedeem} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enter Promo / Top-Up Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="e.g. APPLE2026 or VIPWELCOME"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-base font-mono font-bold text-sky-300 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 uppercase"
                />
              </div>
            </div>

            {resultMessage && (
              <div
                className={`flex items-center gap-2 p-3 rounded-xl text-xs ${
                  resultMessage.type === 'success'
                    ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                    : 'bg-pink-950/80 border border-pink-500/40 text-pink-200'
                }`}
              >
                {resultMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
                )}
                <p>{resultMessage.text}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/20 cursor-pointer"
            >
              Redeem Code Now
            </button>
          </form>

          {/* Information Notice */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <span>Official Voucher Redemption</span>
            </p>
            <p className="text-[11px] leading-relaxed">
              Top-Up codes are promotional cash vouchers granted exclusively by administration during official campaigns in the official WhatsApp and Telegram communities.
            </p>
          </div>

          {/* Redemption History */}
          {previousRedemptions.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-slate-400 mb-2">Your Redemption History</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {previousRedemptions.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-2 rounded-xl bg-slate-900/50 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-white">{item.title}</p>
                      <p className="text-[10px] text-slate-500">{item.date.slice(0, 10)}</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      +{formatNaira(item.amountKobo)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
