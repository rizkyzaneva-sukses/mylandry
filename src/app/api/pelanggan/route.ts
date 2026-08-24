import { requireRole } from '@/lib/auth/require-role';
import { createTenantDb } from '@/lib/prisma-tenant';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await requireRole('OWNER', 'ADMIN', 'KASIR');
    const tenantDb = createTenantDb(session.tenantId!);

    const pelanggan = await tenantDb.pelanggan.findMany({
      orderBy: { nama: 'asc' },
    });

    return apiSuccess(pelanggan);
  } catch (error) {
    return apiError('Gagal memuat data pelanggan.', 500);
  }
}

const createPelangganSchema = z.object({
  nama: z.string().min(1, 'Nama wajib diisi.'),
  nomorWa: z.string().min(8, 'Nomor WhatsApp wajib diisi.'),
  alamat: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole('OWNER', 'ADMIN', 'KASIR');
    const tenantDb = createTenantDb(session.tenantId!);

    const body = await request.json();
    const parsed = createPelangganSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 422);
    }

    const pelanggan = await tenantDb.pelanggan.create({
      data: {
        nama: parsed.data.nama,
        nomorWa: parsed.data.nomorWa,
        alamat: parsed.data.alamat,
      },
    });

    return apiSuccess(pelanggan, 'Pelanggan berhasil ditambahkan.');
  } catch (error) {
    return apiError('Gagal menambahkan pelanggan.', 500);
  }
}
