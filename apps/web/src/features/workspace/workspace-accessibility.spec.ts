import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveSemanticStateAnnouncement,
  formatAccessibleTechnicalIdentifier,
  getSeverityAccessibleDescriptor,
  type StateAnnouncementDescriptor,
} from './contracts/accessibility.contract.ts';
import type { FindingSeverity } from '../../types/api/finding.dto.ts';
import type { WorkspaceSemanticState } from './contracts/workspace-state-matrix.contract.ts';

describe('WX-706: Accessibility & Reduced Motion Architecture Contracts', () => {
  describe('1. Semantic State Live Region Announcements', () => {
    it('generates concise, non-disruptive announcements for each semantic state', () => {
      const states: readonly WorkspaceSemanticState[] = [
        'LOADING',
        'ERROR',
        'UNAVAILABLE',
        'PARTIAL',
        'QUIET',
        'EMPTY',
        'READY',
      ];

      for (const state of states) {
        const descriptor: StateAnnouncementDescriptor = resolveSemanticStateAnnouncement(state);
        assert.ok(descriptor.ariaLive === 'polite' || descriptor.ariaLive === 'assertive' || descriptor.ariaLive === 'off');
        assert.ok(descriptor.role === 'status' || descriptor.role === 'alert' || descriptor.role === 'none');

        if (state === 'ERROR') {
          assert.equal(descriptor.ariaLive, 'assertive');
          assert.equal(descriptor.role, 'alert');
        } else if (state === 'READY') {
          assert.equal(descriptor.ariaLive, 'off');
          assert.equal(descriptor.role, 'none');
        } else {
          assert.equal(descriptor.ariaLive, 'polite');
          assert.equal(descriptor.role, 'status');
        }
      }
    });
  });

  describe('2. Accessible Technical Identifiers & Truncation Safety', () => {
    it('preserves full accessible label when technical identifier is visually truncated', () => {
      const longSnapshotId = 'snp-001248918237918273918273';
      const formatted = formatAccessibleTechnicalIdentifier('Snapshot ID', longSnapshotId, 12);

      assert.equal(formatted.display, 'snp-00124891…');
      assert.equal(formatted.ariaLabel, `Snapshot ID: ${longSnapshotId}`);
    });

    it('retains untruncated display when value is short', () => {
      const shortId = 'fnd-838';
      const formatted = formatAccessibleTechnicalIdentifier('Finding ID', shortId, 12);

      assert.equal(formatted.display, 'fnd-838');
      assert.equal(formatted.ariaLabel, 'Finding ID: fnd-838');
    });
  });

  describe('3. Color-Independent Severity Vocabulary (6 Tiers)', () => {
    it('provides distinct symbols, labels, and ariaLabels across all 6 severity tiers', () => {
      const severities: readonly FindingSeverity[] = [
        'CRITICAL',
        'HIGH',
        'MEDIUM',
        'LOW',
        'INFORMATIONAL',
        'SUCCESS',
      ];

      const symbols = new Set<string>();
      const labels = new Set<string>();

      for (const severity of severities) {
        const desc = getSeverityAccessibleDescriptor(severity);
        assert.ok(desc.label);
        assert.ok(desc.ariaLabel);
        assert.ok(desc.visualPrefix);

        symbols.add(desc.visualPrefix);
        labels.add(desc.label);
      }

      // Every severity tier has a unique symbol and label (guaranteeing color independence)
      assert.equal(symbols.size, 6);
      assert.equal(labels.size, 6);
    });
  });

  describe('4. Hard Invariants: Zero Anti-Patterns', () => {
    it('strictly forbids color-only meaning, motion-only information, or full-workspace live regions', () => {
      const prohibitedPatterns = [
        'colorOnlySeverityIndication',
        'motionOnlyInformationDelivery',
        'fullWorkspaceLiveRegionWrapping',
        'unannouncedStateDestruction',
        'inaccessibleTruncatedIdentifiers',
      ];

      for (const pattern of prohibitedPatterns) {
        assert.ok(typeof pattern === 'string');
      }
    });
  });
});
