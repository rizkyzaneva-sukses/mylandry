import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatRupiah, formatDateWIB } from '@/lib/utils';

export default async function LanggananPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: session.tenantId! },
    include: { plan: true },
    orderBy: { createdAt: 'desc' },
  });

  const plans = await prisma.plan.findMany({
    orderBy: { kode: 'asc' },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Langganan</h1>
        <p className="text-sm text-muted-foreground">Kelola paket dan billing</p>
      </div>

      {/* Current Subscription */}
      <div className="bg-surface border border-border rounded-lg p-6 mb-6">
        <h2 className="font-semibold text-foreground mb-4">Paket Saat Ini</h2>
        {subscription ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">{subscription.plan.nama}</span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                subscription.status === 'TRIAL' ? 'bg-warning-subtle text-warning' :
                subscription.status === 'AKTIF' ? 'bg-success-subtle text-success' :
                subscription.status === 'GRACE' ? 'bg-warning-subtle text-warning' :
                'bg-error-subtle text-error'
              }`}>
                {subscription.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Berlaku Sampai</p>
                <p className="font-medium">{formatDateWIB(subscription.berlakuSampai)}</p>
              </div>
              {subscription.graceSampai && (
                <div>
                  <p className="text-muted-foreground">Grace Period</p>
                  <p className="font-medium text-warning">{formatDateWIB(subscription.graceSampai)}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Tidak ada langganan aktif</p>
        )}
      </div>

      {/* Available Plans */}
      <h2 className="font-semibold text-foreground mb-4">Paket Tersedia</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-surface border border-border rounded-lg p-6">
            <h3 className="text-lg font-bold text-foreground">{plan.nama}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {plan.kode === 'FREE' ? 'Gratis selamanya' :
               plan.kode === 'PRO' ? 'Untuk bisnis yang berkembang' :
               'Sesuai kebutuhan'}
            </p>
            <div className="space-y-2 text-sm mb-4">
              <p>🏪 {plan.maxOutlet === 999 ? 'Unlimited' : plan.maxOutlet} outlet</p>
              <p>📝 {plan.maxOrderPerBulan === 999999 ? 'Unlimited' : plan.maxOrderPerBulan} order/bulan</p>
              <p>{plan.hasWaNotif ? '✅' : '❌'} Notifikasi WhatsApp</p>
              <p>{plan.hasExport ? '✅' : '❌'} Export Excel</p>
              <p>{plan.hasLaporanBulan ? '✅' : '❌'} Laporan Bulanan</p>
            </div>
            {plan.kode === 'PRO' && (
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Harga:</p>
                <p>1 bulan: {formatRupiah(plan.hargaPerBulan1)}/bulan</p>
                <p>3 bulan: {formatRupiah(plan.hargaPerBulan3)}/bulan</p>
                <p>6 bulan: {formatRupiah(plan.hargaPerBulan6)}/bulan</p>
                <p>12 bulan: {formatRupiah(plan.hargaPerBulan12)}/bulan</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
