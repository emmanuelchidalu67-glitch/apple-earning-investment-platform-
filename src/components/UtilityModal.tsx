import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatNaira, nairaToKobo } from '../utils/formatters';
import {
  X,
  Phone,
  Wifi,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface UtilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'airtime' | 'data' | 'electricity';
}

export const UtilityModal: React.FC<UtilityModalProps> = ({
  isOpen,
  onClose,
  initialType = 'airtime',
}) => {
  const { availableBalanceKobo, buyAirtime, buyDataBundle, payElectricityBill } = useApp();

  const [activeTab, setActiveTab] = useState<'airtime' | 'data' | 'electricity'>(initialType);

  // Airtime state
  const [airtimeNetwork, setAirtimeNetwork] = useState('MTN');
  const [airtimePhone, setAirtimePhone] = useState('08139481920');
  const [airtimeAmount, setAirtimeAmount] = useState('1000');

  // Data state
  const [dataNetwork, setDataNetwork] = useState('MTN');
  const [dataPhone, setDataPhone] = useState('08139481920');
  const [dataBundle, setDataBundle] = useState({ name: '2.5GB Monthly (30 Days)', amount: 1500 });

  // Electricity state
  const [disco, setDisco] = useState('Ikeja Electric (IKEDC)');
  const [meterNumber, setMeterNumber] = useState('04192847192');
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [electricityAmount, setElectricityAmount] = useState('5000');

  // Transaction Receipt state
  const [receipt, setReceipt] = useState<{
    title: string;
    reference: string;
    amountKobo: number;
    token?: string;
    details: string;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!isOpen) return null;

  const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
  const discos = [
    'Ikeja Electric (IKEDC)',
    'Eko Electricity (EKEDC)',
    'Abuja Disco (AEDC)',
    'Ibadan Disco (IBEDC)',
    'Port Harcourt Disco (PHED)',
    'Enugu Disco (EEDC)',
  ];

  const dataBundles = [
    { name: '1GB Monthly (30 Days)', amount: 600 },
    { name: '2.5GB Monthly (30 Days)', amount: 1500 },
    { name: '5GB Monthly (30 Days)', amount: 2500 },
    { name: '10GB Monthly (30 Days)', amount: 4500 },
    { name: '20GB Monthly (30 Days)', amount: 8000 },
  ];

  const handleAirtimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amt = Number(airtimeAmount);
    if (!amt || amt < 100) {
      setErrorMsg('Minimum airtime amount is ₦100.');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const res = buyAirtime({
        network: airtimeNetwork,
        phoneNumber: airtimePhone,
        amountKobo: nairaToKobo(amt),
      });
      setIsProcessing(false);
      if (res.success) {
        setReceipt({
          title: `${airtimeNetwork} Airtime Top-Up`,
          reference: res.reference || 'BIL-AIRTIME',
          amountKobo: nairaToKobo(amt),
          details: `Recharge successfully sent to ${airtimePhone}`,
        });
      } else {
        setErrorMsg(res.error || 'Failed to complete airtime transaction');
      }
    }, 500);
  };

  const handleDataSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    setIsProcessing(true);
    setTimeout(() => {
      const res = buyDataBundle({
        network: dataNetwork,
        phoneNumber: dataPhone,
        bundleName: dataBundle.name,
        amountKobo: nairaToKobo(dataBundle.amount),
      });
      setIsProcessing(false);
      if (res.success) {
        setReceipt({
          title: `${dataNetwork} Data Bundle`,
          reference: res.reference || 'BIL-DATA',
          amountKobo: nairaToKobo(dataBundle.amount),
          details: `${dataBundle.name} activated for ${dataPhone}`,
        });
      } else {
        setErrorMsg(res.error || 'Failed to complete data subscription');
      }
    }, 500);
  };

  const handleElectricitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amt = Number(electricityAmount);
    if (!amt || amt < 1000) {
      setErrorMsg('Minimum electricity payment is ₦1,000.');
      return;
    }
    if (meterNumber.length < 10) {
      setErrorMsg('Please enter a valid meter number (min 10 digits).');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const res = payElectricityBill({
        disco,
        meterNumber,
        meterType,
        amountKobo: nairaToKobo(amt),
      });
      setIsProcessing(false);
      if (res.success) {
        setReceipt({
          title: `${disco} Token Purchase`,
          reference: res.reference || 'BIL-POWER',
          amountKobo: nairaToKobo(amt),
          token: res.token,
          details: `Meter: ${meterNumber} (${meterType.toUpperCase()})`,
        });
      } else {
        setErrorMsg(res.error || 'Failed to process electricity payment');
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#09172f] via-[#071328] to-[#040c1a] border border-sky-500/25 rounded-3xl p-6 text-white shadow-2xl my-auto">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h3 className="font-bold text-base text-white">Utility & Bill Payments</h3>
            <p className="text-[11px] text-sky-300 font-medium">Instant Telecom & Power Settlement</p>
          </div>
          <button
            onClick={() => {
              setReceipt(null);
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance strip */}
        <div className="my-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
          <span className="text-slate-400">Wallet Balance:</span>
          <span className="font-bold font-mono text-sky-400">{formatNaira(availableBalanceKobo)}</span>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-xs text-pink-200">
            <AlertCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        {/* SUCCESS RECEIPT VIEW */}
        {receipt ? (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold uppercase">
                Payment Successful
              </span>
              <h4 className="text-base font-bold text-white mt-2">{receipt.title}</h4>
              <p className="text-xl font-black font-mono text-emerald-400 mt-1">
                {formatNaira(receipt.amountKobo)}
              </p>
            </div>

            {/* Generated Electricity Token */}
            {receipt.token && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-sky-500/30 text-center space-y-1">
                <span className="text-[10px] text-sky-300 uppercase font-bold tracking-wider">
                  Recharge Token
                </span>
                <p className="font-mono text-lg font-black text-white tracking-widest">
                  {receipt.token}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(receipt.token!);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-sky-400 hover:text-sky-300 font-semibold"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied Token' : 'Copy Token'}</span>
                </button>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-left space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Reference:</span>
                <span className="font-mono font-bold text-sky-400">{receipt.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Beneficiary:</span>
                <span className="font-semibold text-slate-200 truncate">{receipt.details}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Channel:</span>
                <span className="text-slate-200">Apple Card Wallet</span>
              </div>
            </div>

            <button
              onClick={() => setReceipt(null)}
              className="w-full py-3 rounded-xl bg-sky-500 text-white font-bold text-xs uppercase"
            >
              Make Another Payment
            </button>
          </div>
        ) : (
          /* PAYMENT FORM TABS */
          <div className="space-y-4">
            <div className="grid grid-cols-3 p-1 bg-slate-900 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('airtime')}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'airtime' ? 'bg-sky-500 text-white' : 'text-slate-400'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Airtime</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('data')}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'data' ? 'bg-sky-500 text-white' : 'text-slate-400'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>Data</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('electricity')}
                className={`py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'electricity' ? 'bg-sky-500 text-white' : 'text-slate-400'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Power</span>
              </button>
            </div>

            {/* AIRTIME TAB */}
            {activeTab === 'airtime' && (
              <form onSubmit={handleAirtimeSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Network Provider</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {networks.map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setAirtimeNetwork(net)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          airtimeNetwork === net
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={airtimePhone}
                    onChange={(e) => setAirtimePhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₦)</label>
                  <input
                    type="number"
                    value={airtimeAmount}
                    onChange={(e) => setAirtimeAmount(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {isProcessing ? 'Processing Recharge...' : 'Pay Airtime Now'}
                </button>
              </form>
            )}

            {/* DATA TAB */}
            {activeTab === 'data' && (
              <form onSubmit={handleDataSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Network</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {networks.map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setDataNetwork(net)}
                        className={`py-2 rounded-xl text-xs font-bold border transition ${
                          dataNetwork === net
                            ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={dataPhone}
                    onChange={(e) => setDataPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Data Plan</label>
                  <select
                    value={dataBundle.name}
                    onChange={(e) => {
                      const found = dataBundles.find((b) => b.name === e.target.value);
                      if (found) setDataBundle(found);
                    }}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    {dataBundles.map((b) => (
                      <option key={b.name} value={b.name}>
                        {b.name} — ₦{b.amount.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {isProcessing ? 'Activating Bundle...' : `Pay ₦${dataBundle.amount.toLocaleString()}`}
                </button>
              </form>
            )}

            {/* ELECTRICITY TAB */}
            {activeTab === 'electricity' && (
              <form onSubmit={handleElectricitySubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Distribution Company (DisCo)</label>
                  <select
                    value={disco}
                    onChange={(e) => setDisco(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    {discos.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Meter Type</label>
                    <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setMeterType('prepaid')}
                        className={`py-1.5 text-[11px] font-bold rounded-lg ${
                          meterType === 'prepaid' ? 'bg-sky-500 text-white' : 'text-slate-400'
                        }`}
                      >
                        Prepaid
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeterType('postpaid')}
                        className={`py-1.5 text-[11px] font-bold rounded-lg ${
                          meterType === 'postpaid' ? 'bg-sky-500 text-white' : 'text-slate-400'
                        }`}
                      >
                        Postpaid
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Amount (₦)</label>
                    <input
                      type="number"
                      value={electricityAmount}
                      onChange={(e) => setElectricityAmount(e.target.value)}
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-bold text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Meter Number</label>
                  <input
                    type="text"
                    value={meterNumber}
                    onChange={(e) => setMeterNumber(e.target.value)}
                    placeholder="e.g. 04192847192"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold text-xs uppercase tracking-wider"
                >
                  {isProcessing ? 'Generating Power Token...' : 'Generate Electricity Token'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
