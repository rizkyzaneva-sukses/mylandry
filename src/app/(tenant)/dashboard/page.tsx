import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { getWIBDateComponents, formatDateWIB } from '@/lib/utils';
import { StatusBadge } from '@/components/status-badge';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const { year, month } = getWIBDateComponents();
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  startOfMonth.setTime(startOfMonth.getTime() - 7 * 60 * 60 * 1000);

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  startOfDay.setTime(startOfDay.getTime() - 7 * 60 * 60 * 1000);

  // Dashboard stats
  const [
    orderHariIni,
    siapDiambil,
    totalOmzet,
    totalPiutang,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: {
        tenantId: session.tenantId!,
        createdAt: { gte: startOfDay },
        status: { not: 'DIBATALKAN' },
      },
    }),
    prisma.order.count({
      where: {
        tenantId: session.tenantId!,
        status: 'SIAP_DIAMBIL',
      },
    }),
    prisma.pembayaran.aggregate({
      where: {
        tenantId: session.tenantId!,
        isRefund: false,
        dibayarAt: { gte: startOfMonth },
      },
      _sum: { nominal: true },
    }),
    prisma.order.aggregate({
      where: {
        tenantId: session.tenantId!,
        status: { notIn: ['DIBATALKAN', 'SELESAI'] },
      },
      _sum: { sisa: true },
    }),
    prisma.order.findMany({
      where: { tenantId: session.tenantId! },
      include: {
        pelanggan: { select: { nama: true } },
        outlet: { select: { nama: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  const omzet = totalOmzet._sum.nominal || 0;
  const piutang = totalPiutang._sum.sisa || 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ringkasan operasional hari ini
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Order Hari Ini</p>
          <p className="text-2xl font-bold text-foreground mt-1">{orderHariIni}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Siap Diambil</p>
          <p className="text-2xl font-bold text-accent-strong mt-1">{siapDiambil}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Omzet Bulan Ini</p>
          <p className="text-2xl font-bold text-success mt-1">Rp {omzet.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Piutang</p>
          <p className="text-2xl font-bold text-warning mt-1">Rp {piutang.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 mb-8">
        <Link
          href="/order/baru"
          className="px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-hover transition-colors text-sm"
        >
          ➕ Order Baru
        </Link>
        <Link
          href="/order"
          className="px-4 py-2.5 bg-surface border border-border text-foreground font-medium rounded-lg hover:bg-surface-muted transition-colors text-sm"
        >
          📋 Lihat Semua Order
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-foreground">Order Terbaru</h2>
        </div>

        {recentOrders.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-muted-foreground">Belum ada order</p>
            <Link
              href="/order/baru"
              className="inline-block mt-3 text-sm text-primary font-medium hover:underline"
            >
              Buat order pertama →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/order/${order.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-surface-muted transition-colors"
              >
                <div>
                  <p className="font-mono text-sm font-medium text-foreground">
                    {order.nomorOrder}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.pelanggan.nama} • {order.outlet.nama}
                  </p>
                </div>
                <div className="text-right">
                  <StatusBadge status={order.status} />
                  <p className="text-xs text-muted-foreground mt-1">
                    Rp {order.total.toLocaleString('id-ID')}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
