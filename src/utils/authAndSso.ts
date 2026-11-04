/**
 * Authentication, Security Diagnostics, Rate-Limiting & Cross-Platform SSO Utilities
 * Unifies PakEdu & Gov Portal (Allforu) with AtlierCV (https://atlier-cv.vercel.app/)
 * on shared Firebase project: rising-safeguard-8bcxw
 */

export const UNIFIED_FIREBASE_PROJECT_ID = 'rising-safeguard-8bcxw';
export const ATLIER_CV_LIVE_URL = 'https://atlier-cv.vercel.app/';
export const ALLFORU_BLOG_URL = 'https://www.allfaru.dpdns.org/';

/**
 * Strict allowlist of trusted origins for SSO handoff to prevent Open Redirect vulnerabilities.
 */
const ALLOWED_SSO_HOSTS = new Set([
  'atlier-cv.vercel.app',
  'www.allfaru.dpdns.org',
  'allfaru.dpdns.org',
]);

export interface AuthValidationResult {
  valid: boolean;
  error?: string;
  sanitizedEmail: string;
  sanitizedDisplayName: string;
}

export interface FirebaseAuthDiagnosis {
  code: string;
  userMessage: string;
  technicalHint?: string;
  isUnauthorizedDomain: boolean;
  isProviderDisabled: boolean;
  isPopupBlocked: boolean;
  isPopupClosed: boolean;
  isNetworkError: boolean;
  shouldOfferDemoFallback: boolean;
  hostname: string;
  projectId: string;
}

export interface DemoUserSession {
  uid: string;
  email: string;
  displayName: string;
  isDemoFallback: boolean;
  createdAt: string;
}

/**
 * Sanitizes text input against HTML/script injection and control characters.
 */
export function sanitizeTextInput(input: unknown, maxLength = 120): string {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .replace(/[<>`"']/g, '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates email & password inputs for Sign In, Sign Up, and Password Reset.
 */
export function validateAuthCredentials(params: {
  mode: 'signin' | 'signup' | 'reset';
  email: unknown;
  password?: unknown;
  displayName?: unknown;
}): AuthValidationResult {
  const rawEmail = typeof params.email === 'string' ? params.email.trim().toLowerCase() : '';
  const sanitizedDisplayName = sanitizeTextInput(params.displayName, 80);

  if (!rawEmail) {
    return {
      valid: false,
      error: 'Email address is required.',
      sanitizedEmail: '',
      sanitizedDisplayName,
    };
  }

  // RFC-compliant practical email check without catastrophic backtracking
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (rawEmail.length > 254 || !emailRegex.test(rawEmail)) {
    return {
      valid: false,
      error: 'Please enter a valid email address (e.g., teacher@seld.gos.pk).',
      sanitizedEmail: rawEmail,
      sanitizedDisplayName,
    };
  }

  if (params.mode === 'reset') {
    return {
      valid: true,
      sanitizedEmail: rawEmail,
      sanitizedDisplayName,
    };
  }

  const rawPassword = typeof params.password === 'string' ? params.password : '';
  if (!rawPassword) {
    return {
      valid: false,
      error: 'Password is required.',
      sanitizedEmail: rawEmail,
      sanitizedDisplayName,
    };
  }

  if (params.mode === 'signup') {
    if (rawPassword.length < 6) {
      return {
        valid: false,
        error: 'Password must be at least 6 characters long.',
        sanitizedEmail: rawEmail,
        sanitizedDisplayName,
      };
    }
    if (rawPassword.length > 128) {
      return {
        valid: false,
        error: 'Password cannot exceed 128 characters.',
        sanitizedEmail: rawEmail,
        sanitizedDisplayName,
      };
    }
    if (!sanitizedDisplayName || sanitizedDisplayName.length < 2) {
      return {
        valid: false,
        error: 'Please enter your full name (at least 2 characters) for your profile.',
        sanitizedEmail: rawEmail,
        sanitizedDisplayName,
      };
    }
  }

  return {
    valid: true,
    sanitizedEmail: rawEmail,
    sanitizedDisplayName,
  };
}

/**
 * Client-side Brute-Force Rate Limiter (protects against rapid automated login attempts).
 */
const attemptTimestamps: number[] = [];
const MAX_ATTEMPTS_PER_WINDOW = 6;
const WINDOW_MS = 60_000; // 1 minute

export function checkAuthRateLimit(nowMs: number = Date.now()): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  // Purge expired timestamps
  while (attemptTimestamps.length > 0 && nowMs - attemptTimestamps[0] > WINDOW_MS) {
    attemptTimestamps.shift();
  }

  if (attemptTimestamps.length >= MAX_ATTEMPTS_PER_WINDOW) {
    const oldest = attemptTimestamps[0];
    const retryAfterSeconds = Math.max(1, Math.ceil((WINDOW_MS - (nowMs - oldest)) / 1000));
    return { allowed: false, retryAfterSeconds };
  }

  attemptTimestamps.push(nowMs);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetAuthRateLimitForTesting(): void {
  attemptTimestamps.length = 0;
}

/**
 * Replicates AtlierCV's smart Firebase Auth error diagnostics (`aD` in AtlierCV bundle).
 * Handles unauthorized domains, disabled providers, popup blockers, slow networks, and invalid credentials.
 */
export function diagnoseFirebaseAuthError(
  error: unknown,
  currentHostname = 'localhost',
  projectId = UNIFIED_FIREBASE_PROJECT_ID
): FirebaseAuthDiagnosis {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : JSON.stringify(error ?? '');
  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : '';

  const combined = `${errorCode} ${rawMessage}`.toLowerCase();

  if (combined.includes('unauthorized-domain') || combined.includes('domain is not authorized')) {
    return {
      code: 'auth/unauthorized-domain',
      userMessage: `Domain "${currentHostname}" abhi Firebase Auth mein authorized nahi hai. Neeche diye gaye steps se whitelist karein ya Instant Teacher Session use karein.`,
      technicalHint: `Add "${currentHostname}" in Firebase Console (${projectId}) → Authentication → Settings → Authorized domains.`,
      isUnauthorizedDomain: true,
      isProviderDisabled: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isNetworkError: false,
      shouldOfferDemoFallback: true,
      hostname: currentHostname,
      projectId,
    };
  }

  if (combined.includes('operation-not-allowed')) {
    return {
      code: 'auth/operation-not-allowed',
      userMessage:
        'Email/Password sign-in provider abhi Firebase Console mein enable nahi hai. Google Sign-In use karein ya Firebase Console mein Email/Password enable karein.',
      technicalHint: `Open Firebase Console (${projectId}) → Authentication → Sign-in method → Enable "Email/Password".`,
      isUnauthorizedDomain: false,
      isProviderDisabled: true,
      isPopupBlocked: false,
      isPopupClosed: false,
      isNetworkError: false,
      shouldOfferDemoFallback: true,
      hostname: currentHostname,
      projectId,
    };
  }

  if (combined.includes('popup-blocked')) {
    return {
      code: 'auth/popup-blocked',
      userMessage:
        'Browser ne Google Sign-In popup block kar diya hai. Popup allow karein ya Email/Password login use karein.',
      isUnauthorizedDomain: false,
      isProviderDisabled: false,
      isPopupBlocked: true,
      isPopupClosed: false,
      isNetworkError: false,
      shouldOfferDemoFallback: false,
      hostname: currentHostname,
      projectId,
    };
  }

  if (combined.includes('popup-closed-by-user') || combined.includes('cancelled-popup-request')) {
    return {
      code: 'auth/popup-closed-by-user',
      userMessage:
        'Google Sign-In popup band kar diya gaya. Dobara "Continue with Google Account" par click karein.',
      isUnauthorizedDomain: false,
      isProviderDisabled: false,
      isPopupBlocked: false,
      isPopupClosed: true,
      isNetworkError: false,
      shouldOfferDemoFallback: false,
      hostname: currentHostname,
      projectId,
    };
  }

  if (
    combined.includes('invalid-credential') ||
    combined.includes('wrong-password') ||
    combined.includes('user-not-found') ||
    combined.includes('invalid-login-credentials')
  ) {
    return {
      code: 'auth/invalid-credential',
      userMessage:
        'Email ya Password ghalat hai. Agar aap naye user hain to "Create Account" tab select karein.',
      isUnauthorizedDomain: false,
      isProviderDisabled: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isNetworkError: false,
      shouldOfferDemoFallback: false,
      hostname: currentHostname,
      projectId,
    };
  }

  if (combined.includes('email-already-in-use')) {
    return {
      code: 'auth/email-already-in-use',
      userMessage:
        'Yeh email address pehle se registered hai (PakEdu ya AtlierCV par). "Sign In" tab se login karein.',
      isUnauthorizedDomain: false,
      isProviderDisabled: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isNetworkError: false,
      shouldOfferDemoFallback: false,
      hostname: currentHostname,
      projectId,
    };
  }

  if (combined.includes('weak-password')) {
    return {
      code: 'auth/weak-password',
      userMessage: 'Password kam az kam 6 characters ka hona chahiye.',
      isUnauthorizedDomain: false,
      isProviderDisabled: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isNetworkError: false,
      shouldOfferDemoFallback: false,
      hostname: currentHostname,
      projectId,
    };
  }

  if (combined.includes('network-request-failed') || combined.includes('timeout')) {
    return {
      code: 'auth/network-request-failed',
      userMessage:
        'Slow internet connection detect hua hai. Apna internet check karein ya Offline/Instant Session use karein.',
      isUnauthorizedDomain: false,
      isProviderDisabled: false,
      isPopupBlocked: false,
      isPopupClosed: false,
      isNetworkError: true,
      shouldOfferDemoFallback: true,
      hostname: currentHostname,
      projectId,
    };
  }

  return {
    code: errorCode || 'auth/unknown',
    userMessage: rawMessage || 'Authentication complete nahi ho saki. Dobara koshish karein.',
    isUnauthorizedDomain: false,
    isProviderDisabled: false,
    isPopupBlocked: false,
    isPopupClosed: false,
    isNetworkError: false,
    shouldOfferDemoFallback: false,
    hostname: currentHostname,
    projectId,
  };
}

export const DEFAULT_MAIN_PORTAL_URL =
  'https://ais-pre-lpbionxpwsitdqb4fj4sjt-940167951205.asia-east1.run.app';

/**
 * Validates and sanitizes the return origin for Main Portal Login redirect after AtlierCV logout.
 */
export function sanitizeReturnPortalOrigin(originCandidate?: string): string {
  const defaultOrigin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : DEFAULT_MAIN_PORTAL_URL;

  if (!originCandidate || typeof originCandidate !== 'string') {
    return defaultOrigin;
  }

  try {
    const parsed = new URL(originCandidate);
    const isHttps = parsed.protocol === 'https:';
    const isLocalhost =
      parsed.protocol === 'http:' &&
      (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1');

    if (!isHttps && !isLocalhost) {
      return defaultOrigin;
    }
    return parsed.origin;
  } catch {
    return defaultOrigin;
  }
}

/**
 * Checks whether the current URL query parameters indicate a redirect from AtlierCV logout
 * (?sso_logout=1 or ?logged_out=1 or ?action=logout).
 */
export function shouldTriggerSsoLogoutFromSearch(search: unknown): boolean {
  if (typeof search !== 'string' || !search.trim()) {
    return false;
  }
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    return (
      params.get('sso_logout') === '1' ||
      params.get('sso_logout') === 'true' ||
      params.get('logged_out') === '1' ||
      params.get('logged_out') === 'true' ||
      params.get('action') === 'logout'
    );
  } catch {
    return false;
  }
}

/**
 * Parses incoming SSO session parameters if a user returns from AtlierCV with ?sso_email=...
 */
export function parseIncomingSsoSessionFromSearch(search: unknown): DemoUserSession | null {
  if (typeof search !== 'string' || !search.trim()) {
    return null;
  }
  if (shouldTriggerSsoLogoutFromSearch(search)) {
    return null;
  }
  try {
    const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
    const rawEmail = params.get('sso_email');
    if (!rawEmail) return null;

    const cleanEmail = sanitizeTextInput(rawEmail.toLowerCase(), 120);
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(cleanEmail)) return null;

    const cleanName =
      sanitizeTextInput(params.get('sso_name') || '', 80) ||
      cleanEmail.split('@')[0].replace(/[._-]/g, ' ') ||
      'Sindh SELD Educator';
    const cleanUid =
      sanitizeTextInput(params.get('sso_uid') || '', 64) ||
      `sso_${cleanEmail.replace(/[^a-z0-9]/g, '_')}`;

    return {
      uid: cleanUid,
      email: cleanEmail,
      displayName: cleanName,
      isDemoFallback: true,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Enforces the Mandatory Login Gate on Portal Open.
 * Portal access is strictly blocked unless a verified Firebase user or explicit Teacher Session exists.
 */
export function isPortalAccessAllowed(params: {
  currentUser: { uid?: string | null; email?: string | null } | null | undefined;
  demoSession: DemoUserSession | null | undefined;
  authInitializing?: boolean;
}): {
  allowed: boolean;
  mustShowLoginGate: boolean;
  isInitializing: boolean;
} {
  const isInitializing = Boolean(params.authInitializing);
  const hasFirebaseUser = Boolean(
    params.currentUser && (params.currentUser.uid || params.currentUser.email)
  );
  const hasDemoSession = Boolean(
    params.demoSession && params.demoSession.uid && params.demoSession.email
  );
  const allowed = !isInitializing && (hasFirebaseUser || hasDemoSession);

  return {
    allowed,
    mustShowLoginGate: !isInitializing && !allowed,
    isInitializing,
  };
}

/**
 * Builds a secure, Open-Redirect-proof SSO launch URL for AtlierCV.
 * Includes logout_redirect and return_url pointing back to the Main Portal Login Page.
 */
export function buildAtlierCvSsoUrl(params: {
  targetBaseUrl?: string;
  user?: {
    uid?: string | null;
    email?: string | null;
    displayName?: string | null;
  } | null;
  templateHint?: string;
  portalOrigin?: string;
}): string {
  const baseCandidate = params.targetBaseUrl || ATLIER_CV_LIVE_URL;
  let parsed: URL;
  try {
    parsed = new URL(baseCandidate);
  } catch {
    parsed = new URL(ATLIER_CV_LIVE_URL);
  }

  // Security Audit Rule 3: Enforce strict HTTPS + hostname allowlist to block Open Redirects
  if (parsed.protocol !== 'https:' || !ALLOWED_SSO_HOSTS.has(parsed.hostname)) {
    parsed = new URL(ATLIER_CV_LIVE_URL);
  }

  const safePortalOrigin = sanitizeReturnPortalOrigin(params.portalOrigin);
  const logoutReturnUrl = `${safePortalOrigin}/?sso_logout=1`;

  parsed.searchParams.set('utm_source', 'pakedu_seld_portal');
  parsed.searchParams.set('firebase_project', UNIFIED_FIREBASE_PROJECT_ID);
  parsed.searchParams.set('portal_url', safePortalOrigin);
  parsed.searchParams.set('logout_redirect', logoutReturnUrl);
  parsed.searchParams.set('return_url', logoutReturnUrl);

  if (params.user && params.user.email) {
    const cleanEmail = sanitizeTextInput(params.user.email, 120);
    const cleanName = sanitizeTextInput(params.user.displayName || '', 80);
    const cleanUid = sanitizeTextInput(params.user.uid || '', 64);

    if (cleanEmail) {
      parsed.searchParams.set('sso_email', cleanEmail);
    }
    if (cleanName) {
      parsed.searchParams.set('sso_name', cleanName);
    }
    if (cleanUid) {
      parsed.searchParams.set('sso_uid', cleanUid);
    }
  }

  if (params.templateHint) {
    const cleanTemplate = sanitizeTextInput(params.templateHint, 40);
    if (cleanTemplate) {
      parsed.searchParams.set('template', cleanTemplate);
    }
  }

  return parsed.toString();
}

