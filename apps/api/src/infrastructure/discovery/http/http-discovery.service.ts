import { Injectable } from '@nestjs/common';
import * as https from 'node:https';
import axios, { AxiosError } from 'axios';

import { DiscoveryCollector } from '../collector/discovery-collector.interface';
import { DiscoveryModule } from '../contracts/discovery-module.interface';
import { EvidenceCollector } from '../contracts/evidence-collector.interface';
import { CollectorExecutionResult } from '../contracts/evidence/collector-execution-result.interface';
import { Observation } from '../contracts/evidence/observation.interface';

export type HttpQueryStatus =
  | 'SUCCESS'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'SSL_ERROR'
  | 'DNS_ERROR'
  | 'TOO_MANY_REDIRECTS'
  | 'FAILED';

export type HttpAuthorityType =
  | 'FINAL_HTTPS_RESPONSE'
  | 'FINAL_HTTP_RESPONSE'
  | 'REDIRECT_TERMINATED'
  | 'INCONCLUSIVE'
  | 'NONE';

export type HttpObservationConfidence =
  | 'AUTHORITATIVE'
  | 'SUPPORTED'
  | 'CONTEXTUAL'
  | 'INCONCLUSIVE'
  | 'FAILED';

export interface HttpRedirectHop {
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  location?: string;
  scheme: 'http' | 'https';
  hostname: string;
  responseTimeMs: number;
}

export interface AuthoritativeHttpResponse {
  url: string;
  statusCode: number;
  headers: Record<string, string>;
  responseTimeMs: number;
  contentType?: string;
  isHttps: boolean;
  authority: HttpAuthorityType;
  confidence: HttpObservationConfidence;
}

export interface HttpSecurityHeaderObservations extends Record<
  string,
  Observation<string>
> {
  strictTransportSecurity: Observation<string>;
  contentSecurityPolicy: Observation<string>;
  xFrameOptions: Observation<string>;
  xContentTypeOptions: Observation<string>;
  referrerPolicy: Observation<string>;
}

export interface HttpDiscoveryResult {
  reachable: boolean;
  url: string;
  finalUrl: string | null;
  protocol: 'http' | 'https' | null;
  statusCode: number | null;
  responseTimeMs: number;
  headers: Record<string, string>;
  redirects: string[];
  redirectHops: HttpRedirectHop[];
  redirectCount: number;
  finalResponse: AuthoritativeHttpResponse | null;
  queryStatus: HttpQueryStatus;
  confidence: HttpObservationConfidence;
  error: string | null;
  evidenceResult?: CollectorExecutionResult<HttpSecurityHeaderObservations>;
}

@Injectable()
export class HttpDiscoveryService
  implements
    DiscoveryModule<HttpDiscoveryResult>,
    DiscoveryCollector<HttpDiscoveryResult>,
    EvidenceCollector<HttpSecurityHeaderObservations>
{
  readonly name = 'http';
  readonly version = '1.0.0';

  private readonly httpsAgent = new https.Agent({
    keepAlive: true,
    rejectUnauthorized: false, // Allows observing self-signed/expired certs without hard network failure
  });

  async discover(domainName: string): Promise<HttpDiscoveryResult> {
    const evidenceResult = await this.collectEvidence(domainName);
    const raw = evidenceResult.rawPayload;

    return {
      reachable: evidenceResult.metadata.status === 'SUCCESS',
      url: raw.url || `https://${domainName}`,
      finalUrl: raw.finalUrl || null,
      protocol: raw.protocol || null,
      statusCode: raw.statusCode || null,
      responseTimeMs: evidenceResult.metadata.durationMs,
      headers: raw.headers || {},
      redirects: raw.redirects || [],
      redirectHops: raw.redirectHops || [],
      redirectCount: raw.redirectCount || 0,
      finalResponse: raw.finalResponse || null,
      queryStatus: raw.queryStatus || (evidenceResult.metadata.status === 'SUCCESS' ? 'SUCCESS' : 'FAILED'),
      confidence: raw.confidence || (evidenceResult.metadata.status === 'SUCCESS' ? 'AUTHORITATIVE' : 'FAILED'),
      error: raw.error || null,
      evidenceResult,
    };
  }

  async collect(domainName: string): Promise<HttpDiscoveryResult> {
    return this.discover(domainName);
  }

  async collectEvidence(
    target: string,
  ): Promise<CollectorExecutionResult<HttpSecurityHeaderObservations>> {
    const startedAt = new Date();
    const startTimeMs = Date.now();
    const initialUrl = target.startsWith('http') ? target : `http://${target}`;
    const evidenceId = `ev-http-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const { hops, finalHop, totalDurationMs } = await this.traceRedirectChain(initialUrl);
      const completedAt = new Date();

      const finalUrl = finalHop.url;
      const protocol = finalHop.scheme;
      const normalizedHeaders = finalHop.headers;

      const isHttps = finalHop.scheme === 'https';
      let authority: HttpAuthorityType = 'INCONCLUSIVE';
      if (isHttps && finalHop.statusCode >= 200 && finalHop.statusCode < 400) {
        authority = 'FINAL_HTTPS_RESPONSE';
      } else if (!isHttps && finalHop.statusCode >= 200 && finalHop.statusCode < 400) {
        authority = 'FINAL_HTTP_RESPONSE';
      } else if (finalHop.statusCode >= 300 && finalHop.statusCode < 400) {
        authority = 'REDIRECT_TERMINATED';
      }

      let confidence: HttpObservationConfidence = 'AUTHORITATIVE';
      if (finalHop.statusCode >= 400 && finalHop.statusCode < 500) {
        confidence = 'SUPPORTED';
      } else if (finalHop.statusCode >= 500) {
        confidence = 'INCONCLUSIVE';
      }

      const finalResponse: AuthoritativeHttpResponse = {
        url: finalUrl,
        statusCode: finalHop.statusCode,
        headers: normalizedHeaders,
        responseTimeMs: finalHop.responseTimeMs,
        contentType: normalizedHeaders['content-type'],
        isHttps,
        authority,
        confidence,
      };

      const rawPayload = {
        url: initialUrl,
        finalUrl,
        protocol,
        statusCode: finalHop.statusCode,
        headers: normalizedHeaders,
        redirects: hops.slice(0, -1).map((h) => h.url),
        redirectHops: hops,
        redirectCount: hops.length - 1,
        finalResponse,
        queryStatus: 'SUCCESS' as HttpQueryStatus,
        confidence,
        error: null,
      };

      const observations = this.buildObservations(
        normalizedHeaders,
        evidenceId,
        completedAt,
      );

      const headerString = JSON.stringify(normalizedHeaders);

      return {
        metadata: {
          collectorName: this.name,
          collectorVersion: this.version,
          target,
          startedAt,
          completedAt,
          durationMs: totalDurationMs,
          retryCount: 0,
          status: 'SUCCESS',
        },
        rawEvidence: {
          evidenceId,
          collectorName: this.name,
          payloadType: 'http-response-headers',
          sizeBytes: Buffer.byteLength(headerString, 'utf8'),
          capturedAt: completedAt,
        },
        observations,
        rawPayload,
      };
    } catch (error) {
      const completedAt = new Date();
      const durationMs = Date.now() - startTimeMs;
      const axiosError = error as AxiosError;

      let queryStatus: HttpQueryStatus = 'FAILED';
      let errorMessage = axiosError.message || 'Unknown HTTP error';

      if (axiosError.code === 'ECONNABORTED' || errorMessage.includes('timeout')) {
        queryStatus = 'TIMEOUT';
      } else if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'EAI_AGAIN') {
        queryStatus = 'DNS_ERROR';
      } else if (
        axiosError.code === 'ERR_TLS_CERT_ALTNAME_INVALID' ||
        axiosError.code === 'CERT_HAS_EXPIRED' ||
        axiosError.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE'
      ) {
        queryStatus = 'SSL_ERROR';
      } else if (axiosError.code === 'ECONNREFUSED' || axiosError.code === 'ECONNRESET') {
        queryStatus = 'NETWORK_ERROR';
      }

      if (axiosError.code) {
        errorMessage = `${axiosError.code}: ${errorMessage}`;
      }

      const observations = this.buildFailedObservations(
        errorMessage,
        completedAt,
      );

      return {
        metadata: {
          collectorName: this.name,
          collectorVersion: this.version,
          target,
          startedAt,
          completedAt,
          durationMs,
          retryCount: 0,
          status: 'FAILED',
        },
        rawEvidence: {
          evidenceId,
          collectorName: this.name,
          payloadType: 'http-error',
          sizeBytes: Buffer.byteLength(errorMessage, 'utf8'),
          capturedAt: completedAt,
        },
        observations,
        rawPayload: {
          url: initialUrl,
          finalUrl: null,
          protocol: null,
          statusCode: null,
          headers: {},
          redirects: [],
          redirectHops: [],
          redirectCount: 0,
          finalResponse: null,
          queryStatus,
          confidence: 'FAILED',
          error: errorMessage,
        },
      };
    }
  }

  private async traceRedirectChain(
    startUrl: string,
    maxHops = 10,
  ): Promise<{ hops: HttpRedirectHop[]; finalHop: HttpRedirectHop; totalDurationMs: number }> {
    const hops: HttpRedirectHop[] = [];
    let currentUrl = startUrl;
    const chainStartTime = Date.now();

    for (let hopIndex = 0; hopIndex < maxHops; hopIndex++) {
      const hopStartTime = Date.now();
      const response = await axios.get(currentUrl, {
        httpsAgent: this.httpsAgent,
        maxRedirects: 0, // Manual step-by-step redirect resolution
        timeout: 10000,
        validateStatus: () => true, // Accept 2xx, 3xx, 4xx, 5xx without throwing
      });

      const hopDurationMs = Date.now() - hopStartTime;
      const normalizedHeaders = Object.fromEntries(
        Object.entries(response.headers).map(([key, value]) => [
          key.toLowerCase(),
          Array.isArray(value) ? value.join(', ') : String(value),
        ]),
      );

      let parsedUrl: URL;
      try {
        parsedUrl = new URL(currentUrl);
      } catch {
        parsedUrl = new URL(`http://${currentUrl}`);
      }

      const hop: HttpRedirectHop = {
        url: currentUrl,
        statusCode: response.status,
        headers: normalizedHeaders,
        location: normalizedHeaders['location'],
        scheme: parsedUrl.protocol === 'https:' ? 'https' : 'http',
        hostname: parsedUrl.hostname,
        responseTimeMs: hopDurationMs,
      };

      hops.push(hop);

      // Check if this hop is a redirect
      const isRedirect = response.status >= 300 && response.status < 400 && hop.location;
      if (!isRedirect) {
        return {
          hops,
          finalHop: hop,
          totalDurationMs: Date.now() - chainStartTime,
        };
      }

      // Resolve relative or absolute redirect location
      try {
        currentUrl = new URL(hop.location!, currentUrl).toString();
      } catch {
        // If location is invalid, terminate redirect chain on this hop
        return {
          hops,
          finalHop: hop,
          totalDurationMs: Date.now() - chainStartTime,
        };
      }
    }

    // If max hops exceeded, return last hop
    const finalHop = hops[hops.length - 1];
    return {
      hops,
      finalHop,
      totalDurationMs: Date.now() - chainStartTime,
    };
  }

  private buildObservations(
    headers: Record<string, string>,
    rawRef: string,
    observedAt: Date,
  ): HttpSecurityHeaderObservations {
    return {
      strictTransportSecurity: this.getHeaderObservation(
        headers,
        'strict-transport-security',
        rawRef,
        observedAt,
      ),
      contentSecurityPolicy: this.getHeaderObservation(
        headers,
        'content-security-policy',
        rawRef,
        observedAt,
      ),
      xFrameOptions: this.getHeaderObservation(
        headers,
        'x-frame-options',
        rawRef,
        observedAt,
      ),
      xContentTypeOptions: this.getHeaderObservation(
        headers,
        'x-content-type-options',
        rawRef,
        observedAt,
      ),
      referrerPolicy: this.getHeaderObservation(
        headers,
        'referrer-policy',
        rawRef,
        observedAt,
      ),
    };
  }

  private getHeaderObservation(
    headers: Record<string, string>,
    headerName: string,
    rawRef: string,
    observedAt: Date,
  ): Observation<string> {
    const val = headers[headerName];
    if (val !== undefined && val !== null && val.trim() !== '') {
      return {
        state: 'OBSERVED',
        value: val,
        rawRef,
        observedAt,
      };
    }
    return {
      state: 'MISSING',
      rawRef,
      observedAt,
    };
  }

  private buildFailedObservations(
    failureReason: string,
    observedAt: Date,
  ): HttpSecurityHeaderObservations {
    const failedObs: Observation<string> = {
      state: 'FAILED',
      failureReason,
      observedAt,
    };

    return {
      strictTransportSecurity: failedObs,
      contentSecurityPolicy: failedObs,
      xFrameOptions: failedObs,
      xContentTypeOptions: failedObs,
      referrerPolicy: failedObs,
    };
  }
}
