/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import {
  BookOpen,
  Calculator,
  FileSignature,
  Menu,
  X,
  Printer,
  LogOut,
  GraduationCap,
  Eye,
  Sparkles,
  ExternalLink,
  Sun,
  Moon,
  ChevronDown,
  Bell,
  UserCheck,
  Briefcase,
  ShieldCheck,
} from 'lucide-react';
import { auth } from './firebase';
import { LessonPlanTool } from './components/LessonPlanTool';
import { SalaryCalculatorTool } from './components/SalaryCalculatorTool';
import { LeaveApplicationTool } from './components/LeaveApplicationTool';
import { AtlierCvTool } from './components/AtlierCvTool';
import { AuthModal } from './components/AuthModal';
import { triggerPrintDocument } from './utils/printDocument';
import {
  ATLIER_CV_LIVE_URL,
  ALLFORU_BLOG_URL,
  UNIFIED_FIREBASE_PROJECT_ID,
  DemoUserSession,
  buildAtlierCvSsoUrl,
  isPortalAccessAllowed,
  shouldTriggerSsoLogoutFromSearch,
  parseIncomingSsoSessionFromSearch,
} from './utils/authAndSso';

type ActiveToolId =
  | 'lesson-plan'
  | 'salary-calculator'
  | 'leave-generator'
  | 'atlier-cv';

const DEMO_SESSION_STORAGE_KEY = 'pakedu_seld_demo_session_v1';

export default function App() {
  const [activeTool, setActiveTool] = useState<ActiveToolId>('lesson-plan');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [demoSession, setDemoSession] = useState<DemoUserSession | null>(() => {
    try {
      const savedLocal = localStorage.getItem(DEMO_SESSION_STORAGE_KEY);
      if (savedLocal) return JSON.parse(savedLocal) as DemoUserSession;
      const savedSession = sessionStorage.getItem(DEMO_SESSION_STORAGE_KEY);
      return savedSession ? (JSON.parse(savedSession) as DemoUserSession) : null;
    } catch {
      return null;
    }
  });
  const [authInitializing, setAuthInitializing] = useState(true);
  const [logoutNotice, setLogoutNotice] = useState<string | null>(null);
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup'>('signin');
  const [showHeroOverview, setShowHeroOverview] = useState(true);

  const performUnifiedLogout = useCallback(async (customNotice?: string) => {
    setDemoSession(null);
    try {
      localStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
      sessionStorage.removeItem(DEMO_SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign-out error:', err);
    }
    setCurrentUser(null);
    setAuthModalMode('signin');
    setLogoutNotice(
      customNotice ||
        'Aap successfully Logout ho chuke hain. Portal aur AtlierCV Studio kholne ke liye dobara Sign In karein.'
    );
  }, []);

  // Check for ?sso_logout=1 redirect from AtlierCV, incoming SSO session, and listen to Firebase Auth state
  useEffect(() => {
    const searchStr = typeof window !== 'undefined' ? window.location.search : '';
    const triggeredByAtlierLogout = shouldTriggerSsoLogoutFromSearch(searchStr);

    if (triggeredByAtlierLogout && typeof window !== 'undefined') {
      // Clean URL query parameters so refreshing doesn't re-trigger logout loop
      const cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, cleanUrl);
      performUnifiedLogout(
        'Aap AtlierCV se Logout ho kar wapas Main Portal Login Page par aa gaye hain. Dobara access ke liye Sign In karein.'
      ).finally(() => {
        setAuthInitializing(false);
      });
      return;
    }

    const incomingSso = parseIncomingSsoSessionFromSearch(searchStr);
    if (incomingSso) {
      setDemoSession(incomingSso);
      try {
        localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(incomingSso));
        sessionStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(incomingSso));
      } catch {
        // Ignore storage errors
      }
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setLogoutNotice(null);
      }
      setAuthInitializing(false);
    });
    return () => unsubscribe();
  }, [performUnifiedLogout]);

  const handleDemoSessionSuccess = (session: DemoUserSession) => {
    setDemoSession(session);
    setLogoutNotice(null);
    try {
      localStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session));
      sessionStorage.setItem(DEMO_SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // Ignore storage errors
    }
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.body.classList.add('dark-mode');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark-mode');
      document.documentElement.classList.remove('dark');
    }
  };

  // Toggle live A4 `printing-mode` preview on body
  const togglePrintPreview = () => {
    const nextState = !isPrintPreview;
    setIsPrintPreview(nextState);
    if (nextState) {
      document.body.classList.add('printing-mode');
    } else {
      document.body.classList.remove('printing-mode');
    }
  };

  const openAuthModal = (mode: 'signin' | 'signup' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const selectTool = (tool: ActiveToolId) => {
    setActiveTool(tool);
    setMobileMenuOpen(false);
  };

  // =========================================================================
  // MANDATORY LOGIN GATE CHECK: Portal MUST NOT open without Authentication
  // =========================================================================
  const portalAccess = isPortalAccessAllowed({
    currentUser,
    demoSession,
    authInitializing,
  });

  if (portalAccess.isInitializing) {
    return (
      <div
        className="min-h-screen w-full flex flex-col items-center justify-center p-6 text-white"
        style={{
          background: 'linear-gradient(135deg, #5b21b6 0%, #0f172a 100%)',
        }}
      >
        <div className="allforu-progress-bar" />
        <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center mb-4 animate-pulse">
          <ShieldCheck className="w-6 h-6 text-pink-400" />
        </div>
        <h1 className="text-lg font-bold tracking-tight">
          Verifying Allforu × AtlierCV Unified Session...
        </h1>
        <p className="text-xs text-purple-200/80 mt-1">
          PakEdu &amp; Sindh SELD Portal (`{UNIFIED_FIREBASE_PROJECT_ID}`)
        </p>
      </div>
    );
  }

  if (portalAccess.mustShowLoginGate) {
    return (
      <AuthModal
        isOpen={true}
        isMandatoryGate={true}
        logoutNotice={logoutNotice}
        onClose={() => {}}
        onDemoSessionSuccess={handleDemoSessionSuccess}
        initialMode={authModalMode}
      />
    );
  }

  const activeUserDisplay = currentUser
    ? currentUser.displayName || currentUser.email
    : demoSession
    ? `${demoSession.displayName}`
    : 'Authenticated Teacher';

  const ssoAtlierLink = buildAtlierCvSsoUrl({
    targetBaseUrl: ATLIER_CV_LIVE_URL,
    user: currentUser
      ? {
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName,
        }
      : demoSession
      ? {
          uid: demoSession.uid,
          email: demoSession.email,
          displayName: demoSession.displayName,
        }
      : null,
  });

  return (
    <div
      className={`min-h-screen flex flex-col lg:flex-row transition-colors ${
        darkMode ? 'bg-[#0f172a] text-[#f8fafc]' : 'bg-[#f8fafc] text-[#1e293b]'
      }`}
    >
      {/* Top 4px Progress / Accent Bar from https://www.allfaru.dpdns.org/ */}
      <div className="allforu-progress-bar no-print" />

      {/* Optional Modal when triggered inside portal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onDemoSessionSuccess={handleDemoSessionSuccess}
        initialMode={authModalMode}
      />

      {/* Floating Exit Button when in A4 Print Preview Mode */}
      {isPrintPreview && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg">
          <span className="text-xs font-medium">A4 Print Mode Active</span>
          <button
            type="button"
            onClick={triggerPrintDocument}
            className="px-3 py-1 text-xs font-semibold bg-[#5b21b6] hover:bg-[#4c1d95] rounded-lg cursor-pointer"
          >
            Send to Printer
          </button>
          <button
            type="button"
            onClick={togglePrintPreview}
            className="px-3 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-lg cursor-pointer"
          >
            Exit Preview
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* DESKTOP & MOBILE SIDEBAR NAVIGATION (Allforu Deep Purple & Indigo)  */}
      {/* =================================================================== */}
      <aside
        className={`app-sidebar no-print fixed inset-y-0 left-0 z-40 w-72 text-white flex flex-col justify-between transition-transform duration-200 ease-out lg:static lg:translate-x-0 shrink-0 shadow-xl ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          background: 'linear-gradient(180deg, #5b21b6 0%, #1e1b4b 100%)',
        }}
      >
        <div>
          {/* Sidebar Brand Header (Matches Allforu Education Portal) */}
          <div className="px-5 py-5 border-b border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                }}
              >
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold tracking-tight text-white leading-none">
                    Allforu
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-pink-500/30 text-pink-200 border border-pink-400/30">
                    SELD ERP
                  </span>
                </div>
                <span className="text-[11px] text-purple-200/85 block mt-1">
                  PakEdu &amp; Sindh Govt Portal
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-purple-200 hover:text-white rounded-lg"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tool Navigation Links */}
          <div className="p-3.5 space-y-1.5">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-pink-300/90">
              AI-Powered Education ERP Modules
            </div>

            <button
              type="button"
              onClick={() => selectTool('lesson-plan')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm font-medium transition-all cursor-pointer ${
                activeTool === 'lesson-plan'
                  ? 'bg-white text-[#5b21b6] font-bold shadow-md'
                  : 'text-purple-50 hover:bg-white/10'
              }`}
            >
              <BookOpen className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <span className="block truncate">1. AI Lesson Plan Generator</span>
                <span
                  className={`text-[11px] block truncate ${
                    activeTool === 'lesson-plan'
                      ? 'text-[#5b21b6]/80'
                      : 'text-purple-200/75'
                  }`}
                >
                  STBB / PTB · Firestore &amp; AI
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectTool('salary-calculator')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm font-medium transition-all cursor-pointer ${
                activeTool === 'salary-calculator'
                  ? 'bg-white text-[#5b21b6] font-bold shadow-md'
                  : 'text-purple-50 hover:bg-white/10'
              }`}
            >
              <Calculator className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <span className="block truncate">2. Sindh Salary Calculator</span>
                <span
                  className={`text-[11px] block truncate ${
                    activeTool === 'salary-calculator'
                      ? 'text-[#5b21b6]/80'
                      : 'text-purple-200/75'
                  }`}
                >
                  Budget 2026 · BPS-01 to BPS-22
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => selectTool('leave-generator')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm font-medium transition-all cursor-pointer ${
                activeTool === 'leave-generator'
                  ? 'bg-white text-[#5b21b6] font-bold shadow-md'
                  : 'text-purple-50 hover:bg-white/10'
              }`}
            >
              <FileSignature className="w-4 h-4 shrink-0" />
              <div className="truncate">
                <span className="block truncate">3. SELD FRAMES Leave</span>
                <span
                  className={`text-[11px] block truncate ${
                    activeTool === 'leave-generator'
                      ? 'text-[#5b21b6]/80'
                      : 'text-purple-200/75'
                  }`}
                >
                  38 Leave Types · A4 Proforma
                </span>
              </div>
            </button>

            {/* MODULE 4: AtlierCV Studio */}
            <button
              type="button"
              onClick={() => selectTool('atlier-cv')}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-sm font-medium transition-all cursor-pointer relative ${
                activeTool === 'atlier-cv'
                  ? 'bg-white text-[#5b21b6] font-bold shadow-md'
                  : 'text-purple-50 hover:bg-white/10 border border-pink-400/25 bg-pink-500/10'
              }`}
            >
              <Briefcase className="w-4 h-4 shrink-0 text-[#ec4899]" />
              <div className="truncate flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="block truncate">4. AtlierCV Studio</span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-[#ec4899] text-white shrink-0">
                    NEW
                  </span>
                </div>
                <span
                  className={`text-[11px] block truncate ${
                    activeTool === 'atlier-cv'
                      ? 'text-[#5b21b6]/80'
                      : 'text-pink-200/90'
                  }`}
                >
                  AI Professional CV Studio
                </span>
              </div>
            </button>

            {/* Direct External Links to Live AtlierCV & Allforu Blog */}
            <div className="pt-3 mt-3 border-t border-white/15 space-y-1.5">
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-300/80">
                Connected Live Platforms
              </div>
              <a
                href={ssoAtlierLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold text-white hover:opacity-95 transition-opacity shadow-sm"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 100%)',
                }}
              >
                <span className="flex items-center gap-2 truncate">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  Launch AtlierCV Live
                </span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              <a
                href={ALLFORU_BLOG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-purple-100 hover:bg-white/10 transition-colors"
              >
                <span>Allforu Official Blog</span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-75" />
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar Footer: Unified Firebase Auth & Prominent Logout */}
        <div className="p-4 border-t border-white/15 bg-black/25 space-y-3">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-pink-500/30 border border-pink-400/40 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-pink-200" />
              </div>
              <div className="text-xs min-w-0">
                <span className="text-pink-300 text-[10px] font-semibold uppercase tracking-wider block">
                  Unified SSO Active
                </span>
                <span className="font-bold text-white truncate block">
                  {activeUserDisplay}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => performUnifiedLogout()}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout (Main Login Page)
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="no-print fixed inset-0 z-30 bg-slate-900/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* =================================================================== */}
      {/* MAIN WORKSPACE VIEWPORT                                             */}
      {/* =================================================================== */}
      <div className="app-main-wrapper flex-1 flex flex-col min-w-0">
        {/* Top Glassmorphic Header WITH PROMINENT LOGOUT BUTTON ON MAIN PAGE */}
        <header className="app-topbar allforu-glass no-print px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 sticky top-0 z-20">
          {/* Zone 1: Brand Logo & Mobile Menu Trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-[#5b21b6] rounded-lg"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div
              onClick={() => selectTool('lesson-plan')}
              className="cursor-pointer flex items-center gap-2"
            >
              <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#5b21b6] dark:text-white">
                Allforu
              </span>
              <span className="hidden sm:inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-[#5b21b6] dark:text-purple-300 border border-purple-300/40">
                PakEdu &amp; Sindh SELD Portal
              </span>
            </div>
          </div>

          {/* Zone 2: Allforu Navigation Menu */}
          <nav className="hidden xl:flex items-center gap-5 text-sm font-medium">
            <button
              type="button"
              onClick={() => selectTool('lesson-plan')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
                activeTool === 'lesson-plan'
                  ? 'text-[#5b21b6] dark:text-purple-400 font-bold underline underline-offset-8 decoration-2 decoration-[#ec4899]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#5b21b6]'
              }`}
            >
              AI Lesson Planner
            </button>
            <button
              type="button"
              onClick={() => selectTool('salary-calculator')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
                activeTool === 'salary-calculator'
                  ? 'text-[#5b21b6] dark:text-purple-400 font-bold underline underline-offset-8 decoration-2 decoration-[#ec4899]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#5b21b6]'
              }`}
            >
              Salary Calculator 2026
            </button>
            <button
              type="button"
              onClick={() => selectTool('leave-generator')}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer ${
                activeTool === 'leave-generator'
                  ? 'text-[#5b21b6] dark:text-purple-400 font-bold underline underline-offset-8 decoration-2 decoration-[#ec4899]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#5b21b6]'
              }`}
            >
              SELD Leave Proforma
            </button>
            <button
              type="button"
              onClick={() => selectTool('atlier-cv')}
              className={`py-1 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
                activeTool === 'atlier-cv'
                  ? 'text-[#5b21b6] dark:text-purple-400 font-bold underline underline-offset-8 decoration-2 decoration-[#ec4899]'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#5b21b6]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#ec4899]" />
              <span>AtlierCV Studio</span>
            </button>
          </nav>

          {/* Zone 3: Main Page Actions (User Badge, Prominent Logout Button, Dark Mode, Print/PDF) */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#5b21b6] dark:text-purple-300 bg-purple-100 dark:bg-purple-950/70 rounded-full"
              title="Unified SSO Account Active"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="max-w-28 truncate">{activeUserDisplay}</span>
            </div>

            {/* PROMINENT LOGOUT BUTTON ON MAIN PAGE HEADER */}
            <button
              type="button"
              onClick={() => performUnifiedLogout()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-full shadow-xs transition-colors whitespace-nowrap cursor-pointer"
              title="Logout and return to Main Portal Login Page"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>

            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-purple-500/10 transition-colors cursor-pointer"
              aria-label="Toggle Dark Mode"
              title="Toggle Light / Dark Theme"
            >
              {darkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-[#5b21b6]" />
              )}
            </button>

            <button
              type="button"
              onClick={togglePrintPreview}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-full transition-colors whitespace-nowrap cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              A4 Preview
            </button>

            <button
              type="button"
              onClick={triggerPrintDocument}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#5b21b6] hover:bg-[#4c1d95] rounded-full transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print / PDF</span>
            </button>
          </div>
        </header>

        {/* Main Content Container */}
        <main className="app-content-container flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-5 space-y-6">
          {/* =================================================================== */}
          {/* ALLFORU ANIMATED UPDATES TICKER (Exact copy from allfaru.dpdns.org) */}
          {/* =================================================================== */}
          <div className="no-print flex items-center bg-white dark:bg-slate-900 border border-purple-500/15 rounded-xl shadow-xs overflow-hidden">
            <div className="bg-[#5b21b6] text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2 shrink-0 z-10">
              <Bell className="w-3.5 h-3.5 text-pink-300" />
              <span>Updates</span>
            </div>
            <div className="flex-1 overflow-hidden relative py-2">
              <div className="allforu-ticker-track items-center gap-8 text-xs font-medium">
                <span
                  onClick={() => selectTool('atlier-cv')}
                  className="inline-flex items-center gap-2 px-4 cursor-pointer hover:text-[#5b21b6]"
                >
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#ec4899] text-white">
                    New
                  </span>
                  <span>
                    AtlierCV — AI-Powered Professional CV Studio Integrated with Unified Login &amp; Main Portal Logout Return
                  </span>
                </span>

                <span
                  onClick={() => selectTool('lesson-plan')}
                  className="inline-flex items-center gap-2 px-4 cursor-pointer hover:text-[#5b21b6]"
                >
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#8b5cf6] text-white">
                    STBB &amp; PTB
                  </span>
                  <span>
                    Automated Lesson Plans for Teachers Including Sindh STBB &amp; Punjab PTB Syllabus Powered by Allforu Education Portal
                  </span>
                </span>

                <span
                  onClick={() => selectTool('salary-calculator')}
                  className="inline-flex items-center gap-2 px-4 cursor-pointer hover:text-[#5b21b6]"
                >
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#8b5cf6] text-white">
                    2026 Budget
                  </span>
                  <span>
                    Sindh Government Salary Calculator 2026 — BPS-01 to BPS-22 with Adhoc &amp; Differential Allowances
                  </span>
                </span>

                <span
                  onClick={() => selectTool('leave-generator')}
                  className="inline-flex items-center gap-2 px-4 cursor-pointer hover:text-[#5b21b6]"
                >
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#8b5cf6] text-white">
                    SELD Rules
                  </span>
                  <span>
                    Sindh Government Teachers Leave Rules &amp; 38 Official SELD FRAMES Leave Proformas
                  </span>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowHeroOverview(!showHeroOverview)}
              className="px-3 py-2 text-[11px] font-semibold text-[#5b21b6] dark:text-purple-300 hover:underline shrink-0 border-l border-slate-200 dark:border-slate-800 cursor-pointer"
            >
              {showHeroOverview ? 'Hide Banner' : 'Show Banner'}
              <ChevronDown
                className={`w-3.5 h-3.5 inline ml-1 transition-transform ${
                  showHeroOverview ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* =================================================================== */}
          {/* ALLFORU AI-POWERED HERO & 4 ERP MODULE CARDS (Collapsible)          */}
          {/* =================================================================== */}
          {showHeroOverview && (
            <div className="no-print space-y-6 animate-fadeIn">
              {/* Hero Section matching https://www.allfaru.dpdns.org/ */}
              <section
                className="rounded-3xl px-6 py-9 sm:py-11 text-center text-white shadow-xl relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #5b21b6 0%, #1e1b4b 100%)',
                }}
              >
                <div className="relative z-10 max-w-3xl mx-auto">
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                    <span className="inline-block bg-white text-[#5b21b6] px-4 py-1.5 rounded-full text-[11px] font-extrabold tracking-wider uppercase shadow-sm">
                      AI-POWERED SCHOOL MANAGEMENT &amp; SELD PORTAL
                    </span>
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
                      <UserCheck className="w-3.5 h-3.5" />
                      Welcome, {activeUserDisplay}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-3">
                    The Education Portal That Plans Your Year With AI
                  </h1>
                  <p className="text-xs sm:text-base text-slate-200 max-w-2xl mx-auto mb-6 leading-relaxed">
                    Generate official Sindh STBB &amp; PTB curriculum lesson plans,
                    calculate 2026 BPS salaries, prepare SELD FRAMES leave applications,
                    and build ATS-ready CVs with{' '}
                    <strong className="text-pink-300">AtlierCV Studio</strong>.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => selectTool('lesson-plan')}
                      className="allforu-btn-demo px-6 py-2.5 text-xs sm:text-sm cursor-pointer"
                    >
                      Explore AI Suite →
                    </button>
                    <a
                      href={ssoAtlierLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-white/15 hover:bg-white/25 text-white border border-white/20 transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-pink-300" />
                      <span>Launch AtlierCV Studio Live</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => performUnifiedLogout()}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout Account</span>
                    </button>
                  </div>
                </div>
                <div
                  className="pointer-events-none absolute -top-1/2 -left-1/2 w-[200%] h-[200%]"
                  style={{
                    background:
                      'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)',
                  }}
                />
              </section>

              {/* 4 ERP Module Cards matching .tools-grid on allfaru.dpdns.org */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => selectTool('lesson-plan')}
                  className={`allforu-tool-card p-5 text-center cursor-pointer flex flex-col items-center ${
                    activeTool === 'lesson-plan' ? 'ring-2 ring-[#5b21b6]' : ''
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{
                      background: 'rgba(139, 92, 246, 0.12)',
                      color: '#5b21b6',
                    }}
                  >
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold">Lesson Planning System</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    AI &amp; Firestore academic plans aligned with Sindh STBB &amp; PTB.
                  </p>
                </div>

                <div
                  onClick={() => selectTool('salary-calculator')}
                  className={`allforu-tool-card p-5 text-center cursor-pointer flex flex-col items-center ${
                    activeTool === 'salary-calculator' ? 'ring-2 ring-[#5b21b6]' : ''
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{
                      background: 'rgba(236, 72, 153, 0.12)',
                      color: '#ec4899',
                    }}
                  >
                    <Calculator className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold">Payroll &amp; Finance 2026</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Automated BPS-01 to BPS-22 salary &amp; 2026 allowance breakdown.
                  </p>
                </div>

                <div
                  onClick={() => selectTool('leave-generator')}
                  className={`allforu-tool-card p-5 text-center cursor-pointer flex flex-col items-center ${
                    activeTool === 'leave-generator' ? 'ring-2 ring-[#5b21b6]' : ''
                  }`}
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      color: '#10b981',
                    }}
                  >
                    <FileSignature className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold">SELD FRAMES Leave</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Official A4 leave proforma with 38 Sindh Civil Service leave types.
                  </p>
                </div>

                <div
                  onClick={() => selectTool('atlier-cv')}
                  className={`allforu-tool-card p-5 text-center cursor-pointer flex flex-col items-center relative ${
                    activeTool === 'atlier-cv' ? 'ring-2 ring-[#ec4899]' : ''
                  }`}
                >
                  <span className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#ec4899] text-white">
                    NEW
                  </span>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mb-3"
                    style={{
                      background: 'rgba(236, 72, 153, 0.15)',
                      color: '#ec4899',
                    }}
                  >
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold">AtlierCV Studio</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    AI-Powered Professional CV Studio with unified Login &amp; Logout.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================== */}
          {/* ACTIVE TOOL WORKSPACE                                               */}
          {/* =================================================================== */}
          {activeTool === 'lesson-plan' && (
            <LessonPlanTool
              currentUser={currentUser}
              onRequestSignIn={() => openAuthModal('signin')}
            />
          )}

          {activeTool === 'salary-calculator' && <SalaryCalculatorTool />}

          {activeTool === 'leave-generator' && <LeaveApplicationTool />}

          {activeTool === 'atlier-cv' && (
            <AtlierCvTool
              currentUser={currentUser}
              demoSession={demoSession}
              onOpenAuthModal={openAuthModal}
              onSignOutToPortalLogin={() =>
                performUnifiedLogout(
                  'Aap AtlierCV Studio se Logout ho kar wapas Main Portal Login Page par aa gaye hain.'
                )
              }
            />
          )}
        </main>

        {/* Allforu Footer (Hidden in Print) */}
        <footer className="app-footer no-print border-t border-purple-500/15 bg-white dark:bg-slate-900 px-6 py-5 text-xs text-slate-500 dark:text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[#5b21b6] dark:text-purple-400">
              Allforu Education Portal
            </span>
            <span>·</span>
            <span>
              School Education &amp; Literacy Department (SELD) · Sindh STBB &amp; PTB
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={ALLFORU_BLOG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#5b21b6] font-medium inline-flex items-center gap-1"
            >
              allfaru.dpdns.org <ExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={() => performUnifiedLogout()}
              className="text-rose-600 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3 h-3" /> Logout
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
