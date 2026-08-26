/**
 * Authoritative Workspace Signature Footer Contract (WX-210-F).
 *
 * Frozen signature and lockup specifications communicating Nebula's core product philosophy:
 * "Intelligence before data · Context before details · Summary before evidence"
 */

export const WORKSPACE_SIGNATURE =
  'Intelligence before data · Context before details · Summary before evidence' as const;

export const WORKSPACE_LOCKUP = {
  primary: 'NEBULA',
  secondary: 'WORKSPACE',
} as const;

export interface WorkspaceSignatureContract {
  signature: typeof WORKSPACE_SIGNATURE;
  lockup: typeof WORKSPACE_LOCKUP;
  visualInvariants: {
    small: true;
    muted: true;
    restrained: true;
    spacious: true;
    editorial: true;
    premium: true;
    static: true;
    animated: false;
  };
}

export const WORKSPACE_SIGNATURE_CONTRACT: WorkspaceSignatureContract = {
  signature: WORKSPACE_SIGNATURE,
  lockup: WORKSPACE_LOCKUP,
  visualInvariants: {
    small: true,
    muted: true,
    restrained: true,
    spacious: true,
    editorial: true,
    premium: true,
    static: true,
    animated: false,
  },
};
