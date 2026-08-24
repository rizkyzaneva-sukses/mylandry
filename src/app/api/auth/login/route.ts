import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { checkLoginRateLimit, recordLoginAttempt } from '@/lib/auth/rate-limit';
import { setSession } from '@/lib/session';
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

    // Check rate limit
    const allowed = await checkLoginRateLimit(username);
    if (!allowed) {
      return apiError(
        'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.',
        429
      );
    }

    // Find user
    const user = await prisma.user.findFirst({
      where: { username },
      include: { tenant: true },
    });

    if (!user) {
      await recordLoginAttempt(username, false);
      return apiError('Username atau password salah.', 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await recordLoginAttempt(username, false, user.tenantId);
      return apiError('Username atau password salah.', 401);
    }

    // Create session
    await setSession({
      userId: user.id,
      tenantId: user.tenantId,
      username: user.username,
      nama: user.nama,
      role: user.role,
      isLoggedIn: true,
    });

    return apiSuccess(
      {
        redirectUrl: '/dashboard',
        user: {
          id: user.id,
          nama: user.nama,
          role: user.role,
        },
      },
      'Login berhasil.'
    );
  } catch (error) {
    console.error('Login error:', error);
    return apiError('Terjadi kesalahan. Silakan coba kembali.', 500);
  }
}
