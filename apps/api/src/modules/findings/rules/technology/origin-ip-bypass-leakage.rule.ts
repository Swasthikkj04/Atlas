import { Injectable } from '@nestjs/common';
import { FindingContext } from '../../contracts/finding-context.interface';
import { FindingResult } from '../../contracts/finding-result.interface';
import { FindingRule } from '../../contracts/finding-rule.interface';
import { FindingCategory } from '../../enums/finding-category.enum';
import { Severity } from '../../enums/severity.enum';
import { FindingModule } from '@prisma/client';
import { TopologyLayer } from '../../../../infrastructure/discovery/technology/contracts';

@Injectable()
export class OriginIpBypassLeakageRule implements FindingRule {
  readonly id = 'tech.origin-ip-bypass-leakage';
  readonly name = 'Origin IP Bypass & Internal Network Leakage Rule';
  readonly category = FindingCategory.TECHNOLOGY;

  async evaluate(context: FindingContext): Promise<FindingResult[]> {
    const snapshot = context.snapshot;
    const httpHeaders = snapshot.http?.headers || {};
    const headerStr = JSON.stringify(httpHeaders).toLowerCase();
    const internalIpRegex =
      /\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})\b/;

    if (internalIpRegex.test(headerStr)) {
      const match = headerStr.match(internalIpRegex)?.[0] || '10.x.x.x';
      return [
        {
          ruleId: this.id,
          module: FindingModule.TECHNOLOGY,
          title:
            'Internal Private IPv4 Address Leaked in Public Response Headers',
          description: `Internal network routing topology was exposed via response headers containing private IPv4 address ${match}.`,
          category: FindingCategory.TECHNOLOGY,
          severity: Severity.HIGH,
          confidence: 'AUTHORITATIVE',
          riskClassification: 'SECURITY_HARDENING_GAP',
          severityRationale:
            'Disclosing private origin IP addresses allows attackers to map internal RFC 1918 VPC networks and bypass perimeter firewall boundaries.',
          whatThisDoesNotProve:
            'This observation does not prove the internal host is publicly routeable; it demonstrates response header leakage from internal reverse proxies.',
          recommendations: [
            {
              title: 'Sanitize Internal Routing Headers',
              description:
                'Strip X-Forwarded-For, X-Real-IP, and Via headers containing RFC 1918 private addresses on your edge reverse proxy before returning responses.',
            },
          ],
        },
      ];
    }

    return [];
  }
}
