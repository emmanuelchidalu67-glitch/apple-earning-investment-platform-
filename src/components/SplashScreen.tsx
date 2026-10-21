import React, { useEffect } from 'react';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  useEffect(() => {
    // Show the pristine brand icon and name, then instantly redirect to sign up page
    const timer = setTimeout(() => {
      onDismiss();
    }, 1200);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div
      onClick={onDismiss}
      className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-[#071328] bg-gradient-to-b from-[#0a1931] via-[#09152b] to-[#040b17] p-6 text-white overflow-hidden max-w-md mx-auto cursor-pointer select-none"
    >
      {/* Decorative Diamond ambient radial glows */}
      <div className="absolute top-1/3 -left-20 w-64 h-64 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/3 -right-20 w-64 h-64 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Main Center: ONLY app icon and name of the platform */}
      <div className="flex flex-col items-center justify-center">
        {/* App Icon */}
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-blue-700 via-sky-400 to-pink-500 p-1 shadow-[0_0_50px_rgba(56,189,248,0.45)] mb-6 animate-pulse">
          <div className="w-full h-full bg-[#0a182d] rounded-[22px] flex items-center justify-center relative overflow-hidden">
            <svg
              viewBox="0 0 24 24"
              className="w-16 h-16 text-sky-300 drop-shadow-[0_0_15px_rgba(56,189,248,0.9)]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="6 3 18 3 22 9 12 21 2 9" fill="#38bdf8" fillOpacity="0.25" stroke="currentColor" />
              <line x1="12" y1="21" x2="8.5" y2="9" stroke="currentColor" />
              <line x1="12" y1="21" x2="15.5" y2="9" stroke="currentColor" />
              <line x1="2" y1="9" x2="22" y2="9" stroke="currentColor" />
              <line x1="6" y1="3" x2="8.5" y2="9" stroke="currentColor" />
              <line x1="18" y1="3" x2="15.5" y2="9" stroke="currentColor" />
            </svg>
          </div>
        </div>

        {/* Name of the Platform */}
        <h1 className="text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-sky-100 to-sky-300 text-center">
          APPLE CARD
        </h1>
        <h2 className="text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-pink-500 text-center mt-0.5">
          INVESTMENT
        </h2>
      </div>
    </div>
  );
};
