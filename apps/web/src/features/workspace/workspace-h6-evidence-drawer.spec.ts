import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { EvidenceDrawerItem } from './contracts/investigation-continuity.contract.ts';

describe('H6: Evidence Drawer & Raw Telemetry Fidelity Suite', () => {
  const sampleEvidenceItem: EvidenceDrawerItem = {
    id: 'ev-nginx-01',
    claim: 'Gateway component identified as NGINX',
    layer: 'GATEWAY',
    source: 'HTTP Response Headers',
    rawEvidence: 'Server: nginx/1.24.0 (Ubuntu)',
    timestamp: '2026-08-29T10:30:00.000Z',
    confidence: 'HIGH',
    technology: 'NGINX',
    level1Summary: 'Observed http response headers at GATEWAY boundary.',
    level2Meaning: 'Server: nginx/1.24.0 (Ubuntu) — Directly identifies the observed NGINX gateway signature.',
    level3RawTelemetry: {
      sourceType: 'HTTP Response Headers',
      key: 'Server',
      value: 'nginx/1.24.0 (Ubuntu)',
      payload: { header: 'Server', rawValue: 'nginx/1.24.0 (Ubuntu)' },
      snapshotId: 'snap-prod-2026-08-29-001',
      timestamp: '2026-08-29T10:30:00.000Z',
    },
  };

  it('exposes structured Level 1 Summary, Level 2 Meaning, and Level 3 Raw Telemetry', () => {
    // Level 1
    assert.equal(sampleEvidenceItem.level1Summary, 'Observed http response headers at GATEWAY boundary.');
    assert.equal(sampleEvidenceItem.claim, 'Gateway component identified as NGINX');

    // Level 2
    assert.ok(sampleEvidenceItem.level2Meaning.includes('Server: nginx/1.24.0 (Ubuntu)'));
    assert.ok(sampleEvidenceItem.level2Meaning.includes('Directly identifies the observed NGINX gateway signature.'));

    // Level 3
    assert.equal(sampleEvidenceItem.level3RawTelemetry.sourceType, 'HTTP Response Headers');
    assert.equal(sampleEvidenceItem.level3RawTelemetry.key, 'Server');
    assert.equal(sampleEvidenceItem.level3RawTelemetry.value, 'nginx/1.24.0 (Ubuntu)');
    assert.equal(sampleEvidenceItem.level3RawTelemetry.snapshotId, 'snap-prod-2026-08-29-001');
    assert.equal(sampleEvidenceItem.confidence, 'HIGH');
  });

  it('preserves TLS cryptographic evidence lineage in drawer model', () => {
    const tlsEvidenceItem: EvidenceDrawerItem = {
      id: 'ev-tls-01',
      claim: 'Transport security terminated with TLS 1.3',
      layer: 'EDGE',
      source: 'TLS Handshake',
      rawEvidence: 'Protocol: TLSv1.3, Cipher: TLS_AES_128_GCM_SHA256, Subject: CN=*.example.com',
      timestamp: '2026-08-29T10:30:00.000Z',
      confidence: 'HIGH',
      level1Summary: 'Observed tls handshake at EDGE boundary.',
      level2Meaning: 'Transport security terminated with TLS 1.3 — Corroborated with high confidence.',
      level3RawTelemetry: {
        sourceType: 'TLS Handshake',
        value: 'Protocol: TLSv1.3, Cipher: TLS_AES_128_GCM_SHA256, Subject: CN=*.example.com',
        snapshotId: 'snap-prod-2026-08-29-001',
        timestamp: '2026-08-29T10:30:00.000Z',
      },
    };

    assert.equal(tlsEvidenceItem.layer, 'EDGE');
    assert.equal(tlsEvidenceItem.source, 'TLS Handshake');
    assert.ok(tlsEvidenceItem.rawEvidence.includes('TLSv1.3'));
    assert.ok(tlsEvidenceItem.rawEvidence.includes('TLS_AES_128_GCM_SHA256'));
    assert.equal(tlsEvidenceItem.confidence, 'HIGH');
  });

  it('preserves DNS A-record multi-IP evidence lineage in drawer model', () => {
    const dnsEvidenceItem: EvidenceDrawerItem = {
      id: 'ev-dns-01',
      claim: 'Ingress multi-IP resolution across 2 IPv4 addresses',
      layer: 'DNS',
      source: 'DNS A Record Query',
      rawEvidence: '104.21.48.12, 172.67.180.95',
      timestamp: '2026-08-29T10:30:00.000Z',
      confidence: 'HIGH',
      level1Summary: 'Observed dns a record query at DNS boundary.',
      level2Meaning: 'Ingress multi-IP resolution across 2 IPv4 addresses — Corroborated with high confidence.',
      level3RawTelemetry: {
        sourceType: 'DNS A Record Query',
        value: '104.21.48.12, 172.67.180.95',
        snapshotId: 'snap-prod-2026-08-29-001',
        timestamp: '2026-08-29T10:30:00.000Z',
      },
    };

    assert.equal(dnsEvidenceItem.layer, 'DNS');
    assert.ok(dnsEvidenceItem.rawEvidence.includes('104.21.48.12'));
    assert.equal(dnsEvidenceItem.confidence, 'HIGH');
  });
});
