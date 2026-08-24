'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/searchable-select';
import { formatRupiah } from '@/lib/order/calculate-order-total';

interface Outlet { id: string; nama: string; }
interface Pelanggan { id: string; nama: string; nomorWa: string; }
interface Layanan { id: string; nama: string; harga: number; }
interface TingkatLayanan { id: string; nama: string; tipeBiaya: string; nilaiBiaya: number; }

interface OrderItem {
  layananId: string;
  nama: string;
  harga: number;
  qty: number;
  catatanKondisi: string;
}

export default function OrderBaruPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Master data
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [layananList, setLayananList] = useState<Layanan[]>([]);
  const [tingkatList, setTingkatList] = useState<TingkatLayanan[]>([]);

  // Form state
  const [outletId, setOutletId] = useState('');
  const [pelangganId, setPelangganId] = useState('');
  const [tingkatLayananId, setTingkatLayananId] = useState('');
  const [items, setItems] = useState<OrderItem[]>([]);
  const [biayaAntarJemput, setBiayaAntarJemput] = useState(0);
  const [diskon, setDiskon] = useState(0);
  const [metodeBayar, setMetodeBayar] = useState('TUNAI');
  const [bayarSekarang, setBayarSekarang] = useState(0);

  // New pelanggan
  const [showNewPelanggan, setShowNewPelanggan] = useState(false);
  const [newPelangganNama, setNewPelangganNama] = useState('');
  const [newPelangganWa, setNewPelangganWa] = useState('');

  useEffect(() => {
    async function load() {
      const [outletRes, pelangganRes, layananRes, tingkatRes] = await Promise.all([
        fetch('/api/outlets'),
        fetch('/api/pelanggan'),
        fetch('/api/layanan'),
        fetch('/api/tingkat-layanan'),
      ]);

      const [outletData, pelangganData, layananData, tingkatData] = await Promise.all([
        outletRes.json(),
        pelangganRes.json(),
        layananRes.json(),
        tingkatRes.json(),
      ]);

      if (outletData.data) setOutlets(outletData.data);
      if (pelangganData.data) setPelangganList(pelangganData.data);
      if (layananData.data) setLayananList(layananData.data);
      if (tingkatData.data) setTingkatList(tingkatData.data);
    }
    load();
  }, []);

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.harga * item.qty, 0);
  const selectedTingkat = tingkatList.find((t) => t.id === tingkatLayananId);
  const biayaTingkat = selectedTingkat
    ? selectedTingkat.tipeBiaya === 'PERSEN'
      ? Math.round((subtotal * selectedTingkat.nilaiBiaya) / 100)
      : selectedTingkat.nilaiBiaya
    : 0;
  const total = Math.max(0, subtotal + biayaTingkat + biayaAntarJemput - diskon);
  const sisa = total - bayarSekarang;

  function addItem() {
    setItems([...items, { layananId: '', nama: '', harga: 0, qty: 1, catatanKondisi: '' }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: string, value: unknown) {
    const updated = [...items];
    if (field === 'layananId') {
      const layanan = layananList.find((l) => l.id === value);
      if (layanan) {
        updated[index] = { ...updated[index], layananId: value as string, nama: layanan.nama, harga: layanan.harga };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create pelanggan if new
      let finalPelangganId = pelangganId;
      if (showNewPelanggan && newPelangganNama && newPelangganWa) {
        const res = await fetch('/api/pelanggan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama: newPelangganNama, nomorWa: newPelangganWa }),
        });
        const data = await res.json();
        if (res.ok && data.data) {
          finalPelangganId = data.data.id;
        } else {
          setError(data.message || 'Gagal membuat pelanggan baru.');
          return;
        }
      }

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outletId,
          pelangganId: finalPelangganId,
          tingkatLayananId,
          biayaAntarJemput,
          diskon,
          items: items.map((i) => ({
            layananId: i.layananId,
            qty: i.qty,
            catatanKondisi: i.catatanKondisi || undefined,
          })),
          pembayaranAwal: bayarSekarang > 0 ? {
            nominal: bayarSekarang,
            metode: metodeBayar,
          } : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      router.push(`/order/${data.data.id}`);
    } catch {
      setError('Gagal membuat order. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pb-24 lg:pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Order Baru</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buat order laundry baru
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-error-subtle border border-error/20 rounded-md text-sm text-error">
            {error}
          </div>
        )}

        {/* Customer & Outlet */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <h2 className="font-semibold text-foreground">Pelanggan & Outlet</h2>

          <SearchableSelect
            label="Outlet"
            options={outlets.map((o) => ({ value: o.id, label: o.nama }))}
            value={outletId}
            onChange={setOutletId}
            placeholder="Pilih outlet"
          />

          {!showNewPelanggan ? (
            <div>
              <SearchableSelect
                label="Pelanggan"
                options={pelangganList.map((p) => ({ value: p.id, label: p.nama, description: p.nomorWa }))}
                value={pelangganId}
                onChange={setPelangganId}
                placeholder="Cari pelanggan"
              />
              <button
                type="button"
                onClick={() => setShowNewPelanggan(true)}
                className="mt-2 text-sm text-primary font-medium hover:underline"
              >
                + Pelanggan Baru
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nama Pelanggan</label>
                <input
                  type="text"
                  value={newPelangganNama}
                  onChange={(e) => setNewPelangganNama(e.target.value)}
                  placeholder="Nama pelanggan"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nomor WhatsApp</label>
                <input
                  type="tel"
                  value={newPelangganWa}
                  onChange={(e) => setNewPelangganWa(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNewPelanggan(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Pilih pelanggan existing
              </button>
            </div>
          )}

          <SearchableSelect
            label="Tingkat Layanan"
            options={tingkatList.map((t) => ({
              value: t.id,
              label: t.nama,
              description: t.tipeBiaya === 'PERSEN' ? `+${t.nilaiBiaya}%` : `+${formatRupiah(t.nilaiBiaya)}`,
            }))}
            value={tingkatLayananId}
            onChange={setTingkatLayananId}
            placeholder="Pilih tingkat layanan"
          />
        </div>

        {/* Items */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Item Layanan</h2>
            <button
              type="button"
              onClick={addItem}
              className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary-hover"
            >
              + Tambah Item
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Belum ada item. Klik &quot;Tambah Item&quot; untuk menambahkan.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="border border-border rounded-md p-3 space-y-3">
                  <div className="flex items-start justify-between">
                    <SearchableSelect
                      options={layananList.map((l) => ({
                        value: l.id,
                        label: l.nama,
                        description: formatRupiah(l.harga),
                      }))}
                      value={item.layananId}
                      onChange={(v) => updateItem(index, 'layananId', v)}
                      placeholder="Pilih layanan"
                    />
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      className="ml-2 p-1 text-error hover:bg-error-subtle rounded"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateItem(index, 'qty', Math.max(1, item.qty - 1))}
                        className="w-10 h-10 bg-surface-muted border border-border rounded-md flex items-center justify-center font-bold"
                      >
                        −
                      </button>
                      <span className="w-8 text-center font-semibold">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateItem(index, 'qty', item.qty + 1)}
                        className="w-10 h-10 bg-surface-muted border border-border rounded-md flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-foreground ml-auto">
                      {formatRupiah(item.harga * item.qty)}
                    </span>
                  </div>

                  <input
                    type="text"
                    value={item.catatanKondisi}
                    onChange={(e) => updateItem(index, 'catatanKondisi', e.target.value)}
                    placeholder="Catatan kondisi (opsional)"
                    className="w-full px-3 py-1.5 text-sm bg-surface-muted border border-border rounded-md focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Additional Costs */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <h2 className="font-semibold text-foreground">Biaya Tambahan</h2>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Biaya Antar Jemput</label>
            <input
              type="number"
              value={biayaAntarJemput}
              onChange={(e) => setBiayaAntarJemput(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
              min={0}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Diskon</label>
            <input
              type="number"
              value={diskon}
              onChange={(e) => setDiskon(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
              min={0}
            />
          </div>
        </div>

        {/* Payment */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
          <h2 className="font-semibold text-foreground">Pembayaran</h2>

          <SearchableSelect
            label="Metode Pembayaran"
            options={[
              { value: 'TUNAI', label: 'Tunai' },
              { value: 'TRANSFER', label: 'Transfer' },
              { value: 'QRIS', label: 'QRIS' },
              { value: 'LAINNYA', label: 'Lainnya' },
            ]}
            value={metodeBayar}
            onChange={setMetodeBayar}
            placeholder="Pilih metode"
          />

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Bayar Sekarang</label>
            <input
              type="number"
              value={bayarSekarang}
              onChange={(e) => setBayarSekarang(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
              min={0}
              max={total}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Total: {formatRupiah(total)} • Sisa: {formatRupiah(sisa)}
            </p>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-surface border border-border rounded-lg p-4 space-y-2">
          <h2 className="font-semibold text-foreground mb-3">Ringkasan</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{formatRupiah(subtotal)}</span>
          </div>
          {biayaTingkat > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Biaya {selectedTingkat?.nama}</span>
              <span className="font-medium">{formatRupiah(biayaTingkat)}</span>
            </div>
          )}
          {biayaAntarJemput > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Antar Jemput</span>
              <span className="font-medium">{formatRupiah(biayaAntarJemput)}</span>
            </div>
          )}
          {diskon > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Diskon</span>
              <span className="font-medium text-error">-{formatRupiah(diskon)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex justify-between">
            <span className="font-semibold">Total</span>
            <span className="text-lg font-bold text-primary">{formatRupiah(total)}</span>
          </div>
        </div>

        {/* Sticky Bottom Bar (Mobile) */}
        <div className="fixed bottom-0 left-0 right-0 lg:relative bg-surface border-t border-border p-4 flex items-center justify-between z-20 shadow-lg lg:shadow-none">
          <div>
            <p className="text-xs text-muted-foreground">Total Bayar</p>
            <p className="text-xl font-bold text-primary">{formatRupiah(total)}</p>
          </div>
          <button
            type="submit"
            disabled={loading || items.length === 0 || !outletId || !pelangganId || !tingkatLayananId}
            className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan & Bayar'}
          </button>
        </div>
      </form>
    </div>
  );
}
