export function randomEmail(prefix: string = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@atlas.local`;
}

export function randomDomain(prefix: string = 'domain'): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}.com`;
}

export function createUserDto(overrides: Record<string, any> = {}) {
  const password = overrides.password || 'SuperSecurePassword123!';
  return {
    email: randomEmail('user'),
    password,
    confirmPassword: overrides.confirmPassword ?? password,
    fullName: 'Test User',
    ...overrides,
  };
}

export function createLoginDto(
  email: string,
  password: string = 'SuperSecurePassword123!',
) {
  return {
    email,
    password,
  };
}

export function createDomainDto(overrides: Record<string, any> = {}) {
  return {
    domainName: randomDomain('monitored'),
    ...overrides,
  };
}

export function invalidDomainDto() {
  return {
    domainName: 'invalid_domain_format_with_spaces and $ymbols!',
  };
}
