import { getSession } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import { formatRupiah, formatDateWIB } from '@/lib/utils';

export default async function CetakStrukPage({ params }: { params: Promise<{ id: string }> }) {
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
      tenant: true,
    },
  });

  if (!order) notFound();

  // Check subscription for logo
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId: session.tenantId! },
    include: { plan: true },
  });

  const showLogo = subscription?.plan.logoStrukAllowed && order.tenant.logoUrl;
  const showWatermark = !subscription?.plan.logoStrukAllowed;

  const totalPaid = order.pembayaran
    .filter((p) => !p.isRefund)
    .reduce((sum, p) => sum + p.nominal, 0);
  const sisa = order.total - totalPaid;

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center py-8 px-4">
      {/* Print button */}
      <div className="no-print mb-6 flex gap-3">
        <button
          onClick={() => window.print()}
          className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-hover"
        >
          🖨️ Cetak Struk
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2.5 bg-surface border border-border text-foreground font-medium rounded-lg hover:bg-surface-muted"
        >
          ← Kembali
        </button>
      </div>

      {/* Thermal Receipt */}
      <div className="bg-white w-[58mm] p-3 font-mono text-xs shadow-lg" id="receipt">
        {/* Header */}
        {showLogo && (
          <div className="text-center mb-2">
            <img src={order.tenant.logoUrl!} alt="Logo" className="w-12 h-12 mx-auto object-contain" />
          </div>
        )}
        <div className="text-center border-b border-dashed border-black pb-2 mb-2">
          <p className="font-bold text-sm">{order.tenant.nama}</p>
          <p className="text-[10px]">{order.outlet.nama}</p>
        </div>

        {/* Order Info */}
        <div className="mb-2">
          <p>No: {order.nomorOrder}</p>
          <p>Tgl: {formatDateWIB(order.createdAt)}</p>
          <p>Pelanggan: {order.pelanggan.nama}</p>
        </div>

        {/* Items */}
        <div className="border-t border-dashed border-black pt-2 mb-2">
          {order.items.map((item, i) => (
            <div key={i} className="mb-1">
              <div className="flex justify-between">
                <span className="flex-1">{item.namaLayananSnapshot}</span>
                <span className="text-right">{formatRupiah(item.subtotal)}</span>
              </div>
              <p className="text-[10px] text-gray-600">
                {item.qty} x {formatRupiah(item.hargaSnapshot)}
              </p>
              {item.catatanKondisi && (
                <p className="text-[10px] text-gray-500 italic">  {item.catatanKondisi}</p>
              )}
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-dashed border-black pt-2 mb-2">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>{formatRupiah(order.subtotal)}</span>
          </div>
          {order.biayaTingkat > 0 && (
            <div className="flex justify-between">
              <span>{order.tingkatLayanan.nama}</span>
              <span>{formatRupiah(order.biayaTingkat)}</span>
            </div>
          )}
          {order.biayaAntarJemput > 0 && (
            <div className="flex justify-between">
              <span>Antar Jemput</span>
              <span>{formatRupiah(order.biayaAntarJemput)}</span>
            </div>
          )}
          {order.diskon > 0 && (
            <div className="flex justify-between">
              <span>Diskon</span>
              <span>-{formatRupiah(order.diskon)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-sm mt-1">
            <span>TOTAL</span>
            <span>{formatRupiah(order.total)}</span>
          </div>
        </div>

        {/* Payments */}
        <div className="border-t border-dashed border-black pt-2 mb-2">
          <p className="font-bold mb-1">Pembayaran:</p>
          {order.pembayaran.filter(p => !p.isRefund).map((p, i) => (
            <div key={i} className="flex justify-between">
              <span>{p.metode}</span>
              <span>{formatRupiah(p.nominal)}</span>
            </div>
          ))}
          <div className="flex justify-between font-bold mt-1">
            <span>Sisa</span>
            <span>{formatRupiah(sisa)}</span>
          </div>
          {sisa === 0 && (
            <p className="text-center font-bold text-sm mt-1">LUNAS</p>
          )}
        </div>

        {/* Status */}
        <div className="text-center border-t border-dashed border-black pt-2 mb-2">
          <p className="font-bold">Status: {order.status.replace('_', ' ')}</p>
        </div>

        {/* Watermark for FREE plan */}
        {showWatermark && (
          <div className="text-center mt-4 pt-2 border-t border-dashed border-black">
            <p className="text-[10px] text-gray-500">Powered by Gampangin.biz.id</p>
          </div>
        )}
      </div>
    </div>
  );
}
