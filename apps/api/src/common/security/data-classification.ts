/**
 * S-08 Data Classification Engine
 *
 * Implements S08-I01, S08-I05:
 * - Authoritative taxonomy: PUBLIC, INTERNAL, SENSITIVE, SECURITY_SENSITIVE
 * - Classification registry for all persistent entity schemas and attributes
 * - Purpose limitation boundaries
 */

export type DataClassificationTier =
  'PUBLIC' | 'INTERNAL' | 'SENSITIVE' | 'SECURITY_SENSITIVE';

export type AuthorizedDataPurpose =
  | 'INFRASTRUCTURE_UNDERSTANDING'
  | 'AUTHENTICATION_AND_SESSION'
  | 'USER_PREFERENCES'
  | 'SECURITY_AUDIT_LOGGING'
  | 'ADMIN_GOVERNANCE';

export interface ClassifiedFieldDefinition {
  fieldName: string;
  tier: DataClassificationTier;
  purpose: AuthorizedDataPurpose;
  allowedPlanes: ('GX' | 'WX' | 'ADMIN')[];
  retentionDays?: number; // undefined = tied to parent entity lifecycle
  requiresAtRestEncryption?: boolean;
}

export const CANONICAL_DATA_SCHEMA_CLASSIFICATIONS: Record<
  string,
  ClassifiedFieldDefinition[]
> = {
  User: [
    {
      fieldName: 'id',
      tier: 'INTERNAL',
      purpose: 'AUTHENTICATION_AND_SESSION',
      allowedPlanes: ['WX', 'ADMIN'],
    },
    {
      fieldName: 'email',
      tier: 'SENSITIVE',
      purpose: 'AUTHENTICATION_AND_SESSION',
      allowedPlanes: ['WX', 'ADMIN'],
    },
    {
      fieldName: 'name',
      tier: 'INTERNAL',
      purpose: 'USER_PREFERENCES',
      allowedPlanes: ['WX', 'ADMIN'],
    },
    {
      fieldName: 'passwordHash',
      tier: 'SECURITY_SENSITIVE',
      purpose: 'AUTHENTICATION_AND_SESSION',
      allowedPlanes: [],
      requiresAtRestEncryption: true,
    },
    {
      fieldName: 'role',
      tier: 'INTERNAL',
      purpose: 'AUTHENTICATION_AND_SESSION',
      allowedPlanes: ['WX', 'ADMIN'],
    },
    {
      fieldName: 'createdAt',
      tier: 'INTERNAL',
      purpose: 'AUTHENTICATION_AND_SESSION',
      allowedPlanes: ['WX', 'ADMIN'],
    },
  ],
  Domain: [
    {
      fieldName: 'id',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['WX', 'ADMIN'],
    },
    {
      fieldName: 'userId',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['WX', 'ADMIN'],
    },
    {
      fieldName: 'domainName',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['WX', 'ADMIN'],
    },
    {
      fieldName: 'status',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['WX', 'ADMIN'],
    },
    {
      fieldName: 'createdAt',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['WX', 'ADMIN'],
    },
  ],
  GuestSession: [
    {
      fieldName: 'id',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['GX'],
    },
    {
      fieldName: 'domainName',
      tier: 'PUBLIC',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['GX'],
    },
    {
      fieldName: 'fingerprintHash',
      tier: 'SENSITIVE',
      purpose: 'SECURITY_AUDIT_LOGGING',
      allowedPlanes: ['GX', 'ADMIN'],
    },
    {
      fieldName: 'createdAt',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['GX'],
    },
    {
      fieldName: 'expiresAt',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['GX'],
    },
  ],
  InfrastructureFinding: [
    {
      fieldName: 'id',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['GX', 'WX', 'ADMIN'],
    },
    {
      fieldName: 'title',
      tier: 'PUBLIC',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['GX', 'WX', 'ADMIN'],
    },
    {
      fieldName: 'severity',
      tier: 'PUBLIC',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['GX', 'WX', 'ADMIN'],
    },
    {
      fieldName: 'summary',
      tier: 'PUBLIC',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['GX', 'WX', 'ADMIN'],
    },
    {
      fieldName: 'evidencePreview',
      tier: 'INTERNAL',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['WX', 'ADMIN'],
    },
    {
      fieldName: 'rawCollectorPayload',
      tier: 'SECURITY_SENSITIVE',
      purpose: 'INFRASTRUCTURE_UNDERSTANDING',
      allowedPlanes: ['WX', 'ADMIN'],
      requiresAtRestEncryption: true,
    },
  ],
};

export class DataClassificationEngine {
  /**
   * Evaluates if a given data schema and field has an explicit canonical classification.
   */
  static getFieldClassification(
    entityName: string,
    fieldName: string,
  ): ClassifiedFieldDefinition | null {
    const schema = CANONICAL_DATA_SCHEMA_CLASSIFICATIONS[entityName];
    if (!schema) return null;
    return schema.find((f) => f.fieldName === fieldName) || null;
  }

  /**
   * Asserts whether a field is authorized for disclosure to a specific plane.
   */
  static isFieldAllowedInPlane(
    entityName: string,
    fieldName: string,
    plane: 'GX' | 'WX' | 'ADMIN',
  ): boolean {
    const classification = this.getFieldClassification(entityName, fieldName);
    if (!classification) return false; // Fail closed if unclassified
    return classification.allowedPlanes.includes(plane);
  }

  /**
   * Validates purpose alignment (prevents usage for ads/unauthorized analytics).
   */
  static validatePurposeAlignment(purpose: string): {
    isValid: boolean;
    decision: 'PURPOSE_AUTHORIZED' | 'UNAUTHORIZED_PURPOSE_BLOCKED';
  } {
    const authorizedPurposes: AuthorizedDataPurpose[] = [
      'INFRASTRUCTURE_UNDERSTANDING',
      'AUTHENTICATION_AND_SESSION',
      'USER_PREFERENCES',
      'SECURITY_AUDIT_LOGGING',
      'ADMIN_GOVERNANCE',
    ];

    if (authorizedPurposes.includes(purpose as AuthorizedDataPurpose)) {
      return { isValid: true, decision: 'PURPOSE_AUTHORIZED' };
    }

    return { isValid: false, decision: 'UNAUTHORIZED_PURPOSE_BLOCKED' };
  }
}
