import { requireRole } from '@/lib/auth/require-role';
import { createTenantDb } from '@/lib/prisma-tenant';
import { checkOutletLimit } from '@/server/services/subscription-limit';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

export async function GET() {
  try {
    const session = await requireRole('OWNER', 'ADMIN', 'KASIR');
    const tenantDb = createTenantDb(session.tenantId!);

    const outlets = await tenantDb.outlet.findMany({
      where: { isAktif: true },
      orderBy: { nama: 'asc' },
    });

    return apiSuccess(outlets);
  } catch (error) {
    return apiError('Gagal memuat data outlet.', 500);
  }
}

const createOutletSchema = z.object({
  nama: z.string().min(1, 'Nama outlet wajib diisi.'),
  alamat: z.string().optional(),
  telepon: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole('OWNER');
    const tenantDb = createTenantDb(session.tenantId!);

    const body = await request.json();
    const parsed = createOutletSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 422);
    }

    // Check outlet limit
    const limit = await checkOutletLimit(session.tenantId!);
    if (!limit.allowed) {
      return apiError(
        `Batas outlet tercapai (${limit.used}/${limit.max}). Upgrade ke PRO untuk menambah outlet.`,
        403
      );
    }

    const outlet = await tenantDb.outlet.create({
      data: {
        nama: parsed.data.nama,
        alamat: parsed.data.alamat,
        telepon: parsed.data.telepon,
      },
    });

    return apiSuccess(outlet, 'Outlet berhasil ditambahkan.');
  } catch (error) {
    return apiError('Gagal menambahkan outlet.', 500);
  }
}
