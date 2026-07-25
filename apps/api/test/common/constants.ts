export const API_PREFIX = '/api/v1';

export const DEFAULT_LIMIT = 20;

export const STANDARD_TIMEOUT = 10000;

export const TEST_USER_CREDENTIALS = {
  email: 'regression-test-user@atlas.local',
  password: 'SuperSecurePassword123!',
  fullName: 'Regression Quality Assurance',
};

export const REGEX_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const REGEX_ISO_DATE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
