import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';

import { ObservationState } from '../../discovery/contracts/evidence/observation.interface';
import { CanonicalObservation } from '../contracts/canonical-observation.interface';
import { NormalizationResult } from '../contracts/normalization-result.interface';
import { Normalizer } from '../contracts/normalizer.interface';
import { CanonicalHttpObservations } from '../models/canonical-http-observation.model';

@Injectable()
export class HttpNormalizerService implements Normalizer<
  Record<string, any>,
  CanonicalHttpObservations
> {
  readonly name = 'http-normalizer';
  readonly version = '1.0.0';

  normalize(
    domainId: string,
    evidenceId: string,
    rawPayload: Record<string, any>,
  ): NormalizationResult<CanonicalHttpObservations> {
    const startedAt = Date.now();
    const normalizedAt = new Date();
    const warnings: string[] = [];
    const unknownValues: string[] = [];
    const unsupportedFields: string[] = [];

    // Step 1: Extract and lower-case raw header dictionary
    const rawHeaders = rawPayload.headers || rawPayload;
    const canonicalHeaders: Record<string, string> = {};

    if (typeof rawHeaders === 'object' && rawHeaders !== null) {
      for (const [key, val] of Object.entries(rawHeaders)) {
        const lowerKey = key.toLowerCase().trim();
        const strVal = Array.isArray(val)
          ? val
              .map((v) => String(v).trim())
              .sort()
              .join(', ')
          : String(val).trim();

        if (canonicalHeaders[lowerKey]) {
          warnings.push(`Duplicate header '${key}' merged into '${lowerKey}'`);
          canonicalHeaders[lowerKey] =
            `${canonicalHeaders[lowerKey]}, ${strVal}`;
        } else {
          canonicalHeaders[lowerKey] = strVal;
        }
      }
    } else {
      warnings.push('Raw headers payload is empty or not an object');
    }

    // Step 2: Build Canonical Observations with lineage
    const strictTransportSecurity = this.buildCanonicalObservation(
      evidenceId,
      'strict-transport-security',
      canonicalHeaders['strict-transport-security'],
      normalizedAt,
    );

    const contentSecurityPolicy = this.buildCanonicalObservation(
      evidenceId,
      'content-security-policy',
      canonicalHeaders['content-security-policy'],
      normalizedAt,
    );

    const xFrameOptions = this.buildCanonicalObservation(
      evidenceId,
      'x-frame-options',
      canonicalHeaders['x-frame-options'],
      normalizedAt,
    );

    const xContentTypeOptions = this.buildCanonicalObservation(
      evidenceId,
      'x-content-type-options',
      canonicalHeaders['x-content-type-options'],
      normalizedAt,
    );

    const referrerPolicy = this.buildCanonicalObservation(
      evidenceId,
      'referrer-policy',
      canonicalHeaders['referrer-policy'],
      normalizedAt,
    );

    const serverHeader = this.buildCanonicalObservation(
      evidenceId,
      'server',
      canonicalHeaders['server'],
      normalizedAt,
    );

    const durationMs = Date.now() - startedAt;

    return {
      domainId,
      evidenceId,
      normalizerName: this.name,
      normalizerVersion: this.version,
      normalizedAt,
      observations: {
        strictTransportSecurity,
        contentSecurityPolicy,
        xFrameOptions,
        xContentTypeOptions,
        referrerPolicy,
        serverHeader,
      },
      diagnostics: {
        warnings,
        unsupportedFields,
        partialNormalizations: [],
        unknownValues,
        executionTimeMs: durationMs,
      },
    };
  }

  private buildCanonicalObservation(
    evidenceId: string,
    headerName: string,
    rawVal: string | undefined,
    normalizedAt: Date,
  ): CanonicalObservation<string> {
    let state: ObservationState = 'MISSING';
    let value: string | undefined = undefined;
    const transformationNotes: string[] = [`Normalized key '${headerName}'`];

    if (rawVal !== undefined && rawVal !== null && rawVal.trim() !== '') {
      state = 'OBSERVED';
      value = rawVal.trim();
      transformationNotes.push(`Extracted canonical value '${value}'`);
    } else {
      transformationNotes.push(`Header '${headerName}' explicitly missing`);
    }

    const observationId = `obs-canon-${crypto
      .createHash('sha256')
      .update(`${evidenceId}:${headerName}:${value || 'MISSING'}`)
      .digest('hex')
      .slice(0, 16)}`;

    return {
      lineage: {
        observationId,
        evidenceId,
        normalizerName: this.name,
        normalizerVersion: this.version,
        normalizedAt,
        transformationNotes,
      },
      observation: {
        state,
        value,
        rawRef: evidenceId,
        observedAt: normalizedAt,
      },
    };
  }
}
