import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  Optional,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_CAPABILITIES_KEY } from '../decorators/admin-authorization.decorator';
import {
  ALL_ADMIN_CAPABILITIES,
  AdminAuthorizationAuditEvent,
  AdminCapability,
} from '../contracts/admin-authorization.contract';
import {
  AdminAuthorizationRequiredException,
  AdminCapabilityDeniedException,
  AdminForbiddenException,
} from '../exceptions/admin-authorization.exception';
import { AdminSessionService } from '../../admin-session/services/admin-session.service';
import { AdminAnomalyDetectionService } from '../../admin-audit/services/admin-anomaly-detection.service';

/**
 * ADMIN-006 & ADMIN-008: Dedicated Admin Authorization Guard with Security Hardening
 *
 * Enforces the complete defense-in-depth authorization chain for Admin APIs.
 * Tracks suspicious token probing, rejects disabled identities, and guarantees
 * zero client-authoritative privilege escalation.
 */
@Injectable()
export class AdminAuthorizationGuard implements CanActivate {
  private readonly logger = new Logger(AdminAuthorizationGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly adminSessionService: AdminSessionService,
    @Optional() private readonly anomalyService?: AdminAnomalyDetectionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const ipAddress =
      request.ip || request.headers?.['x-forwarded-for'] || 'unknown';

    // 1. Extract Bearer Token
    const authHeader = request.headers?.authorization;
    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      this.logger.warn(
        `Admin authorization failed: Missing or malformed Authorization header.`,
      );
      this.anomalyService?.recordTokenRejection(
        String(ipAddress),
        'MISSING_BEARER_HEADER',
      );
      throw new AdminAuthorizationRequiredException(
        'Bearer authorization token required for Admin access.',
      );
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      this.anomalyService?.recordTokenRejection(
        String(ipAddress),
        'EMPTY_BEARER_TOKEN',
      );
      throw new AdminAuthorizationRequiredException('Empty Bearer token.');
    }

    const userAgent = request.headers?.['user-agent'] || 'unknown';

    try {
      // 2. Validate Token & Session State (Layers 1-4)
      const adminContext = await this.adminSessionService.validateAdminToken(
        token,
        {
          ipAddress: String(ipAddress),
          userAgent: String(userAgent),
        },
      );

      // 3. Check Required Capabilities (Layer 5)
      const requiredCapabilities = this.reflector.getAllAndOverride<
        AdminCapability[]
      >(ADMIN_CAPABILITIES_KEY, [context.getHandler(), context.getClass()]);

      if (requiredCapabilities && requiredCapabilities.length > 0) {
        // Platform owner possesses all capabilities or uses scoped capabilities if specified on session context
        const grantedCapabilities = new Set(
          adminContext.capabilities && adminContext.capabilities.length > 0
            ? adminContext.capabilities
            : ALL_ADMIN_CAPABILITIES,
        );
        for (const cap of requiredCapabilities) {
          if (!grantedCapabilities.has(cap)) {
            this.logger.warn(
              `[AuditEvent: ${AdminAuthorizationAuditEvent.ADMIN_CAPABILITY_DENIED}] Admin [${adminContext.adminId}] missing required capability: ${cap}`,
            );
            throw new AdminCapabilityDeniedException(cap);
          }
        }
      }

      // 4. Attach Verified Admin Context to Request
      request.admin = adminContext;

      // 5. Emit Authorization Granted Audit Event
      this.logger.log(
        `[AuditEvent: ${AdminAuthorizationAuditEvent.ADMIN_AUTHORIZATION_GRANTED}] Admin [${adminContext.adminId}] authorized on ${request.method} ${request.url}`,
      );

      return true;
    } catch (err: any) {
      this.logger.warn(
        `[AuditEvent: ${AdminAuthorizationAuditEvent.ADMIN_AUTHORIZATION_DENIED}] Admin authorization denied on ${request.method} ${request.url}: ${err?.message}`,
      );

      this.anomalyService?.recordTokenRejection(
        String(ipAddress),
        err?.message || 'AUTHORIZATION_DENIED',
      );

      if (
        err instanceof AdminAuthorizationRequiredException ||
        err instanceof AdminCapabilityDeniedException
      ) {
        throw err;
      }

      // Fail closed with standard 401/403
      if (err?.getStatus && typeof err.getStatus === 'function') {
        throw err;
      }

      throw new AdminForbiddenException('Admin authorization failed.');
    }
  }
}
