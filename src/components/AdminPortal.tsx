import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, formatDate, nairaToKobo } from '../utils/formatters';
import { InvestmentPlan, UserProfile } from '../types';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Gift,
  FileText,
  Sliders,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Building,
  UserCheck,
  UserX,
  Ban,
  Trash2,
  Edit3,
  MessageCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  X,
  DollarSign,
  Award,
  Check,
} from 'lucide-react';

interface AdminPortalProps {
  onBackToUserView: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBackToUserView }) => {
  const {
    transactions,
    adminApproveDeposit,
    adminRejectDeposit,
    adminApproveWithdrawal,
    adminRejectWithdrawal,
    plans,
    adminUpdatePlan,
    adminCreateTopUpCode,
    auditLogs,
    availableBalanceKobo,
    investedCapitalKobo,
    pendingWithdrawalKobo,
    allUsers,
    adminSettings,
    updateAdminSettings,
    adminToggleUserVerification,
    addNotification,
    adminUpdateUserFinancials,
    adminDeleteUserInvestments,
    adminDeleteUser,
    adminToggleUserWithdrawalBan,
    adminToggleUserSuspension,
    adminPublishNotification,
    userInvestments,
    bankAccounts,
  } = useApp();

  const [adminTab, setAdminTab] = useState<'overview' | 'users' | 'controls' | 'deposits' | 'withdrawals' | 'plans' | 'codes' | 'audit'>('overview');

  // Reject modal state
  const [rejectTxId, setRejectTxId] = useState<string | null>(null);
  const [rejectType, setRejectType] = useState<'deposit' | 'withdrawal' | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment reference unverified on banking portal');

  // Plan editor state
  const [editingPlan, setEditingPlan] = useState<InvestmentPlan | null>(null);
  const [editDailyReturn, setEditDailyReturn] = useState('');
  const [editDuration, setEditDuration] = useState('');

  // Top-Up Code generator state
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeAmount, setNewCodeAmount] = useState('2000');
  const [newCodeLimit, setNewCodeLimit] = useState('500');
  const [newCodeExpiry, setNewCodeExpiry] = useState('2026-12-31');
  const [newCodeDesc, setNewCodeDesc] = useState('Executive VIP incentive');
  const [codeSuccessMsg, setCodeSuccessMsg] = useState<string | null>(null);

  // System Controls & Social Links State
  const [whatsappInput, setWhatsappInput] = useState(adminSettings.whatsappGroupUrl || '');
  const [telegramInput, setTelegramInput] = useState(adminSettings.telegramChannelUrl || '');
  const [referralBaseInput, setReferralBaseInput] = useState(adminSettings.baseReferralUrl || '');
  const [usdtAddressInput, setUsdtAddressInput] = useState(adminSettings.usdtBep20Address || '');
  const [usdtRateInput, setUsdtRateInput] = useState((adminSettings.usdtExchangeRateNaira || 1550).toString());
  const [wheelFriendInput, setWheelFriendInput] = useState(((adminSettings.wheelMinFriendInvestKobo || 20000000) / 100).toString());
  const [wheelUserInput, setWheelUserInput] = useState(((adminSettings.wheelMinUserInvestKobo || 50000000) / 100).toString());
  const [depositBankInput, setDepositBankInput] = useState(adminSettings.depositBankName || 'Moniepoint Microfinance Bank');
  const [depositAccountNumInput, setDepositAccountNumInput] = useState(adminSettings.depositAccountNumber || '8129940182');
  const [depositAccountNameInput, setDepositAccountNameInput] = useState(adminSettings.depositAccountName || 'APPLE CARD INVESTMENT TECH NIGERIA');
  const [savedSettingsNotice, setSavedSettingsNotice] = useState<string | null>(null);

  // User Management & Financial Editor State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserProfile | null>(null);
  const [editBalNaira, setEditBalNaira] = useState('');
  const [editCapitalNaira, setEditCapitalNaira] = useState('');
  const [editEarnedNaira, setEditEarnedNaira] = useState('');
  const [editVipLevel, setEditVipLevel] = useState(0);
  const [editSpinBalance, setEditSpinBalance] = useState(0);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [userEditNotice, setUserEditNotice] = useState<string | null>(null);
  const [copiedTextNotice, setCopiedTextNotice] = useState<string | null>(null);
  const [confirmDeleteInv, setConfirmDeleteInv] = useState(false);
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(false);

  // Platform Notification Broadcaster State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState<'system' | 'reward' | 'security' | 'transaction'>('system');
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);

  const pendingDeposits = transactions.filter((t) => t.type === 'deposit' && t.status === 'Pending');
  const pendingWithdrawals = transactions.filter((t) => t.type === 'withdrawal' && t.status === 'Pending');

  const totalDepositsApprovedKobo = transactions
    .filter((t) => t.type === 'deposit' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amountKobo, 0);

  const totalWithdrawalsPaidKobo = transactions
    .filter((t) => t.type === 'withdrawal' && t.status === 'Completed')
    .reduce((sum, t) => sum + t.amountKobo, 0);

  const handleApproveDeposit = (id: string) => {
    adminApproveDeposit(id);
  };

  const handleApproveWithdrawal = (id: string) => {
    adminApproveWithdrawal(id);
  };

  const handleOpenReject = (id: string, type: 'deposit' | 'withdrawal') => {
    setRejectTxId(id);
    setRejectType(type);
    setRejectReason(
      type === 'deposit'
        ? 'Narration reference mismatch or funds uncredited'
        : 'Bank account name mismatch with KYC records'
    );
  };

  const handleConfirmReject = () => {
    if (!rejectTxId || !rejectType) return;
    if (rejectType === 'deposit') {
      adminRejectDeposit(rejectTxId, rejectReason);
    } else {
      adminRejectWithdrawal(rejectTxId, rejectReason);
    }
    setRejectTxId(null);
    setRejectType(null);
  };

  const handleSavePlanEdit = () => {
    if (!editingPlan) return;
    const dailyKobo = nairaToKobo(Number(editDailyReturn) || 0);
    const duration = Number(editDuration) || editingPlan.durationDays;
    const totalPayout = dailyKobo * duration;

    adminUpdatePlan(editingPlan.id, {
      dailyReturnKobo: dailyKobo,
      durationDays: duration,
      totalPayoutKobo: totalPayout,
    });
    setEditingPlan(null);
  };

  const handleCreateCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCodeName.trim()) return;

    const res = adminCreateTopUpCode({
      code: newCodeName.trim(),
      amountKobo: nairaToKobo(Number(newCodeAmount)),
      totalLimit: Number(newCodeLimit),
      expiryDate: newCodeExpiry,
      description: newCodeDesc,
    });

    if (res.success) {
      setCodeSuccessMsg(`Code ${newCodeName.toUpperCase()} created successfully!`);
      setNewCodeName('');
      setTimeout(() => setCodeSuccessMsg(null), 3000);
    } else {
      alert(res.error || 'Failed to create code');
    }
  };

  const handleSaveSocialsAndGateways = (e: React.FormEvent) => {
    e.preventDefault();
    updateAdminSettings({
      whatsappGroupUrl: whatsappInput.trim(),
      telegramChannelUrl: telegramInput.trim(),
      baseReferralUrl: referralBaseInput.trim(),
      usdtBep20Address: usdtAddressInput.trim(),
      usdtExchangeRateNaira: Number(usdtRateInput) || 1550,
      depositBankName: depositBankInput.trim(),
      depositAccountNumber: depositAccountNumInput.trim(),
      depositAccountName: depositAccountNameInput.trim(),
      wheelMinFriendInvestKobo: (Number(wheelFriendInput) || 200000) * 100,
      wheelMinUserInvestKobo: (Number(wheelUserInput) || 500000) * 100,
    });
    setSavedSettingsNotice('All links, Nigerian bank deposit account, USDT settings, and wheel thresholds updated successfully!');
    setTimeout(() => setSavedSettingsNotice(null), 3500);
  };

  const handleOpenUserEditor = (targetUser: UserProfile) => {
    setSelectedUserForEdit(targetUser);
    setConfirmDeleteInv(false);
    setConfirmDeleteUser(false);
    const userBal = targetUser.balanceKobo !== undefined ? (targetUser.balanceKobo / 100).toString() : '0';
    const userCap = targetUser.investedBalanceKobo !== undefined ? (targetUser.investedBalanceKobo / 100).toString() : '0';
    const userEarned = targetUser.totalEarnedKobo !== undefined ? (targetUser.totalEarnedKobo / 100).toString() : '0';
    setEditBalNaira(userBal);
    setEditCapitalNaira(userCap);
    setEditEarnedNaira(userEarned);
    setEditVipLevel(targetUser.vipLevel || 0);
    setEditSpinBalance(targetUser.spinBalance || 0);
    setEditFullName(targetUser.fullName);
    setEditEmail(targetUser.email);
    setEditPhone(targetUser.phone);
    setEditRole(targetUser.role);
    setUserEditNotice(null);
  };

  const handleSaveUserFinancials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    adminUpdateUserFinancials(selectedUserForEdit.id, {
      fullName: editFullName.trim(),
      email: editEmail.trim(),
      phone: editPhone.trim(),
      role: editRole,
      balanceKobo: Math.round((Number(editBalNaira) || 0) * 100),
      investedCapitalKobo: Math.round((Number(editCapitalNaira) || 0) * 100),
      totalEarnedKobo: Math.round((Number(editEarnedNaira) || 0) * 100),
      vipLevel: editVipLevel,
      spinBalance: editSpinBalance,
    });

    setUserEditNotice('User profile, balances & VIP level updated successfully!');
    setTimeout(() => setUserEditNotice(null), 3000);
  };

  const handleDeleteUserInvestmentsAction = (userId: string) => {
    adminDeleteUserInvestments(userId);
    setEditCapitalNaira('0');
    setConfirmDeleteInv(false);
    setUserEditNotice('All active investments deleted. Invested capital reset to ₦0.00.');
    setTimeout(() => setUserEditNotice(null), 3500);
  };

  const handleDeleteUserPermanentlyAction = (userId: string) => {
    adminDeleteUser(userId);
    setConfirmDeleteUser(false);
    setSelectedUserForEdit(null);
    setUserEditNotice('User permanently deleted from platform.');
    setTimeout(() => setUserEditNotice(null), 3500);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextNotice(`${label} copied to clipboard`);
    setTimeout(() => setCopiedTextNotice(null), 2000);
  };

  const handleBroadcastNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
    addNotification(broadcastTitle.trim(), broadcastMessage.trim(), broadcastType);
    setBroadcastTitle('');
    setBroadcastMessage('');
    setBroadcastSuccess('Announcement broadcasted to all investor dashboards!');
    setTimeout(() => setBroadcastSuccess(null), 3500);
  };

  return (
    <div className="pb-28 pt-2 px-4 space-y-4">
      {/* Top Admin Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={onBackToUserView}
          className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Investor Portal</span>
        </button>

        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-pink-950/80 border border-pink-500/40 text-[10px] font-bold text-pink-300">
          <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
          <span>ADMIN ACCESS 2026</span>
        </div>
      </div>

      {/* Admin Sub-navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'users', label: `Users (${allUsers.length})` },
          { id: 'controls', label: 'System Controls' },
          { id: 'deposits', label: `Deposits (${pendingDeposits.length})` },
          { id: 'withdrawals', label: `Payouts (${pendingWithdrawals.length})` },
          { id: 'plans', label: 'Plans VIP 1-12' },
          { id: 'codes', label: 'Create Codes' },
          { id: 'audit', label: 'Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setAdminTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              adminTab === tab.id
                ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-sm'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {adminTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Deposits In</span>
              <p className="text-xl font-black font-mono text-emerald-400 mt-1">
                {formatNaira(totalDepositsApprovedKobo, false)}
              </p>
              <p className="text-[10px] text-slate-500">Reconciled capital</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Payouts Out</span>
              <p className="text-xl font-black font-mono text-pink-400 mt-1">
                {formatNaira(totalWithdrawalsPaidKobo, false)}
              </p>
              <p className="text-[10px] text-slate-500">Disbursed to banks</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Active Capital Pool</span>
              <p className="text-xl font-black font-mono text-sky-400 mt-1">
                {formatNaira(investedCapitalKobo, false)}
              </p>
              <p className="text-[10px] text-slate-500">Currently in VIP tiers</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pending Requests</span>
              <p className="text-xl font-black font-mono text-amber-400 mt-1">
                {pendingDeposits.length + pendingWithdrawals.length}
              </p>
              <p className="text-[10px] text-slate-500">Requires admin action</p>
            </div>
          </div>

          {/* Quick Queue summary */}
          <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Immediate Attention Required
            </h4>
            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-950">
              <span className="text-slate-300">Pending Deposit Approvals:</span>
              <span className="font-bold font-mono text-sky-400">{pendingDeposits.length}</span>
            </div>
            <div className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-slate-950">
              <span className="text-slate-300">Pending Withdrawal Payouts:</span>
              <span className="font-bold font-mono text-pink-400">{pendingWithdrawals.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REGISTERED USERS MANAGEMENT */}
      {/* Requirement: "every user that registers should be recorded in the admin panel" */}
      {adminTab === 'users' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Registered Investors & Admins ({allUsers.length})
              </h3>
              <p className="text-[10px] text-slate-400">All registered accounts are captured on the ledger</p>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold">
              Total: {allUsers.length}
            </span>
          </div>

          <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
            {allUsers.map((u) => {
              const uBalKobo = u.balanceKobo || 0;
              const uCapKobo = u.investedBalanceKobo || 0;
              const uEarnKobo = u.totalEarnedKobo || 0;
              const uVip = u.vipLevel !== undefined ? u.vipLevel : (uCapKobo > 0 ? 1 : 0);
              const cleanPhone = u.phone.replace(/\D/g, '');

              return (
                <div
                  key={u.id}
                  className={`p-4 rounded-3xl bg-slate-900 border transition ${
                    u.isSuspended
                      ? 'border-red-500/50 bg-red-950/20'
                      : u.isWithdrawalBanned
                      ? 'border-amber-500/40 bg-amber-950/10'
                      : 'border-slate-800'
                  } space-y-3 shadow-md`}
                >
                  {/* Row 1: Profile & Badges */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-500 text-white flex items-center justify-center font-bold text-xs shadow-md">
                        {u.avatarInitials}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold text-white">{u.fullName}</span>
                          {u.role === 'admin' ? (
                            <span className="px-1.5 py-0.2 rounded bg-pink-500/30 border border-pink-500/40 text-pink-300 text-[9px] font-black">
                              ADMIN
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 text-[9px] font-bold">
                              VIP {uVip}
                            </span>
                          )}
                          {u.isSuspended && (
                            <span className="px-1.5 py-0.2 rounded bg-red-600/30 text-red-300 text-[9px] font-bold">
                              SUSPENDED
                            </span>
                          )}
                          {u.isWithdrawalBanned && (
                            <span className="px-1.5 py-0.2 rounded bg-amber-600/30 text-amber-300 text-[9px] font-bold">
                              WITHDRAW FROZEN
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-300 font-mono">{u.email}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400 font-bold">
                        {u.accountNumberId}
                      </span>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Reg: {u.registrationDate ? u.registrationDate.slice(0, 10) : '2026'}
                      </p>
                    </div>
                  </div>

                  {/* Row 2: WhatsApp Link, Phone & Referral Info & Login Showcase */}
                  <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] text-slate-300 font-bold">{u.phone}</span>
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/30 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-600/50 text-[10px] font-bold transition shadow-xs"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp Direct</span>
                      </a>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-500/30 text-sky-300 font-mono font-bold">
                        Login: {u.phone}
                      </span>
                      <span>Ref: <strong className="font-mono text-sky-300">{u.referralCode}</strong></span>
                      {u.referredBy && (
                        <span>By: <strong className="font-mono text-purple-300">{u.referredBy}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Financial Balances Grid (Available, Invested/Capital, Profit, VIP, Spins) */}
                  <div className="grid grid-cols-5 gap-1 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Available</span>
                      <span className="font-bold font-mono text-white text-[10px] truncate block">
                        {formatNaira(uBalKobo, false)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Invested</span>
                      <span className="font-bold font-mono text-sky-300 text-[10px] truncate block">
                        {formatNaira(uCapKobo, false)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">Earned</span>
                      <span className="font-bold font-mono text-emerald-400 text-[10px] truncate block">
                        {formatNaira(uEarnKobo, false)}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block truncate">VIP</span>
                      <span className="font-extrabold font-mono text-amber-300 text-[10px] block">
                        T{uVip}
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-[9px] uppercase font-bold text-purple-400 block truncate">Spins</span>
                      <span className="font-extrabold font-mono text-purple-300 text-[10px] block">
                        {u.spinBalance || 0}
                      </span>
                    </div>
                  </div>

                  {/* Row 4: Primary Action Button: "Manage & Edit Investor" + Quick toggles */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => handleOpenUserEditor(u)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Manage / Edit Investor</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Quick Ban/Unban Withdraw */}
                      <button
                        type="button"
                        onClick={() => adminToggleUserWithdrawalBan(u.id)}
                        title={u.isWithdrawalBanned ? 'Unfreeze user payouts' : 'Freeze user payouts'}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          u.isWithdrawalBanned
                            ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 hover:bg-amber-600/50'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {u.isWithdrawalBanned ? 'Unban Wth' : 'Ban Wth'}
                      </button>

                      {/* Quick Suspend/Unsuspend */}
                      <button
                        type="button"
                        onClick={() => adminToggleUserSuspension(u.id)}
                        title={u.isSuspended ? 'Reactivate account' : 'Suspend account'}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          u.isSuspended
                            ? 'bg-red-600/30 text-red-300 border border-red-500/40 hover:bg-red-600/50'
                            : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {u.isSuspended ? 'Restore' : 'Suspend'}
                      </button>

                      {/* KYC toggle */}
                      <button
                        type="button"
                        onClick={() => adminToggleUserVerification(u.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition ${
                          u.isVerified
                            ? 'bg-slate-800 text-slate-400 hover:text-white'
                            : 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/50'
                        }`}
                      >
                        {u.isVerified ? 'KYC ✓' : 'Verify KYC'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: SYSTEM & RISK CONTROLS */}
      {/* Requirement: "the withdrawal fees should be 15% and no withdrawals on Sat and Sunday and also everything admin should control it" */}
      {adminTab === 'controls' && (
        <div className="space-y-4">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Financial Policy & Weekend Gates
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configure platform fee structures and banking settlement windows in real-time.
              </p>
            </div>

            {/* Withdrawal Fee Control (Default 15%) */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs font-bold text-white">Withdrawal Processing Fee</p>
                  <p className="text-[10px] text-slate-400">Currently applied to all outgoing payouts</p>
                </div>
                <span className="text-base font-black font-mono text-pink-400">
                  {adminSettings.withdrawalFeePercent}%
                </span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={adminSettings.withdrawalFeePercent}
                  onChange={(e) => updateAdminSettings({ withdrawalFeePercent: Number(e.target.value) })}
                  className="w-full accent-pink-500 cursor-pointer"
                />
                <span className="font-mono text-xs font-bold text-white w-10 text-right">
                  {adminSettings.withdrawalFeePercent}%
                </span>
              </div>
            </div>

            {/* Weekend Withdrawals Toggle (Sat & Sun) */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-white">Allow Weekend Withdrawals</p>
                <p className="text-[10px] text-slate-400">
                  Default: Disabled (No withdrawals on Saturday & Sunday)
                </p>
                <span
                  className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    adminSettings.allowWeekendWithdrawals
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-pink-500/20 text-pink-300'
                  }`}
                >
                  {adminSettings.allowWeekendWithdrawals
                    ? 'Weekend Requests Allowed'
                    : 'Closed on Saturday & Sunday'}
                </span>
              </div>
              <button
                onClick={() =>
                  updateAdminSettings({
                    allowWeekendWithdrawals: !adminSettings.allowWeekendWithdrawals,
                  })
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  adminSettings.allowWeekendWithdrawals
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {adminSettings.allowWeekendWithdrawals ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {/* Welcome Bonus Config */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-white">Auto Welcome Bonus</p>
                <p className="text-[10px] text-slate-400">
                  Auto-credited to new verified accounts upon registration
                </p>
              </div>
              <span className="text-sm font-black font-mono text-emerald-400">
                {formatNaira(adminSettings.welcomeBonusKobo)}
              </span>
            </div>

            {/* Referral Tiers Config */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <p className="text-xs font-bold text-white">Referral Syndicate Commission Rules</p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Tier 1</span>
                  <p className="font-bold text-sky-400 font-mono">{adminSettings.tier1CommissionPercent}%</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Tier 2</span>
                  <p className="font-bold text-purple-400 font-mono">{adminSettings.tier2CommissionPercent}%</p>
                </div>
                <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] text-slate-400">Tier 3</span>
                  <p className="font-bold text-pink-400 font-mono">{adminSettings.tier3CommissionPercent}%</p>
                </div>
              </div>
            </div>

            {/* SOCIAL, REFERRAL & USDT GATEWAY CONTROLS */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Community Links, Referral URL & USDT Gateway
                </h4>
                <p className="text-[10px] text-slate-400">
                  Admin-managed investor channels, team links, and crypto wallet parameters.
                </p>
              </div>

              {savedSettingsNotice && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200">
                  {savedSettingsNotice}
                </div>
              )}

              <form onSubmit={handleSaveSocialsAndGateways} className="space-y-3 text-xs">
                {/* WhatsApp Group Link */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Official WhatsApp Group Link
                  </label>
                  <input
                    type="url"
                    value={whatsappInput}
                    onChange={(e) => setWhatsappInput(e.target.value)}
                    placeholder="https://chat.whatsapp.com/..."
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Telegram Channel Link */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Official Telegram Channel Link
                  </label>
                  <input
                    type="url"
                    value={telegramInput}
                    onChange={(e) => setTelegramInput(e.target.value)}
                    placeholder="https://t.me/..."
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>

                {/* Base Referral Link */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Base Referral URL Prefix
                  </label>
                  <input
                    type="text"
                    value={referralBaseInput}
                    onChange={(e) => setReferralBaseInput(e.target.value)}
                    placeholder="https://applecardinvestment.ng/ref/"
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    User unique referral code will append to this URL across the app.
                  </p>
                </div>

                {/* USDT BEP-20 Wallet Address */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    USDT (BEP-20) Receiving Wallet Address
                  </label>
                  <input
                    type="text"
                    value={usdtAddressInput}
                    onChange={(e) => setUsdtAddressInput(e.target.value)}
                    placeholder="0x..."
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sky-300 text-xs font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* USDT Exchange Rate & Wheel Thresholds */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      1 USDT = (NGN)
                    </label>
                    <input
                      type="number"
                      value={usdtRateInput}
                      onChange={(e) => setUsdtRateInput(e.target.value)}
                      placeholder="1550"
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Friend Wheel (₦)
                    </label>
                    <input
                      type="number"
                      value={wheelFriendInput}
                      onChange={(e) => setWheelFriendInput(e.target.value)}
                      placeholder="200000"
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                      Personal Wheel (₦)
                    </label>
                    <input
                      type="number"
                      value={wheelUserInput}
                      onChange={(e) => setWheelUserInput(e.target.value)}
                      placeholder="500000"
                      className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Official Nigerian Deposit Bank Account Management */}
                {/* Requirement: "Make admin to be able to manage deposit Nigeria account" */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                    <Building className="w-4 h-4 text-sky-400" />
                    <span>Official Nigerian Deposit Bank Account</span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Set the destination bank account where investors transfer funds for Nigerian Naira deposits.
                  </p>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={depositBankInput}
                        onChange={(e) => setDepositBankInput(e.target.value)}
                        placeholder="e.g. Moniepoint Microfinance Bank"
                        className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                          Account Number
                        </label>
                        <input
                          type="text"
                          value={depositAccountNumInput}
                          onChange={(e) => setDepositAccountNumInput(e.target.value)}
                          placeholder="e.g. 8129940182"
                          className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono font-bold focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-300 mb-1">
                          Account Name
                        </label>
                        <input
                          type="text"
                          value={depositAccountNameInput}
                          onChange={(e) => setDepositAccountNameInput(e.target.value)}
                          placeholder="e.g. APPLE CARD INVESTMENT TECH"
                          className="w-full px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-sky-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer transition"
                >
                  Save Links & Platform Controls
                </button>
              </form>
            </div>

            {/* NOTIFICATION PUBLISHER SECTION */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Broadcast System Announcement
                </h4>
                <p className="text-[10px] text-slate-400">
                  Publish live notification cards to all user accounts and notification bell.
                </p>
              </div>

              {broadcastSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200">
                  {broadcastSuccess}
                </div>
              )}

              <form onSubmit={handleBroadcastNotification} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Announcement Headline
                  </label>
                  <input
                    type="text"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    placeholder="e.g. VIP Payout Cycle Credited & Weekend Reminder"
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Notification Message
                  </label>
                  <textarea
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Write announcement body here..."
                    required
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="flex gap-2 items-center">
                  <select
                    value={broadcastType}
                    onChange={(e) => setBroadcastType(e.target.value as any)}
                    className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="system">Category: System</option>
                    <option value="reward">Category: Reward / Promo</option>
                    <option value="security">Category: Security</option>
                    <option value="transaction">Category: Transaction</option>
                  </select>

                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow cursor-pointer transition"
                  >
                    Publish to All Users
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DEPOSIT APPROVALS */}
      {adminTab === 'deposits' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Pending Bank Deposits ({pendingDeposits.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Real-time queue</span>
          </div>

          {pendingDeposits.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-bold">No pending deposits</p>
              <p className="text-[11px] text-slate-500 mt-0.5">All customer inflows have been reconciled.</p>
            </div>
          ) : (
            pendingDeposits.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-3xl bg-slate-900 border border-sky-500/30 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-sky-400">{tx.reference}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tx.paymentMethod?.includes('USDT')
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {tx.paymentMethod || 'Bank Transfer'}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white mt-1">
                      Sender: {tx.senderName || 'Anonymous Investor'}
                    </p>
                    {tx.metadata?.senderReference && (
                      <p className="text-[10px] font-mono text-slate-300 mt-0.5 truncate max-w-[240px]">
                        Ref/TxID: {tx.metadata.senderReference}
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(tx.date)}</p>
                  </div>
                  <p className="text-base font-black font-mono text-emerald-400">
                    +{formatNaira(tx.amountKobo)}
                  </p>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenReject(tx.id, 'deposit')}
                    className="w-1/2 py-2 rounded-xl bg-pink-950/60 hover:bg-pink-950 text-pink-300 border border-pink-500/30 text-xs font-bold"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveDeposit(tx.id)}
                    className="w-1/2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
                  >
                    Approve & Credit Balance
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: WITHDRAWAL APPROVALS */}
      {adminTab === 'withdrawals' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Pending Payout Requests ({pendingWithdrawals.length})
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Disbursement queue</span>
          </div>

          {pendingWithdrawals.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-3xl border border-slate-800">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="text-xs text-slate-300 font-bold">No pending payouts</p>
              <p className="text-[11px] text-slate-500 mt-0.5">All customer withdrawals are fulfilled.</p>
            </div>
          ) : (
            pendingWithdrawals.map((tx) => (
              <div
                key={tx.id}
                className="p-4 rounded-3xl bg-slate-900 border border-pink-500/30 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-bold text-pink-400">{tx.reference}</span>
                    <p className="text-xs font-bold text-white mt-1">
                      {tx.bankDetails?.bankName}
                    </p>
                    <p className="font-mono text-xs text-sky-400">
                      {tx.bankDetails?.accountNumber} • {tx.bankDetails?.accountName}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(tx.date)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-black font-mono text-pink-400">
                      {formatNaira(tx.amountKobo)}
                    </p>
                    {tx.feeKobo && (
                      <p className="text-[10px] text-slate-400 font-mono">
                        Fee: {formatNaira(tx.feeKobo)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => handleOpenReject(tx.id, 'withdrawal')}
                    className="w-1/2 py-2 rounded-xl bg-pink-950/60 hover:bg-pink-950 text-pink-300 border border-pink-500/30 text-xs font-bold"
                  >
                    Reject & Refund
                  </button>
                  <button
                    onClick={() => handleApproveWithdrawal(tx.id)}
                    className="w-1/2 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold shadow-md shadow-sky-500/25"
                  >
                    Approve & Mark Paid
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 4: INVESTMENT PLAN MANAGEMENT (VIP 1 - 12) */}
      {adminTab === 'plans' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-300">
            Configure daily earnings and duration for all 12 VIP tiers. Changes take effect on newly activated contracts.
          </p>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {plans.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center"
              >
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-white">{p.name}</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-semibold">
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                    Capital: {formatNaira(p.capitalKobo, false)} • Daily: +{formatNaira(p.dailyReturnKobo, false)} ({p.durationDays}d)
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingPlan(p);
                    setEditDailyReturn((p.dailyReturnKobo / 100).toString());
                    setEditDuration(p.durationDays.toString());
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-sky-400"
                >
                  Edit Terms
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: FREE TOP-UP CODE GENERATOR */}
      {adminTab === 'codes' && (
        <div className="space-y-4">
          {codeSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200">
              {codeSuccessMsg}
            </div>
          )}

          <form onSubmit={handleCreateCode} className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Generate New Voucher Code
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Code Text</label>
              <input
                type="text"
                value={newCodeName}
                onChange={(e) => setNewCodeName(e.target.value.toUpperCase())}
                placeholder="e.g. VIPBONUS5000"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono font-bold text-sky-400 uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Reward Value (₦)</label>
                <input
                  type="number"
                  value={newCodeAmount}
                  onChange={(e) => setNewCodeAmount(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Max Redemptions</label>
                <input
                  type="number"
                  value={newCodeLimit}
                  onChange={(e) => setNewCodeLimit(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={newCodeExpiry}
                  onChange={(e) => setNewCodeExpiry(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Campaign Purpose</label>
                <input
                  type="text"
                  value={newCodeDesc}
                  onChange={(e) => setNewCodeDesc(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs uppercase"
            >
              Issue Promotional Code
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: AUDIT LOGS */}
      {adminTab === 'audit' && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">
            Immutable Administrative Audit Trail
          </h4>
          {auditLogs.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-6">No administrative audit records yet.</p>
          ) : (
            auditLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-sky-400">{log.action}</span>
                  <span className="text-[10px] text-slate-400">{formatDate(log.timestamp)}</span>
                </div>
                <p className="text-slate-200">{log.details}</p>
                {log.reason && (
                  <p className="text-[11px] text-amber-300 font-medium">Reason: {log.reason}</p>
                )}
                <p className="text-[10px] text-slate-500 font-mono">By: {log.adminEmail}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* REJECT DIALOG MODAL */}
      {rejectTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-pink-500/40 rounded-3xl p-5 text-white space-y-3">
            <h4 className="font-bold text-sm text-pink-400">
              Decline {rejectType === 'deposit' ? 'Deposit' : 'Withdrawal'}
            </h4>
            <p className="text-xs text-slate-300">
              Please enter an official audit reason for this rejection. The customer will be notified:
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-pink-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setRejectTxId(null)}
                className="w-1/2 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="w-1/2 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-xs font-bold text-white uppercase"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PLAN MODAL */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-sky-500/30 rounded-3xl p-5 text-white space-y-3">
            <h4 className="font-bold text-sm text-sky-400">Edit {editingPlan.name}</h4>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Daily Return Amount (₦)
              </label>
              <input
                type="number"
                value={editDailyReturn}
                onChange={(e) => setEditDailyReturn(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Duration (Days)
              </label>
              <input
                type="number"
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setEditingPlan(null)}
                className="w-1/2 py-2 rounded-xl bg-slate-800 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePlanEdit}
                className="w-1/2 py-2 rounded-xl bg-sky-500 text-xs font-bold text-white uppercase"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MANAGE INVESTOR / USER EDIT MODAL */}
      {/* Requirements: "add in each user registers should have a good button where admin can edit there balance, invested balance, capital, total earned balance and also vip level, ban withdraw, delete investment of user , suspend or delete user permanently, and also everything about the user add the Whatsapp and login show case and also make it look good" */}
      {selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-gradient-to-b from-[#0a182d] via-[#0b1b36] to-[#081224] border border-sky-500/40 rounded-3xl p-5 text-white shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-start pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center font-bold text-sm shadow-md">
                  {selectedUserForEdit.avatarInitials}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-base text-white">
                      {selectedUserForEdit.fullName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 text-[10px] font-bold border border-sky-500/30">
                      {selectedUserForEdit.role.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono">{selectedUserForEdit.email}</p>
                  <p className="text-[11px] text-sky-400 font-mono">
                    ID: {selectedUserForEdit.accountNumberId} · Ref: {selectedUserForEdit.referralCode}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUserForEdit(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification / Copy Toast */}
            {userEditNotice && (
              <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-xs text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{userEditNotice}</span>
              </div>
            )}
            {copiedTextNotice && (
              <div className="p-2.5 rounded-xl bg-sky-950/80 border border-sky-500/50 text-xs text-sky-200">
                {copiedTextNotice}
              </div>
            )}

            {/* SECTION 1: EDIT FINANCIAL BALANCES & VIP LEVEL */}
            <form onSubmit={handleSaveUserFinancials} className="space-y-3.5 p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs uppercase tracking-wider">
                  <DollarSign className="w-4 h-4" />
                  <span>Financial Balances & VIP Tier</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Real-time ledger</span>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {/* Available Balance */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Available Balance (₦)
                  </label>
                  <input
                    type="number"
                    value={editBalNaira}
                    onChange={(e) => setEditBalNaira(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl text-xs font-mono font-bold text-white"
                  />
                </div>

                {/* Invested Balance / Capital */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Invested Capital (₦)
                  </label>
                  <input
                    type="number"
                    value={editCapitalNaira}
                    onChange={(e) => setEditCapitalNaira(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-sky-400 rounded-xl text-xs font-mono font-bold text-sky-300"
                  />
                </div>

                {/* Total Earned Balance */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Total Earned Profit (₦)
                  </label>
                  <input
                    type="number"
                    value={editEarnedNaira}
                    onChange={(e) => setEditEarnedNaira(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-emerald-400 rounded-xl text-xs font-mono font-bold text-emerald-400"
                  />
                </div>

                {/* VIP Level */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    VIP Tier Level (0 - 12)
                  </label>
                  <select
                    value={editVipLevel}
                    onChange={(e) => setEditVipLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl text-xs font-bold text-amber-300"
                  >
                    <option value={0}>Tier 0 (Standard Free)</option>
                    <option value={1}>VIP 1 (₦3,000 Mini)</option>
                    <option value={2}>VIP 2 (₦10,000 Starter)</option>
                    <option value={3}>VIP 3 (₦30,000 Pro)</option>
                    <option value={4}>VIP 4 (₦50,000 Growth)</option>
                    <option value={5}>VIP 5 (₦70,000 Advanced)</option>
                    <option value={6}>VIP 6 (₦100,000 Elite)</option>
                    <option value={7}>VIP 7 (₦200,000 Diamond)</option>
                    <option value={8}>VIP 8 (₦300,000 Platinum)</option>
                    <option value={9}>VIP 9 (₦500,000 Master)</option>
                    <option value={10}>VIP 10 (₦1,000,000 Imperial)</option>
                    <option value={11}>VIP 11 (₦1,500,000 Supreme)</option>
                    <option value={12}>VIP 12 (₦2,000,000 Sovereign)</option>
                  </select>
                </div>

                {/* Spin Tickets / Balance */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Spin Wheel Tickets / Credits
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editSpinBalance}
                    onChange={(e) => setEditSpinBalance(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-purple-400 rounded-xl text-xs font-mono font-bold text-purple-300"
                    placeholder="0"
                  />
                  <p className="text-[9px] text-slate-500 mt-0.5">Allows user to spin Lucky Wheel</p>
                </div>
              </div>

              {/* Editable User Bio Info */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-800">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 mb-1">Account Role</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white font-bold"
                  >
                    <option value="user">Standard Investor</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
              >
                Save Investor Financials & Info
              </button>
            </form>

            {/* SECTION 2: ACCESS RESTRICTIONS & SECURITY SWITCHES */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
              <h4 className="font-bold text-sky-400 uppercase tracking-wider text-[11px]">
                Access Controls & Restriction Gates
              </h4>

              <div className="grid grid-cols-2 gap-2">
                {/* Freeze / Ban Withdrawals */}
                <button
                  type="button"
                  onClick={() => {
                    adminToggleUserWithdrawalBan(selectedUserForEdit.id);
                    setSelectedUserForEdit((prev) =>
                      prev ? { ...prev, isWithdrawalBanned: !prev.isWithdrawalBanned } : null
                    );
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    selectedUserForEdit.isWithdrawalBanned
                      ? 'bg-amber-600/20 border-amber-500/50 text-amber-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">Withdraw Access</p>
                    <p className="text-[10px] text-slate-400">
                      {selectedUserForEdit.isWithdrawalBanned ? 'Payouts Frozen' : 'Payouts Permitted'}
                    </p>
                  </div>
                  <Ban className={`w-4 h-4 ${selectedUserForEdit.isWithdrawalBanned ? 'text-amber-400' : 'text-slate-500'}`} />
                </button>

                {/* Suspend Account */}
                <button
                  type="button"
                  onClick={() => {
                    adminToggleUserSuspension(selectedUserForEdit.id);
                    setSelectedUserForEdit((prev) =>
                      prev ? { ...prev, isSuspended: !prev.isSuspended } : null
                    );
                  }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer ${
                    selectedUserForEdit.isSuspended
                      ? 'bg-red-600/20 border-red-500/50 text-red-200'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-bold">Account Status</p>
                    <p className="text-[10px] text-slate-400">
                      {selectedUserForEdit.isSuspended ? 'Suspended (Blocked)' : 'Active (Healthy)'}
                    </p>
                  </div>
                  <UserX className={`w-4 h-4 ${selectedUserForEdit.isSuspended ? 'text-red-400' : 'text-slate-500'}`} />
                </button>
              </div>
            </div>

            {/* SECTION 3: USER INVESTMENTS & PURGE */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1.5 font-bold text-sky-400 uppercase text-[11px]">
                  <Layers className="w-4 h-4" />
                  <span>Active Investment Portfolio</span>
                </div>
                {!confirmDeleteInv ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteInv(true)}
                    className="px-2.5 py-1 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3 text-red-400" />
                    <span>Delete Investments</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteUserInvestmentsAction(selectedUserForEdit.id)}
                      className="px-2.5 py-1 rounded-lg bg-red-600 text-white hover:bg-red-500 text-[10px] font-extrabold shadow cursor-pointer transition"
                    >
                      Confirm Delete All
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteInv(false)}
                      className="px-2 py-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-[10px] font-bold cursor-pointer transition"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {confirmDeleteInv && (
                <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-500/40 text-[11px] text-red-200">
                  ⚠️ This will revoke and delete all active investment contracts for this investor and reset active capital to ₦0.00.
                </div>
              )}

              {(() => {
                const userInvs = userInvestments.filter((inv) => inv.userId === selectedUserForEdit.id);
                if (userInvs.length === 0) {
                  return <p className="text-[11px] text-slate-500 py-1">No active investment contracts for this investor.</p>;
                }
                return (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {userInvs.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs"
                      >
                        <div>
                          <p className="font-bold text-white">{inv.planName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            Day {inv.daysElapsed}/{inv.durationDays} · Daily: +{formatNaira(inv.dailyReturnKobo, false)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-sky-300">{formatNaira(inv.capitalKobo, false)}</p>
                          <span className="text-[9px] font-semibold text-emerald-400">{inv.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* SECTION 4: LOGIN SHOWCASE & WHATSAPP INTEGRATION */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-sky-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-emerald-400 uppercase text-[11px]">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Login Showcase & WhatsApp Connect</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                  Verified Showcase
                </span>
              </div>

              {/* Login Credentials Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Login Phone</span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="font-mono font-bold text-white text-[11px] truncate">
                      {selectedUserForEdit.phone}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedUserForEdit.phone, 'Phone number')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Login Email</span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="font-mono font-bold text-sky-300 text-[11px] truncate">
                      {selectedUserForEdit.email}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedUserForEdit.email, 'Email')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Account Number</span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="font-mono font-bold text-purple-300 text-[11px]">
                      {selectedUserForEdit.accountNumberId}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(selectedUserForEdit.accountNumberId, 'Account Number')}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-bold"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Referral Code</span>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <span className="font-mono font-bold text-amber-300 text-[11px]">
                      {selectedUserForEdit.referralCode}
                    </span>
                    <span className="text-[9px] text-slate-500">
                      {selectedUserForEdit.referredBy ? `via ${selectedUserForEdit.referredBy}` : 'Direct'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Call-to-Action */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <a
                  href={`https://wa.me/${selectedUserForEdit.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>Direct WhatsApp Chat ({selectedUserForEdit.phone})</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* SECTION 5: DANGER ZONE - PERMANENT USER PURGE */}
            <div className="p-3.5 rounded-2xl bg-red-950/30 border border-red-500/30 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs font-bold text-red-300">Permanently Delete User</p>
                  <p className="text-[10px] text-slate-400">
                    Wipe this investor permanently from platform database, transactions, and banking.
                  </p>
                </div>
                {!confirmDeleteUser ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteUser(true)}
                    className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs uppercase flex items-center gap-1 shadow-md transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDeleteUserPermanentlyAction(selectedUserForEdit.id)}
                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs uppercase shadow-md transition cursor-pointer"
                    >
                      Confirm Permanent Wipe
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteUser(false)}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              {confirmDeleteUser && (
                <div className="p-2.5 rounded-xl bg-red-900/40 border border-red-500/50 text-[11px] text-red-200">
                  ⚠️ <strong>CRITICAL WARNING:</strong> This will completely remove <strong>{selectedUserForEdit.fullName}</strong> ({selectedUserForEdit.email}), all associated transaction logs, and balances permanently. This cannot be undone.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
