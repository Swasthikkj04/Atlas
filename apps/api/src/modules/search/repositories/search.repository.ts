import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { SearchItemDto } from '../dto/search-item.dto';

@Injectable()
export class SearchRepository {
  constructor(private readonly prisma: PrismaService) {}

  async executeSearch(
    userId: string,
    query: string,
  ): Promise<SearchItemDto[]> {
    const qTerm = query.trim().toLowerCase();
    if (!qTerm) {
      return [];
    }

    const [domains, findings, changes, briefs, verifications] =
      await Promise.all([
        // 1. Search Domains
        this.prisma.domain.findMany({
          where: {
            userId,
            domainName: { contains: qTerm, mode: 'insensitive' },
          },
        }),

        // 2. Search Findings
        this.prisma.infrastructureFinding.findMany({
          where: {
            snapshot: { domain: { userId } },
            OR: [
              { title: { contains: qTerm, mode: 'insensitive' } },
              { description: { contains: qTerm, mode: 'insensitive' } },
            ],
          },
          include: {
            snapshot: { include: { domain: true } },
          },
        }),

        // 3. Search Timeline Changes
        this.prisma.changeHistory.findMany({
          where: {
            domain: { userId },
            OR: [
              { title: { contains: qTerm, mode: 'insensitive' } },
              { description: { contains: qTerm, mode: 'insensitive' } },
            ],
          },
          include: { domain: true },
        }),

        // 4. Search Infrastructure Briefs
        this.prisma.infrastructureBrief.findMany({
          where: {
            snapshot: { domain: { userId } },
            OR: [
              { summary: { contains: qTerm, mode: 'insensitive' } },
              { overallHealth: { contains: qTerm, mode: 'insensitive' } },
            ],
          },
          include: {
            snapshot: { include: { domain: true } },
          },
        }),

        // 5. Search Verifications / Activity
        this.prisma.infrastructureVerification.findMany({
          where: { domain: { userId } },
          include: { domain: true },
        }),
      ]);

    const results: SearchItemDto[] = [];

    // Map Domains
    for (const d of domains) {
      const score = this.computeScore(d.domainName, 'Monitored domain', qTerm, 20);
      if (score > 0) {
        results.push({
          id: d.id,
          type: 'DOMAIN',
          title: d.domainName,
          description: 'Monitored domain',
          domainName: d.domainName,
          relevanceScore: score,
        });
      }
    }

    // Map Findings
    for (const f of findings) {
      const score = this.computeScore(f.title, f.description, qTerm, 10);
      if (score > 0) {
        results.push({
          id: f.id,
          type: 'FINDING',
          title: f.title,
          description: f.description,
          domainName: f.snapshot.domain.domainName,
          relevanceScore: score,
        });
      }
    }

    // Map Timeline
    for (const c of changes) {
      const score = this.computeScore(c.title, c.description, qTerm, 5);
      if (score > 0) {
        results.push({
          id: c.id,
          type: 'TIMELINE',
          title: c.title,
          description: c.description,
          domainName: c.domain.domainName,
          relevanceScore: score,
        });
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
          description: b.summary,
          domainName: b.snapshot.domain.domainName,
          relevanceScore: score,
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
          description: desc,
          domainName: dName,
          relevanceScore: score,
        });
      }
    }

    return results;
  }

  private computeScore(
    primary: string,
    secondary: string,
    qTerm: string,
    typeBoost: number,
  ): number {
    const pLower = primary.toLowerCase();
    const sLower = secondary.toLowerCase();

    let score = 0;

    if (pLower === qTerm) {
      score += 100;
    } else if (pLower.startsWith(qTerm)) {
      score += 80;
    } else if (pLower.includes(qTerm)) {
      score += 50;
    }

    if (sLower.includes(qTerm)) {
      score += 30;
    }

    if (score > 0) {
      score += typeBoost;
    }

    return score;
  }
}
