import { Injectable } from '@nestjs/common';

export interface ComponentDiff<T = any> {
  added: T[];
  removed: T[];
  modified: Array<{ item: string; before: any; after: any }>;
  unchanged: T[];
}

export interface InfrastructureChangeDiff {
  technologies: ComponentDiff<string>;
  dns: ComponentDiff<string>;
  headers: ComponentDiff<{ name: string; value: string }>;
  certificates: ComponentDiff<string>;
  assets: ComponentDiff<string>;
}

@Injectable()
export class ChangeDiffEngineService {
  computeDiff(
    previousPayload: any | null | undefined,
    currentPayload: any | null | undefined,
  ): InfrastructureChangeDiff {
    const prev = previousPayload || {};
    const curr = currentPayload || {};

    return {
      technologies: this.diffStringArrays(
        this.extractTechnologies(prev),
        this.extractTechnologies(curr),
      ),
      dns: this.diffStringArrays(
        this.extractIpAddresses(prev),
        this.extractIpAddresses(curr),
      ),
      headers: this.diffHeaders(prev.headers || {}, curr.headers || {}),
      certificates: this.diffCertificates(prev, curr),
      assets: this.diffStringArrays(
        this.extractAssets(prev),
        this.extractAssets(curr),
      ),
    };
  }

  private extractTechnologies(payload: any): string[] {
    if (!payload) return [];
    if (Array.isArray(payload.technologies)) {
      return payload.technologies.map((t: any) =>
        typeof t === 'string' ? t : t.name || String(t),
      );
    }
    return [];
  }

  private extractIpAddresses(payload: any): string[] {
    if (!payload) return [];
    const ips: string[] = [];
    if (Array.isArray(payload.ipv4Addresses)) {
      ips.push(...payload.ipv4Addresses);
    }
    if (Array.isArray(payload.ipv6Addresses)) {
      ips.push(...payload.ipv6Addresses);
    }
    if (Array.isArray(payload.dnsRecords)) {
      payload.dnsRecords.forEach((r: any) => {
        if (typeof r === 'string') ips.push(r);
        else if (r.value) ips.push(`${r.type || 'DNS'}: ${r.value}`);
      });
    }
    return Array.from(new Set(ips));
  }

  private extractAssets(payload: any): string[] {
    if (!payload) return [];
    const assets: string[] = [];
    if (payload.webServer) assets.push(`Server: ${payload.webServer}`);
    if (payload.cdn) assets.push(`CDN: ${payload.cdn}`);
    assets.push(...this.extractIpAddresses(payload));
    assets.push(...this.extractTechnologies(payload));
    return Array.from(new Set(assets));
  }

  private diffStringArrays(prevList: string[], currList: string[]): ComponentDiff<string> {
    const prevSet = new Set(prevList);
    const currSet = new Set(currList);

    const added = currList.filter((x) => !prevSet.has(x));
    const removed = prevList.filter((x) => !currSet.has(x));
    const unchanged = currList.filter((x) => prevSet.has(x));

    return {
      added,
      removed,
      modified: [],
      unchanged,
    };
  }

  private diffHeaders(
    prevHeaders: Record<string, any>,
    currHeaders: Record<string, any>,
  ): ComponentDiff<{ name: string; value: string }> {
    const prevKeys = Object.keys(prevHeaders).map((k) => k.toLowerCase());
    const currKeys = Object.keys(currHeaders).map((k) => k.toLowerCase());

    const prevMap = new Map<string, string>();
    Object.entries(prevHeaders).forEach(([k, v]) =>
      prevMap.set(k.toLowerCase(), String(v)),
    );

    const currMap = new Map<string, string>();
    Object.entries(currHeaders).forEach(([k, v]) =>
      currMap.set(k.toLowerCase(), String(v)),
    );

    const added: Array<{ name: string; value: string }> = [];
    const removed: Array<{ name: string; value: string }> = [];
    const modified: Array<{ item: string; before: any; after: any }> = [];
    const unchanged: Array<{ name: string; value: string }> = [];

    currMap.forEach((val, key) => {
      if (!prevMap.has(key)) {
        added.push({ name: key, value: val });
      } else if (prevMap.get(key) !== val) {
        modified.push({
          item: key,
          before: prevMap.get(key),
          after: val,
        });
      } else {
        unchanged.push({ name: key, value: val });
      }
    });

    prevMap.forEach((val, key) => {
      if (!currMap.has(key)) {
        removed.push({ name: key, value: val });
      }
    });

    return { added, removed, modified, unchanged };
  }

  private diffCertificates(prev: any, curr: any): ComponentDiff<string> {
    const added: string[] = [];
    const removed: string[] = [];
    const modified: Array<{ item: string; before: any; after: any }> = [];
    const unchanged: string[] = [];

    if (prev.sslValid !== undefined || curr.sslValid !== undefined) {
      if (prev.sslValid === curr.sslValid) {
        unchanged.push(`SSL Valid: ${curr.sslValid}`);
      } else {
        modified.push({
          item: 'sslValid',
          before: prev.sslValid,
          after: curr.sslValid,
        });
      }
    }

    if (prev.sslExpiresAt || curr.sslExpiresAt) {
      if (prev.sslExpiresAt === curr.sslExpiresAt) {
        unchanged.push(`SSL Expiry: ${curr.sslExpiresAt}`);
      } else {
        modified.push({
          item: 'sslExpiresAt',
          before: prev.sslExpiresAt,
          after: curr.sslExpiresAt,
        });
      }
    }

    return { added, removed, modified, unchanged };
  }
}
