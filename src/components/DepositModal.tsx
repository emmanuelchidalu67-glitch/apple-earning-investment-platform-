import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, nairaToKobo } from '../utils/formatters';
import {
  X,
  Wallet,
  ArrowRight,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  AlertCircle,
  HelpCircle,
  Coins,
  QrCode,
} from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { submitDeposit, adminSettings } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [depositAmount, setDepositAmount] = useState<string>('10000');
  const [channelType, setChannelType] = useState<'bank' | 'usdt'>('bank');
  const [senderName, setSenderName] = useState('');
  const [senderReference, setSenderReference] = useState('');
  const [usdtTxHash, setUsdtTxHash] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Moniepoint Instant' | 'USDT (BEP-20)'>('Bank Transfer');
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedUsdt, setCopiedUsdt] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);
  const [confirmedReference, setConfirmedReference] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Preset quick chips as specified in prompt:
  // ₦3,000 · ₦5,000 · ₦6,000 · ₦10,000 · ₦20,000 · ₦50,000 · ₦100,000 · ₦200,000 · ₦500,000 · ₦1,000,000
  const quickAmounts = [3000, 5000, 6000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];

  const parsedAmount = Number(depositAmount) || 0;
  const usdtRate = adminSettings.usdtExchangeRateNaira || 1550;
  const calculatedUsdt = (parsedAmount / usdtRate).toFixed(2);
  const bep20Address = adminSettings.usdtBep20Address || '0x71C8F8b2B7A8c2b535B48B96602e1c942FdB7a61';

  const receivingAccount = {
    bankName: adminSettings.depositBankName || 'Moniepoint Microfinance Bank',
    accountNumber: adminSettings.depositAccountNumber || '8129940182',
    accountName: adminSettings.depositAccountName || 'APPLE CARD INVESTMENT TECH NIGERIA',
    tempReference: `DEP-${Math.floor(100000 + Math.random() * 900000)}`,
  };

  const handleProceedToStep2 = () => {
    if (parsedAmount < 1000) {
      setErrorMessage('Minimum deposit amount is ₦1,000.');
      return;
    }
    if (parsedAmount > 10000000) {
      setErrorMessage('Maximum single deposit is ₦10,000,000.');
      return;
    }
    setErrorMessage(null);
    if (channelType === 'usdt') {
      setPaymentMethod('USDT (BEP-20)');
    } else {
      setPaymentMethod('Bank Transfer');
    }
    setStep(2);
  };

  const handleConfirmPayment = () => {
    if (channelType === 'bank') {
      if (!senderName.trim()) {
        setErrorMessage('Please provide the Sender / Depositor Account Name for reconciliation.');
        return;
      }
    } else {
      if (!usdtTxHash.trim()) {
        setErrorMessage('Please provide the USDT BEP-20 Transaction Hash (TxID) or Sender Wallet.');
        return;
      }
    }

    const res = submitDeposit({
      amountKobo: nairaToKobo(parsedAmount),
      senderName: channelType === 'bank' ? senderName.trim() : `USDT BEP-20 Depositor (${calculatedUsdt} USDT)`,
      senderReference: channelType === 'bank' ? senderReference.trim() || undefined : usdtTxHash.trim(),
      paymentMethod: channelType === 'bank' ? paymentMethod : 'USDT (BEP-20)',
    });

    setConfirmedReference(res.reference);
    setStep(3);
  };

  const copyToClipboard = (text: string, type: 'account' | 'usdt' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'account') {
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    } else if (type === 'usdt') {
      setCopiedUsdt(true);
      setTimeout(() => setCopiedUsdt(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setDepositAmount('10000');
    setSenderName('');
    setSenderReference('');
    setUsdtTxHash('');
    setErrorMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#09172f] via-[#071328] to-[#040c1a] border border-sky-500/30 rounded-3xl p-6 text-white shadow-2xl my-auto space-y-4">
        {/* Top Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Deposit Funds</h3>
              <p className="text-[11px] text-sky-300">Instant Wallet Balance Credit</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          {[
            { num: 1, label: 'Amount' },
            { num: 2, label: 'Payment' },
            { num: 3, label: 'Confirm' },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center gap-1.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s.num
                    ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {step > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
              </div>
              <span
                className={`text-[11px] font-medium ${
                  step >= s.num ? 'text-white' : 'text-slate-500'
                }`}
              >
                {s.label}
              </span>
              {idx < 2 && <div className="w-6 h-0.5 bg-slate-800 mx-1" />}
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-xs text-pink-200">
            <AlertCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}

        {/* STEP 1: ENTER AMOUNT & CHOOSE METHOD */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Payment Method Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Deposit Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChannelType('bank')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    channelType === 'bank'
                      ? 'bg-sky-500/15 border-sky-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Building className="w-4 h-4 text-sky-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Bank Transfer</p>
                    <p className="text-[10px] text-slate-400">All Nigerian Banks</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setChannelType('usdt')}
                  className={`p-3 rounded-2xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                    channelType === 'usdt'
                      ? 'bg-emerald-500/15 border-emerald-400 text-white'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="text-xs font-bold text-white">USDT (BEP-20)</p>
                    <p className="text-[10px] text-slate-400">Binance Smart Chain</p>
                  </div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Deposit Amount (NGN)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-sky-400">
                  ₦
                </span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 10000"
                  className="w-full pl-10 pr-4 py-3.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-lg font-bold font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Min: ₦1,000 • Max: ₦10,000,000
                {channelType === 'usdt' && (
                  <span className="text-emerald-400 font-bold ml-1">
                    ≈ {calculatedUsdt} USDT (1 USDT = ₦{usdtRate.toLocaleString()})
                  </span>
                )}
              </p>
            </div>

            {/* Quick Amount Chips */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Quick Amount Select
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {quickAmounts.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount(amt.toString())}
                    className={`py-2 px-1 rounded-xl text-center font-mono text-[10px] font-bold border transition cursor-pointer ${
                      parsedAmount === amt
                        ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                        : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    ₦{(amt / 1000).toLocaleString()}k
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleProceedToStep2}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
            >
              <span>Continue to Payment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: BANK DETAILS OR USDT BEP-20 INSTRUCTIONS */}
        {step === 2 && (
          <div className="space-y-4">
            {channelType === 'bank' ? (
              /* Nigerian Bank Transfer View */
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-[#071328] border border-sky-500/40 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-xs text-slate-400">Transfer Exact Amount:</span>
                  <span className="text-lg font-black font-mono text-emerald-400">
                    {formatNaira(nairaToKobo(parsedAmount))}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Receiving Bank</span>
                    <p className="font-bold text-white text-sm">{receivingAccount.bankName}</p>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Account Number</span>
                    <div className="flex items-center justify-between p-2 rounded-xl bg-slate-950 border border-slate-800 mt-0.5">
                      <span className="font-mono text-base font-black text-sky-300 tracking-wider">
                        {receivingAccount.accountNumber}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(receivingAccount.accountNumber, 'account')}
                        className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        {copiedAccount ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedAccount ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase">Account Name</span>
                    <p className="font-semibold text-slate-200">{receivingAccount.accountName}</p>
                  </div>
                </div>
              </div>
            ) : (
              /* USDT BEP-20 View */
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#041a12] via-slate-900 to-[#071328] border border-emerald-500/40 space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div>
                    <span className="text-xs text-slate-400">Send Exactly:</span>
                    <p className="text-lg font-black font-mono text-emerald-400">
                      {calculatedUsdt} USDT
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black font-mono">
                    BEP20 (BNB CHAIN)
                  </span>
                </div>

                {/* BEP20 Address Box */}
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Official Deposit USDT Address (BEP-20)
                  </span>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 mt-1">
                    <span className="font-mono text-xs font-bold text-sky-300 truncate max-w-[210px]">
                      {bep20Address}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bep20Address, 'usdt')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      {copiedUsdt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedUsdt ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Network Warning */}
                <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-[10px] text-amber-200 leading-tight">
                  <strong className="text-amber-300">Important: </strong>
                  Only transfer USDT via the <strong>BNB Smart Chain (BEP-20)</strong> network. Sending via ERC-20 or TRC-20 will result in loss of funds.
                </div>
              </div>
            )}

            {/* Reconciliation Fields */}
            {channelType === 'bank' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Sender Account Name <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    placeholder="e.g. Chukwudi Joseph Nwankwo"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Name as it appears on your bank debit alert
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Bank Transfer Reference / Session ID <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={senderReference}
                    onChange={(e) => setSenderReference(e.target.value)}
                    placeholder="e.g. 000013289104829103"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    USDT BEP-20 Transaction Hash (TxID) or Sender Wallet <span className="text-pink-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={usdtTxHash}
                    onChange={(e) => setUsdtTxHash(e.target.value)}
                    placeholder="e.g. 0x4f92d... or your Binance BEP20 address"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Used for automated blockchain reconciliation by our treasury desk
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="w-2/3 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                I Have Sent Payment
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: SUBMISSION CONFIRMATION */}
        {step === 3 && (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-base font-extrabold text-white">Deposit Request Submitted</h4>
              <p className="text-xs text-slate-300 mt-1">
                Your deposit of{' '}
                <span className="font-mono font-bold text-emerald-400">
                  {formatNaira(nairaToKobo(parsedAmount))}
                </span>{' '}
                ({channelType === 'usdt' ? `${calculatedUsdt} USDT BEP-20` : 'Bank Transfer'}) is queued for automated reconciliation.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-mono font-bold text-sky-400">{confirmedReference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="font-medium text-white">{paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Expected Time:</span>
                <span className="font-medium text-emerald-400">1 - 5 Minutes</span>
              </div>
            </div>

            <button
              onClick={handleResetAndClose}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-sky-500/25 cursor-pointer"
            >
              Done / Return to Portfolio
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
