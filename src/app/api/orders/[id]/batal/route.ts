import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const batalSchema = z.object({
  alasan: z.string().min(1, 'Alasan pembatalan wajib diisi.'),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Only OWNER and ADMIN can cancel
    const session = await requireRole('OWNER', 'ADMIN');

    const body = await request.json();
    const parsed = batalSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 422);
    }

    const order = await prisma.order.findFirst({
      where: { id, tenantId: session.tenantId! },
      include: { pembayaran: true },
    });

    if (!order) {
      return apiError('Order tidak ditemukan.', 404);
    }

    if (order.status === 'DIBATALKAN') {
      return apiError('Order sudah dibatalkan.', 422);
    }

    if (order.status === 'SELESAI') {
      return apiError('Order yang sudah selesai tidak dapat dibatalkan.', 422);
    }

    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id },
        data: {
          status: 'DIBATALKAN',
          catatanBatal: parsed.data.alasan,
          dibatalkanOlehId: session.userId!,
          dibatalkanAt: new Date(),
        },
      });

      // Create refund payments for any positive payments
      const positivePayments = order.pembayaran.filter((p) => !p.isRefund && p.nominal > 0);
      for (const payment of positivePayments) {
        await tx.pembayaran.create({
          data: {
            tenantId: session.tenantId!,
            orderId: id,
            kasirUserId: session.userId!,
            nominal: -payment.nominal,
            metode: payment.metode,
            isRefund: true,
          },
        });
      }

      // Update sisa to 0
      await tx.order.update({
        where: { id },
        data: { sisa: 0 },
      });

      // Create order log
      await tx.orderLog.create({
        data: {
          orderId: id,
          userId: session.userId!,
          statusSebelumnya: order.status,
          statusBaru: 'DIBATALKAN',
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId!,
          userId: session.userId!,
          aksi: 'ORDER_CANCELLED',
          detail: `Order ${order.nomorOrder} dibatalkan. Alasan: ${parsed.data.alasan}`,
        },
      });
    });

    return apiSuccess(null, 'Order berhasil dibatalkan.');
  } catch (error) {
    console.error('Cancel order error:', error);
    return apiError('Gagal membatalkan order.', 500);
  }
}
