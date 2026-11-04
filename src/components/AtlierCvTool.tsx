import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  Sparkles,
  ExternalLink,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Download,
  Copy,
  Check,
  LogIn,
  LogOut,
  KeyRound,
  Cpu,
  Code2,
  ArrowRight,
} from 'lucide-react';
import {
  buildAtlierCvSsoUrl,
  ATLIER_CV_LIVE_URL,
  UNIFIED_FIREBASE_PROJECT_ID,
  DemoUserSession,
  sanitizeReturnPortalOrigin,
} from '../utils/authAndSso';

interface AtlierCvToolProps {
  currentUser: User | null;
  demoSession: DemoUserSession | null;
  onOpenAuthModal: (mode?: 'signin' | 'signup') => void;
  onSignOutToPortalLogin: () => void;
}

const ATLIER_TEMPLATES = [
  {
    id: 'executive-ats',
    name: 'Executive ATS Pro',
    badge: 'Most Popular',
    description:
      'High-scoring ATS layout tailored for Senior Educators, Headmasters (BPS-17 to BPS-20), and Educational Administrators.',
  },
  {
    id: 'seld-educator',
    name: 'Academic & SELD Educator',
    badge: 'Teacher Favorite',
    description:
      'Highlights STBB/PTB curriculum mastery, B.Ed./M.Ed. credentials, trainings, and teaching methodology.',
  },
  {
    id: 'modern-hexagon',
    name: 'Modern Professional Studio',
    badge: 'AtelierCV Free',
    description:
      'Clean two-column typography with skill bars, professional summary polishing, and instant PDF/Word export.',
  },
  {
    id: 'govt-promotion',
    name: 'Civil Service & BPS Dossier',
    badge: 'Govt Format',
    description:
      'Structured chronology for Sindh Government service records, ACR/PER summaries, and departmental promotions.',
  },
];

export const AtlierCvTool: React.FC<AtlierCvToolProps> = ({
  currentUser,
  demoSession,
  onOpenAuthModal,
  onSignOutToPortalLogin,
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('executive-ats');
  const [copiedSsoLink, setCopiedSsoLink] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const activeIdentity = currentUser
    ? {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName,
        mode: 'Firebase Cloud Auth (Verified)',
      }
    : demoSession
    ? {
        uid: demoSession.uid,
        email: demoSession.email,
        displayName: demoSession.displayName,
        mode: 'Instant Teacher Session',
      }
    : null;

  const currentPortalOrigin = sanitizeReturnPortalOrigin(
    typeof window !== 'undefined' ? window.location.origin : undefined
  );
  const portalLogoutReturnUrl = `${currentPortalOrigin}/?sso_logout=1`;

  const ssoLaunchUrl = buildAtlierCvSsoUrl({
    targetBaseUrl: ATLIER_CV_LIVE_URL,
    user: activeIdentity,
    templateHint: selectedTemplate,
    portalOrigin: currentPortalOrigin,
  });

  const promptForAtlierCvProject = `Please update AtlierCV so it integrates seamlessly with my Main "PakEdu & Gov Portal — Sindh SELD Toolkit" (${currentPortalOrigin}):

1. Persist Portal Return URLs from Query Parameters:
- On app load, read URL search parameters: \`portal_url\`, \`logout_redirect\`, \`sso_email\`, \`sso_name\`, and \`sso_uid\`.
- If \`portal_url\` is present, save it to \`localStorage.setItem('pakedu_portal_url', portal_url)\` (default fallback: "${currentPortalOrigin}").
- If \`logout_redirect\` is present, save it to \`localStorage.setItem('pakedu_logout_redirect', logout_redirect)\` (default fallback: "${portalLogoutReturnUrl}").
- If \`sso_email\` is passed from the Main Portal and the user is not yet signed in, pre-fill the email input on the login screen (or auto-activate a session for \`sso_email\` / \`sso_name\`).

2. Add a "← Main Portal" Button in the Top Header Bar:
- In the top navigation header bar (next to Dark Mode / Sign Out), add a prominent button/link labeled "← Main Portal" that navigates directly to \`localStorage.getItem('pakedu_portal_url') || "${currentPortalOrigin}"\`.

3. Redirect to Main Portal Login Page on Sign Out / Logout:
- Update the "Sign Out" button handler so that when a user clicks "Sign Out" inside AtlierCV:
  1) It signs out of Firebase Auth (\`await signOut(auth)\`) and clears local user state.
  2) Instead of showing AtlierCV's internal login page, it immediately redirects the browser to the Main Portal Login Page:
     \`window.location.href = localStorage.getItem('pakedu_logout_redirect') || "${portalLogoutReturnUrl}";\``;

  const handleCopySsoLink = async () => {
    try {
      await navigator.clipboard.writeText(ssoLaunchUrl);
      setCopiedSsoLink(true);
      setTimeout(() => setCopiedSsoLink(false), 2500);
    } catch {
      setCopiedSsoLink(false);
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptForAtlierCvProject);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      setCopiedPrompt(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* =================================================================== */}
      {/* HERO BANNER: DIRECT STANDALONE LAUNCH TO ATLIERCV                   */}
      {/* =================================================================== */}
      <div
        className="rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-purple-400/20"
        style={{
          background: 'linear-gradient(135deg, #5b21b6 0%, #1e1b4b 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white text-[#5b21b6] text-xs font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
              DEDICATED MODULE · AI RESUME &amp; CV STUDIO
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              AtlierCV — AI-Powered Professional CV Studio
            </h1>

            <p className="text-sm sm:text-base text-purple-100/90 leading-relaxed">
              Launch the full standalone <strong>AtlierCV Studio</strong> with your
              unified Portal login session, automatic{' '}
              <code className="font-mono text-pink-300">portal_url</code> back-button
              link, and <code className="font-mono text-pink-300">logout_redirect</code>{' '}
              to return straight to the Main Portal Login Page on Sign Out.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3.5">
              <a
                href={ssoLaunchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                }}
              >
                <span>Open AtlierCV Studio (Full App)</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <a
                href={ssoLaunchUrl}
                target="_top"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-white/15 hover:bg-white/25 border border-white/20 transition-colors"
              >
                <span>Switch to AtlierCV (Same Tab)</span>
                <ArrowRight className="w-4 h-4 text-pink-300" />
              </a>

              <button
                type="button"
                onClick={onSignOutToPortalLogin}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-400/40 shadow-md transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Portal</span>
              </button>
            </div>
          </div>

          {/* Right Status Box inside Hero */}
          <div className="bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 lg:w-80 shrink-0 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-pink-300">
                Active Unified Session
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                SSO Ready
              </span>
            </div>
            <div className="text-xs space-y-1">
              <p className="font-bold text-white truncate text-sm">
                {activeIdentity?.displayName || activeIdentity?.email || 'Authenticated User'}
              </p>
              <p className="text-purple-200/80 truncate">{activeIdentity?.email}</p>
            </div>
            <div className="pt-2 border-t border-white/15 text-[11px] text-purple-200/90">
              Project: <code className="font-mono font-bold">{UNIFIED_FIREBASE_PROJECT_ID}</code>
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* VERIFIED TWO-WAY INTEGRATION STATUS CARD                            */}
      {/* =================================================================== */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 rounded-2xl border border-emerald-300 dark:border-emerald-800/70 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Two-Way SSO &amp; Logout Sync Active (PakEdu Portal ↔ AtlierCV)
              </h2>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-600 text-white">
                Verified
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              • Launching AtlierCV automatically passes your session (<code className="font-mono">sso_email</code>, <code className="font-mono">sso_name</code>, <code className="font-mono">portal_url</code>, <code className="font-mono">logout_redirect</code>).<br />
              • Clicking <strong>&ldquo;← Main Portal&rdquo;</strong> in AtlierCV brings you right back here.<br />
              • Clicking <strong>&ldquo;Sign Out&rdquo;</strong> in AtlierCV redirects you to <code className="font-mono">/?sso_logout=1</code> and opens the <strong>Main Portal Login Page</strong>.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCopyPrompt}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-emerald-900 dark:text-emerald-200 bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/50 shrink-0 cursor-pointer"
        >
          {copiedPrompt ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Integration Spec Copied</span>
            </>
          ) : (
            <>
              <Code2 className="w-3.5 h-3.5" />
              <span>Copy Integration Spec</span>
            </>
          )}
        </button>
      </div>

      {/* =================================================================== */}
      {/* UNIFIED AUTH & SSO SESSION BRIDGE CARD                              */}
      {/* =================================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-500/15 shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-100 dark:bg-purple-950/70 text-[#5b21b6] dark:text-purple-300 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  SSO Launch Link with Portal Back-Link &amp; Logout Return
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Shared Project: {UNIFIED_FIREBASE_PROJECT_ID}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Automatically passes <code className="font-mono">portal_url</code> and{' '}
                <code className="font-mono">logout_redirect</code> to AtlierCV.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {activeIdentity ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
                {activeIdentity.displayName || activeIdentity.email}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal('signin')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#5b21b6] hover:bg-[#4c1d95] transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* SSO Handoff URL Preview & Actions */}
        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-8">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Generated SSO Launch URL:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={ssoLaunchUrl}
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={handleCopySsoLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 shrink-0 cursor-pointer"
              >
                {copiedSsoLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-4 flex items-center justify-end gap-2.5 pt-2 lg:pt-5">
            <a
              href={ssoLaunchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-all hover:opacity-95"
              style={{
                background: 'linear-gradient(135deg, #5b21b6 0%, #ec4899 100%)',
              }}
            >
              <span>Launch AtlierCV Studio</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* FEATURE HIGHLIGHTS & TEMPLATE SELECTOR                              */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-500/15 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-[#5b21b6] dark:text-purple-400 flex items-center justify-center mb-3">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            AI Content Polishing
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Transforms raw teaching duties or service history into executive, measurable bullet points.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-500/15 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-pink-100 dark:bg-pink-950/60 text-[#ec4899] flex items-center justify-center mb-3">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            6 Executive &amp; ATS Layouts
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Switch templates in real time with inline drag-and-drop section reordering.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-500/15 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Offline-First Firestore Sync
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Automatically backs up your CV drafts to Firestore under your unified account.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-purple-500/15 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mb-3">
            <Download className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            A4 PDF &amp; Word Export
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
            Download pixel-perfect A4 PDFs or editable DOCX files ready for SPSC, FPSC, or school boards.
          </p>
        </div>
      </div>

      {/* Template Quick-Launch Cards */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-purple-500/15 shadow-md p-6">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Select a CV Template &amp; Open in AtlierCV
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Click any template below to pre-select it in your SSO launch URL.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {ATLIER_TEMPLATES.map((tpl) => {
            const isSelected = selectedTemplate === tpl.id;
            const tplUrl = buildAtlierCvSsoUrl({
              targetBaseUrl: ATLIER_CV_LIVE_URL,
              user: activeIdentity,
              templateHint: tpl.id,
              portalOrigin: currentPortalOrigin,
            });
            return (
              <div
                key={tpl.id}
                onClick={() => setSelectedTemplate(tpl.id)}
                className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#5b21b6] bg-purple-50/50 dark:bg-purple-950/30 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 hover:border-purple-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <FileText className="w-5 h-5 text-[#5b21b6] dark:text-purple-400" />
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-[#5b21b6] dark:text-purple-200">
                      {tpl.badge}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {tpl.name}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {tpl.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">
                    {isSelected ? 'Selected' : 'Click to select'}
                  </span>
                  <a
                    href={tplUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#ec4899] hover:underline"
                  >
                    Open Template <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
