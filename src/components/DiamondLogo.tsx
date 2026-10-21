import React from 'react';

interface DiamondLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  centered?: boolean;
}

export const DiamondLogo: React.FC<DiamondLogoProps> = ({
  size = 'md',
  showTagline = false,
  centered = false,
}) => {
  const iconSizeClasses = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-xl',
  };

  const titleSizeClasses = {
    sm: 'text-sm font-bold tracking-tight',
    md: 'text-base font-extrabold tracking-wider',
    lg: 'text-xl font-extrabold tracking-wider',
    xl: 'text-2xl font-black tracking-widest',
  };

  return (
    <div className={`flex ${centered ? 'flex-col items-center text-center' : 'items-center gap-3'}`}>
      {/* Distinctive Diamond Faceted Icon */}
      <div
        className={`${iconSizeClasses[size]} relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-sky-500 to-pink-500 p-0.5 shadow-lg shadow-sky-500/20`}
      >
        <div className="w-full h-full bg-[#0a1628] rounded-[14px] flex items-center justify-center relative overflow-hidden">
          {/* Diamond light streaks */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-pink-500/20" />
          <svg
            viewBox="0 0 24 24"
            className="w-3/5 h-3/5 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Faceted Diamond Geometry */}
            <polygon points="6 3 18 3 22 9 12 21 2 9" fill="url(#diamondGrad)" fillOpacity="0.3" stroke="currentColor" />
            <line x1="12" y1="21" x2="8.5" y2="9" stroke="currentColor" strokeOpacity="0.8" />
            <line x1="12" y1="21" x2="15.5" y2="9" stroke="currentColor" strokeOpacity="0.8" />
            <line x1="2" y1="9" x2="22" y2="9" stroke="currentColor" strokeOpacity="0.8" />
            <line x1="6" y1="3" x2="8.5" y2="9" stroke="currentColor" strokeOpacity="0.8" />
            <line x1="18" y1="3" x2="15.5" y2="9" stroke="currentColor" strokeOpacity="0.8" />
            <defs>
              <linearGradient id="diamondGrad" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#0284c7" />
                <stop offset="1" stopColor="#db2777" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      <div className={centered ? 'mt-3' : ''}>
        <div className="flex items-center gap-1.5 justify-center">
          <span className={`${titleSizeClasses[size]} bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent`}>
            APPLE CARD
          </span>
          <span className={`${titleSizeClasses[size]} bg-gradient-to-r from-sky-400 to-pink-500 bg-clip-text text-transparent`}>
            INVESTMENT
          </span>
        </div>
        {showTagline && (
          <p className="text-xs text-sky-200/80 font-medium tracking-wide mt-1">
            Where Your Money Is Growing Unstoppable
          </p>
        )}
      </div>
    </div>
  );
};
