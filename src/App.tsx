import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { SplashScreen } from './components/SplashScreen';
import { AuthModal } from './components/AuthModal';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { HomeTab } from './components/HomeTab';
import { PlansTab } from './components/PlansTab';
import { InvestTab } from './components/InvestTab';
import { TeamTab } from './components/TeamTab';
import { ProfileTab } from './components/ProfileTab';
import { AdminPortal } from './components/AdminPortal';
import { InvestmentCanvasCelebration } from './components/InvestmentCanvasCelebration';

import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { BankAccountsModal } from './components/BankAccountsModal';
import { TopUpCodeModal } from './components/TopUpCodeModal';
import { UtilityModal } from './components/UtilityModal';
import { HistoryModal } from './components/HistoryModal';
import { NotificationsModal } from './components/NotificationsModal';
import { CommunityWelcomeModal } from './components/CommunityWelcomeModal';
import { LuckyWheelModal } from './components/LuckyWheelModal';

const MainAppContent: React.FC = () => {
  const {
    user,
    isAuthenticated,
    showSplash,
    setShowSplash,
    activeTab,
    setActiveTab,
    setAuthView,
    investInPlan,
    celebrationData,
    dismissCelebration,
    showCommunityModal,
    setShowCommunityModal,
  } = useApp();

  // Modal open states
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [showUtilityModal, setShowUtilityModal] = useState(false);
  const [utilityType, setUtilityType] = useState<'airtime' | 'data' | 'electricity'>('airtime');
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [showLuckyWheelModal, setShowLuckyWheelModal] = useState(false);

  // 1. Splash Showcase Presentation
  if (showSplash) {
    return (
      <SplashScreen
        onDismiss={() => {
          setShowSplash(false);
          if (!isAuthenticated) {
            setAuthView('signup');
          }
        }}
      />
    );
  }

  // 2. Strict Auth Gate: Do not show platform until user registers or signs in
  // Requirement: "don't show the platform until user registers after showcase user sigin"
  if (!user) {
    return (
      <div className="min-h-screen bg-[#030812] text-slate-100 flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-gradient-to-b from-[#071328] via-[#091833] to-[#040c1a] border-x border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col items-center justify-center p-4">
          <AuthModal />
        </div>
      </div>
    );
  }

  const handleOpenUtility = (type: 'airtime' | 'data' | 'electricity') => {
    setUtilityType(type);
    setShowUtilityModal(true);
  };

  const handleOpenHistoryWithFilter = (filter = 'all') => {
    setHistoryFilter(filter);
    setShowHistoryModal(true);
  };

  const handleInvestInPlan = (planId: string) => {
    const res = investInPlan(planId);
    if (res.success) {
      setActiveTab('invest');
    } else {
      if (res.error?.includes('deposit')) {
        setShowDepositModal(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#030812] text-slate-100 flex justify-center">
      {/* Mobile-first Shell */}
      <div className="w-full max-w-md min-h-screen bg-gradient-to-b from-[#071328] via-[#091833] to-[#040c1a] border-x border-slate-800/80 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col">
        {/* Top Sticky Header */}
        <Header onOpenNotifications={() => setShowNotificationsModal(true)} />

        {/* Main Body View */}
        <main className="flex-1 overflow-x-hidden">
          {activeTab === 'home' && (
            <HomeTab
              onOpenDeposit={() => setShowDepositModal(true)}
              onOpenWithdraw={() => setShowWithdrawModal(true)}
              onOpenHistory={() => handleOpenHistoryWithFilter('all')}
              onOpenUtility={handleOpenUtility}
              onInvestInPlan={handleInvestInPlan}
              onOpenLuckyWheel={() => setShowLuckyWheelModal(true)}
              onOpenCommunity={() => setShowCommunityModal(true)}
            />
          )}

          {activeTab === 'plans' && (
            <PlansTab onInvestInPlan={handleInvestInPlan} />
          )}

          {activeTab === 'invest' && <InvestTab />}

          {activeTab === 'team' && <TeamTab />}

          {activeTab === 'profile' && (
            <ProfileTab
              onOpenDeposit={() => setShowDepositModal(true)}
              onOpenWithdraw={() => setShowWithdrawModal(true)}
              onOpenHistory={() => handleOpenHistoryWithFilter('all')}
              onOpenBankManager={() => setShowBankModal(true)}
              onOpenTopUpCode={() => setShowTopUpModal(true)}
              onOpenNotifications={() => setShowNotificationsModal(true)}
              onOpenAdminPortal={() => setActiveTab('admin')}
            />
          )}

          {activeTab === 'admin' &&
            (user?.role === 'admin' && user?.email?.toLowerCase() === 'emmanuelchidalu67@gmail.com' ? (
              <AdminPortal onBackToUserView={() => setActiveTab('profile')} />
            ) : (
              <HomeTab
                onOpenDeposit={() => setShowDepositModal(true)}
                onOpenWithdraw={() => setShowWithdrawModal(true)}
                onOpenHistory={() => handleOpenHistoryWithFilter('all')}
                onOpenUtility={handleOpenUtility}
                onInvestInPlan={handleInvestInPlan}
                onOpenLuckyWheel={() => setShowLuckyWheelModal(true)}
                onOpenCommunity={() => setShowCommunityModal(true)}
              />
            ))}
        </main>

        {/* Fixed 5-Tab Bottom Navigation (visible unless inside admin portal) */}
        {activeTab !== 'admin' && <Navigation />}

        {/* Subtle Canvas-based Positive Reinforcement Particle Animation */}
        {celebrationData && (
          <InvestmentCanvasCelebration
            planName={celebrationData.planName}
            capitalKobo={celebrationData.capitalKobo}
            dailyYieldKobo={celebrationData.dailyYieldKobo}
            onDismiss={dismissCelebration}
          />
        )}

        {/* Global Modals */}
        <DepositModal
          isOpen={showDepositModal}
          onClose={() => setShowDepositModal(false)}
        />

        <WithdrawModal
          isOpen={showWithdrawModal}
          onClose={() => setShowWithdrawModal(false)}
          onOpenBankManager={() => {
            setShowWithdrawModal(false);
            setShowBankModal(true);
          }}
        />

        <BankAccountsModal
          isOpen={showBankModal}
          onClose={() => setShowBankModal(false)}
        />

        <TopUpCodeModal
          isOpen={showTopUpModal}
          onClose={() => setShowTopUpModal(false)}
        />

        <UtilityModal
          isOpen={showUtilityModal}
          initialType={utilityType}
          onClose={() => setShowUtilityModal(false)}
        />

        <HistoryModal
          isOpen={showHistoryModal}
          initialFilter={historyFilter}
          onClose={() => setShowHistoryModal(false)}
        />

        <NotificationsModal
          isOpen={showNotificationsModal}
          onClose={() => setShowNotificationsModal(false)}
        />

        <LuckyWheelModal
          isOpen={showLuckyWheelModal}
          onClose={() => setShowLuckyWheelModal(false)}
        />

        <CommunityWelcomeModal
          isOpen={showCommunityModal}
          onClose={() => setShowCommunityModal(false)}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
