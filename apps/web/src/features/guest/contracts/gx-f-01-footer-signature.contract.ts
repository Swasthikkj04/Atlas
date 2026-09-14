/**
 * GX-F-01 — Premium GX Footer Signature Contract
 *
 * Phase: Guest Experience — Global Presentation
 * Ticket: GX-F-01
 * Priority: P1 — UX / Visual Quality
 * Type: Frontend / UX / Design System
 * Status: FROZEN_GX_FOOTER_SIGNATURE_CONTRACT
 *
 * Acceptance Gate Demonstrated Truth:
 * "Conversion belongs beside demonstrated intelligence. The footer belongs to the product."
 *
 * Core Philosophy:
 * "Intelligence before data · Context before details · Summary before evidence"
 */

export const GX_F01_TICKET_ID = 'GX-F-01' as const;
export const GX_F01_PHASE = 'Guest Experience — Global Presentation' as const;
export const GX_F01_PRIORITY = 'P1' as const;
export const GX_F01_STATUS = 'FROZEN_GX_FOOTER_SIGNATURE_CONTRACT' as const;

export const GX_F01_DESIGN_GATE_STATEMENT =
  'Conversion belongs beside demonstrated intelligence. The footer belongs to the product.' as const;

export const GX_F01_PRODUCT_SIGNATURE_TITLE = 'NEBULA' as const;

export const GX_F01_PRODUCT_SIGNATURE_SUBTITLE =
  'Telemetry Engine · Ephemeral Single-Domain Inspection' as const;

export const GX_F01_PHILOSOPHY_SIGNATURE =
  'Intelligence before data · Context before details · Summary before evidence' as const;

/**
 * 1. Permanently Prohibited Elements in the GX Footer
 */
export const EXPLICITLY_PROHIBITED_FOOTER_ELEMENTS = [
  'CLAIM_WORKSPACE_CTA',
  'DUPLICATE_CONVERSION_BUTTONS',
  'NEW_DOMAIN_RESET_BUTTONS',
  'FEATURE_NAVIGATION_LINKS',
  'DOCUMENTATION_LINKS',
  'MARKETING_PROMOTIONAL_COPY',
  'SOCIAL_MEDIA_LINKS',
  'DENSE_METADATA_BLOCKS',
  'REPEATED_BADGES_CHIPS',
  'DECORATIVE_ICON_SPAM',
] as const;

/**
 * 2. Canonical Footer Signature Data Model
 */
export interface FooterSignatureModel {
  readonly brandTitle: string;
  readonly descriptor: string;
  readonly philosophySignature: string;
  readonly hasAppearanceControls: boolean;
  readonly hasDuplicateConversionCta: boolean;
}

export const CANONICAL_FOOTER_SIGNATURE_MODEL: FooterSignatureModel = {
  brandTitle: GX_F01_PRODUCT_SIGNATURE_TITLE,
  descriptor: GX_F01_PRODUCT_SIGNATURE_SUBTITLE,
  philosophySignature: GX_F01_PHILOSOPHY_SIGNATURE,
  hasAppearanceControls: true,
  hasDuplicateConversionCta: false,
};

/**
 * Helper: Returns the canonical footer signature configuration.
 */
export function getCanonicalFooterSignatureModel(): FooterSignatureModel {
  return CANONICAL_FOOTER_SIGNATURE_MODEL;
}

/**
 * Validator: Ensures the footer satisfies the quiet signature standard and contains zero conversion duplication.
 */
export function validateFooterSignatureConfig(config: {
  hasDuplicateConversionCta: boolean;
  hasPhilosophySignature: boolean;
  hasProductDescriptor: boolean;
  hasExcessiveIcons: boolean;
  hasMarketingCopy: boolean;
}): { isValid: boolean; violations: string[] } {
  const violations: string[] = [];

  if (config.hasDuplicateConversionCta) {
    violations.push('Prohibited: Footer must never contain duplicate Workspace conversion CTAs.');
  }

  if (!config.hasPhilosophySignature) {
    violations.push('Missing required philosophy signature: "Intelligence before data · Context before details · Summary before evidence".');
  }

  if (!config.hasProductDescriptor) {
    violations.push('Missing required product descriptor: "Telemetry Engine · Ephemeral Single-Domain Inspection".');
  }

  if (config.hasExcessiveIcons) {
    violations.push('Prohibited: Footer must avoid icon-per-item clutter or decorative icon spam.');
  }

  if (config.hasMarketingCopy) {
    violations.push('Prohibited: Footer must not contain marketing or promotional copy.');
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Gate Verifier: Asserts GX-F-01 Certification Gate.
 */
export function verifyGXF01CertificationGate(
  model: FooterSignatureModel
): { certified: boolean; reasons: string[] } {
  const reasons: string[] = [];

  if (model.hasDuplicateConversionCta) {
    reasons.push('Footer must not duplicate conversion actions.');
  }
  if (model.brandTitle !== GX_F01_PRODUCT_SIGNATURE_TITLE) {
    reasons.push(`Brand title must be "${GX_F01_PRODUCT_SIGNATURE_TITLE}".`);
  }
  if (model.descriptor !== GX_F01_PRODUCT_SIGNATURE_SUBTITLE) {
    reasons.push(`Descriptor must be "${GX_F01_PRODUCT_SIGNATURE_SUBTITLE}".`);
  }
  if (model.philosophySignature !== GX_F01_PHILOSOPHY_SIGNATURE) {
    reasons.push(`Philosophy signature must match "${GX_F01_PHILOSOPHY_SIGNATURE}".`);
  }

  return {
    certified: reasons.length === 0,
    reasons,
  };
}
