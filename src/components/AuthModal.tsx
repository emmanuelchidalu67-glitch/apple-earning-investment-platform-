import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { COUNTRIES, CountryDialCode } from '../data/countries';
import { DiamondLogo } from './DiamondLogo';
import {
  Lock,
  Mail,
  Phone,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ChevronDown,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  FileText,
  X,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { authView, setAuthView, login, signup, verifyOtp } = useApp();

  const [isLoginTab, setIsLoginTab] = useState(authView === 'login');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Sign up form state
  const [fullName, setFullName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<CountryDialCode>(COUNTRIES[0]); // Default Nigeria
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [withdrawalPin, setWithdrawalPin] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // OTP state
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);

  // Recovery state
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoverySent, setRecoverySent] = useState(false);

  // Error message
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dialCode.includes(countrySearch)
  );

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);

    setTimeout(() => {
      const res = login(loginIdentifier, loginPassword);
      setIsLoading(false);
      if (!res.success) {
        setFormError(res.error || 'Failed to authenticate');
      }
    }, 400);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (signupPassword.length < 6) {
      setFormError('Password must have at least 6 characters.');
      return;
    }
    if (signupPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }
    if (withdrawalPin.length !== 4 || !/^\d+$/.test(withdrawalPin)) {
      setFormError('Withdrawal PIN must be exactly 4 numeric digits.');
      return;
    }
    if (!agreedTerms) {
      setFormError('Please accept the Terms & Conditions to proceed.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = signup({
        fullName,
        email: signupEmail,
        phone: `${selectedCountry.dialCode}${signupPhone}`,
        countryCode: selectedCountry.dialCode,
        withdrawalPin,
        password: signupPassword,
        referralCode: referralCodeInput || undefined,
      });
      setIsLoading(false);
      if (!res.success) {
        setFormError(res.error || 'Registration failed');
      }
    }, 450);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otpCode];
    newOtp[index] = val.slice(-1);
    setOtpCode(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const fullCode = otpCode.join('');
    if (fullCode.length !== 6) {
      setFormError('Please enter the complete 6-digit OTP code.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = verifyOtp(fullCode);
      setIsLoading(false);
      if (!res.success) {
        setFormError(res.error || 'Invalid OTP code');
      }
    }, 500);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!recoveryEmail || !recoveryEmail.includes('@')) {
      setFormError('Please provide a valid registered email address.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setRecoverySent(true);
      setFormSuccess('A secure reset link and one-time verification token have been dispatched to your email.');
    }, 500);
  };

  if (!authView) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-gradient-to-b from-[#09172f] via-[#071328] to-[#040c1a] border border-sky-500/20 rounded-3xl p-6 text-white shadow-2xl my-auto">
        {/* Diamond glow in top right */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Branding */}
        <div className="flex flex-col items-center mb-6">
          <DiamondLogo size="md" showTagline centered />
        </div>

        {/* Global Error Banner */}
        {formError && (
          <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl bg-pink-950/80 border border-pink-500/40 text-xs text-pink-200">
            <AlertCircle className="w-4 h-4 text-pink-400 flex-shrink-0" />
            <p className="flex-1">{formError}</p>
          </div>
        )}

        {/* Global Success Banner */}
        {formSuccess && (
          <div className="mb-4 flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <p className="flex-1">{formSuccess}</p>
          </div>
        )}

        {/* VIEW 1: FORGOT PASSWORD */}
        {authView === 'forgot_password' && (
          <div className="space-y-4">
            <button
              onClick={() => {
                setAuthView('login');
                setFormError(null);
                setFormSuccess(null);
              }}
              className="flex items-center gap-1.5 text-xs text-sky-400 hover:text-sky-300 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </button>

            <h3 className="text-lg font-bold text-white">Reset Account Password</h3>
            <p className="text-xs text-slate-400">
              Enter your registered email address to receive an instant verification code and password recovery link.
            </p>

            {!recoverySent ? (
              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Registered Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={recoveryEmail}
                      onChange={(e) => setRecoveryEmail(e.target.value)}
                      placeholder="e.g. name@example.com"
                      required
                      className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm tracking-wider uppercase shadow-md shadow-sky-500/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isLoading ? 'Sending Token...' : 'Send Recovery Token'}
                </button>
              </form>
            ) : (
              <button
                onClick={() => setAuthView('login')}
                className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-semibold text-white"
              >
                Return to Login
              </button>
            )}
          </div>
        )}

        {/* VIEW 2: VERIFY OTP (Registration Step) */}
        {authView === 'verify_otp' && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-6 h-6 text-sky-400" />
              </div>
              <h3 className="text-lg font-bold text-white">Verify Phone & Email</h3>
              <p className="text-xs text-slate-400 mt-1">
                We sent a 6-digit confirmation code. Please enter it below to activate your account and claim your ₦800 welcome bonus.
              </p>
              <div className="inline-block mt-2 px-3 py-1 rounded-full bg-slate-800 text-[11px] text-sky-300 font-mono">
                Code: 123456 (Demo instant OTP)
              </div>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="flex justify-between gap-2">
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-bold bg-slate-900 border border-slate-700 rounded-xl text-sky-300 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white font-bold text-sm tracking-wider uppercase shadow-md shadow-sky-500/20 cursor-pointer"
              >
                {isLoading ? 'Verifying...' : 'Verify & Continue'}
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: LOGIN & SIGNUP TABS */}
        {(authView === 'login' || authView === 'signup') && (
          <>
            {/* Top Switcher Tab: Sign Up on the Left, Login on the Right */}
            <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800 mb-5">
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(false);
                  setAuthView('signup');
                  setFormError(null);
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  !isLoginTab
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CREATE ACCOUNT
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLoginTab(true);
                  setAuthView('login');
                  setFormError(null);
                }}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isLoginTab
                    ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                LOGIN
              </button>
            </div>

            {/* LOGIN FORM */}
            {isLoginTab ? (
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                {/* Email / Phone Long Tab */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address or Phone Number
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type="text"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="e.g. name@example.com or 08012345678"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 focus:border-sky-400 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-400 shadow-inner transition"
                    />
                  </div>
                </div>

                {/* Password Long Tab */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <button
                      type="button"
                      onClick={() => setAuthView('forgot_password')}
                      className="text-xs text-sky-400 hover:text-sky-300 font-medium"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-11 py-3 bg-slate-900/90 border border-slate-800 focus:border-sky-400 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-400 shadow-inner transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 mt-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {isLoading ? 'Verifying Credentials...' : 'Secure Login'}
                </button>
              </form>
            ) : (
              /* SIGNUP FORM: Each item on its own long rectangular circular tab line */
              <form onSubmit={handleSignupSubmit} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {/* 1. Full Name Long Tab */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Chukwudi Joseph"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 focus:border-sky-400 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-400 shadow-inner transition"
                    />
                  </div>
                </div>

                {/* 2. Email Address Long Tab */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. investor@gmail.com"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 focus:border-sky-400 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-400 shadow-inner transition"
                    />
                  </div>
                </div>

                {/* 3. Phone Number Long Tab */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Phone Number (WhatsApp / Mobile)
                  </label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="flex items-center gap-1 px-3.5 py-3 bg-slate-900 border border-slate-800 hover:border-sky-400 rounded-2xl text-sm text-white transition cursor-pointer"
                      >
                        <span>{selectedCountry.flag}</span>
                        <span className="font-mono text-xs font-bold">{selectedCountry.dialCode}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      </button>

                      {showCountryPicker && (
                        <div className="absolute left-0 top-14 z-50 w-64 bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl max-h-56 overflow-y-auto">
                          <div className="relative mb-2">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                              type="text"
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              placeholder="Search country..."
                              className="w-full pl-8 pr-2 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                          </div>
                          <div className="space-y-1">
                            {filteredCountries.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                onClick={() => {
                                  setSelectedCountry(c);
                                  setShowCountryPicker(false);
                                }}
                                className="w-full flex items-center justify-between px-2.5 py-1.5 hover:bg-slate-800 rounded-xl text-xs text-left cursor-pointer"
                              >
                                <span className="flex items-center gap-2">
                                  <span>{c.flag}</span>
                                  <span className="text-white truncate">{c.name}</span>
                                </span>
                                <span className="text-slate-400 font-mono">{c.dialCode}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="relative flex-1">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                      <input
                        type="tel"
                        value={signupPhone}
                        onChange={(e) => setSignupPhone(e.target.value)}
                        placeholder="8012345678"
                        required
                        className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 focus:border-sky-400 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-400 shadow-inner transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Strong Password Long Tab */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Strong Password (min 6 characters)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-11 py-3 bg-slate-900/90 border border-slate-800 focus:border-sky-400 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-400 shadow-inner transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* 5. Confirm Password Long Tab */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 focus:border-sky-400 rounded-2xl text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-400 shadow-inner transition"
                    />
                  </div>
                </div>

                {/* 6. Withdrawal PIN Long Tab */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Withdrawal PIN (4-digit security code)
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                    <input
                      type="password"
                      maxLength={4}
                      value={withdrawalPin}
                      onChange={(e) => setWithdrawalPin(e.target.value)}
                      placeholder="4412"
                      required
                      className="w-full pl-11 pr-4 py-3 bg-slate-900/90 border border-slate-800 focus:border-sky-400 rounded-2xl text-sm font-mono tracking-widest text-white focus:outline-none focus:ring-1 focus:ring-sky-400 shadow-inner transition"
                    />
                  </div>
                </div>



                {/* Terms agreement checkbox */}
                <div className="flex items-start gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="terms-check"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-sky-500 focus:ring-sky-500 bg-slate-900 border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="terms-check" className="text-xs text-slate-400 leading-tight">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-sky-400 underline hover:text-sky-300"
                    >
                      Terms of Service
                    </button>{' '}
                    and Privacy Policy of Apple Card Investment.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-sky-500 via-blue-600 to-pink-600 hover:from-sky-400 hover:to-pink-500 text-white font-bold text-sm tracking-wider uppercase shadow-lg shadow-sky-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {isLoading ? 'Creating Account...' : 'Continue / Create Account'}
                </button>
              </form>
            )}
          </>
        )}

        {/* Footer Requirement: All rights reserved by Apple Card Investment 2026. */}
        <div className="mt-5 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            All rights reserved by Apple Card Investment 2026.
          </p>
        </div>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-5 text-white max-h-[80vh] overflow-y-auto space-y-3">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="font-bold text-sky-400 text-sm">Terms & Investment Conditions</h4>
              <button onClick={() => setShowTermsModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-2">
              <p>
                1. <strong>Investment Terms:</strong> Capital yields are calculated on a verified 45-day cycle. All withdrawals are subject to verification and Nigerian financial settlement rules.
              </p>
              <p>
                2. <strong>Welcome Bonus:</strong> The ₦800 welcome bonus is granted once per verified legal person and becomes unlocked upon portfolio activation.
              </p>
              <p>
                3. <strong>Anti-Fraud:</strong> Multiple registrations, duplicate accounts, and fictitious bank entries are immediately frozen.
              </p>
              <p>
                4. <strong>Withdrawals:</strong> Standard 5% financial settlement fee applies to processed withdrawals.
              </p>
            </div>
            <button
              onClick={() => {
                setAgreedTerms(true);
                setShowTermsModal(false);
              }}
              className="w-full py-2.5 rounded-xl bg-sky-500 text-white font-bold text-xs"
            >
              I Accept the Terms
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
