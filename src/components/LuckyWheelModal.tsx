import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira } from '../utils/formatters';
import { SpinPrizeItem } from '../types';
import {
  X,
  Sparkles,
  Lock,
  CheckCircle2,
  AlertCircle,
  Users,
  TrendingUp,
  RefreshCw,
  Gift,
  ShieldCheck,
} from 'lucide-react';

interface LuckyWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 6 Required Live Showcase Prizes:
// machines, bicycle, fridges, washing machine, power Bank, try again
export const LUCKY_WHEEL_PRIZES: SpinPrizeItem[] = [
  {
    id: 'p-washing',
    name: 'Automatic Washing Machine',
    subtitle: '8kg Front-Load Inverter Drum',
    category: 'washing_machine',
    color: '#0284c7', // Sky Blue
    iconName: 'WashingMachine',
    marketValueNaira: 320000,
  },
  {
    id: 'p-bicycle',
    name: 'Sport Mountain Bicycle',
    subtitle: '21-Speed Alloy Touring Bike',
    category: 'bicycle',
    color: '#db2777', // Dark Pink
    iconName: 'Bicycle',
    marketValueNaira: 185000,
  },
  {
    id: 'p-fridge',
    name: 'Double-Door Smart Fridge',
    subtitle: 'Frost-Free Deep Inverter Refrigerator',
    category: 'fridge',
    color: '#059669', // Emerald
    iconName: 'Fridge',
    marketValueNaira: 410000,
  },
  {
    id: 'p-machine',
    name: 'Industrial Tech Generator',
    subtitle: '5.5KVA Heavy Duty Machine',
    category: 'machine',
    color: '#7c3aed', // Purple
    iconName: 'Machine',
    marketValueNaira: 460000,
  },
  {
    id: 'p-powerbank',
    name: '50,000mAh Power Bank',
    subtitle: '65W Fast Charging PD Bank',
    category: 'power_bank',
    color: '#ea580c', // Orange
    iconName: 'PowerBank',
    marketValueNaira: 48000,
  },
  {
    id: 'p-tryagain',
    name: 'Try Again Tomorrow',
    subtitle: 'Better Luck Next Spin',
    category: 'try_again',
    color: '#334155', // Slate
    iconName: 'TryAgain',
    marketValueNaira: 0,
  },
];

// Rich pictorial SVG illustrations for each prize item
export const PrizeIllustration: React.FC<{ category: SpinPrizeItem['category']; className?: string }> = ({
  category,
  className = 'w-10 h-10',
}) => {
  switch (category) {
    case 'washing_machine':
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect x="8" y="4" width="32" height="40" rx="6" fill="#0f2b48" stroke="#38bdf8" strokeWidth="2.5" />
          <circle cx="24" cy="26" r="11" fill="#07182b" stroke="#38bdf8" strokeWidth="2" />
          <circle cx="24" cy="26" r="7" fill="#38bdf8" fillOpacity="0.3" stroke="#7dd3fc" strokeWidth="1.5" />
          <path d="M21 26C21 24.3431 22.3431 23 24 23C25.6569 23 27 24.3431 27 26" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="14" cy="10" r="2" fill="#38bdf8" />
          <line x1="20" y1="10" x2="34" y2="10" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'bicycle':
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <circle cx="12" cy="32" r="8" stroke="#f472b6" strokeWidth="2.5" />
          <circle cx="12" cy="32" r="3" fill="#f472b6" />
          <circle cx="36" cy="32" r="8" stroke="#f472b6" strokeWidth="2.5" />
          <circle cx="36" cy="32" r="3" fill="#f472b6" />
          <path d="M12 32L22 18H28L36 32" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 32L28 18" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 18L18 12" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <path d="M27 14H31" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 'fridge':
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect x="11" y="4" width="26" height="40" rx="5" fill="#093123" stroke="#34d399" strokeWidth="2.5" />
          <line x1="11" y1="18" x2="37" y2="18" stroke="#34d399" strokeWidth="2" />
          <line x1="15" y1="10" x2="15" y2="14" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="15" y1="24" x2="15" y2="32" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="23" y="24" width="8" height="6" rx="1.5" fill="#10b981" fillOpacity="0.4" stroke="#6ee7b7" strokeWidth="1" />
        </svg>
      );
    case 'machine':
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect x="8" y="10" width="32" height="28" rx="4" fill="#251246" stroke="#c084fc" strokeWidth="2.5" />
          <rect x="13" y="15" width="10" height="18" rx="2" fill="#7c3aed" fillOpacity="0.4" stroke="#a855f7" strokeWidth="1.5" />
          <circle cx="30" cy="24" r="6" stroke="#c084fc" strokeWidth="2" />
          <circle cx="30" cy="24" r="2.5" fill="#ffffff" />
          <path d="M12 6H36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="14" y1="38" x2="14" y2="42" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" />
          <line x1="34" y1="38" x2="34" y2="42" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
    case 'power_bank':
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <rect x="14" y="6" width="20" height="36" rx="4" fill="#381504" stroke="#fb923c" strokeWidth="2.5" />
          <rect x="18" y="12" width="12" height="6" rx="1.5" fill="#f97316" fillOpacity="0.3" stroke="#fdba74" strokeWidth="1" />
          <circle cx="21" cy="15" r="1" fill="#4ade80" />
          <circle cx="24" cy="15" r="1" fill="#4ade80" />
          <circle cx="27" cy="15" r="1" fill="#4ade80" />
          <path d="M24 23L21 28H27L24 33" stroke="#fed7aa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="20" y1="42" x2="28" y2="42" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case 'try_again':
    default:
      return (
        <svg viewBox="0 0 48 48" className={className} fill="none">
          <circle cx="24" cy="24" r="16" fill="#1e293b" stroke="#94a3b8" strokeWidth="2.5" />
          <path d="M24 16V24L29 29" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16 20C17.5 17 20.5 15 24 15C28.9706 15 33 19.0294 33 24" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
};

export const LuckyWheelModal: React.FC<LuckyWheelModalProps> = ({ isOpen, onClose }) => {
  const { user, investedCapitalKobo, allUsers, transactions, adminSettings, addNotification, updateProfile } = useApp();

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [wonPrize, setWonPrize] = useState<SpinPrizeItem | null>(null);

  if (!isOpen) return null;

  // Strict Eligibility Rule + Admin Spin Balance:
  // "make admin to be able to edit user spin balance"
  const minFriendInvestKobo = adminSettings.wheelMinFriendInvestKobo || 200000 * 100; // ₦200,000
  const minUserInvestKobo = adminSettings.wheelMinUserInvestKobo || 500000 * 100; // ₦500,000

  // 1. User Spin Tickets granted by Admin
  const userSpinTickets = user?.spinBalance || 0;

  // 2. Personal capital check
  const userQualified = investedCapitalKobo >= minUserInvestKobo;

  // 3. Direct downline check
  const userReferralCode = user?.referralCode || '';
  const myDownlines = allUsers.filter((u) => u.referredBy === userReferralCode);
  const myDownlineIds = myDownlines.map((d) => d.id);

  // Find max friend investment
  const downlineMaxInvestKobo = transactions
    .filter(
      (t) =>
        myDownlineIds.includes(t.userId) &&
        t.type === 'investment' &&
        t.status === 'Completed'
    )
    .reduce((max, t) => Math.max(max, t.amountKobo), 0);

  const downlineQualified = downlineMaxInvestKobo >= minFriendInvestKobo;
  const isEligible = userSpinTickets > 0 || userQualified || downlineQualified;

  const handleSpin = () => {
    if (!isEligible || isSpinning) return;

    if (user && user.spinBalance && user.spinBalance > 0) {
      updateProfile({ spinBalance: user.spinBalance - 1 });
    }

    setIsSpinning(true);
    setWonPrize(null);

    // Pick a prize
    const prizeIndex = Math.floor(Math.random() * LUCKY_WHEEL_PRIZES.length);
    const selectedPrize = LUCKY_WHEEL_PRIZES[prizeIndex];

    const segmentAngle = 360 / LUCKY_WHEEL_PRIZES.length; // 60 deg
    const totalSpins = 6 + Math.floor(Math.random() * 3);
    const targetAngle = totalSpins * 360 + (360 - (prizeIndex * segmentAngle + segmentAngle / 2));

    const finalRotation = rotation + targetAngle;
    setRotation(finalRotation);

    setTimeout(() => {
      setIsSpinning(false);
      setWonPrize(selectedPrize);

      if (selectedPrize.category !== 'try_again') {
        addNotification(
          `Lucky Wheel: ${selectedPrize.name} Won!`,
          `Congratulations! You unlocked the ${selectedPrize.name} (Valued at ₦${selectedPrize.marketValueNaira.toLocaleString()}) on the Apple Card Lucky Wheel! Our verification desk will dispatch your delivery confirmation.`,
          'reward'
        );
      }
    }, 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto select-none">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#09172f] via-[#071328] to-[#040c1a] border border-sky-500/40 rounded-3xl p-6 text-white shadow-2xl my-auto space-y-4">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 via-blue-500 to-pink-500 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-[#071328] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-sky-300" />
              </div>
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Apple Card Lucky Wheel</h3>
              <p className="text-[11px] text-sky-300 font-medium">Home Appliances & Luxury Tech Machines</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Eligibility Banner with Clear Criteria */}
        <div
          className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
            isEligible
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-900/90 border-amber-500/40 text-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold">
              {isEligible ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Wheel Eligible & Unlocked!</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-300">Spin Locked (Requirement Not Met)</span>
                </>
              )}
            </div>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                isEligible ? 'bg-emerald-900/80 text-emerald-300' : 'bg-slate-950 text-slate-400'
              }`}
            >
              {isEligible ? '1 Free Spin Ready' : '0 Spins'}
            </span>
          </div>

          {/* Detailed Progress Bars */}
          <div className="space-y-1.5 pt-1 border-t border-slate-800/80 text-[11px]">
            {/* Condition 1: Direct friend buys ₦200,000+ */}
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-sky-400" />
                  <span>Friend Investment (Min: ₦200,000)</span>
                </span>
                <span className="font-mono font-bold text-sky-300">
                  {formatNaira(downlineMaxInvestKobo, false)} / ₦200,000
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-sky-500 to-blue-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, (downlineMaxInvestKobo / minFriendInvestKobo) * 100)}%` }}
                />
              </div>
            </div>

            {/* Condition 2: Personal user buys ₦500,000+ */}
            <div>
              <div className="flex justify-between items-center text-[10px] text-slate-300 mb-0.5">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-pink-400" />
                  <span>Your Personal Capital (Min: ₦500,000)</span>
                </span>
                <span className="font-mono font-bold text-pink-300">
                  {formatNaira(investedCapitalKobo, false)} / ₦500,000
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${Math.min(100, (investedCapitalKobo / minUserInvestKobo) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* SPINNING WHEEL */}
        <div className="relative flex flex-col items-center justify-center my-2">
          {/* Top Indicator Needle Pointer */}
          <div className="absolute -top-3.5 z-20 w-0 h-0 border-l-[14px] border-l-transparent border-r-[14px] border-r-transparent border-t-[26px] border-t-pink-500 drop-shadow-[0_4px_10px_rgba(236,72,153,0.9)]" />

          {/* Wheel Disc */}
          <div className="w-64 h-64 rounded-full p-2 bg-gradient-to-tr from-sky-500 via-blue-600 to-pink-500 shadow-[0_0_45px_rgba(56,189,248,0.35)] relative overflow-hidden">
            <div
              className="w-full h-full rounded-full relative transition-transform duration-[4500ms] cubic-bezier(0.15, 0.9, 0.25, 1)"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {LUCKY_WHEEL_PRIZES.map((prize, idx) => {
                  const angle = 360 / LUCKY_WHEEL_PRIZES.length;
                  const startAngle = idx * angle;
                  const endAngle = startAngle + angle;

                  const rad1 = (startAngle * Math.PI) / 180;
                  const rad2 = (endAngle * Math.PI) / 180;

                  const x1 = 100 + 100 * Math.cos(rad1);
                  const y1 = 100 + 100 * Math.sin(rad1);
                  const x2 = 100 + 100 * Math.cos(rad2);
                  const y2 = 100 + 100 * Math.sin(rad2);

                  const path = `M 100 100 L ${x1} ${y1} A 100 100 0 0 1 ${x2} ${y2} Z`;

                  const midAngle = startAngle + angle / 2;
                  const textRad = (midAngle * Math.PI) / 180;
                  const tx = 100 + 64 * Math.cos(textRad);
                  const ty = 100 + 64 * Math.sin(textRad);

                  return (
                    <g key={prize.id}>
                      <path d={path} fill={prize.color} stroke="#071328" strokeWidth="2" />
                      <text
                        x={tx}
                        y={ty}
                        fill="#ffffff"
                        fontSize="6.5"
                        fontWeight="bold"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        transform={`rotate(${midAngle + 90}, ${tx}, ${ty})`}
                      >
                        {prize.name.split(' ')[0]}
                      </text>
                    </g>
                  );
                })}
              </svg>

              {/* Center Diamond Hub */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-slate-950 border-2 border-sky-400 shadow-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-sky-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Won Prize Banner */}
        {wonPrize && (
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-sky-950 via-slate-900 to-pink-950 border border-sky-400/50 text-center space-y-1 animate-in zoom-in-95">
            <span className="text-[10px] uppercase font-bold text-sky-300">Wheel Outcome</span>
            <div className="flex items-center justify-center gap-2">
              <PrizeIllustration category={wonPrize.category} className="w-7 h-7" />
              <h4 className="text-base font-black text-white">{wonPrize.name}</h4>
            </div>
            <p className="text-xs text-slate-300">{wonPrize.subtitle}</p>
            {wonPrize.category !== 'try_again' && (
              <p className="text-xs font-bold font-mono text-emerald-400">
                Market Worth: ₦{wonPrize.marketValueNaira.toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Spin Action Button */}
        <button
          onClick={handleSpin}
          disabled={!isEligible || isSpinning}
          className={`w-full py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition cursor-pointer ${
            isEligible && !isSpinning
              ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white cursor-pointer active:scale-95 shadow-sky-500/25'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-75'
          }`}
        >
          {isSpinning ? (
            <span className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Spinning Lucky Wheel...</span>
            </span>
          ) : isEligible ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Spin To Win Luxury Prize</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>Locked (Unlock Via Friends or ₦500k Invest)</span>
            </>
          )}
        </button>

        {/* 6 Live Prize Showcase Cards with Rich Pictures */}
        <div>
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Showcase Prizes (Live Machine Items)
          </h4>
          <div className="grid grid-cols-2 gap-2 text-left">
            {LUCKY_WHEEL_PRIZES.map((item) => (
              <div
                key={item.id}
                className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center flex-shrink-0 p-1 border border-slate-800">
                  <PrizeIllustration category={item.category} className="w-6 h-6" />
                </div>
                <div className="truncate">
                  <p className="text-[11px] font-bold text-white truncate">{item.name}</p>
                  <p className="text-[9px] font-mono text-sky-400">
                    {item.category === 'try_again' ? 'Bonus Spin' : `₦${item.marketValueNaira.toLocaleString()}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
