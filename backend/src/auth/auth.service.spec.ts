import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('rechaza credenciales de un usuario inexistente', async () => {
    const prisma = { user: { findUnique: jest.fn().mockResolvedValue(null) } };
    const service = new AuthService(prisma as never, {} as never, {} as never);
    await expect(
      service.login({ email: 'missing@nexo.local', password: 'Secret123!' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
