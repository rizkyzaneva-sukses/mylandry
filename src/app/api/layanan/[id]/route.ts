import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/require-role';
import { createTenantDb } from '@/lib/prisma-tenant';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const updateSchema = z.object({
  nama: z.string().min(1).optional(),
  harga: z.number().int().min(0).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole('OWNER', 'ADMIN');
    const tenantDb = createTenantDb(session.tenantId!);

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 422);
    }

    const layanan = await tenantDb.layanan.findFirst({ where: { id, isDeleted: false } });
    if (!layanan) {
      return apiError('Layanan tidak ditemukan.', 404);
    }

    const updated = await tenantDb.layanan.update({
      where: { id },
      data: parsed.data,
    });

    return apiSuccess(updated, 'Layanan berhasil diperbarui.');
  } catch (error) {
    return apiError('Gagal memperbarui layanan.', 500);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole('OWNER', 'ADMIN');
    const tenantDb = createTenantDb(session.tenantId!);

    const layanan = await tenantDb.layanan.findFirst({ where: { id, isDeleted: false } });
    if (!layanan) {
      return apiError('Layanan tidak ditemukan.', 404);
    }

    // Soft delete
    await tenantDb.layanan.update({
      where: { id },
      data: { isDeleted: true },
    });

    return apiSuccess(null, 'Layanan berhasil dihapus.');
  } catch (error) {
    return apiError('Gagal menghapus layanan.', 500);
  }
}
