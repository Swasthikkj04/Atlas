import { TestAppInstance } from './test-app.helper';
import { createUserDto } from './factories.helper';
import { API_PREFIX } from './constants';

export async function registerTestUser(
  testApp: TestAppInstance,
  userDto: Record<string, any> = createUserDto(),
) {
  const response = await testApp.request
    .post(`${API_PREFIX}/auth/register`)
    .send(userDto);

  return {
    response,
    userDto,
    body: response.body,
  };
}

export async function loginTestUser(
  testApp: TestAppInstance,
  credentials: { email: string; password?: string },
) {
  const password = credentials.password || 'SuperSecurePassword123!';
  const response = await testApp.request
    .post(`${API_PREFIX}/auth/login`)
    .send({
      email: credentials.email,
      password,
    });

  return {
    response,
    body: response.body,
    accessToken: response.body?.accessToken,
    refreshToken: response.body?.refreshToken,
  };
}

export async function getAccessToken(
  testApp: TestAppInstance,
  userDto: Record<string, any> = createUserDto(),
): Promise<{ accessToken: string; userDto: Record<string, any> }> {
  await registerTestUser(testApp, userDto);
  const loginRes = await loginTestUser(testApp, {
    email: userDto.email,
    password: userDto.password,
  });

  return {
    accessToken: loginRes.accessToken,
    userDto,
  };
}

export function authenticatedRequest(
  testApp: TestAppInstance,
  accessToken: string,
) {
  return {
    get: (url: string) =>
      testApp.request.get(url).set('Authorization', `Bearer ${accessToken}`),
    post: (url: string) =>
      testApp.request.post(url).set('Authorization', `Bearer ${accessToken}`),
    put: (url: string) =>
      testApp.request.put(url).set('Authorization', `Bearer ${accessToken}`),
    patch: (url: string) =>
      testApp.request.patch(url).set('Authorization', `Bearer ${accessToken}`),
    delete: (url: string) =>
      testApp.request.delete(url).set('Authorization', `Bearer ${accessToken}`),
  };
}
