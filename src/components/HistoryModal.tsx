import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, formatUsd, formatDate, DEFAULT_USD_EXCHANGE_RATE } from '../utils/formatters';
import { DualCurrency } from './DualCurrency';
import { TransactionRecord } from '../types';
import {
  X,
  Clock,
  Search,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Gift,
  Phone,
  Wifi,
  Zap,
  ShieldAlert,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilter?: string;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  initialFilter = 'all',
}) => {
  const { transactions } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<TransactionRecord | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Records' },
    { id: 'deposit', label: 'Deposits' },
    { id: 'withdrawal', label: 'Withdrawals' },
    { id: 'investment', label: 'Investments' },
    { id: 'daily_earning', label: 'Earnings' },
    { id: 'referral_bonus', label: 'Referrals' },
    { id: 'topup_code', label: 'Top-Up' },
    { id: 'utility', label: 'Airtime/Bills' },
  ];

  const filteredTransactions = transactions.filter((t) => {
    // Category match
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'utility') {
        if (!['airtime', 'data', 'electricity'].includes(t.type)) return false;
      } else if (t.type !== categoryFilter) {
        return false;
      }
    }

    // Search query match
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.reference.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal':
        return <ArrowUpRight className="w-4 h-4 text-pink-400" />;
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-sky-400" />;
      case 'daily_earning':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'topup_code':
      case 'welcome_bonus':
      case 'referral_bonus':
        return <Gift className="w-4 h-4 text-purple-400" />;
      case 'airtime':
        return <Phone className="w-4 h-4 text-cyan-400" />;
      case 'data':
        return <Wifi className="w-4 h-4 text-blue-400" />;
      case 'electricity':
        return <Zap className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            Completed
          </span>
        );
      case 'Pending':
        return (
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">
            Pending
          </span>
        );
      case 'Rejected':
      case 'Failed':
        return (
          <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 text-[10px] font-bold">
            Declined
          </span>
        );
      default:
        return null;
    }
  };

  const isPositiveFlow = (type: string) => {
    return ['deposit', 'daily_earning', 'referral_bonus', 'welcome_bonus', 'topup_code'].includes(type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#09172f] via-[#071328] to-[#040c1a] border border-sky-500/25 rounded-3xl p-6 text-white shadow-2xl my-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Financial History</h3>
              <p className="text-[11px] text-sky-300 font-medium">Auditable Transaction Ledger</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="my-3 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference ID or description..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap border transition ${
                categoryFilter === c.id
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Transactions list */}
        <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
          {filteredTransactions.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80">
              <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-400">No records found for this filter.</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => setSelectedReceipt(tx)}
                className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/90 hover:border-sky-500/40 flex justify-between items-center transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white leading-tight">{tx.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDate(tx.date)}</p>
                    <p className="text-[10px] font-mono text-slate-500">{tx.reference}</p>
                  </div>
                </div>

                <div className="text-right">
                  <DualCurrency
                    kobo={tx.amountKobo}
                    prefix={isPositiveFlow(tx.type) ? '+' : '-'}
                    align="right"
                    usdClassName={`text-xs font-black font-mono ${
                      isPositiveFlow(tx.type) ? 'text-emerald-400' : 'text-slate-200'
                    }`}
                    nairaClassName="text-[10px] font-mono text-slate-400"
                  />
                  <div className="mt-1">{getStatusBadge(tx.status)}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DETAILED RECEIPT MODAL */}
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
            <div className="w-full max-w-sm bg-gradient-to-b from-slate-900 to-[#071328] border border-sky-500/30 rounded-3xl p-5 text-white space-y-4 shadow-2xl">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold">
                  <Receipt className="w-4 h-4" />
                  <span>Verified Financial Receipt</span>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 rounded bg-slate-800 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center py-2 space-y-1">
                <p className="text-xs text-slate-400 uppercase font-semibold">Transaction Amount</p>
                <DualCurrency
                  kobo={selectedReceipt.amountKobo}
                  align="center"
                  usdClassName="text-2xl font-black font-mono text-white"
                  nairaClassName="text-xs font-mono text-slate-400"
                />
                <div className="mt-1.5">{getStatusBadge(selectedReceipt.status)}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference:</span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono font-bold text-sky-400">
                      {selectedReceipt.reference}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedReceipt.reference);
                        setCopiedRef(true);
                        setTimeout(() => setCopiedRef(false), 2000);
                      }}
                      className="text-slate-400 hover:text-white"
                    >
                      {copiedRef ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-semibold text-slate-200 capitalize">
                    {selectedReceipt.type.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400">Date & Time:</span>
                  <span className="text-slate-300">{formatDate(selectedReceipt.date)}</span>
                </div>

                {selectedReceipt.feeKobo ? (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Handling Fee:</span>
                    <DualCurrency
                      kobo={selectedReceipt.feeKobo}
                      align="right"
                      usdClassName="text-pink-400 font-mono font-bold"
                      nairaClassName="text-[10px] font-mono text-slate-400"
                    />
                  </div>
                ) : null}

                {selectedReceipt.senderName ? (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sender Name:</span>
                    <span className="text-slate-200">{selectedReceipt.senderName}</span>
                  </div>
                ) : null}

                {selectedReceipt.bankDetails ? (
                  <div className="pt-1 border-t border-slate-800">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Destination Bank:</span>
                    <p className="font-semibold text-slate-200 mt-0.5">
                      {selectedReceipt.bankDetails.bankName}
                    </p>
                    <p className="font-mono text-sky-400">{selectedReceipt.bankDetails.accountNumber}</p>
                  </div>
                ) : null}

                <div className="pt-1 border-t border-slate-800">
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Narration:</span>
                  <p className="text-slate-300 text-[11px] mt-0.5">{selectedReceipt.description}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedReceipt(null)}
                className="w-full py-2.5 rounded-xl bg-sky-500 text-white font-bold text-xs"
              >
                Close Receipt
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
