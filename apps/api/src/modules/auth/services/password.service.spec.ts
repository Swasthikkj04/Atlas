import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();

  it('should hash and verify passwords', async () => {
    const password = 'Atlas@123';

    const hash = await service.hash(password);

    expect(hash).not.toBe(password);

    const valid = await service.verify(hash, password);

    expect(valid).toBe(true);
  });
});
