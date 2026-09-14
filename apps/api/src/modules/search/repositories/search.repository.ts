import { Injectable } from '@nestjs/common';
import { Severity } from '@prisma/client';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SearchItemDto } from '../dto/search-item.dto';

export interface SearchExecutionOptions {
  type?: string;
  domainId?: string;
  severity?: string;
  timeRange?: string;
  status?: string;
  limit?: number;
}

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async executeSearch(
    userId: string,
    query: string,
    options: SearchExecutionOptions = {},
  ): Promise<SearchItemDto[]> {
    const qTerm = query.trim().toLowerCase();
    if (!qTerm) {
      return [];
    }

    const { domainId, type, severity, timeRange, limit = 20 } = options;

    // 0. Domain ownership validation if domainId is specified
    if (domainId) {
      const ownedDomain = await this.prisma.domain.findFirst({
        where: { id: domainId, userId },
        select: { id: true },
      });
      if (!ownedDomain) {
        // Enforce cross-tenant isolation: unauthorized domain scope yields zero results
        return [];
      }
    }

    const bound = Math.max(limit * 2, 20);

    // 1. Time range filter calculation
    let sinceDate: Date | undefined;
    if (timeRange) {
      const tr = timeRange.toLowerCase();
      const now = Date.now();
      if (tr === '24h' || tr === '1d') {
        sinceDate = new Date(now - 24 * 60 * 60 * 1000);
      } else if (tr === '7d' || tr === '1w') {
        sinceDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
      } else if (tr === '30d' || tr === '1m') {
        sinceDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
      }
    }

    // 2. Type filter determination
    const targetType = type ? type.toUpperCase() : undefined;
    const shouldSearchDomains =
      !targetType || targetType === 'ALL' || targetType === 'DOMAIN';
    const shouldSearchFindings =
      !targetType || targetType === 'ALL' || targetType === 'FINDING';
    const shouldSearchChanges =
      !targetType ||
      targetType === 'ALL' ||
      targetType === 'CHANGE' ||
      targetType === 'TIMELINE';
    const shouldSearchInfra =
      !targetType || targetType === 'ALL' || targetType === 'INFRASTRUCTURE';
    const shouldSearchBriefs =
      !targetType || targetType === 'ALL' || targetType === 'BRIEF';
    const shouldSearchActivity =
      !targetType || targetType === 'ALL' || targetType === 'ACTIVITY';

    // 3. Severity filter
    const severityFilter = severity
      ? (severity.toUpperCase() as Severity)
      : undefined;

    const [domains, findings, changes, snapshots, briefs, verifications] =
      await Promise.all([
        // 1. Search Domains
        shouldSearchDomains
          ? this.prisma.domain.findMany({
              where: {
                userId,
                ...(domainId ? { id: domainId } : {}),
                ...(sinceDate ? { createdAt: { gte: sinceDate } } : {}),
                domainName: { contains: qTerm, mode: 'insensitive' },
              },
              take: bound,
            })
          : Promise.resolve([] as any[]),

        // 2. Search Findings
        shouldSearchFindings
          ? this.prisma.infrastructureFinding.findMany({
              where: {
                snapshot: {
                  domain: {
                    userId,
                    ...(domainId ? { id: domainId } : {}),
                  },
                },
                ...(severityFilter ? { severity: severityFilter } : {}),
                ...(sinceDate ? { createdAt: { gte: sinceDate } } : {}),
                OR: [
                  { title: { contains: qTerm, mode: 'insensitive' } },
                  { description: { contains: qTerm, mode: 'insensitive' } },
                  { id: { contains: qTerm, mode: 'insensitive' } },
                  {
                    snapshot: {
                      domain: {
                        domainName: { contains: qTerm, mode: 'insensitive' },
                      },
                    },
                  },
                ],
              },
              include: {
                snapshot: { include: { domain: true } },
              },
              take: bound,
            })
          : Promise.resolve([] as any[]),

        // 3. Search Changes
        shouldSearchChanges
          ? this.prisma.changeHistory.findMany({
              where: {
                domain: {
                  userId,
                  ...(domainId ? { id: domainId } : {}),
                },
                ...(sinceDate ? { detectedAt: { gte: sinceDate } } : {}),
                OR: [
                  { title: { contains: qTerm, mode: 'insensitive' } },
                  { description: { contains: qTerm, mode: 'insensitive' } },
                  { id: { contains: qTerm, mode: 'insensitive' } },
                  {
                    domain: {
                      domainName: { contains: qTerm, mode: 'insensitive' },
                    },
                  },
                ],
              },
              include: { domain: true },
              take: bound,
            })
          : Promise.resolve([] as any[]),

        // 4. Search Snapshots for Infrastructure Entities
        shouldSearchInfra
          ? this.prisma.infrastructureSnapshot.findMany({
              where: {
                domain: {
                  userId,
                  ...(domainId ? { id: domainId } : {}),
                },
                ...(sinceDate ? { createdAt: { gte: sinceDate } } : {}),
              },
              orderBy: { createdAt: 'desc' },
              include: { domain: true },
              take: bound,
            })
          : Promise.resolve([] as any[]),

        // 5. Search Infrastructure Briefs
        shouldSearchBriefs
          ? this.prisma.infrastructureBrief.findMany({
              where: {
                snapshot: {
                  domain: {
                    userId,
                    ...(domainId ? { id: domainId } : {}),
                  },
                },
                ...(sinceDate ? { createdAt: { gte: sinceDate } } : {}),
                OR: [
                  { summary: { contains: qTerm, mode: 'insensitive' } },
                  { overallHealth: { contains: qTerm, mode: 'insensitive' } },
                  {
                    snapshot: {
                      domain: {
                        domainName: { contains: qTerm, mode: 'insensitive' },
                      },
                    },
                  },
                ],
              },
              include: {
                snapshot: { include: { domain: true } },
              },
              take: bound,
            })
          : Promise.resolve([] as any[]),

        // 6. Search Verifications / Activity
        shouldSearchActivity
          ? this.prisma.infrastructureVerification.findMany({
              where: {
                domain: {
                  userId,
                  ...(domainId ? { id: domainId } : {}),
                },
                ...(sinceDate ? { createdAt: { gte: sinceDate } } : {}),
              },
              include: { domain: true },
              take: bound,
            })
          : Promise.resolve([] as any[]),
      ]);

    const results: SearchItemDto[] = [];

    // Map Domains
    for (const d of domains) {
      const score = this.computeScore(
        d.domainName,
        'Monitored domain',
        qTerm,
        20,
      );
      if (score > 0) {
        results.push({
          id: d.id,
          type: 'DOMAIN',
          title: d.domainName,
          subtitle: 'Active Domain',
          description: 'Monitored domain',
          domainId: d.id,
          domainName: d.domainName,
          relevanceScore: score,
          destination: `/workspace?domainId=${d.id}`,
        });
      }
    }

    // Map Findings
    for (const f of findings) {
      const dName = f.snapshot.domain.domainName;
      const score = this.computeScore(
        f.title,
        `${f.description} ${dName}`,
        qTerm,
        10,
      );
      if (score > 0) {
        results.push({
          id: f.id,
          type: 'FINDING',
          title: f.title,
          subtitle: `${f.severity} · ${f.category}`,
          description: f.description,
          domainId: f.snapshot.domainId,
          domainName: dName,
          relevanceScore: score,
          metadata: {
            severity: f.severity,
            category: f.category,
            ruleId: f.ruleId,
          },
          destination: `/workspace?sourceType=finding&sourceId=${f.id}&domainId=${f.snapshot.domainId}`,
        });
      }
    }

    // Map Changes
    for (const c of changes) {
      const dName = c.domain.domainName;
      const score = this.computeScore(
        c.title,
        `${c.description} ${dName}`,
        qTerm,
        5,
      );
      if (score > 0) {
        results.push({
          id: c.id,
          type: 'CHANGE',
          title: c.title,
          subtitle: `${c.changeType} · ${c.module}`,
          description: c.description,
          domainId: c.domainId,
          domainName: dName,
          relevanceScore: score,
          metadata: {
            changeType: c.changeType,
            severity: c.severity,
            module: c.module,
          },
          destination: `/workspace?sourceType=change&sourceId=${c.id}&domainId=${c.domainId}`,
        });
      }
    }

    // Map Infrastructure Entities from Snapshot Payloads
    for (const s of snapshots) {
      const payload = s.payload;
      if (!payload) continue;

      const domainName = s.domain.domainName;

      // Web server
      const server = payload.http?.headers?.server;
      if (server && typeof server === 'string') {
        const score = this.computeScore(
          `Web Server (${server})`,
          `${server} ${domainName}`,
          qTerm,
          8,
        );
        if (score > 0) {
          results.push({
            id: `infra-server-${s.id}`,
            type: 'INFRASTRUCTURE',
            title: `Web Server (${server})`,
            subtitle: `Web Server · ${domainName}`,
            description: `HTTP server header reported ${server}`,
            domainId: s.domainId,
            domainName,
            relevanceScore: score,
            destination: `/workspace?view=overview&domainId=${s.domainId}`,
          });
        }
      }

      // Technologies
      const techs = payload.technology?.technologies;
      if (Array.isArray(techs)) {
        for (const t of techs) {
          if (t && t.name) {
            const score = this.computeScore(
              `Technology: ${t.name}`,
              `${t.name} ${t.categories?.join(', ') || ''} ${domainName}`,
              qTerm,
              7,
            );
            if (score > 0) {
              results.push({
                id: `infra-tech-${s.id}-${t.name}`,
                type: 'INFRASTRUCTURE',
                title: `Technology: ${t.name}`,
                subtitle: `Technology · ${domainName}`,
                description: `Detected on ${domainName}`,
                domainId: s.domainId,
                domainName,
                relevanceScore: score,
                destination: `/workspace?view=overview&domainId=${s.domainId}`,
              });
            }
          }
        }
      }

      // IP Addresses
      const ips = payload.dns?.a;
      if (Array.isArray(ips)) {
        for (const ip of ips) {
          if (typeof ip === 'string') {
            const score = this.computeScore(
              `IP Address: ${ip}`,
              `${ip} ${domainName}`,
              qTerm,
              6,
            );
            if (score > 0) {
              results.push({
                id: `infra-ip-${s.id}-${ip}`,
                type: 'INFRASTRUCTURE',
                title: `IP Address: ${ip}`,
                subtitle: `IPv4 · ${domainName}`,
                description: `DNS A record for ${domainName}`,
                domainId: s.domainId,
                domainName,
                relevanceScore: score,
                destination: `/workspace?view=overview&domainId=${s.domainId}`,
              });
            }
          }
        }
      }

      // TLS Certificate
      const sslValid = payload.ssl?.authorized;
      const certIssuer =
        payload.ssl?.certificate?.issuer?.O ||
        payload.ssl?.certificate?.issuer?.CN;
      if (certIssuer || sslValid !== undefined) {
        const tlsTitle = certIssuer
          ? `TLS Certificate: ${certIssuer}`
          : 'TLS / SSL Certificate';
        const score = this.computeScore(
          tlsTitle,
          `TLS certificate ${certIssuer || ''} ${domainName}`,
          qTerm,
          6,
        );
        if (score > 0) {
          results.push({
            id: `infra-ssl-${s.id}`,
            type: 'INFRASTRUCTURE',
            title: tlsTitle,
            subtitle: `TLS / SSL · ${domainName}`,
            description: `Valid: ${sslValid ? 'Yes' : 'No'}`,
            domainId: s.domainId,
            domainName,
            relevanceScore: score,
            destination: `/workspace?view=overview&domainId=${s.domainId}`,
          });
        }
      }
    }

    // Map Briefs
    for (const b of briefs) {
      const score = this.computeScore(b.overallHealth, b.summary, qTerm, 10);
      if (score > 0) {
        results.push({
          id: b.id,
          type: 'BRIEF',
          title: `Infrastructure Brief: ${b.overallHealth}`,
          subtitle: 'Executive Intelligence',
          description: b.summary,
          domainId: b.snapshot.domainId,
          domainName: b.snapshot.domain.domainName,
          relevanceScore: score,
          destination: `/workspace?sourceType=story&sourceId=${b.id}&domainId=${b.snapshot.domainId}`,
        });
      }
    }

    // Map Verifications / Activity
    for (const v of verifications) {
      const dName = v.domain.domainName;
      const title = `Verification: ${dName}`;
      const desc = v.changeDetected
        ? 'Infrastructure changes detected'
        : 'No infrastructure changes detected';

      const score = this.computeScore(title, desc, qTerm, 5);
      if (score > 0) {
        results.push({
          id: v.id,
          type: 'ACTIVITY',
          title,
          subtitle: 'Automated Verification',
          description: desc,
          domainId: v.domainId,
          domainName: dName,
          relevanceScore: score,
          destination: `/workspace/memory?domainId=${v.domainId}`,
        });
      }
    }

    return results;
  }

  private computeScore(
    primary: string,
    secondary: string | undefined | null,
    qTerm: string,
    typeBoost: number,
  ): number {
    const pLower = (primary || '').toLowerCase();
    const sLower = (secondary || '').toLowerCase();

    let score = 0;

    if (pLower === qTerm) {
      score += 100;
    } else if (pLower.startsWith(qTerm)) {
      score += 80;
    } else if (pLower.includes(qTerm)) {
      score += 50;
    }

    if (sLower && sLower.includes(qTerm)) {
      score += 30;
    }

    if (score > 0) {
      score += typeBoost;
    }

    return score;
  }
}
