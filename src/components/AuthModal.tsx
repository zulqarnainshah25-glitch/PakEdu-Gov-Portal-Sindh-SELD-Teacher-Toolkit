import React, { useState } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import {
  X,
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import {
  validateAuthCredentials,
  checkAuthRateLimit,
  diagnoseFirebaseAuthError,
  FirebaseAuthDiagnosis,
  DemoUserSession,
  UNIFIED_FIREBASE_PROJECT_ID,
  ATLIER_CV_LIVE_URL,
} from '../utils/authAndSso';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDemoSessionSuccess: (session: DemoUserSession) => void;
  initialMode?: 'signin' | 'signup';
  isMandatoryGate?: boolean;
  logoutNotice?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onDemoSessionSuccess,
  initialMode = 'signin',
  isMandatoryGate = false,
  logoutNotice = null,
}) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>(initialMode);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState<FirebaseAuthDiagnosis | null>(null);
  const [copiedHostname, setCopiedHostname] = useState(false);

  if (!isOpen && !isMandatoryGate) return null;

  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : 'allfaru.dpdns.org';

  const handleCopyHostname = async () => {
    try {
      await navigator.clipboard.writeText(currentHostname);
      setCopiedHostname(true);
      setTimeout(() => setCopiedHostname(false), 2500);
    } catch {
      setCopiedHostname(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setDiagnosis(null);

    const validation = validateAuthCredentials({
      mode,
      email,
      password,
      displayName,
    });

    if (!validation.valid) {
      setErrorMessage(validation.error || 'Please check your input fields.');
      return;
    }

    const rateCheck = checkAuthRateLimit();
    if (!rateCheck.allowed) {
      setErrorMessage(
        `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`
      );
      return;
    }

    setLoading(true);
    try {
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, validation.sanitizedEmail);
        setSuccessMessage(
          `Password reset link sent to ${validation.sanitizedEmail}. Check your inbox or spam folder.`
        );
        setLoading(false);
        return;
      }

      if (mode === 'signup') {
        const credential = await createUserWithEmailAndPassword(
          auth,
          validation.sanitizedEmail,
          password
        );
        if (validation.sanitizedDisplayName) {
          await updateProfile(credential.user, {
            displayName: validation.sanitizedDisplayName,
          });
        }
      } else {
        await signInWithEmailAndPassword(auth, validation.sanitizedEmail, password);
      }

      onClose();
    } catch (err) {
      const diag = diagnoseFirebaseAuthError(
        err,
        currentHostname,
        UNIFIED_FIREBASE_PROJECT_ID
      );
      setDiagnosis(diag);
      setErrorMessage(diag.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setDiagnosis(null);

    const rateCheck = checkAuthRateLimit();
    if (!rateCheck.allowed) {
      setErrorMessage(
        `Too many login attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`
      );
      return;
    }

    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      onClose();
    } catch (err) {
      const diag = diagnoseFirebaseAuthError(
        err,
        currentHostname,
        UNIFIED_FIREBASE_PROJECT_ID
      );
      if (diag.isPopupBlocked) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          // Fall through to display diagnostic UI
        }
      }
      setDiagnosis(diag);
      setErrorMessage(diag.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInstantFallbackSession = () => {
    const cleanEmail =
      email.trim().toLowerCase() || 'teacher.seld@allfaru.dpdns.org';
    const cleanName =
      displayName.trim() ||
      cleanEmail.split('@')[0].replace(/[._-]/g, ' ') ||
      'Sindh SELD Educator';

    onDemoSessionSuccess({
      uid: `seld_local_${Date.now()}`,
      email: cleanEmail,
      displayName: cleanName,
      isDemoFallback: true,
      createdAt: new Date().toISOString(),
    });
    onClose();
  };

  return (
    <div
      className={
        isMandatoryGate
          ? 'no-print min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-slate-950 relative overflow-y-auto'
          : 'no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn'
      }
      style={
        isMandatoryGate
          ? {
              background:
                'radial-gradient(circle at top left, #3b0764 0%, #0f172a 55%, #1e1b4b 100%)',
            }
          : undefined
      }
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      {isMandatoryGate && <div className="allforu-progress-bar no-print" />}

      {isMandatoryGate && (
        <div className="w-full max-w-4xl mb-4 flex items-center justify-between text-white px-1">
          <div className="flex items-center gap-2.5">
            <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Allforu
            </span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-pink-500/20 text-pink-200 border border-pink-400/30">
              PakEdu &amp; Sindh SELD Official Portal
            </span>
          </div>
          <span className="text-xs font-mono text-purple-200/80 hidden sm:inline">
            Mandatory Authentication Gate
          </span>
        </div>
      )}

      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-purple-500/25 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Branding Panel (Identical to AtlierCV + Allforu Deep Purple & Neon Theme) */}
        <div
          className="md:col-span-5 p-7 text-white flex flex-col justify-between relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #5b21b6 0%, #1e1b4b 100%)',
          }}
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-[11px] font-semibold tracking-wider uppercase text-pink-300 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-pink-400" />
              Allforu × AtlierCV Unified ID
            </div>
            <h2
              id="auth-modal-title"
              className="text-2xl sm:text-3xl font-bold tracking-tight mt-4 leading-tight"
            >
              One Account for PakEdu Portal &amp; AtlierCV Studio
            </h2>
            <p className="text-xs sm:text-sm text-purple-100/85 mt-3 leading-relaxed">
              Portal open karne ke liye Sign In zaroori hai. Aapka ek hi account{' '}
              <strong>PakEdu SELD Portal</strong> aur{' '}
              <strong>AtlierCV Resume Studio</strong> dono ko unlock karta hai (Project:{' '}
              <code className="font-mono text-pink-300 font-semibold">
                {UNIFIED_FIREBASE_PROJECT_ID}
              </code>
              ).
            </p>

            <div className="mt-6 space-y-3 text-xs text-purple-100/90">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span>
                  1. AI Lesson Plan Generator (Sindh STBB &amp; Punjab PTB + Firestore)
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span>
                  2. Sindh Government Salary Calculator 2026 &amp; SELD Leave Proforma
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
                <span>
                  3. Integrated <strong className="text-white">AtlierCV Studio</strong> with Unified Login &amp; Logout Return
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-4 border-t border-white/15 flex items-center justify-between text-[11px] text-purple-200/80">
            <span>Project: {UNIFIED_FIREBASE_PROJECT_ID}</span>
            <a
              href={ATLIER_CV_LIVE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-pink-300 hover:text-white font-semibold"
            >
              AtlierCV Live <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Right Authentication Form Panel */}
        <div className="md:col-span-7 p-6 sm:p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-between">
          <div>
            {/* Logout Notice Banner (Shown when user logs out from Portal or AtlierCV) */}
            {logoutNotice && (
              <div className="mb-4 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 text-xs font-medium text-[#5b21b6] dark:text-purple-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#ec4899] shrink-0" />
                <span>{logoutNotice}</span>
              </div>
            )}

            {/* Top Mode Switcher & Close Button */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'signin'
                      ? 'bg-[#5b21b6] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'signup'
                      ? 'bg-[#5b21b6] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('reset');
                    setErrorMessage(null);
                    setSuccessMessage(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    mode === 'reset'
                      ? 'bg-[#5b21b6] text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  Reset Password
                </button>
              </div>

              {!isMandatoryGate ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg cursor-pointer"
                  aria-label="Close authentication modal"
                >
                  <X className="w-5 h-5" />
                </button>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-pink-100 dark:bg-pink-950/70 text-[#ec4899] border border-pink-200 dark:border-pink-800">
                  Login Required
                </span>
              )}
            </div>

            {/* Google Sign-In Button (Identical to AtlierCV) */}
            {mode !== 'reset' && (
              <div className="mt-5">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleGoogleAuth}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/70 rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.3 0 6.08-1.09 8.1-2.96l-3.88-3.05c-1.08.72-2.45 1.16-4.22 1.16-3.24 0-5.98-2.18-6.96-5.11H1.05v3.14C3.06 21.2 7.22 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.04 14.04c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.32H1.05C.38 7.66 0 9.18 0 11.75s.38 4.09 1.05 5.43l3.99-3.14z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.8 0 3.41.62 4.68 1.84l3.51-3.51C18.07 1.19 15.3 0 12 0 7.22 0 3.06 2.8 1.05 6.32l3.99 3.14c.98-2.93 3.72-5.11 6.96-5.11z"
                    />
                  </svg>
                  <span>Continue with Google Account</span>
                </button>

                <div className="relative my-4 flex items-center justify-center">
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                  <span className="bg-white dark:bg-slate-900 px-3 text-[11px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">
                    or continue with email
                  </span>
                  <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
                </div>
              </div>
            )}

            {/* Email / Password Form */}
            <form onSubmit={handleEmailAuth} className="space-y-3.5 mt-3">
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name (Teacher / Officer Name)
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g., Muhammad Farooq (PST / JEST)"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="teacher@seld.gos.pk or Gmail address"
                    className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]"
                    required
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Password
                    </label>
                    {mode === 'signin' && (
                      <button
                        type="button"
                        onClick={() => setMode('reset')}
                        className="text-[11px] font-semibold text-[#5b21b6] dark:text-purple-400 hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        mode === 'signup'
                          ? 'Create password (min. 6 characters)'
                          : 'Enter your account password'
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5b21b6]"
                      required
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-5 rounded-xl text-xs sm:text-sm font-semibold text-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #5b21b6 0%, #ec4899 100%)',
                }}
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {loading
                    ? 'Processing Authentication...'
                    : mode === 'signin'
                    ? 'Sign In to Portal & AtlierCV ID'
                    : mode === 'signup'
                    ? 'Create Unified Account'
                    : 'Send Password Reset Email'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Success Banner */}
            {successMessage && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                {successMessage}
              </div>
            )}

            {/* Diagnostic & Error Banner (Matches AtlierCV's smart diagnostics) */}
            {errorMessage && (
              <div className="mt-4 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 text-xs space-y-2.5">
                <div className="flex items-start gap-2 text-amber-900 dark:text-amber-200 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>

                {diagnosis?.isUnauthorizedDomain && (
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-amber-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Firebase Console Domain Whitelist Steps:
                    </p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>
                        Open Firebase Console (Project:{' '}
                        <code className="font-mono font-bold">
                          {UNIFIED_FIREBASE_PROJECT_ID}
                        </code>
                        )
                      </li>
                      <li>
                        Go to{' '}
                        <strong>
                          Authentication → Settings → Authorized domains
                        </strong>
                      </li>
                      <li className="flex items-center justify-between gap-2 pt-1">
                        <span>
                          Add domain:{' '}
                          <code className="font-mono font-bold text-[#5b21b6] dark:text-pink-400">
                            {currentHostname}
                          </code>
                        </span>
                        <button
                          type="button"
                          onClick={handleCopyHostname}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold cursor-pointer"
                        >
                          {copiedHostname ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> Copy Domain
                            </>
                          )}
                        </button>
                      </li>
                    </ol>
                  </div>
                )}

                {diagnosis?.isProviderDisabled && (
                  <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-amber-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
                    <strong>Admin Tip:</strong> In Firebase Console (
                    <code className="font-mono">{UNIFIED_FIREBASE_PROJECT_ID}</code>) →{' '}
                    <strong>Authentication → Sign-in method</strong>, enable{' '}
                    <strong>Email/Password</strong> so both Email &amp; Google Sign-In
                    work across PakEdu and AtlierCV.
                  </div>
                )}

                {diagnosis?.shouldOfferDemoFallback && (
                  <button
                    type="button"
                    onClick={handleInstantFallbackSession}
                    className="w-full py-2 px-3 rounded-lg bg-[#5b21b6] hover:bg-[#4c1d95] text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Continue with Instant Teacher Session (Offline-Ready Mode)
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Unified Firebase Auth (`rising-safeguard-8bcxw`)</span>
            <button
              type="button"
              onClick={handleInstantFallbackSession}
              className="text-[#5b21b6] dark:text-pink-400 font-semibold hover:underline cursor-pointer"
            >
              Quick Guest Teacher Access →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
