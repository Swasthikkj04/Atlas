import { Injectable } from '@nestjs/common';

import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';

@Injectable()
export class SnapshotEqualityEngine {
  isEqual(
    previous: DiscoverySnapshot,
    current: DiscoverySnapshot,
  ): boolean {
    return (
      this.isDnsEqual(previous, current) &&
      this.isSslEqual(previous, current) &&
      this.isHttpEqual(previous, current)
    );
  }

  private isDnsEqual(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
  ): boolean {
    const prevA = prev.dns?.a ? [...prev.dns.a].sort() : [];
    const currA = curr.dns?.a ? [...curr.dns.a].sort() : [];
    if (!this.areArraysEqual(prevA, currA)) {
      return false;
    }

    const prevAaaa = prev.dns?.aaaa ? [...prev.dns.aaaa].sort() : [];
    const currAaaa = curr.dns?.aaaa ? [...curr.dns.aaaa].sort() : [];
    if (!this.areArraysEqual(prevAaaa, currAaaa)) {
      return false;
    }

    return true;
  }

  private isSslEqual(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
  ): boolean {
    const prevSsl = prev.ssl;
    const currSsl = curr.ssl;

    if (prevSsl?.authorized !== currSsl?.authorized) {
      return false;
    }

    if (
      prevSsl?.certificate?.issuer !==
      currSsl?.certificate?.issuer
    ) {
      return false;
    }

    if (
      prevSsl?.certificate?.validFrom !==
      currSsl?.certificate?.validFrom
    ) {
      return false;
    }

    if (
      prevSsl?.certificate?.validTo !==
      currSsl?.certificate?.validTo
    ) {
      return false;
    }

    return true;
  }

  private isHttpEqual(
    prev: DiscoverySnapshot,
    curr: DiscoverySnapshot,
  ): boolean {
    const prevHttp = prev.http;
    const currHttp = curr.http;

    if (
      (prevHttp?.statusCode ?? null) !==
      (currHttp?.statusCode ?? null)
    ) {
      return false;
    }

    const securityHeaderKeys = [
      'server',
      'strict-transport-security',
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'referrer-policy',
    ];

    for (const key of securityHeaderKeys) {
      const prevVal = this.getHeaderValue(
        prevHttp?.headers,
        key,
      );
      const currVal = this.getHeaderValue(
        currHttp?.headers,
        key,
      );

      if (prevVal !== currVal) {
        return false;
      }
    }

    return true;
  }

  private getHeaderValue(
    headers: Record<string, string> | undefined,
    key: string,
  ): string | undefined {
    if (!headers) {
      return undefined;
    }

    const targetKey = key.toLowerCase();
    for (const [k, v] of Object.entries(headers)) {
      if (k.toLowerCase() === targetKey) {
        return v;
      }
    }

    return undefined;
  }

  private areArraysEqual(
    arr1: string[],
    arr2: string[],
  ): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }

    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }

    return true;
  }
}
