import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';

export default async function OrderListPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const orders = await prisma.order.findMany({
    where: { tenantId: session.tenantId! },
    include: {
      pelanggan: { select: { nama: true } },
      outlet: { select: { nama: true } },
      items: true,
      pembayaran: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Daftar Order</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola semua order laundry
          </p>
        </div>
        <Link
          href="/order/baru"
          className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm"
        >
          ➕ Order Baru
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg px-4 py-16 text-center">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-muted-foreground mb-2">Belum ada order</p>
          <Link
            href="/order/baru"
            className="text-sm text-primary font-medium hover:underline"
          >
            Buat order pertama →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const totalPaid = order.pembayaran
              .filter((p) => !p.isRefund)
              .reduce((sum, p) => sum + p.nominal, 0);
            const sisa = order.total - totalPaid;

            return (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="block bg-surface border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-mono text-sm font-semibold text-foreground">
                      {order.nomorOrder}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.pelanggan.nama} • {order.outlet.nama}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    {order.items.length} item
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">
                      Rp {order.total.toLocaleString('id-ID')}
                    </p>
                    {sisa > 0 && (
                      <p className="text-xs text-warning">
                        Sisa: Rp {sisa.toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
