import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, nairaToKobo } from '../utils/formatters';
import {
  X,
  ArrowUpFromLine,
  ArrowRight,
  ShieldCheck,
  Building,
  KeyRound,
  AlertCircle,
  Clock,
  PlusCircle,
} from 'lucide-react';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenBankManager: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  onOpenBankManager,
}) => {
  const { availableBalanceKobo, bankAccounts, submitWithdrawal, adminSettings } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('5000');
  const [selectedBankId, setSelectedBankId] = useState<string>(
    bankAccounts.find((b) => b.isDefault)?.id || bankAccounts[0]?.id || ''
  );
  const [withdrawalPin, setWithdrawalPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedReference, setConfirmedReference] = useState<string>('');
  const [confirmedAmountKobo, setConfirmedAmountKobo] = useState<number>(0);
  const [confirmedBank, setConfirmedBank] = useState<string>('');

  if (!isOpen) return null;

  const currentDay = new Date().getDay();
  const isWeekend = currentDay === 0 || currentDay === 6; // 0 is Sunday, 6 is Saturday
  const isWeekendBlocked = isWeekend && !adminSettings.allowWeekendWithdrawals;

  const quickWithdrawAmounts = [2000, 5000, 10000, 20000, 50000, 100000];
  const parsedAmount = Number(withdrawAmount) || 0;
  const amountKobo = nairaToKobo(parsedAmount);

  // 15% standard financial handling fee (controlled by adminSettings)
  const feePercent = adminSettings.withdrawalFeePercent; // default 15%
  const feeKobo = Math.round(amountKobo * (feePercent / 100));
  const netPayoutKobo = Math.max(0, amountKobo - feeKobo);

  const handleStep1Submit = () => {
    setErrorMessage(null);

    if (isWeekendBlocked) {
      setErrorMessage(
        'Withdrawals are closed on Saturdays and Sundays. Please request during standard banking business days (Monday - Friday).'
      );
      return;
    }

    const minKobo = 1000 * 100; // ₦1,000
    const maxKobo = 5000000 * 100; // ₦5,000,000

    if (amountKobo < minKobo) {
      setErrorMessage('Minimum withdrawal amount is ₦1,000.');
      return;
    }
    if (amountKobo > maxKobo) {
      setErrorMessage('Maximum single withdrawal limit is ₦5,000,000.');
      return;
    }
    if (amountKobo > availableBalanceKobo) {
      setErrorMessage('Withdrawal amount exceeds your available balance.');
      return;
    }
    if (bankAccounts.length === 0) {
      setErrorMessage('No saved bank account found. Please add a bank account first.');
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedBankId) {
      setErrorMessage('Please choose a destination bank account.');
      return;
    }
    if (withdrawalPin.length !== 4) {
      setErrorMessage('Please enter your 4-digit withdrawal PIN.');
      return;
    }

    const selectedBank = bankAccounts.find((b) => b.id === selectedBankId);
    const res = submitWithdrawal({
      amountKobo,
      bankAccountId: selectedBankId,
      withdrawalPin,
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Withdrawal submission failed');
      return;
    }

    setConfirmedReference(res.reference || 'WTH-PENDING');
    setConfirmedAmountKobo(amountKobo);
    setConfirmedBank(selectedBank ? `${selectedBank.bankName} (${selectedBank.accountNumber})` : 'Nigerian Bank');
    setStep(3);
  };

  const handleResetAndClose = () => {
    setStep(1);
    setWithdrawAmount('5000');
    setWithdrawalPin('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#09172f] via-[#071328] to-[#040c1a] border border-sky-500/25 rounded-3xl p-6 text-white shadow-2xl my-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
              <ArrowUpFromLine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Withdraw Funds</h3>
              <p className="text-[11px] text-pink-300 font-medium">3-Step Direct Bank Payout</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between my-4 px-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step === s
                    ? 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-[0_0_10px_rgba(236,72,153,0.5)]'
                    : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step > s ? '✓' : s}
              </div>
              <span className={`text-[11px] ${step === s ? 'text-pink-300 font-bold' : 'text-slate-500'}`}>
                {s === 1 ? 'Amount' : s === 2 ? 'Account & PIN' : 'Confirmation'}
              </span>
              {s < 3 && <div className="w-8 h-0.5 bg-slate-800 mx-1" />}
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-pink-950/80 border border-pink-500/40 text-xs text-pink-200">
            <AlertCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <p className="flex-1">{errorMessage}</p>
          </div>
        )}

        {/* STEP 1: AMOUNT SELECTION */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Balance banner */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-400">Available Withdrawable</span>
                <p className="text-lg font-black text-sky-400 font-mono">
                  {formatNaira(availableBalanceKobo)}
                </p>
              </div>
              <span className="text-[10px] px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-md font-semibold">
                Instant Settlement
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Withdrawal Amount (₦)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-pink-400 font-mono">
                  ₦
                </span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-900 border border-slate-700 rounded-2xl text-xl font-bold font-mono text-white focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            {/* Quick Amounts */}
            <div>
              <p className="text-xs font-semibold text-slate-300 mb-2">Quick Amounts</p>
              <div className="grid grid-cols-3 gap-2">
                {quickWithdrawAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWithdrawAmount(amt.toString())}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      parsedAmount === amt
                        ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-sm'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Limits & Fee Calculation */}
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Platform Processing Fee ({feePercent}%):</span>
                <span className="text-pink-400 font-mono">-{formatNaira(feeKobo)}</span>
              </div>
              <div className="flex justify-between font-bold text-white pt-1 border-t border-slate-800">
                <span>Net Bank Payout:</span>
                <span className="text-emerald-400 font-mono text-sm">{formatNaira(netPayoutKobo)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 pt-1">
                <span>Min: ₦1,000 • Max: ₦5,000,000</span>
                <span className={isWeekendBlocked ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                  {isWeekendBlocked ? 'Closed on Sat/Sun' : 'Open: Mon - Fri (Banking Hours)'}
                </span>
              </div>
            </div>

            <button
              onClick={handleStep1Submit}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-600 to-sky-600 hover:from-pink-500 hover:to-sky-500 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <span>Continue to Bank & PIN</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: BANK SELECTION & PIN */}
        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Select Destination Account or BEP-20 Card
                </label>
                <button
                  type="button"
                  onClick={onOpenBankManager}
                  className="flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Bank / BEP-20</span>
                </button>
              </div>

              {bankAccounts.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-center">
                  <p className="text-xs text-amber-300">No payout account or BEP-20 card linked yet.</p>
                  <button
                    type="button"
                    onClick={onOpenBankManager}
                    className="mt-2 text-xs font-bold text-sky-400 underline"
                  >
                    Click here to add your verified Nigerian bank or BEP-20 address
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {bankAccounts.map((b) => {
                    const isBep20 = b.type === 'bep20';
                    return (
                      <label
                        key={b.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          selectedBankId === b.id
                            ? isBep20
                              ? 'bg-teal-500/15 border-teal-400 text-white shadow-md'
                              : 'bg-sky-500/15 border-sky-400 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            name="bankSelection"
                            checked={selectedBankId === b.id}
                            onChange={() => setSelectedBankId(b.id)}
                            className="text-sky-500 focus:ring-sky-500 bg-slate-800"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold">{b.bankName}</p>
                              {isBep20 && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-500/20 text-teal-300 font-bold">
                                  BEP-20
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-mono text-sky-300">
                              {isBep20
                                ? `${b.accountNumber.slice(0, 8)}...${b.accountNumber.slice(-6)} • ${b.accountName}`
                                : `${b.accountNumber} • ${b.accountName}`}
                            </p>
                          </div>
                        </div>
                        {b.isDefault && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-semibold">
                            Primary
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4-digit PIN Request */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Enter 4-Digit Withdrawal PIN <span className="text-pink-400">*</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  maxLength={4}
                  value={withdrawalPin}
                  onChange={(e) => setWithdrawalPin(e.target.value)}
                  placeholder="••••"
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-pink-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Security notice: Never share your withdrawal PIN with third parties.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300"
              >
                Back
              </button>
              <button
                type="submit"
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-sky-600 text-white font-bold text-xs tracking-wider uppercase shadow-md shadow-pink-500/25"
              >
                Confirm Withdrawal
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: REQUEST CONFIRMATION */}
        {step === 3 && (
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider">
                Status: Pending Approval
              </span>
              <h4 className="text-lg font-bold text-white mt-2">Withdrawal Request Logged</h4>
              <p className="text-xs text-slate-300 mt-1 max-w-xs mx-auto">
                Your withdrawal request has been placed in the secure disbursement queue. Funds will be deposited to your verified bank upon final reconciliation.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-mono font-bold text-pink-400">{confirmedReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Requested Amount:</span>
                <span className="font-bold text-white">{formatNaira(confirmedAmountKobo)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destination:</span>
                <span className="font-semibold text-slate-200 truncate max-w-[200px]">{confirmedBank}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Audit Status:</span>
                <span className="text-amber-400 font-semibold">Under Security Review</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-sky-500/20"
            >
              Done / Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
