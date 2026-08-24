import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { StatusBadge, PaymentBadge } from '@/components/status-badge';
import { formatRupiah, formatDateWIB } from '@/lib/utils';
import Link from 'next/link';

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const order = await prisma.order.findFirst({
    where: { id, tenantId: session.tenantId! },
    include: {
      pelanggan: true,
      outlet: true,
      tingkatLayanan: true,
      items: true,
      pembayaran: true,
      logs: { include: { user: { select: { nama: true } } }, orderBy: { createdAt: 'asc' } },
    },
  });

  if (!order) notFound();

  const totalPaid = order.pembayaran
    .filter((p) => !p.isRefund)
    .reduce((sum, p) => sum + p.nominal, 0);
  const totalRefund = order.pembayaran
    .filter((p) => p.isRefund)
    .reduce((sum, p) => sum + Math.abs(p.nominal), 0);
  const sisa = order.total - totalPaid;

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/order" className="text-sm text-primary hover:underline mb-1 inline-block">
            ← Kembali
          </Link>
          <h1 className="text-2xl font-bold text-foreground font-mono">{order.nomorOrder}</h1>
          <p className="text-sm text-muted-foreground">
            {formatDateWIB(order.createdAt)}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Outlet */}
          <div className="bg-surface border border-border rounded-lg p-4">
            <h2 className="font-semibold text-foreground mb-3">Informasi Order</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Pelanggan</p>
                <p className="font-medium">{order.pelanggan.nama}</p>
                <p className="text-xs text-muted-foreground">{order.pelanggan.nomorWa}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Outlet</p>
                <p className="font-medium">{order.outlet.nama}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tingkat Layanan</p>
                <p className="font-medium">{order.tingkatLayanan.nama}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <StatusBadge status={order.status} />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-foreground">Item Layanan</h2>
            </div>
            <div className="divide-y divide-border">
              {order.items.map((item) => (
                <div key={item.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.namaLayananSnapshot}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.qty} x {formatRupiah(item.hargaSnapshot)}
                    </p>
                    {item.catatanKondisi && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        Catatan: {item.catatanKondisi}
                      </p>
                    )}
                  </div>
                  <p className="font-semibold text-sm">{formatRupiah(item.subtotal)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payments */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-foreground">Riwayat Pembayaran</h2>
            </div>
            {order.pembayaran.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Belum ada pembayaran
              </div>
            ) : (
              <div className="divide-y divide-border">
                {order.pembayaran.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {p.isRefund ? '↩️ Refund' : p.metode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateWIB(p.dibayarAt)}
                      </p>
                    </div>
                    <p className={`font-semibold text-sm ${p.isRefund ? 'text-error' : 'text-success'}`}>
                      {p.isRefund ? '-' : '+'}{formatRupiah(Math.abs(p.nominal))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order Logs */}
          <div className="bg-surface border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-foreground">Log Status</h2>
            </div>
            <div className="divide-y divide-border">
              {order.logs.map((log) => (
                <div key={log.id} className="px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    {log.statusSebelumnya && (
                      <>
                        <StatusBadge status={log.statusSebelumnya} />
                        <span className="text-muted-foreground">→</span>
                      </>
                    )}
                    <StatusBadge status={log.statusBaru} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    oleh {log.user.nama} • {formatDateWIB(log.createdAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Summary & Actions */}
        <div className="space-y-6">
          {/* Financial Summary */}
          <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Ringkasan Pembayaran</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatRupiah(order.subtotal)}</span>
              </div>
              {order.biayaTingkat > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Biaya {order.tingkatLayanan.nama}</span>
                  <span>{formatRupiah(order.biayaTingkat)}</span>
                </div>
              )}
              {order.biayaAntarJemput > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Antar Jemput</span>
                  <span>{formatRupiah(order.biayaAntarJemput)}</span>
                </div>
              )}
              {order.diskon > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Diskon</span>
                  <span className="text-error">-{formatRupiah(order.diskon)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatRupiah(order.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Dibayar</span>
                <span className="text-success">{formatRupiah(totalPaid)}</span>
              </div>
              {totalRefund > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund</span>
                  <span className="text-error">{formatRupiah(totalRefund)}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                <span>Sisa</span>
                <span className={sisa > 0 ? 'text-warning' : 'text-success'}>
                  {formatRupiah(sisa)}
                </span>
              </div>
            </div>

            {sisa === 0 && order.status !== 'DIBATALKAN' && (
              <div className="mt-2">
                <PaymentBadge status="LUNAS" />
              </div>
            )}
            {sisa > 0 && (
              <div className="mt-2">
                <PaymentBadge status="DP" sisa={sisa} />
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-surface border border-border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-foreground">Aksi</h2>
            <div className="space-y-2">
              {order.status === 'DITERIMA' && (
                <form action={`/api/orders/${order.id}/status`} method="POST">
                  <input type="hidden" name="status" value="DIPROSES" />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary-hover text-sm"
                  >
                    Proses Order
                  </button>
                </form>
              )}
              {order.status === 'DIPROSES' && (
                <form action={`/api/orders/${order.id}/status`} method="POST">
                  <input type="hidden" name="status" value="SIAP_DIAMBIL" />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-accent text-primary-foreground font-semibold rounded-md hover:bg-accent-strong text-sm"
                  >
                    Siap Diambil
                  </button>
                </form>
              )}
              {order.status === 'SIAP_DIAMBIL' && sisa === 0 && (
                <form action={`/api/orders/${order.id}/status`} method="POST">
                  <input type="hidden" name="status" value="SELESAI" />
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-success text-primary-foreground font-semibold rounded-md hover:opacity-90 text-sm"
                  >
                    Selesaikan Order
                  </button>
                </form>
              )}
              {order.status === 'SIAP_DIAMBIL' && sisa > 0 && (
                <p className="text-xs text-warning text-center">
                  Order belum lunas. Terima sisa pembayaran terlebih dahulu.
                </p>
              )}
              <Link
                href={`/order/${order.id}/cetak`}
                className="block w-full py-2.5 bg-surface-muted border border-border text-foreground font-medium rounded-md hover:bg-surface text-sm text-center"
              >
                🖨️ Cetak Struk
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
