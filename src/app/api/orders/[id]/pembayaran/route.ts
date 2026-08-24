import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/require-role';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const pembayaranSchema = z.object({
  nominal: z.number().int().min(1, 'Nominal harus lebih dari 0.'),
  metode: z.enum(['TUNAI', 'TRANSFER', 'QRIS', 'LAINNYA']),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await requireRole('OWNER', 'ADMIN', 'KASIR');

    const body = await request.json();
    const parsed = pembayaranSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 422);
    }

    const order = await prisma.order.findFirst({
      where: { id, tenantId: session.tenantId! },
    });

    if (!order) {
      return apiError('Order tidak ditemukan.', 404);
    }

    if (order.status === 'DIBATALKAN') {
      return apiError('Order sudah dibatalkan.', 422);
    }

    if (parsed.data.nominal > order.sisa) {
      return apiError(`Nominal melebihi sisa tagihan (Rp ${order.sisa.toLocaleString('id-ID')}).`, 422);
    }

    const pembayaran = await prisma.$transaction(async (tx) => {
      const newPayment = await tx.pembayaran.create({
        data: {
          tenantId: session.tenantId!,
          orderId: id,
          kasirUserId: session.userId!,
          nominal: parsed.data.nominal,
          metode: parsed.data.metode,
        },
      });

      // Update sisa
      const allPayments = await tx.pembayaran.findMany({
        where: { orderId: id, isRefund: false },
      });
      const totalPaid = allPayments.reduce((sum, p) => sum + p.nominal, 0);
      const newSisa = order.total - totalPaid;

      await tx.order.update({
        where: { id },
        data: { sisa: newSisa },
      });

      return newPayment;
    });

    return apiSuccess(pembayaran, 'Pembayaran berhasil dicatat.');
  } catch (error) {
    console.error('Add payment error:', error);
    return apiError('Gagal mencatat pembayaran.', 500);
  }
}
