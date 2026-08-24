import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/require-role';
import { createTenantDb } from '@/lib/prisma-tenant';
import { calculateOrderTotal, generateInvoiceDate } from '@/lib/order/calculate-order-total';
import { checkOrderQuota } from '@/server/services/subscription-limit';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const orderItemSchema = z.object({
  layananId: z.string().uuid(),
  qty: z.number().int().min(1),
  catatanKondisi: z.string().optional(),
});

const createOrderSchema = z.object({
  outletId: z.string().uuid(),
  pelangganId: z.string().uuid(),
  tingkatLayananId: z.string().uuid(),
  biayaAntarJemput: z.number().int().min(0).default(0),
  diskon: z.number().int().min(0).default(0),
  items: z.array(orderItemSchema).min(1, 'Minimal 1 item layanan.'),
  pembayaranAwal: z.object({
    nominal: z.number().int().min(1),
    metode: z.enum(['TUNAI', 'TRANSFER', 'QRIS', 'LAINNYA']),
  }).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireRole('OWNER', 'ADMIN', 'KASIR');
    const tenantDb = createTenantDb(session.tenantId!);

    const body = await request.json();
    const parsed = createOrderSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return apiError(firstError.message, 422);
    }

    const data = parsed.data;

    // Check order quota
    const quota = await checkOrderQuota(session.tenantId!);
    if (!quota.allowed) {
      return apiError(
        `Kuota order bulanan tercapai (${quota.used}/${quota.max}). Upgrade ke PRO untuk order unlimited.`,
        403
      );
    }

    // Get service level for fee calculation
    const tingkatLayanan = await tenantDb.tingkatLayanan.findUnique({
      where: { id: data.tingkatLayananId },
    });

    if (!tingkatLayanan) {
      return apiError('Tingkat layanan tidak ditemukan.', 422);
    }

    // Get layanan details for snapshot
    const layananIds = data.items.map((i) => i.layananId);
    const layananList = await tenantDb.layanan.findMany({
      where: { id: { in: layananIds }, isDeleted: false },
    });

    const layananMap = new Map(layananList.map((l) => [l.id, l]));

    // Build order items with snapshot
    const orderItems = data.items.map((item) => {
      const layanan = layananMap.get(item.layananId);
      if (!layanan) {
        throw new Error(`Layanan ${item.layananId} tidak ditemukan.`);
      }
      return {
        layananId: item.layananId,
        namaLayananSnapshot: layanan.nama,
        hargaSnapshot: layanan.harga,
        qty: item.qty,
        catatanKondisi: item.catatanKondisi || null,
        subtotal: layanan.harga * item.qty,
      };
    });

    // Calculate totals
    const calculation = calculateOrderTotal({
      items: orderItems.map((i) => ({ hargaSnapshot: i.hargaSnapshot, qty: i.qty })),
      feeType: tingkatLayanan.tipeBiaya,
      feeValue: tingkatLayanan.nilaiBiaya,
      biayaAntarJemput: data.biayaAntarJemput,
      diskon: data.diskon,
    });

    // Generate invoice number with retry
    const dateStr = generateInvoiceDate();
    let nomorOrder = '';
    let retries = 0;

    while (retries < 3) {
      const count = await tenantDb.order.count({
        where: {
          nomorOrder: { startsWith: `INV-${dateStr}-` },
        },
      });
      const seq = String(count + 1).padStart(3, '0');
      nomorOrder = `INV-${dateStr}-${seq}`;

      // Check uniqueness
      const existing = await prisma.order.findFirst({
        where: { tenantId: session.tenantId!, nomorOrder },
      });
      if (!existing) break;
      retries++;
    }

    if (retries >= 3) {
      return apiError('Gagal membuat nomor order. Silakan coba lagi.', 500);
    }

    // Calculate payment
    const pembayaranAwal = data.pembayaranAwal;
    const totalPembayaran = pembayaranAwal ? pembayaranAwal.nominal : 0;
    const sisa = calculation.total - totalPembayaran;

    // Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          tenantId: session.tenantId!,
          nomorOrder,
          outletId: data.outletId,
          pelangganId: data.pelangganId,
          tingkatLayananId: data.tingkatLayananId,
          status: 'DITERIMA',
          subtotal: calculation.subtotal,
          biayaTingkat: calculation.biayaTingkat,
          biayaAntarJemput: data.biayaAntarJemput,
          diskon: data.diskon,
          total: calculation.total,
          sisa,
          items: {
            create: orderItems,
          },
          logs: {
            create: {
              userId: session.userId!,
              statusBaru: 'DITERIMA',
            },
          },
        },
        include: {
          items: true,
          logs: true,
        },
      });

      // Create initial payment if provided
      if (pembayaranAwal && pembayaranAwal.nominal > 0) {
        await tx.pembayaran.create({
          data: {
            tenantId: session.tenantId!,
            orderId: newOrder.id,
            kasirUserId: session.userId!,
            nominal: pembayaranAwal.nominal,
            metode: pembayaranAwal.metode,
          },
        });
      }

      // Record event
      await tx.auditLog.create({
        data: {
          tenantId: session.tenantId!,
          userId: session.userId!,
          aksi: 'ORDER_CREATED',
          detail: `Order ${nomorOrder} created with total Rp ${calculation.total.toLocaleString('id-ID')}`,
        },
      });

      return newOrder;
    });

    return apiSuccess(
      {
        id: order.id,
        nomorOrder: order.nomorOrder,
        total: order.total,
        sisa: order.sisa,
        status: order.status,
      },
      'Order berhasil dibuat.'
    );
  } catch (error) {
    console.error('Create order error:', error);
    return apiError('Gagal membuat order. Silakan coba kembali.', 500);
  }
}

export async function GET(request: Request) {
  try {
    const session = await requireRole('OWNER', 'ADMIN', 'KASIR');
    const tenantDb = createTenantDb(session.tenantId!);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      tenantDb.order.findMany({
        where,
        include: {
          pelanggan: { select: { nama: true, nomorWa: true } },
          outlet: { select: { nama: true } },
          items: true,
          pembayaran: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      tenantDb.order.count({ where }),
    ]);

    return apiSuccess({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('List orders error:', error);
    return apiError('Gagal memuat data order.', 500);
  }
}
