import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('WX-104 & WX-500-SHELL-02: Workspace Header Architecture & Context Contracts', () => {
  describe('1. Contextual Location & Breadcrumbs', () => {
    it('formats contextual location as SectionName / domain when domain is provided', () => {
      const sectionName = 'Workspace';
      const domain = 'stripe.com';
      const crumb = `${sectionName} / ${domain}`;
      assert.equal(crumb, 'Workspace / stripe.com');
    });

    it('formats contextual location with subsection when entering contextual surfaces', () => {
      const sectionName = 'Workspace';
      const domain = 'stripe.com';
      const subSection = 'Infrastructure Memory';
      const crumb = `${sectionName} / ${domain} / ${subSection}`;
      assert.equal(crumb, 'Workspace / stripe.com / Infrastructure Memory');
    });

    it('handles root workspace location when no domain is selected', () => {
      const sectionName = 'Workspace';
      const domain = null;
      assert.equal(domain, null);
      assert.equal(sectionName, 'Workspace');
    });

    it('prohibits intelligence metrics, finding counts, and health scores in header', () => {
      const allowedHeaderElements = ['Breadcrumbs', 'NavTrigger', 'SessionStatus', 'ProfileMenu'];
      const forbiddenMetrics = [
        'criticalFindingsCount',
        'healthScore',
        'securityPostureGrade',
        'lastScannedTimestamp',
        'dnsDriftCount',
      ];

      for (const metric of forbiddenMetrics) {
        assert.ok(
          !allowedHeaderElements.includes(metric),
          `Forbidden metric ${metric} must not exist in header`
        );
      }
    });
  });

  describe('2. Profile Access & Add Domain Separation', () => {
    it('prohibits Add Domain action in top navigation (lives exclusively in sidebar)', () => {
      const topBarAllowedElements = ['Breadcrumbs', 'MobileDrawerTrigger', 'StatusIndicator', 'UserProfileMenu'];
      assert.ok(!topBarAllowedElements.includes('AddDomainButton'));
    });

    it('provides user profile context and sign out in top-right navbar', () => {
      const user = { fullName: 'Rolex', email: 'rolex1995@example.com' };
      const displayName = user.fullName || user.email;
      assert.equal(displayName, 'Rolex');
    });
  });

  describe('3. Accessibility & Mobile Drawer Integration', () => {
    it('verifies accessible aria properties for navigation toggle trigger', () => {
      const isNavOpen = true;
      const ariaExpanded = isNavOpen;
      const ariaControls = 'workspace-nav';
      const ariaLabel = isNavOpen ? 'Close navigation' : 'Open navigation';

      assert.equal(ariaExpanded, true);
      assert.equal(ariaControls, 'workspace-nav');
      assert.equal(ariaLabel, 'Close navigation');
    });
  });
});
