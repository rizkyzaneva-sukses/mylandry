import { requireRole } from '@/lib/auth/require-role';
import { createTenantDb } from '@/lib/prisma-tenant';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET() {
  try {
    const session = await requireRole('OWNER', 'ADMIN', 'KASIR');
    const tenantDb = createTenantDb(session.tenantId!);

    const layanan = await tenantDb.layanan.findMany({
      where: { isDeleted: false },
      orderBy: { nama: 'asc' },
    });

    return apiSuccess(layanan);
  } catch (error) {
    return apiError('Gagal memuat data layanan.', 500);
  }
}
