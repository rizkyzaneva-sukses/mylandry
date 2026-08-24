import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const statusSchema = z.object({
  status: z.enum(['DIPROSES', 'SIAP_DIAMBIL', 'SELESAI']),
});

const STATUS_FLOW: Record<string, string> = {
  DITERIMA: 'DIPROSES',
  DIPROSES: 'SIAP_DIAMBIL',
  SIAP_DIAMBIL: 'SELESAI',
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole('OWNER', 'ADMIN', 'KASIR');

    const formData = await request.formData();
    const statusValue = formData.get('status');

    const parsed = statusSchema.safeParse({ status: statusValue });
    if (!parsed.success) {
      return apiError('Status tidak valid.', 422);
    }

    const newStatus = parsed.data.status;

    // Find order
    const order = await prisma.order.findFirst({
      where: { id, tenantId: session.tenantId! },
    });

    if (!order) {
      return apiError('Order tidak ditemukan.', 404);
    }

    // Validate status transition
    const expectedCurrent = Object.entries(STATUS_FLOW).find(([, v]) => v === newStatus)?.[0];
    if (order.status !== expectedCurrent) {
      return apiError(`Status tidak dapat diubah dari ${order.status} ke ${newStatus}.`, 422);
    }

    // Check if trying to complete with outstanding balance
    if (newStatus === 'SELESAI' && order.sisa > 0) {
      return apiError('Order belum lunas. Terima sisa pembayaran terlebih dahulu.', 422);
    }

    // Update status
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.orderLog.create({
        data: {
          orderId: id,
          userId: session.userId!,
          statusSebelumnya: order.status,
          statusBaru: newStatus,
        },
      });
    });

    return apiSuccess(null, `Status order berhasil diubah ke ${newStatus}.`);
  } catch (error) {
    console.error('Update status error:', error);
    return apiError('Gagal mengubah status order.', 500);
  }
}
