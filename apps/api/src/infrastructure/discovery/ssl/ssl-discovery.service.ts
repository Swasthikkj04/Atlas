import { Injectable } from '@nestjs/common';
import * as tls from 'node:tls';

import { DiscoveryModule } from '../contracts/discovery-module.interface';
import { DiscoveryCollector } from '../collector/discovery-collector.interface';

interface SocketError extends Error {
  code?: string;
}

export interface SslDiscoveryResult {
  reachable: boolean;

  supported: boolean;

  responseTimeMs: number;

  protocol?: string;

  cipher?: string;

  authorized?: boolean;

  authorizationError?: string;

  certificate?: {
    subject: string;
    issuer: string;

    validFrom: string;
    validTo: string;

    serialNumber: string;

    subjectAltName?: string;

    fingerprint256?: string;
  };

  error: string | null;
}

@Injectable()
export class SslDiscoveryService
  implements
    DiscoveryModule<SslDiscoveryResult>,
    DiscoveryCollector<SslDiscoveryResult>
{
  readonly name = 'ssl';

  async discover(
    domainName: string,
  ): Promise<SslDiscoveryResult> {
    const startedAt = Date.now();
    const timeoutMs = 10000;

    return new Promise((resolve) => {
      let isSettled = false;

      const socket = tls.connect(
        {
          host: domainName,
          port: 443,
          servername: domainName,
          rejectUnauthorized: false,
        },
        () => {
          if (isSettled) return;
          isSettled = true;

          const cert = socket.getPeerCertificate();
          const responseTimeMs = Date.now() - startedAt;

          // Check if Node trusted the certificate chain
          const authorized = socket.authorized;
          const authorizationError = socket.authorizationError
            ? String(socket.authorizationError)
            : undefined;

          resolve({
            reachable: true,
            supported: true,
            responseTimeMs,
            protocol: socket.getProtocol() ?? undefined,
            cipher: socket.getCipher()?.name,
            authorized,
            authorizationError,
            certificate: {
              subject: Array.isArray(cert.subject?.CN)
                ? cert.subject.CN.join(', ')
                : (cert.subject?.CN ?? ''),
              issuer: Array.isArray(cert.issuer?.CN)
                ? cert.issuer.CN.join(', ')
                : (cert.issuer?.CN ?? ''),
              validFrom: cert.valid_from,
              validTo: cert.valid_to,
              serialNumber: cert.serialNumber,
              subjectAltName: cert.subjectaltname,
              fingerprint256: cert.fingerprint256,
            },
            error: null,
          });

          socket.end();
        },
      );

      socket.setTimeout(timeoutMs);

      socket.on('timeout', () => {
        if (isSettled) return;
        isSettled = true;

        socket.destroy();

        resolve({
          reachable: false,
          supported: false,
          responseTimeMs: Date.now() - startedAt,
          error: 'ETIMEDOUT: Connection timed out',
        });
      });

      socket.on('error', (error: SocketError) => {
        if (isSettled) return;
        isSettled = true;

        socket.destroy();

        const errorCode = error?.code;
        const errorMessage = error instanceof Error ? error.message : String(error);
        const formattedError = errorCode ? `${errorCode}: ${errorMessage}` : errorMessage;

        // Transport/Network level connection failures
        const isNetworkFailure =
          errorCode === 'ECONNREFUSED' ||
          errorCode === 'ENOTFOUND' ||
          errorCode === 'ETIMEDOUT' ||
          errorCode === 'ECONNRESET' ||
          errorCode === 'EHOSTUNREACH' ||
          errorCode === 'ENETUNREACH';

        resolve({
          reachable: !isNetworkFailure,
          supported: false,
          responseTimeMs: Date.now() - startedAt,
          error: formattedError,
        });
      });
    });
  }

  async collect(domainName: string): Promise<SslDiscoveryResult> {
    return this.discover(domainName);
  }
}