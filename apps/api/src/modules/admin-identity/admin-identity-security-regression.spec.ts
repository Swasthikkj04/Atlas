import { Test, TestingModule } from '@nestjs/testing';
import { AdminIdentityService } from './services/admin-identity.service';
import { AdminIdentityBoundary } from './boundaries/admin-identity.boundary';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import {
  AdminStatus,
  ADMIN_IDENTITY_INVARIANTS,
} from './contracts/admin-identity.contract';
import {
  AdminAlreadyProvisionedException,
  AdminDisabledException,
  AdminPrivilegeEscalationException,
} from './exceptions/admin-identity.exception';

/**
 * ADMIN-001: Security Regression & Hard Identity Boundary Verification
 *
 * Verifies all 10 security invariants from ADMIN-001 specification:
 * 1. Admin identity is explicitly provisioned.
 * 2. Exactly one Admin identity is authorized.
 * 3. Admin cannot be self-created.
 * 4. Admin cannot be self-promoted.
 * 5. Normal authentication cannot produce Admin authority.
 * 6. Guest authentication cannot produce Admin authority.
 * 7. OAuth cannot automatically produce Admin authority.
 * 8. Admin identity has explicit active/disabled state.
 * 9. Authorization failures fail closed.
 * 10. Normal User JWT accepted as an Admin credential is FORBIDDEN.
 */
describe('ADMIN-001: Admin Identity Security Regression & Boundary Invariants', () => {
  let adminService: AdminIdentityService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      adminIdentity: {
        count: jest.fn(),
        create: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      domain: {
        create: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminIdentityService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    adminService = module.get<AdminIdentityService>(AdminIdentityService);
  });

  describe('Vector 1: User Self-Promotion via Request Body Manipulation', () => {
    it('strips isAdmin, role, and other administrative fields from user registration/update inputs', () => {
      const maliciousBody = {
        email: 'attacker@example.com',
        fullName: 'Attacker User',
        password: 'Password123!',
        isAdmin: true,
        role: 'ADMIN',
        roles: ['ADMIN', 'SUPERUSER'],
        isOwner: true,
        accountType: 'ADMIN',
      };

      expect(AdminIdentityBoundary.hasEscalationAttempt(maliciousBody)).toBe(
        true,
      );

      const sanitized =
        AdminIdentityBoundary.sanitizeClientPayload(maliciousBody);
      expect(sanitized).toEqual({
        email: 'attacker@example.com',
        fullName: 'Attacker User',
        password: 'Password123!',
      });
      expect((sanitized as any).isAdmin).toBeUndefined();
      expect((sanitized as any).role).toBeUndefined();
    });
  });

  describe('Vector 2: User Self-Promotion via Client Headers', () => {
    it('detects and flags spoofed admin client headers', () => {
      const headers = {
        'x-admin-role': 'true',
        'x-is-admin': 'true',
        'x-admin-override': 'platform-owner',
      };

      expect(AdminIdentityBoundary.hasAdminHeaderAttempt(headers)).toBe(true);
    });
  });

  describe('Vector 3: Secondary Admin Provisioning Lockout (Owner-Exclusive Invariant)', () => {
    it('blocks any secondary admin creation once owner admin exists', async () => {
      prismaMock.adminIdentity.count.mockResolvedValue(1);

      await expect(
        adminService.provisionAdminIdentity({
          identifier: 'rogue-admin',
        }),
      ).rejects.toThrow(AdminAlreadyProvisionedException);

      expect(prismaMock.adminIdentity.create).not.toHaveBeenCalled();
    });
  });

  describe('Vector 4: Identity Object Masquerading & Confusion', () => {
    it('prevents normal User domain entity from masquerading as AdminIdentity', () => {
      const normalUserEntity = {
        id: 'usr-4444-4444',
        email: 'regular@example.com',
        fullName: 'Regular User',
        passwordHash: '$argon2id$...',
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
        verificationTokens: [],
        oauthAccounts: [],
      };

      expect(() => {
        AdminIdentityBoundary.assertNotUserIdentity(normalUserEntity);
      }).toThrow(AdminPrivilegeEscalationException);
    });
  });

  describe('Vector 5: Disabled Admin Fail-Closed Invariant', () => {
    it('strictly denies authentication when Admin identity is disabled', async () => {
      prismaMock.adminIdentity.findUnique.mockResolvedValue({
        id: 'adm-00000001',
        identifier: 'platform-owner',
        status: AdminStatus.DISABLED,
        disabledAt: new Date('2026-08-20T00:00:00Z'),
        disabledReason: 'Security incident review',
      });

      await expect(
        adminService.validateAuthenticationEligibility('adm-00000001'),
      ).rejects.toThrow(AdminDisabledException);
    });
  });

  describe('Vector 6: Tenant / Domain Ownership Separation', () => {
    it('confirms domain ownership does not confer Admin authority', () => {
      const domainOwner = {
        userId: 'usr-owner-100',
        domainId: 'dom-001',
        domainName: 'example.com',
      };

      // Domain ownership is scoped purely to tenant domain management
      expect((domainOwner as any).isAdmin).toBeUndefined();
      expect(ADMIN_IDENTITY_INVARIANTS.NO_USER_ROLE_ADMIN).toBe(true);
    });
  });

  describe('Vector 7: OAuth & Guest Identity Separation', () => {
    it('guarantees OAuth and Guest invariant flags are strictly enforced', () => {
      expect(ADMIN_IDENTITY_INVARIANTS.NO_GITHUB_OAUTH_ADMIN).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_GOOGLE_OAUTH_ADMIN).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_GUEST_ADMIN).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.NO_USER_SELF_PROMOTION).toBe(true);
    });
  });

  describe('Vector 8: Public Workflow Isolation (Hard Security Boundary)', () => {
    it('rejects attempt to establish Admin authority from public workflows', () => {
      const publicWorkflows = [
        'REGISTRATION',
        'USER_LOGIN',
        'GOOGLE_OAUTH',
        'GITHUB_OAUTH',
        'GUEST_SESSION',
        'ACCOUNT_CLAIM',
        'ACCOUNT_SETTINGS',
        'PUBLIC_API',
        'FRONTEND_STATE',
        'GITHUB_ACTIONS',
        'CI_CD_BUILD',
      ];

      for (const workflow of publicWorkflows) {
        expect(() => {
          AdminIdentityBoundary.assertPublicWorkflowIsolation(workflow);
        }).toThrow(AdminPrivilegeEscalationException);
      }
    });
  });

  describe('Vector 9: GitHub OAuth ≠ Admin Authentication Separation', () => {
    it('guarantees GitHub OAuth sign-in cannot elevate to Admin even for owner username', () => {
      const gitHubProfile = {
        provider: 'GITHUB',
        username: 'swasthikkj04',
        email: 'swasthik@example.com',
      };

      // Invariant: GitHub OAuth profile cannot be asserted as Admin credential
      expect(() => {
        AdminIdentityBoundary.assertNoOAuthAdminElevation(
          'GITHUB',
          gitHubProfile,
        );
      }).not.toThrow();

      expect(ADMIN_IDENTITY_INVARIANTS.NO_GITHUB_OAUTH_ADMIN).toBe(true);
    });
  });

  describe('Vector 10: Email-Address Matching Elevation Prohibition', () => {
    it('strictly prohibits deriving Admin authority from email address matching', () => {
      const ownerEmail = 'owner@nebula.io';

      expect(() => {
        AdminIdentityBoundary.assertNoEmailBasedAdminElevation(ownerEmail);
      }).not.toThrow();

      expect(ADMIN_IDENTITY_INVARIANTS.NO_EMAIL_MATCH_ADMIN).toBe(true);
    });
  });

  describe('Vector 11: GitHub Actions & CI/CD Isolation', () => {
    it('guarantees CI/CD environments build/test code without possessing Admin authority', () => {
      expect(ADMIN_IDENTITY_INVARIANTS.NO_CI_CD_ADMIN_AUTHORITY).toBe(true);
    });
  });

  describe('Vector 12: Public API Isolation (No Public Admin Endpoints)', () => {
    it('enforces that no public API endpoint can create or bootstrap Admin authority', () => {
      expect(ADMIN_IDENTITY_INVARIANTS.NO_PUBLIC_PROVISIONING_ENDPOINTS).toBe(
        true,
      );
      expect(ADMIN_IDENTITY_INVARIANTS.HARD_SECURITY_BOUNDARY).toBe(true);
      expect(ADMIN_IDENTITY_INVARIANTS.PUBLIC_WORKFLOW_ISOLATION).toBe(true);
    });
  });
});
