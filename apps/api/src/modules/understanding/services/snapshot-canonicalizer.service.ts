import { Injectable } from '@nestjs/common';
import {
  DetectedTechnology,
  InfrastructureTopology,
  InfrastructureArchitectureBrief,
} from '../../../infrastructure/discovery/technology/contracts';
import { DiscoverySnapshot } from '../../../infrastructure/discovery/contracts/discovery-snapshot.interface';

@Injectable()
export class SnapshotCanonicalizerService {
  /**
   * Deterministically canonicalizes detected technologies into a stable JSON string.
   */
  canonicalizeTechnologies(technologies?: DetectedTechnology[]): string {
    if (!Array.isArray(technologies) || technologies.length === 0) {
      return '[]';
    }

    const sorted = [...technologies]
      .map((t) => ({
        id: t.id,
        name: t.name,
        category: String(t.category),
        confidence:
          typeof t.confidence === 'number'
            ? Number(t.confidence.toFixed(2))
            : 0.95,
        confidenceLevel: t.confidenceLevel,
        role: t.role,
        infrastructureMeaning: t.infrastructureMeaning,
        version: t.version ?? null,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    return JSON.stringify(sorted);
  }

  /**
   * Deterministically canonicalizes infrastructure topology nodes and relationships.
   */
  canonicalizeTopology(topology?: InfrastructureTopology): string {
    if (!topology) {
      return '{}';
    }

    const sortedNodes = (topology.nodes || [])
      .map((n) => ({
        id: n.id,
        name: n.name,
        category: String(n.category),
        layer: n.layer,
        role: n.role,
      }))
      .sort((a, b) => a.id.localeCompare(b.id));

    const sortedRelationships = (topology.relationships || [])
      .map((r) => ({
        source: r.sourceTechnologyId,
        target: r.targetTechnologyId,
        type: r.relationshipType,
        evidenceState: r.evidenceState,
        confidence: Number(r.confidence.toFixed(2)),
      }))
      .sort((a, b) =>
        `${a.source}:${a.type}:${a.target}`.localeCompare(
          `${b.source}:${b.type}:${b.target}`,
        ),
      );

    return JSON.stringify({
      nodes: sortedNodes,
      relationships: sortedRelationships,
    });
  }

  /**
   * Deterministically canonicalizes architecture path, layers, and known unknowns.
   */
  canonicalizeArchitecture(brief?: InfrastructureArchitectureBrief): string {
    if (!brief) {
      return '{}';
    }

    const sortedPath = (brief.architecturePath || [])
      .map((p) => ({
        hop: p.hop,
        layer: p.layer,
        technologyId: p.technologyId,
        relationshipType: p.relationshipType ?? null,
      }))
      .sort((a, b) => a.hop - b.hop);

    const sortedLayers = (brief.layers || [])
      .map((l) => ({
        layer: l.layer,
        state: l.state,
        confidenceLevel: l.confidenceLevel,
        techIds: (l.technologies || []).map((t) => t.technologyId).sort(),
      }))
      .sort((a, b) => a.layer.localeCompare(b.layer));

    const sortedIntegrations = (brief.integrations || [])
      .map((i) => i.technologyId)
      .sort();

    const sortedUnknowns = (brief.knownUnknowns || [])
      .map((u) => ({
        dimension: u.dimension,
        status: u.status,
      }))
      .sort((a, b) => a.dimension.localeCompare(b.dimension));

    return JSON.stringify({
      path: sortedPath,
      layers: sortedLayers,
      integrations: sortedIntegrations,
      unknowns: sortedUnknowns,
    });
  }

  /**
   * Deterministically canonicalizes raw discovery observations (DNS, HTTP headers, SSL).
   */
  canonicalizeEvidence(snapshot?: DiscoverySnapshot): string {
    if (!snapshot) {
      return '{}';
    }

    const dnsA = snapshot.dns?.a ? [...snapshot.dns.a].sort() : [];
    const dnsAaaa = snapshot.dns?.aaaa ? [...snapshot.dns.aaaa].sort() : [];
    const dnsCname = snapshot.dns?.cname ? [...snapshot.dns.cname].sort() : [];
    const dnsNs = snapshot.dns?.ns ? [...snapshot.dns.ns].sort() : [];

    const httpStatus = snapshot.http?.statusCode ?? 0;
    const httpHeaders: Record<string, string> = {};
    if (snapshot.http?.headers) {
      const keys = Object.keys(snapshot.http.headers).sort();
      for (const k of keys) {
        httpHeaders[k.toLowerCase()] = String(snapshot.http.headers[k]);
      }
    }

    const sslIssuer = snapshot.ssl?.certificate?.issuer ?? null;
    const sslValid = snapshot.ssl?.authorized ?? null;

    return JSON.stringify({
      dns: { a: dnsA, aaaa: dnsAaaa, cname: dnsCname, ns: dnsNs },
      http: { statusCode: httpStatus, headers: httpHeaders },
      ssl: { issuer: sslIssuer, valid: sslValid },
    });
  }
}
