import React from 'react';
import { useApp } from '../context/AppContext';
import { Home, Layers, TrendingUp, Users, UserCircle } from 'lucide-react';

export const Navigation: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const navItems = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'plans' as const,
      label: 'Plan',
      icon: Layers,
    },
    {
      id: 'invest' as const,
      label: 'Invest',
      icon: TrendingUp,
    },
    {
      id: 'team' as const,
      label: 'Team',
      icon: Users,
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      icon: UserCircle,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-[#071328]/95 backdrop-blur-lg border-t border-slate-800/80 px-3 py-2 shadow-2xl">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 cursor-pointer relative ${
                isActive
                  ? 'text-sky-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Active Diamond Jewel Glow Indicator */}
              {isActive && (
                <div className="absolute -top-1 w-6 h-1 rounded-full bg-gradient-to-r from-sky-400 to-pink-500 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
              )}

              <div
                className={`p-1.5 rounded-xl transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                    : 'text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              </div>

              <span className="text-[11px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
