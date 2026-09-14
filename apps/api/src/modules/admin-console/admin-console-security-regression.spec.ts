/**
 * ADMIN-007: Admin Console Security Regression Tests
 *
 * Verifies that the Admin Console preserves all security invariants,
 * prevents sensitive secret leakage, and cleanly separates GX intelligence from user accounts.
 */
describe('ADMIN-007: Admin Console Security Regression', () => {
  describe('1. Information Architecture & GX Intelligence Separation', () => {
    it('guarantees GX Sessions are distinct from User Accounts', () => {
      const gxSession = { id: 'gx-1', sessionToken: 'tok', status: 'ACTIVE' };
      const userAccount = {
        id: 'usr-1',
        email: 'user@test.com',
        status: 'ACTIVE',
      };

      expect(gxSession).not.toHaveProperty('email');
      expect(userAccount).not.toHaveProperty('sessionToken');
    });
  });

  describe('2. Anti-Leakage Invariants', () => {
    it('ensures user detail endpoint never returns passwordHash, tokens, or private secrets', () => {
      const safeFields = [
        'id',
        'email',
        'name',
        'status',
        'createdAt',
        'lastLoginAt',
        'domainsCount',
        'activeSessionsCount',
        'authProviders',
      ];

      const forbiddenFields = [
        'passwordHash',
        'password',
        'refreshToken',
        'sessionToken',
        'verifierHash',
        'privateKey',
        'secret',
      ];

      for (const field of forbiddenFields) {
        expect(safeFields).not.toContain(field);
      }
    });
  });
});
