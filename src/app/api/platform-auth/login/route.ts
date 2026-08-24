import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { setPlatformSession } from '@/lib/session';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi.'),
  password: z.string().min(1, 'Password wajib diisi.'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 422);
    }

    const { username, password } = parsed.data;

    const user = await prisma.platformUser.findUnique({
      where: { username },
    });

    if (!user) {
      return apiError('Username atau password salah.', 401);
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return apiError('Username atau password salah.', 401);
    }

    await setPlatformSession({
      userId: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      isLoggedIn: true,
    });

    return apiSuccess(
      { redirectUrl: '/superadmin/dashboard' },
      'Login berhasil.'
    );
  } catch (error) {
    console.error('Platform login error:', error);
    return apiError('Terjadi kesalahan.', 500);
  }
}
