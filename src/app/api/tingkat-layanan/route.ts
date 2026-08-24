import { requireRole } from '@/lib/auth/require-role';
import { createTenantDb } from '@/lib/prisma-tenant';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET() {
  try {
    const session = await requireRole('OWNER', 'ADMIN', 'KASIR');
    const tenantDb = createTenantDb(session.tenantId!);

    const tingkat = await tenantDb.tingkatLayanan.findMany({
      where: { isAktif: true },
      orderBy: { nama: 'asc' },
    });

    return apiSuccess(tingkat);
  } catch (error) {
    return apiError('Gagal memuat data tingkat layanan.', 500);
  }
}
