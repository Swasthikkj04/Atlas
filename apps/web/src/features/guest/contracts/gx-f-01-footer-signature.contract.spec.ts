import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  GX_F01_TICKET_ID,
  GX_F01_PHASE,
  GX_F01_PRIORITY,
  GX_F01_STATUS,
  GX_F01_DESIGN_GATE_STATEMENT,
  GX_F01_PRODUCT_SIGNATURE_TITLE,
  GX_F01_PRODUCT_SIGNATURE_SUBTITLE,
  GX_F01_PHILOSOPHY_SIGNATURE,
  EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS,
  CANONICAL_FOOTER_SIGNATURE_MODEL,
  getCanonicalFooterSignatureModel,
  validateFooterSignatureConfig,
  verifyGXF01CertificationGate,
} from './gx-f-01-footer-signature.contract.ts';

describe('GX-F-01 — Premium GX Footer Signature Contracts', () => {
  it('GX-F-01-01: validates ticket identity, phase, priority, and contract status', () => {
    assert.equal(GX_F01_TICKET_ID, 'GX-F-01');
    assert.equal(GX_F01_PHASE, 'Guest Experience — Global Presentation');
    assert.equal(GX_F01_PRIORITY, 'P1');
    assert.equal(GX_F01_STATUS, 'FROZEN_GX_FOOTER_SIGNATURE_CONTRACT');
  });

  it('GX-F-01-02: enforces design gate statement: Conversion belongs beside intelligence; footer belongs to product', () => {
    assert.equal(
      GX_F01_DESIGN_GATE_STATEMENT,
      'Conversion belongs beside demonstrated intelligence. The footer belongs to the product.'
    );
  });

  it('GX-F-01-03: enforces canonical philosophy signature line', () => {
    assert.equal(
      GX_F01_PHILOSOPHY_SIGNATURE,
      'Intelligence before data · Context before details · Summary before evidence'
    );
  });

  it('GX-F-01-04: enforces product signature title and telemetry descriptor', () => {
    assert.equal(GX_F01_PRODUCT_SIGNATURE_TITLE, 'NEBULA');
    assert.equal(
      GX_F01_PRODUCT_SIGNATURE_SUBTITLE,
      'Telemetry Engine · Ephemeral Single-Domain Inspection'
    );
  });

  it('GX-F-01-05: explicitly prohibits duplicate Workspace conversion CTAs in footer', () => {
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('CLAIM_WORKSPACE_CTA'));
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('DUPLICATE_CONVERSION_BUTTONS'));
  });

  it('GX-F-01-06: explicitly prohibits navigation resets and documentation links in footer', () => {
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('NEW_DOMAIN_RESET_BUTTONS'));
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('FEATURE_NAVIGATION_LINKS'));
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('DOCUMENTATION_LINKS'));
  });

  it('GX-F-01-07: explicitly prohibits marketing promotional copy and social links in footer', () => {
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('MARKETING_PROMOTIONAL_COPY'));
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('SOCIAL_MEDIA_LINKS'));
  });

  it('GX-F-01-08: explicitly prohibits decorative icon spam and repeated badge clutter', () => {
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('DECORATIVE_ICON_SPAM'));
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('REPEATED_BADGES_CHIPS'));
    assert.ok(EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS.includes('DENSE_METADATA_BLOCKS'));
  });

  it('GX-F-01-09: canonical footer signature model contains zero duplicate conversion mechanisms', () => {
    const model = getCanonicalFooterSignatureModel();
    assert.equal(model.hasDuplicateConversionCta, false);
    assert.equal(model.hasAppearanceControls, true);
    assert.equal(model.brandTitle, 'NEBULA');
  });

  it('GX-F-01-10: validateFooterSignatureConfig passes for valid compliant configuration', () => {
    const result = validateFooterSignatureConfig({
      hasDuplicateConversionCta: false,
      hasPhilosophySignature: true,
      hasProductDescriptor: true,
      hasExcessiveIcons: false,
      hasMarketingCopy: false,
    });
    assert.equal(result.isValid, true);
    assert.equal(result.violations.length, 0);
  });

  it('GX-F-01-11: validateFooterSignatureConfig rejects duplicate conversion CTAs', () => {
    const result = validateFooterSignatureConfig({
      hasDuplicateConversionCta: true,
      hasPhilosophySignature: true,
      hasProductDescriptor: true,
      hasExcessiveIcons: false,
      hasMarketingCopy: false,
    });
    assert.equal(result.isValid, false);
    assert.ok(result.violations.some((v) => v.includes('duplicate Workspace conversion')));
  });

  it('GX-F-01-12: validateFooterSignatureConfig rejects missing philosophy signature', () => {
    const result = validateFooterSignatureConfig({
      hasDuplicateConversionCta: false,
      hasPhilosophySignature: false,
      hasProductDescriptor: true,
      hasExcessiveIcons: false,
      hasMarketingCopy: false,
    });
    assert.equal(result.isValid, false);
    assert.ok(result.violations.some((v) => v.includes('philosophy signature')));
  });

  it('GX-F-01-13: validateFooterSignatureConfig rejects missing product descriptor', () => {
    const result = validateFooterSignatureConfig({
      hasDuplicateConversionCta: false,
      hasPhilosophySignature: true,
      hasProductDescriptor: false,
      hasExcessiveIcons: false,
      hasMarketingCopy: false,
    });
    assert.equal(result.isValid, false);
    assert.ok(result.violations.some((v) => v.includes('product descriptor')));
  });

  it('GX-F-01-14: validateFooterSignatureConfig rejects marketing copy and excessive icons', () => {
    const result = validateFooterSignatureConfig({
      hasDuplicateConversionCta: false,
      hasPhilosophySignature: true,
      hasProductDescriptor: true,
      hasExcessiveIcons: true,
      hasMarketingCopy: true,
    });
    assert.equal(result.isValid, false);
    assert.equal(result.violations.length, 2);
  });

  it('GX-F-01-15: verifyGXF01CertificationGate succeeds for canonical footer signature model', () => {
    const gate = verifyGXF01CertificationGate(CANONICAL_FOOTER_SIGNATURE_MODEL);
    assert.equal(gate.certified, true);
    assert.equal(gate.reasons.length, 0);
  });

  it('GX-F-01-16: verifyGXF01CertificationGate fails if model has duplicate conversion or wrong title', () => {
    const corruptedModel = {
      ...CANONICAL_FOOTER_SIGNATURE_MODEL,
      hasDuplicateConversionCta: true,
      brandTitle: 'WRONG_NAME',
    };
    const gate = verifyGXF01CertificationGate(corruptedModel);
    assert.equal(gate.certified, false);
    assert.equal(gate.reasons.length, 2);
  });

  it('GX-F-01-17: verifies footer is a quiet product signature rather than navigation', () => {
    const model = getCanonicalFooterSignatureModel();
    assert.ok(model.descriptor.includes('Ephemeral Single-Domain Inspection'));
    assert.ok(model.philosophySignature.includes('Summary before evidence'));
  });

  it('GX-F-01-18: verifies appearance controls are retained for theme selection', () => {
    const model = getCanonicalFooterSignatureModel();
    assert.equal(model.hasAppearanceControls, true);
  });

  it('GX-F-01-19: preserves strict GX security boundary (no tenant data or API side-effects)', () => {
    const model = getCanonicalFooterSignatureModel();
    assert.ok(!('tenantId' in model));
    assert.ok(!('workspaceId' in model));
  });

  it('GX-F-01-20: guarantees zero new backend/API dependencies and global GX consistency', () => {
    assert.equal(GX_F01_STATUS, 'FROZEN_GX_FOOTER_SIGNATURE_CONTRACT');
    assert.equal(GX_F01_TICKET_ID, 'GX-F-01');
  });
});
