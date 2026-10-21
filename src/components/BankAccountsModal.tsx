import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { NIGERIAN_BANKS } from '../data/nigerianBanks';
import {
  X,
  Building,
  CheckCircle2,
  Trash2,
  Search,
  ChevronDown,
  ShieldCheck,
  AlertCircle,
  Plus,
  Coins,
  CreditCard,
  Wifi,
  Sparkles,
} from 'lucide-react';

interface BankAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BankAccountsModal: React.FC<BankAccountsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { bankAccounts, addBankAccount, deleteBankAccount, setDefaultBankAccount } = useApp();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [accountType, setAccountType] = useState<'bank' | 'bep20'>('bank');

  // Bank Form State
  const [selectedBank, setSelectedBank] = useState(NIGERIAN_BANKS[0]);
  const [bankSearch, setBankSearch] = useState('');
  const [showBankDropdown, setShowBankDropdown] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');

  // BEP-20 Form State
  const [bep20Address, setBep20Address] = useState('');
  const [bep20Label, setBep20Label] = useState('');

  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Search filtered A to Z Nigerian Banks
  const filteredBanks = NIGERIAN_BANKS.filter((b) =>
    b.name.toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (accountType === 'bank') {
      const cleanNum = accountNumber.trim().replace(/\D/g, '');
      if (cleanNum.length !== 10) {
        setFormError('Nigerian bank NUBAN must be exactly 10 digits.');
        return;
      }
      if (!accountName.trim()) {
        setFormError('Please enter your full account holder name.');
        return;
      }

      const res = addBankAccount({
        type: 'bank',
        bankName: selectedBank.name,
        bankCode: selectedBank.code,
        accountNumber: cleanNum,
        accountName: accountName.trim().toUpperCase(),
      });

      if (res.success) {
        setIsAddingNew(false);
        setAccountNumber('');
        setAccountName('');
        setFormError(null);
      } else {
        setFormError(res.error || 'Failed to save bank account.');
      }
    } else {
      const cleanAddr = bep20Address.trim();
      if (!cleanAddr.startsWith('0x') || cleanAddr.length < 25) {
        setFormError('Please enter a valid BSC BEP-20 wallet address (starting with 0x).');
        return;
      }
      if (!bep20Label.trim()) {
        setFormError('Please enter a label for this wallet (e.g. My Binance BEP20, TrustWallet).');
        return;
      }

      const res = addBankAccount({
        type: 'bep20',
        bankName: 'USDT (BNB Smart Chain BEP-20)',
        bankCode: 'BEP20',
        accountNumber: cleanAddr,
        accountName: bep20Label.trim(),
        bep20Address: cleanAddr,
        network: 'BNB Smart Chain (BEP-20)',
      });

      if (res.success) {
        setIsAddingNew(false);
        setBep20Address('');
        setBep20Label('');
        setFormError(null);
      } else {
        setFormError(res.error || 'Failed to save BEP-20 address.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#0b1b36] via-[#071326] to-[#040c1a] border border-sky-500/30 rounded-3xl p-5 sm:p-6 text-white shadow-2xl my-auto">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/30 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-inner">
              <CreditCard className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Payout Accounts & Debit Cards</h3>
              <p className="text-[11px] text-sky-300 font-medium">Nigerian Banks (A-Z) & USDT BEP-20</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Accounts List */}
        {!isAddingNew ? (
          <div className="py-4 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Saved Payout Cards ({bankAccounts.length})
                </span>
                <p className="text-[10px] text-slate-400">Funds disburse directly to these linked accounts</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(true);
                  setFormError(null);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-md cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Add Account / BEP-20</span>
              </button>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800/80 space-y-2">
                <CreditCard className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-xs font-bold text-slate-300">No linked payout account or debit card yet.</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Add your Nigerian bank account or USDT BEP-20 address to receive instant cashouts.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-xs font-bold cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" />
                  <span>Link Bank or BEP-20 Card</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3.5 max-h-[60vh] overflow-y-auto pr-1">
                {bankAccounts.map((account) => {
                  const isBep20 = account.type === 'bep20';
                  return (
                    <div
                      key={account.id}
                      className="relative group rounded-2xl overflow-hidden p-4 sm:p-5 text-white shadow-xl border transition-all duration-300"
                      style={{
                        background: isBep20
                          ? 'linear-gradient(135deg, #092027 0%, #0d3840 50%, #05191e 100%)'
                          : 'linear-gradient(135deg, #0f244a 0%, #173873 50%, #0a1b38 100%)',
                        borderColor: isBep20 ? 'rgba(45, 212, 191, 0.35)' : 'rgba(56, 189, 248, 0.35)',
                      }}
                    >
                      {/* Holographic Card Background Texture */}
                      <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/5 rounded-full blur-xl pointer-events-none" />
                      <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />

                      {/* Card Top Row: Chip + Contactless + Bank Name */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          {/* EMV Gold Smart Chip */}
                          <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 border border-amber-200/50 shadow-inner flex flex-col justify-between p-1">
                            <div className="h-0.5 bg-amber-700/60 rounded" />
                            <div className="h-0.5 bg-amber-700/60 rounded" />
                            <div className="h-0.5 bg-amber-700/60 rounded" />
                          </div>
                          {/* Contactless waves */}
                          <Wifi className="w-4 h-4 text-slate-300/80 rotate-90" />
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black uppercase tracking-wider text-white block">
                            {account.bankName}
                          </span>
                          <span className="text-[9px] font-mono font-bold text-sky-300/80">
                            {isBep20 ? 'BNB Smart Chain' : 'Nigerian NUBAN'}
                          </span>
                        </div>
                      </div>

                      {/* Card Middle: Account Number styled as Embossed Card Number */}
                      <div className="my-3">
                        <p className="text-[9px] uppercase tracking-wider text-slate-300/70 font-semibold mb-0.5">
                          {isBep20 ? 'BEP-20 Wallet Address' : 'Account Number'}
                        </p>
                        <p className="font-mono text-base sm:text-lg font-bold tracking-widest text-white drop-shadow-sm select-all break-all">
                          {isBep20 ? (
                            `${account.accountNumber.slice(0, 10)}••••${account.accountNumber.slice(-8)}`
                          ) : (
                            account.accountNumber.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3')
                          )}
                        </p>
                      </div>

                      {/* Card Bottom Row: Cardholder Name + Network Badge + Actions */}
                      <div className="flex justify-between items-end pt-2 border-t border-white/10">
                        <div>
                          <p className="text-[9px] uppercase tracking-wider text-slate-300/70 font-semibold">
                            {isBep20 ? 'Wallet Label' : 'Account Name'}
                          </p>
                          <p className="font-bold text-xs uppercase tracking-wide text-white drop-shadow-xs">
                            {account.accountName}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Payment Brand Badge: Verve / Mastercard / BEP20 */}
                          <div className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs border border-white/20 text-[10px] font-black tracking-wider text-white">
                            {isBep20 ? 'USDT BEP-20' : 'VERVE DEBIT'}
                          </div>

                          {/* Default status */}
                          {account.isDefault ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Primary
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDefaultBankAccount(account.id)}
                              className="text-[9px] font-semibold text-slate-300 hover:text-white underline cursor-pointer"
                            >
                              Make Primary
                            </button>
                          )}

                          {/* Delete Card Button */}
                          <button
                            type="button"
                            onClick={() => deleteBankAccount(account.id)}
                            title="Remove card"
                            className="p-1 rounded-lg bg-red-600/20 text-red-300 hover:bg-red-600/40 border border-red-500/30 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Add New Account / BEP-20 Form */
          <form onSubmit={handleSaveAccount} className="py-4 space-y-4">
            {/* Account Type Toggle: Bank vs BEP-20 */}
            <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-950 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setAccountType('bank');
                  setFormError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  accountType === 'bank'
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Nigerian Bank (A-Z)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAccountType('bep20');
                  setFormError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  accountType === 'bep20'
                    ? 'bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                <span>USDT (BEP-20)</span>
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {accountType === 'bank' ? (
              /* NIGERIAN BANK SECTION (Strictly A to Z) */
              <div className="space-y-3">
                {/* Bank Select Dropdown with Search */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Nigerian Bank (A to Z Directory)
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowBankDropdown(!showBankDropdown)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-700 hover:border-sky-500 text-left text-xs font-bold text-white transition cursor-pointer"
                    >
                      <span className="truncate">{selectedBank.name}</span>
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    </button>

                    {showBankDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 max-h-60 overflow-hidden flex flex-col">
                        <div className="relative mb-2">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search bank (e.g. Access, Kuda, Moniepoint, Zenith)..."
                            value={bankSearch}
                            onChange={(e) => setBankSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                            autoFocus
                          />
                        </div>
                        <div className="overflow-y-auto space-y-1 flex-1 pr-1">
                          {filteredBanks.map((b) => (
                            <button
                              key={b.code}
                              type="button"
                              onClick={() => {
                                setSelectedBank(b);
                                setShowBankDropdown(false);
                                setBankSearch('');
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                                selectedBank.code === b.code
                                  ? 'bg-sky-500/20 text-sky-300 font-bold'
                                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              {b.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 10-Digit Account Number */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    10-Digit NUBAN Account Number
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="e.g. 0123456789"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-sky-400 text-white font-mono text-sm tracking-wider outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Must be exactly 10 digits.</p>
                </div>

                {/* Account Name (Self-Inputted by User) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Account Holder Name (Beneficiary Name)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. EMMANUEL CHUKWUDI NWATE"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-sky-400 text-white font-bold text-xs uppercase tracking-wide outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Type your full name as it appears on your Nigerian bank account or debit card.
                  </p>
                </div>
              </div>
            ) : (
              /* USDT BEP-20 WALLET SECTION */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-teal-300 mb-1">
                    USDT (BEP-20) Binance Smart Chain Address
                  </label>
                  <input
                    type="text"
                    placeholder="0x..."
                    value={bep20Address}
                    onChange={(e) => setBep20Address(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-teal-400 text-teal-300 font-mono text-xs outline-none"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Supports TrustWallet, Binance, MetaMask, OKX, Bybit BSC USDT addresses.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Wallet Label / Exchange Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. My Binance BSC Wallet / TrustWallet"
                    value={bep20Label}
                    onChange={(e) => setBep20Label(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-900 border border-slate-700 focus:border-teal-400 text-white font-bold text-xs outline-none"
                    required
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setFormError(null);
                }}
                className="w-1/3 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white font-bold text-xs cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`w-2/3 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg transition cursor-pointer ${
                  accountType === 'bank'
                    ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500'
                    : 'bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500'
                }`}
              >
                Save Payout Debit Card
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
