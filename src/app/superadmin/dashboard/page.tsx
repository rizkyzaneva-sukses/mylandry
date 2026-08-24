import { getPlatformSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { formatDateWIB } from '@/lib/utils';

export default async function SuperadminDashboardPage() {
  const session = await getPlatformSession();
  if (!session.isLoggedIn) redirect('/superadmin/login');

  const [tenants, pendingInvoices, failedOutbox] = await Promise.all([
    prisma.tenant.findMany({
      include: { subscriptions: { include: { plan: true }, take: 1 } },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.invoice.count({ where: { status: 'PENDING' } }),
    prisma.pesanWaOutbox.count({ where: { status: 'GAGAL' } }),
  ]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Superadmin Dashboard</h1>
            <p className="text-sm text-muted-foreground">MyLandry Platform Administration</p>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit" className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
              Keluar
            </button>
          </form>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase">Total Tenant</p>
            <p className="text-2xl font-bold">{tenants.length}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase">Invoice Pending</p>
            <p className="text-2xl font-bold text-warning">{pendingInvoices}</p>
          </div>
          <div className="bg-surface border border-border rounded-lg p-4">
            <p className="text-xs text-muted-foreground uppercase">WA Gagal</p>
            <p className="text-2xl font-bold text-error">{failedOutbox}</p>
          </div>
        </div>

        {/* Tenant List */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold">Daftar Tenant</h2>
          </div>
          <div className="divide-y divide-border">
            {tenants.map((tenant) => {
              const sub = tenant.subscriptions[0];
              return (
                <div key={tenant.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{tenant.nama}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateWIB(tenant.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      tenant.status === 'TRIAL' ? 'bg-warning-subtle text-warning' :
                      tenant.status === 'AKTIF' ? 'bg-success-subtle text-success' :
                      'bg-error-subtle text-error'
                    }`}>
                      {tenant.status}
                    </span>
                    {sub && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {sub.plan.nama}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
