import { Injectable } from '@nestjs/common';
import * as https from 'node:https';
import axios, { AxiosError } from 'axios';

import { DiscoveryCollector } from '../collector/discovery-collector.interface';
import { DiscoveryModule } from '../contracts/discovery-module.interface';
import { EvidenceCollector } from '../contracts/evidence-collector.interface';
import { CollectorExecutionResult } from '../contracts/evidence/collector-execution-result.interface';
import { Observation } from '../contracts/evidence/observation.interface';

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
  redirectCount: number;
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
      redirectCount: raw.redirectCount || 0,
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
    const url = target.startsWith('http') ? target : `https://${target}`;
    const evidenceId = `ev-http-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const response = await this.executeRequest(url);
      const completedAt = new Date();
      const durationMs = Date.now() - startTimeMs;

      const finalUrl = response.request?.res?.responseUrl ?? url;
      let protocol: 'http' | 'https' | null = null;
      try {
        const parsed = new URL(finalUrl);
        protocol = parsed.protocol === 'https:' ? 'https' : 'http';
      } catch {
        protocol = finalUrl.startsWith('https') ? 'https' : 'http';
      }

      const normalizedHeaders = Object.fromEntries(
        Object.entries(response.headers).map(([key, value]) => [
          key.toLowerCase(),
          Array.isArray(value) ? value.join(', ') : String(value),
        ]),
      );

      const headerString = JSON.stringify(normalizedHeaders);
      const rawPayload = {
        url,
        finalUrl,
        protocol,
        statusCode: response.status,
        headers: normalizedHeaders,
        redirects: finalUrl !== url ? [finalUrl] : [],
        redirectCount: finalUrl !== url ? 1 : 0,
        error: null,
      };

      const observations = this.buildObservations(
        normalizedHeaders,
        evidenceId,
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
      const errorMessage = axiosError.code
        ? `${axiosError.code}: ${axiosError.message}`
        : axiosError.message || 'Unknown error';

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
          url,
          finalUrl: null,
          protocol: null,
          statusCode: null,
          headers: {},
          redirects: [],
          redirectCount: 0,
          error: errorMessage,
        },
      };
    }
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

  private async executeRequest(url: string, retries = 1) {
    try {
      return await axios.get(url, {
        httpsAgent: this.httpsAgent,
        maxRedirects: 10,
        timeout: 10000,
        validateStatus: () => true,
      });
    } catch (error) {
      const axiosError = error as AxiosError;
      if (axiosError.code === 'ECONNRESET' && retries > 0) {
        return this.executeRequest(url, retries - 1);
      }
      throw error;
    }
  }
}
