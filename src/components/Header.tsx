import React from 'react';
import { useApp } from '../context/AppContext';
import { DiamondLogo } from './DiamondLogo';
import { Bell, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  onOpenNotifications: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNotifications }) => {
  const { user, unreadNotificationCount } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-[#071328]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Brand with diamond icon */}
        <DiamondLogo size="sm" showTagline={false} />

        {/* Right actions: VIP badge & Notification bell */}
        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-900/80 border border-sky-500/30 text-[11px] font-semibold text-sky-300">
              <Sparkles className="w-3 h-3 text-sky-400" />
              <span>VIP Investor</span>
            </div>
          )}

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {unreadNotificationCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
