import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/require-role';
import { createTenantDb } from '@/lib/prisma-tenant';
import { hashPassword } from '@/lib/auth/password';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await requireRole('OWNER', 'ADMIN');
    const tenantDb = createTenantDb(session.tenantId!);

    const users = await tenantDb.user.findMany({
      select: { id: true, nama: true, username: true, role: true },
      orderBy: { nama: 'asc' },
    });

    return apiSuccess(users);
  } catch (error) {
    return apiError('Gagal memuat data pengguna.', 500);
  }
}

const createUserSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi.'),
  username: z.string().min(3, 'Username minimal 3 karakter.'),
  password: z.string().min(8, 'Password minimal 8 karakter.'),
  role: z.enum(['ADMIN', 'KASIR']),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole('OWNER', 'ADMIN');
    const tenantDb = createTenantDb(session.tenantId!);

    const body = await request.json();
    const parsed = createUserSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 422);
    }

    // ADMIN cannot create OWNER
    if (parsed.data.role === 'OWNER' && session.role !== 'OWNER') {
      return apiError('Hanya owner yang dapat membuat akun owner.', 403);
    }

    // Check username uniqueness within tenant
    const existing = await tenantDb.user.findFirst({
      where: { username: parsed.data.username },
    });

    if (existing) {
      return apiError('Username sudah digunakan.', 422);
    }

    const passwordHash = await hashPassword(parsed.data.password);

    const user = await tenantDb.user.create({
      data: {
        nama: parsed.data.nama,
        username: parsed.data.username,
        passwordHash,
        role: parsed.data.role,
      },
      select: { id: true, nama: true, username: true, role: true },
    });

    return apiSuccess(user, 'Pengguna berhasil ditambahkan.');
  } catch (error) {
    return apiError('Gagal menambahkan pengguna.', 500);
  }
}
