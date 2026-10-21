import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Sun,
  Sunrise,
  Sunset,
  Moon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const DynamicGreetingCard: React.FC = () => {
  const { user } = useApp();

  // Dynamic Time of Day Greeting
  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return {
        greeting: 'Good morning',
        icon: Sunrise,
        iconColor: 'text-amber-400',
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        greeting: 'Good afternoon',
        icon: Sun,
        iconColor: 'text-yellow-400',
      };
    } else if (hour >= 17 && hour < 22) {
      return {
        greeting: 'Good evening',
        icon: Sunset,
        iconColor: 'text-orange-400',
      };
    } else {
      return {
        greeting: 'Good night',
        icon: Moon,
        iconColor: 'text-indigo-400',
      };
    }
  }, []);

  const IconComponent = greetingInfo.icon;
  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Investor';

  return (
    <div className="flex items-center justify-between px-1 py-1">
      <div className="flex items-center gap-2.5">
        <div className="w-10 h-10 rounded-2xl bg-slate-900/90 border border-sky-500/30 flex items-center justify-center shadow-inner flex-shrink-0">
          <IconComponent className={`w-5 h-5 ${greetingInfo.iconColor}`} />
        </div>
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">{greetingInfo.greeting},</span>
            <span className="text-sm font-black text-white tracking-wide">
              {firstName}
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-[11px] text-sky-300 font-mono">
            ID: <span className="font-bold text-white">{user?.accountNumberId || 'ACI-882910'}</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/90 border border-sky-400/30 text-[10px] text-sky-300 font-bold shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
        <span>Diamond Vault</span>
      </div>
    </div>
  );
};
