import { Injectable } from '@nestjs/common';
import * as tls from 'node:tls';

import { DiscoveryModule } from '../contracts/discovery-module.interface';
import { DiscoveryCollector } from '../collector/discovery-collector.interface';

export interface SslDiscoveryResult {
  reachable: boolean;

  supported: boolean;

  responseTimeMs: number;

  protocol?: string;

  cipher?: string;

  certificate?: {
    subject: string;
    issuer: string;

    validFrom: string;
    validTo: string;

    serialNumber: string;
  };

  error: string | null;
}

@Injectable()
export class SslDiscoveryService
  implements DiscoveryModule<SslDiscoveryResult>, DiscoveryCollector<unknown>
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

          resolve({
            reachable: true,
            supported: true,
            responseTimeMs,
            protocol: socket.getProtocol() ?? undefined,
            cipher: socket.getCipher()?.name,
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
          error: 'TIMEOUT',
        });
      });

      socket.on('error', (error: any) => {
        if (isSettled) return;
        isSettled = true;

        socket.destroy();

        // If the connection was refused or could not resolve host, it is unreachable.
        // If it connected but failed handshaking, it's reachable but unsupported.
        const isUnreachable = 
          error?.code === 'ECONNREFUSED' || 
          error?.code === 'ENOTFOUND' || 
          error?.code === 'ETIMEDOUT';

        resolve({
          reachable: !isUnreachable,
          supported: false,
          responseTimeMs: Date.now() - startedAt,
          error: error instanceof Error ? error.message : String(error),
        });
      });
    });
  }

  async collect(domainName: string): Promise<unknown> {
    return this.discover(domainName);
  }
}