import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatDate } from '../utils/formatters';
import {
  UserCircle,
  Settings,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  Gift,
  Clock,
  Building,
  KeyRound,
  ShieldCheck,
  Bell,
  HelpCircle,
  FileText,
  Lock,
  LogOut,
  ChevronRight,
  ShieldAlert,
  Sparkles,
  Sliders,
  CheckCircle2,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface ProfileTabProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenHistory: () => void;
  onOpenBankManager: () => void;
  onOpenTopUpCode: () => void;
  onOpenNotifications: () => void;
  onOpenAdminPortal: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  onOpenHistory,
  onOpenBankManager,
  onOpenTopUpCode,
  onOpenNotifications,
  onOpenAdminPortal,
}) => {
  const { user, logout, setActiveTab, updateWithdrawalPin, updateProfile } = useApp();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showProfileSettingsModal, setShowProfileSettingsModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Copied feedback notification
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  // Profile Edit State
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null);

  // Password Management State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // PIN change state
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  // Support ticket state
  const [supportMessage, setSupportMessage] = useState('');
  const [ticketCreated, setTicketCreated] = useState(false);

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedNotice(`Copied ${label}!`);
      setTimeout(() => setCopiedNotice(null), 2000);
    } catch {
      setCopiedNotice(`${label}: ${text}`);
      setTimeout(() => setCopiedNotice(null), 3000);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFullName.trim()) return;
    updateProfile({
      fullName: editFullName.trim(),
      phone: editPhone.trim() || user?.phone,
    });
    setProfileSaveSuccess('Profile details saved successfully!');
    setTimeout(() => {
      setProfileSaveSuccess(null);
      setShowProfileSettingsModal(false);
    }, 1500);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    setPasswordSuccess('Security password updated and re-encrypted successfully!');
    setTimeout(() => {
      setPasswordSuccess(null);
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1500);
  };

  const handlePinUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      setPinError('New PIN must be exactly 4 numeric digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PINs do not match.');
      return;
    }

    updateWithdrawalPin(newPin);
    setPinSuccess('Your 4-digit withdrawal PIN was updated successfully!');
    setTimeout(() => {
      setShowPinModal(false);
      setPinSuccess(null);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
    }, 1500);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportMessage.trim()) return;
    setTicketCreated(true);
    setTimeout(() => {
      setTicketCreated(false);
      setSupportMessage('');
      setShowSupportModal(false);
    }, 2000);
  };

  return (
    <div className="pb-28 pt-2 px-4 space-y-4">
      {/* Toast Notice for Clipboard & Actions */}
      {copiedNotice && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-sky-500 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{copiedNotice}</span>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-tr from-[#0a1932] via-[#0e2448] to-[#1c1236] border border-sky-500/30 text-white relative overflow-hidden shadow-xl">
        <div className="flex items-center gap-4">
          {/* Avatar with diamond ring - clickable to open settings */}
          <button
            onClick={() => setShowProfileSettingsModal(true)}
            title="Click to view & edit profile details"
            className="relative group cursor-pointer"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-400 via-blue-600 to-pink-500 p-0.5 shadow-lg shadow-sky-500/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-[#0a1628] rounded-[14px] flex items-center justify-center font-extrabold text-xl text-sky-300">
                {user?.avatarInitials || 'AI'}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
          </button>

          {/* Details */}
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center justify-between">
              <h3
                onClick={() => setShowProfileSettingsModal(true)}
                className="font-extrabold text-base text-white tracking-wide hover:text-sky-300 cursor-pointer transition flex items-center gap-1.5"
                title="Click to view full investor identity"
              >
                <span>{user?.fullName || 'Investor Profile'}</span>
                <Settings className="w-3.5 h-3.5 text-sky-400/80 inline" />
              </h3>
            </div>
            <p className="text-xs text-slate-300 truncate">{user?.email || 'user@applecard.ng'}</p>
            <p className="text-xs font-mono text-slate-400">{user?.phone || '+234 800 000 0000'}</p>

            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <button
                onClick={() => handleCopy(user?.accountNumberId || 'ACI-000000', 'Account ID')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-sky-300 hover:border-sky-400 flex items-center gap-1 cursor-pointer transition"
                title="Click to copy Account ID"
              >
                <span>ID: {user?.accountNumberId || 'ACI-000000'}</span>
                <Copy className="w-2.5 h-2.5 opacity-70" />
              </button>
              <button
                onClick={() => handleCopy(user?.referralCode || 'APPLE77', 'Referral Code')}
                className="text-[10px] font-mono px-2 py-0.5 rounded bg-pink-950/60 border border-pink-500/30 text-pink-300 hover:border-pink-400 flex items-center gap-1 cursor-pointer transition"
                title="Click to copy Referral Code"
              >
                <span>Ref: {user?.referralCode || 'APPLE77'}</span>
                <Copy className="w-2.5 h-2.5 opacity-70" />
              </button>
            </div>
          </div>
        </div>

        {/* Verification Status & Date */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <span>Joined: {user?.registrationDate ? formatDate(user.registrationDate) : '2026'}</span>
          <button
            onClick={() => setShowProfileSettingsModal(true)}
            className="text-emerald-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>KYC Tier 1 Verified</span>
          </button>
        </div>
      </div>

      {/* LONG ROUNDED RECTANGULAR ACTION AREA WITH SEPARATE ICON BUTTONS */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 divide-y divide-slate-800/80 overflow-hidden shadow-lg">
        {/* 1. Profile Settings */}
        <button
          onClick={() => setShowProfileSettingsModal(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Profile Settings</p>
              <p className="text-[10px] text-slate-400">Personal details & KYC tier</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 2. Deposit */}
        <button
          onClick={onOpenDeposit}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <ArrowDownToLine className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Deposit</p>
              <p className="text-[10px] text-slate-400">Add capital via instant bank transfer</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 3. Withdraw */}
        <button
          onClick={onOpenWithdraw}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Withdraw</p>
              <p className="text-[10px] text-slate-400">Fast payout to your Nigerian bank</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 4. Team */}
        <button
          onClick={() => setActiveTab('team')}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Team & Referrals</p>
              <p className="text-[10px] text-slate-400">Manage 3-tier commission syndicate</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 5. Free Top-Up Code */}
        <button
          onClick={onOpenTopUpCode}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Free Top-Up Code</p>
              <p className="text-[10px] text-slate-400">Redeem promotional cash vouchers</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 6. History */}
        <button
          onClick={onOpenHistory}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">History & Receipts</p>
              <p className="text-[10px] text-slate-400">Auditable transaction records</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 7. Add Bank Account */}
        <button
          onClick={onOpenBankManager}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Nigerian Bank Accounts</p>
              <p className="text-[10px] text-slate-400">Add or manage CBN bank accounts</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 8. Security Password */}
        <button
          onClick={() => setShowPasswordModal(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Security Password</p>
              <p className="text-[10px] text-slate-400">Account login password & 2FA</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 9. Withdrawal PIN */}
        <button
          onClick={() => setShowPinModal(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Withdrawal PIN</p>
              <p className="text-[10px] text-slate-400">Change your secure 4-digit PIN</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 10. Notifications */}
        <button
          onClick={onOpenNotifications}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Notifications</p>
              <p className="text-[10px] text-slate-400">Broadcasts & transaction notices</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 11. Help and Support */}
        <button
          onClick={() => setShowSupportModal(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Help and Support</p>
              <p className="text-[10px] text-slate-400">24/7 dedicated investor ticket support</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 12. Terms and Conditions */}
        <button
          onClick={() => setShowTermsModal(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Terms and Conditions</p>
              <p className="text-[10px] text-slate-400">Investment policies & guidelines</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* 13. Privacy Policy */}
        <button
          onClick={() => setShowPrivacyModal(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-slate-800/60 transition text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white">Privacy Policy</p>
              <p className="text-[10px] text-slate-400">Data encryption & NDPR compliance</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>

        {/* SPECIFIC ADMIN ONLY: Visible ONLY to emmanuelchidalu67@gmail.com */}
        {user?.role === 'admin' && user?.email?.toLowerCase() === 'emmanuelchidalu67@gmail.com' && (
          <button
            onClick={onOpenAdminPortal}
            className="w-full flex items-center justify-between p-3.5 bg-gradient-to-r from-blue-950/60 to-purple-950/60 hover:from-blue-900/80 hover:to-purple-900/80 transition text-left cursor-pointer border-t-2 border-sky-500/40"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-400 to-pink-500 text-white flex items-center justify-center shadow-sm">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-black text-white tracking-wide">Administrator Portal</p>
                  <span className="px-1.5 py-0.2 rounded bg-pink-500/30 text-pink-300 text-[9px] font-bold">
                    MASTER
                  </span>
                </div>
                <p className="text-[10px] text-sky-300">Approve deposits, payouts, plans & vouchers</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-sky-400" />
          </button>
        )}

        {/* 14. Logout */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-between p-3.5 hover:bg-pink-950/30 transition text-left cursor-pointer text-pink-400"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-pink-950/50 text-pink-400 flex items-center justify-center">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold">Sign Out</p>
              <p className="text-[10px] text-pink-400/80">End this session securely</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-pink-500" />
        </button>
      </div>

      {/* Mandatory Footer requirement: All rights reserved by Apple Card Investment 2026. */}
      <div className="pt-4 pb-2 text-center">
        <p className="text-xs text-slate-500 font-medium">
          All rights reserved by Apple Card Investment 2026.
        </p>
      </div>

      {/* PIN CHANGE MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 text-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-sky-400" />
                <span>Change Withdrawal PIN</span>
              </h4>
              <button onClick={() => setShowPinModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {pinError && <p className="text-xs text-pink-400">{pinError}</p>}
            {pinSuccess && <p className="text-xs text-emerald-400">{pinSuccess}</p>}

            <form onSubmit={handlePinUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">New 4-Digit PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New PIN</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs uppercase"
              >
                Update Withdrawal PIN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SUPPORT MODAL */}
      {showSupportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 text-white space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                <span>Investor Support Desk</span>
              </h4>
              <button onClick={() => setShowSupportModal(false)} className="text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {ticketCreated ? (
              <div className="p-4 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                <p className="text-sm font-bold text-white">Ticket Submitted</p>
                <p className="text-xs text-slate-300">
                  Our official customer manager will respond to your registered email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} className="space-y-3">
                <p className="text-xs text-slate-400">
                  Have a question about deposits, plans, or withdrawals? Message our support team:
                </p>
                <textarea
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Describe your issue or question..."
                  rows={4}
                  required
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-sky-500 text-white font-bold text-xs uppercase"
                >
                  Send Support Ticket
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* PROFILE SETTINGS & KYC MODAL */}
      {showProfileSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-sky-500/50 rounded-3xl p-6 text-white max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base">Investor Profile Settings</h4>
                  <p className="text-[11px] text-sky-300">Verified KYC Tier 1 Credentials</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {profileSaveSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{profileSaveSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
              {/* Account ID & Referral (Readonly with 1-click copy) */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Account ID</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-300">{user?.accountNumberId || 'ACI-000000'}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(user?.accountNumberId || '', 'Account ID')}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">Referral Code</span>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-pink-300">{user?.referralCode || 'APPLE77'}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(user?.referralCode || '', 'Referral Code')}
                      className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Verified KYC Tier Banner */}
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-300">Identity Verified (Tier 1)</p>
                  <p className="text-[10px] text-slate-400">
                    Unlimited deposits, daily 24h automated yields, and verified bank/BEP-20 payouts enabled.
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  required
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-medium"
                />
              </div>

              {/* Email (Readonly) */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Registered Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full p-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 font-mono cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">Email is permanently locked to your ledger.</span>
              </div>

              {/* Phone */}
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Contact Phone</label>
                <input
                  type="tel"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowProfileSettingsModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold uppercase tracking-wider cursor-pointer shadow-lg"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SECURITY PASSWORD CHANGE MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-md bg-slate-900 border-2 border-sky-500/50 rounded-3xl p-6 text-white max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base">Security Password</h4>
                  <p className="text-[11px] text-sky-300">256-Bit Argon2 Protection</p>
                </div>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {passwordError && (
              <div className="p-3 rounded-2xl bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-bold">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handlePasswordUpdate} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p className="font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                  <span>End-to-End Cryptographic Security</span>
                </p>
                <p className="text-slate-400 leading-relaxed">
                  Your password protects your access to all investments and withdrawal records. Choose a strong password of 6 or more characters.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  required
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  required
                  className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold uppercase tracking-wider cursor-pointer shadow-lg"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENHANCED TERMS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-sky-500/50 rounded-3xl p-6 text-white max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base">Terms and Conditions of Investment</h4>
                  <p className="text-[11px] text-sky-300">Apple Card Investment Official Policy 2026</p>
                </div>
              </div>
              <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h5 className="font-bold text-white text-xs text-sky-400">1. Automated 24-Hour Settlement</h5>
                <p>
                  Returns are calculated automatically every 24 hours. No manual claims are permitted or required. Yields credit directly into your available balance every single day.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h5 className="font-bold text-white text-xs text-sky-400">2. 15% Standard Withdrawal Processing Fee</h5>
                <p>
                  All bank disbursements and BEP-20 payouts carry a fixed 15% settlement fee, covering interbank clearance and blockchain gas validation.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h5 className="font-bold text-white text-xs text-sky-400">3. Sole Administration Guarantee</h5>
                <p>
                  This platform is governed strictly by administrator Emmanuel Chidalu (emmanuelchidalu67@gmail.com). No other person or agent has administrative credentials.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTermsModal(false)}
              className="w-full py-3 rounded-2xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close Terms Charter
            </button>
          </div>
        </div>
      )}

      {/* ENHANCED PRIVACY MODAL */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 text-white max-h-[85vh] overflow-y-auto space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-white text-base">Privacy & Data Security Charter</h4>
                  <p className="text-[11px] text-emerald-300">NDPR & Global Security Standards 2026</p>
                </div>
              </div>
              <button onClick={() => setShowPrivacyModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h5 className="font-bold text-white text-xs text-emerald-400">1. Data Encryption in Transit & Rest</h5>
                <p>
                  Your financial records are protected with 256-bit TLS 1.3 encryption. Withdrawal PINs are secured with irreversible hashing.
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <h5 className="font-bold text-white text-xs text-emerald-400">2. Strict Zero Data Resale Policy</h5>
                <p>
                  We never sell, trade, or distribute your email, phone number, or banking information to external parties.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Close Privacy Charter
            </button>
          </div>
        </div>
      )}

      {/* LOGOUT CONFIRMATION */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-pink-500/30 rounded-3xl p-5 text-white space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto">
              <LogOut className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-base">Sign Out of Apple Card?</h4>
            <p className="text-xs text-slate-300">
              You will need your password to log back into your verified investment portfolio.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="w-1/2 py-2.5 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                className="w-1/2 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white uppercase"
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
