/**
 * Unit & Security Tests (Rule 1: TDD & Rule 3: Security Self-Audit)
 * Tests Auth validation, XSS sanitization, brute-force rate limiting,
 * Open Redirect prevention on SSO URLs, and 2026 Salary Calculator edge cases.
 */

import assert from 'node:assert/strict';
import {
  validateAuthCredentials,
  sanitizeTextInput,
  checkAuthRateLimit,
  resetAuthRateLimitForTesting,
  diagnoseFirebaseAuthError,
  buildAtlierCvSsoUrl,
  isPortalAccessAllowed,
  shouldTriggerSsoLogoutFromSearch,
  sanitizeReturnPortalOrigin,
  parseIncomingSsoSessionFromSearch,
  DEFAULT_MAIN_PORTAL_URL,
  ATLIER_CV_LIVE_URL,
  UNIFIED_FIREBASE_PROJECT_ID,
} from './authAndSso';
import { calculateSindhSalary2026 } from '../data/salaryScale2026';

function runAllUnitTests() {
  console.log('=== Running PakEdu & AtlierCV Unit & Security Test Suite ===\n');

  // 1. XSS & Input Sanitization Tests
  {
    const malicious = '<script>alert("xss")</script>Muhammed "Ali" \u0000\u0007';
    const cleaned = sanitizeTextInput(malicious);
    assert.equal(cleaned.includes('<'), false, 'Should strip <');
    assert.equal(cleaned.includes('>'), false, 'Should strip >');
    assert.equal(cleaned.includes('"'), false, 'Should strip quotes');
    assert.equal(cleaned.includes('\u0000'), false, 'Should strip null bytes');
    assert.equal(sanitizeTextInput(null), '', 'Should handle null input safely');
    assert.equal(sanitizeTextInput(undefined), '', 'Should handle undefined input safely');
    console.log('✅ PASS: XSS & Null-Byte Sanitization Tests');
  }

  // 2. Auth Credential Validation Edge Cases
  {
    const nullEmail = validateAuthCredentials({ mode: 'signin', email: null, password: 'secretPassword' });
    assert.equal(nullEmail.valid, false);

    const badEmail = validateAuthCredentials({ mode: 'signin', email: 'not-an-email', password: 'secretPassword' });
    assert.equal(badEmail.valid, false);

    const shortPassSignup = validateAuthCredentials({
      mode: 'signup',
      email: 'teacher@seld.gos.pk',
      password: '123',
      displayName: 'Ustad Ahmed',
    });
    assert.equal(shortPassSignup.valid, false);

    const missingNameSignup = validateAuthCredentials({
      mode: 'signup',
      email: 'teacher@seld.gos.pk',
      password: 'securePassword123',
      displayName: ' ',
    });
    assert.equal(missingNameSignup.valid, false);

    const validSignup = validateAuthCredentials({
      mode: 'signup',
      email: '  Teacher@SELD.gos.pk ',
      password: 'securePassword123',
      displayName: '<b>Ahmed Khan</b>',
    });
    assert.equal(validSignup.valid, true);
    assert.equal(validSignup.sanitizedEmail, 'teacher@seld.gos.pk');
    assert.equal(validSignup.sanitizedDisplayName, 'bAhmed Khan/b');
    console.log('✅ PASS: Auth Credential Validation & Edge Case Tests');
  }

  // 3. Brute-Force Rate Limiter Tests
  {
    resetAuthRateLimitForTesting();
    const baseTime = 1_700_000_000_000;
    for (let i = 0; i < 6; i++) {
      const res = checkAuthRateLimit(baseTime + i * 100);
      assert.equal(res.allowed, true, `Attempt ${i + 1} should be allowed`);
    }
    const blocked = checkAuthRateLimit(baseTime + 1000);
    assert.equal(blocked.allowed, false, '7th rapid attempt within 60s must be blocked');
    assert.equal(blocked.retryAfterSeconds > 0, true);

    // After 61 seconds, window resets
    const afterWindow = checkAuthRateLimit(baseTime + 61_000);
    assert.equal(afterWindow.allowed, true, 'Attempt after 60s window must be allowed');
    resetAuthRateLimitForTesting();
    console.log('✅ PASS: Brute-Force Login Rate Limiter Tests');
  }

  // 4. Open-Redirect & SSO URL Security Tests
  {
    const evilRedirect = buildAtlierCvSsoUrl({
      targetBaseUrl: 'https://evil-phishing-site.example.com/steal-token',
      user: { uid: 'uid_123', email: 'teacher@seld.gos.pk', displayName: 'Sanaullah' },
    });
    assert.equal(
      evilRedirect.startsWith(ATLIER_CV_LIVE_URL),
      true,
      'Untrusted domain must fallback to official AtlierCV URL'
    );

    const javascriptProtocol = buildAtlierCvSsoUrl({
      targetBaseUrl: 'javascript:alert(1)',
      user: { uid: 'uid_123', email: 'teacher@seld.gos.pk', displayName: 'Sanaullah' },
    });
    assert.equal(
      javascriptProtocol.startsWith(ATLIER_CV_LIVE_URL),
      true,
      'javascript: URI must be blocked and fallback to official AtlierCV URL'
    );

    const validSsoUrl = new URL(
      buildAtlierCvSsoUrl({
        user: { uid: 'user_99', email: 'faru@allfaru.dpdns.org', displayName: 'Allforu Teacher' },
        templateHint: 'executive-ats',
        portalOrigin: DEFAULT_MAIN_PORTAL_URL,
      })
    );
    assert.equal(validSsoUrl.hostname, 'atlier-cv.vercel.app');
    assert.equal(validSsoUrl.searchParams.get('firebase_project'), UNIFIED_FIREBASE_PROJECT_ID);
    assert.equal(validSsoUrl.searchParams.get('sso_email'), 'faru@allfaru.dpdns.org');
    assert.equal(validSsoUrl.searchParams.get('template'), 'executive-ats');
    assert.equal(validSsoUrl.searchParams.get('portal_url'), DEFAULT_MAIN_PORTAL_URL);
    assert.equal(
      validSsoUrl.searchParams.get('logout_redirect'),
      `${DEFAULT_MAIN_PORTAL_URL}/?sso_logout=1`
    );
    console.log('✅ PASS: Open-Redirect Prevention & Cross-Platform SSO URL Builder Tests');
  }

  // 5. Firebase Auth Error Diagnostics Tests
  {
    const unauthDiag = diagnoseFirebaseAuthError(
      { code: 'auth/unauthorized-domain', message: 'Firebase: Error (auth/unauthorized-domain).' },
      'preview.run.app'
    );
    assert.equal(unauthDiag.isUnauthorizedDomain, true);
    assert.equal(unauthDiag.shouldOfferDemoFallback, true);

    const disabledDiag = diagnoseFirebaseAuthError(
      new Error('Firebase: Error (auth/operation-not-allowed).')
    );
    assert.equal(disabledDiag.isProviderDisabled, true);
    assert.equal(disabledDiag.shouldOfferDemoFallback, true);
    console.log('✅ PASS: Firebase Auth Error Diagnostics & Fallback Tests');
  }

  // 6. 2026 Salary Calculator Integration & Boundary Edge Cases
  {
    // BPS-14 Stage 5 (Primary/JEST Teacher scale)
    const bps14 = calculateSindhSalary2026(14, 5);
    assert.equal(bps14.bpsRow.bps, 14);
    assert.equal(bps14.adhoc2023RatePercent, 35);
    assert.equal(bps14.differential2026 > 0, true, 'BPS 1-16 receives 2% Differential Allowance 2026');
    assert.equal(bps14.netSalary, bps14.grossSalary - bps14.totalDeductions);

    // BPS-17 Stage 0 (Gazetted Officer / Subject Specialist)
    const bps17 = calculateSindhSalary2026(17, 0);
    assert.equal(bps17.adhoc2023RatePercent, 30);
    assert.equal(bps17.differential2026, 0, 'BPS 17-22 gets 0 Differential Allowance 2026');

    // Out-of-range inputs (e.g. negative stage or invalid BPS)
    const clamped = calculateSindhSalary2026(999, -10, -500);
    assert.equal(clamped.bpsRow.bps, 14, 'Invalid BPS falls back to default BPS-14 teacher scale safely');
    assert.equal(Number.isFinite(clamped.netSalary), true);
    console.log('✅ PASS: Sindh Government Salary Calculator 2026 Boundary & Math Tests');
  }

  // 7. Mandatory Login Gate & Bi-Directional Cross-App SSO / Logout Tests
  {
    const unauthState = isPortalAccessAllowed({
      currentUser: null,
      demoSession: null,
      authInitializing: false,
    });
    assert.equal(unauthState.allowed, false, 'Unauthenticated user must NOT be allowed into portal');
    assert.equal(unauthState.mustShowLoginGate, true, 'Mandatory login gate must be shown');

    const initState = isPortalAccessAllowed({
      currentUser: null,
      demoSession: null,
      authInitializing: true,
    });
    assert.equal(initState.allowed, false);
    assert.equal(initState.isInitializing, true);

    const authedState = isPortalAccessAllowed({
      currentUser: { uid: 'u1', email: 'teacher@seld.gos.pk' },
      demoSession: null,
      authInitializing: false,
    });
    assert.equal(authedState.allowed, true, 'Authenticated user is allowed into portal');
    assert.equal(authedState.mustShowLoginGate, false);

    assert.equal(shouldTriggerSsoLogoutFromSearch('?sso_logout=1'), true);
    assert.equal(shouldTriggerSsoLogoutFromSearch('?logged_out=true'), true);
    assert.equal(shouldTriggerSsoLogoutFromSearch('?tab=atlier'), false);
    assert.equal(sanitizeReturnPortalOrigin('javascript:alert(1)'), DEFAULT_MAIN_PORTAL_URL);

    const parsedIncoming = parseIncomingSsoSessionFromSearch(
      '?sso_email=ZulqarnainShah25%40gmail.com&sso_name=Zulqarnain+Shah&sso_uid=uid_786'
    );
    assert.equal(parsedIncoming?.email, 'zulqarnainshah25@gmail.com');
    assert.equal(parsedIncoming?.displayName, 'Zulqarnain Shah');
    assert.equal(parsedIncoming?.uid, 'uid_786');
    console.log('✅ PASS: Mandatory Login Gate & Bi-Directional Cross-Platform Logout/SSO Tests');
  }

  console.log('\n🎉 ALL UNIT & SECURITY TESTS PASSED SUCCESSFULLY!');
}

runAllUnitTests();
