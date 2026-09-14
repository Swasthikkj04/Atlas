import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GX_R006_TICKET_ID,
  GX_R006_PHASE,
  GX_R006_STATUS,
  GX_R006_INTERACTION_FLOW,
  GX_R006_PRIMARY_ACTION_LABEL,
  GX_R006_CANONICAL_PLACEHOLDER,
  GX_R006_CALM_ERROR_INVALID,
  GX_R006_CALM_ERROR_UNRESOLVED,
  GX_R006_CERTIFICATION_GATE_STATEMENT,
  normalizeDomainInput,
  isValidDomainInput,
  DOMAIN_INPUT_STATES,
  KEYBOARD_ERGONOMICS_CONTRACT,
  GUEST_SECURITY_INVARIANTS,
  EXPLICITLY_REJECTED_DOMAIN_PATTERNS,
  validateDomainInputIntent,
  verifyGXR006CertificationGate,
} from './gx-r006-domain-input-intent.contract.ts';

describe('GX-R006: Domain Input & Intent Contract', () => {
  describe('1. Canonical Metadata & Statements', () => {
    it('defines the canonical ticket metadata and status', () => {
      assert.equal(GX_R006_TICKET_ID, 'GX-R006');
      assert.equal(GX_R006_PHASE, 'Guest Experience Redesign');
      assert.equal(GX_R006_STATUS, 'FROZEN_DOMAIN_INTENT');
    });

    it('embodies the canonical interaction flow, action label, and placeholder', () => {
      assert.equal(
        GX_R006_INTERACTION_FLOW,
        'DOMAIN → VALIDATE → UNDERSTAND → → UNDERSTANDING'
      );
      assert.equal(GX_R006_PRIMARY_ACTION_LABEL, 'Understand →');
      assert.equal(GX_R006_CANONICAL_PLACEHOLDER, 'example.com');
      assert.equal(GX_R006_CALM_ERROR_INVALID, 'Enter a valid domain.');
      assert.equal(
        GX_R006_CALM_ERROR_UNRESOLVED,
        "We couldn't understand that domain. Try another."
      );
    });

    it('passes the 🔒 GX-R006 Certification Gate with canonical statement', () => {
      const statement =
        'A guest can enter, paste, or select any standard domain notation, receive calm and accessible feedback, submit via Enter or click without duplicate submission, and cleanly transition into the Understanding state without account friction or scan vocabulary.';
      const result = verifyGXR006CertificationGate(statement);

      assert.equal(result.passed, true);
      assert.equal(result.canonicalStatement, GX_R006_CERTIFICATION_GATE_STATEMENT);
      assert.equal(result.interactionFlow, GX_R006_INTERACTION_FLOW);
      assert.equal(result.similarityRatio, 1);
    });

    it('rejects an invalid statement that treats domain input as a scan wizard', () => {
      const statement = 'A multi-step scanner wizard requiring account creation and email confirmation before scan.';
      const result = verifyGXR006CertificationGate(statement);

      assert.equal(result.passed, false);
      assert.ok(result.similarityRatio < 0.4);
    });
  });

  describe('2. Canonical Domain Normalization Engine', () => {
    it('correctly normalizes standard domains', () => {
      assert.equal(normalizeDomainInput('example.com'), 'example.com');
      assert.equal(normalizeDomainInput('Example.COM'), 'example.com');
      assert.equal(normalizeDomainInput('  stripe.com   '), 'stripe.com');
    });

    it('strips HTTP, HTTPS, trailing slashes, and paths', () => {
      assert.equal(normalizeDomainInput('https://example.com'), 'example.com');
      assert.equal(normalizeDomainInput('http://example.com/'), 'example.com');
      assert.equal(normalizeDomainInput('https://github.com/org/repo'), 'github.com');
      assert.equal(normalizeDomainInput('https://cloudflare.com/overview?src=test#section'), 'cloudflare.com');
    });

    it('strips port annotations and trailing dots', () => {
      assert.equal(normalizeDomainInput('https://example.com:8443/test'), 'example.com');
      assert.equal(normalizeDomainInput('example.com.'), 'example.com');
    });

    it('validates public FQDN syntax correctly', () => {
      assert.equal(isValidDomainInput('stripe.com'), true);
      assert.equal(isValidDomainInput('api.internal.github.com'), true);
      assert.equal(isValidDomainInput('cloudflare.co.uk'), true);

      assert.equal(isValidDomainInput(''), false);
      assert.equal(isValidDomainInput('localhost'), false);
      assert.equal(isValidDomainInput('example'), false);
      assert.equal(isValidDomainInput('http://example.com'), false); // Must be normalized first
    });
  });

  describe('3. Six Canonical Input Interaction States', () => {
    it('defines all 6 canonical interaction states in strict order', () => {
      assert.equal(DOMAIN_INPUT_STATES.length, 6);
      const states = DOMAIN_INPUT_STATES.map((s) => s.state);
      assert.deepEqual(states, [
        '01_IDLE',
        '02_FOCUSED',
        '03_ENTERING',
        '04_VALID',
        '05_INVALID',
        '06_SUBMITTING',
      ]);
    });

    it('prohibits decorative clutter and alarms across all states', () => {
      DOMAIN_INPUT_STATES.forEach((spec) => {
        assert.ok(spec.name.length > 0);
        assert.ok(spec.visualBehavior.length > 0);
        assert.ok(spec.actionAffordance.length > 0);
        assert.ok(spec.prohibitedDecorations.length >= 2);
      });
    });
  });

  describe('4. Keyboard Ergonomics Contract', () => {
    it('codifies Enter, Tab, and Escape key behaviors', () => {
      assert.equal(KEYBOARD_ERGONOMICS_CONTRACT.length, 3);
      const keys = KEYBOARD_ERGONOMICS_CONTRACT.map((k) => k.key);
      assert.deepEqual(keys, ['Enter', 'Tab', 'Escape']);

      const enter = KEYBOARD_ERGONOMICS_CONTRACT.find((k) => k.key === 'Enter')!;
      assert.ok(enter.behavior.includes('Submits'));

      const escape = KEYBOARD_ERGONOMICS_CONTRACT.find((k) => k.key === 'Escape')!;
      assert.ok(escape.behavior.includes('Does NOT unexpectedly clear'));
    });
  });

  describe('5. Security & Isolation Invariants', () => {
    it('enforces all 6 guest security and session boundary invariants', () => {
      assert.equal(GUEST_SECURITY_INVARIANTS.length, 6);
      assert.ok(GUEST_SECURITY_INVARIANTS.includes('Guest domain input cannot create a user account.'));
      assert.ok(GUEST_SECURITY_INVARIANTS.includes('Guest domain input cannot create a persistent Workspace.'));
      assert.ok(GUEST_SECURITY_INVARIANTS.includes('Guest domain input cannot access historical snapshot lineage.'));
      assert.ok(GUEST_SECURITY_INVARIANTS.includes('Guest domain input cannot access Admin endpoints or influence authorization.'));
    });
  });

  describe('6. Explicitly Rejected Domain Intent Patterns (12 Items)', () => {
    it('codifies and rejects all 12 domain intent anti-patterns', () => {
      assert.equal(EXPLICITLY_REJECTED_DOMAIN_PATTERNS.length, 12);
      assert.ok(EXPLICITLY_REJECTED_DOMAIN_PATTERNS.includes('"Scan" or "Scanner" terminology in labels, buttons, or errors'));
      assert.ok(EXPLICITLY_REJECTED_DOMAIN_PATTERNS.includes('Search-engine style mega search box with browsing filters'));
      assert.ok(EXPLICITLY_REJECTED_DOMAIN_PATTERNS.includes('Email capture or registration form before understanding starts'));
      assert.ok(EXPLICITLY_REJECTED_DOMAIN_PATTERNS.includes('Auto-submission of sample domains upon selection'));
    });
  });

  describe('7. Domain Input Intent Invariant Validators', () => {
    it('passes compliant domain input configuration', () => {
      const result = validateDomainInputIntent({
        usesCanonicalPlaceholder: true,
        normalizesProtocolsAndPaths: true,
        sampleSelectionRequiresExplicitSubmit: true,
        preventsDuplicateSubmissions: true,
        avoidsScanTerminology: true,
        preservesGuestSecurityBoundary: true,
      });

      assert.equal(result.valid, true);
      assert.equal(result.violation, undefined);
    });

    it('rejects implementation using scan terminology', () => {
      const result = validateDomainInputIntent({
        usesCanonicalPlaceholder: true,
        normalizesProtocolsAndPaths: true,
        sampleSelectionRequiresExplicitSubmit: true,
        preventsDuplicateSubmissions: true,
        avoidsScanTerminology: false,
        preservesGuestSecurityBoundary: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('The word "scan" is strictly prohibited'));
    });

    it('rejects implementation auto-submitting sample domains', () => {
      const result = validateDomainInputIntent({
        usesCanonicalPlaceholder: true,
        normalizesProtocolsAndPaths: true,
        sampleSelectionRequiresExplicitSubmit: false,
        preventsDuplicateSubmissions: true,
        avoidsScanTerminology: true,
        preservesGuestSecurityBoundary: true,
      });

      assert.equal(result.valid, false);
      assert.ok(result.violation?.includes('Selecting a sample domain must NOT auto-submit'));
    });
  });
});
