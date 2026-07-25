import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  private readonly isProduction: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // 0. Remove X-Powered-By header
    res.removeHeader('X-Powered-By');

    // 1. Strict-Transport-Security (HSTS)
    if (
      this.isProduction ||
      req.secure ||
      req.headers['x-forwarded-proto'] === 'https'
    ) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
      );
    }

    // 2. Anti-Clickjacking (X-Frame-Options)
    res.setHeader('X-Frame-Options', 'DENY');

    // 3. MIME Content Sniffing Protection
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // 4. Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 5. Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), display-capture=()',
    );

    // 6. Cross-Origin Policies
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');

    // 7. Content Security Policy (CSP)
    const isDocs = req.path.startsWith('/api/docs') || req.baseUrl.startsWith('/api/docs');
    if (this.isProduction || process.env.ENABLE_CSP === 'true') {
      if (isDocs) {
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none';",
        );
      } else {
        res.setHeader(
          'Content-Security-Policy',
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none';",
        );
      }
    }

    next();
  }
}
