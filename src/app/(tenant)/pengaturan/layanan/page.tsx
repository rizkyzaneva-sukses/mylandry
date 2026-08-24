'use client';

import { useState, useEffect } from 'react';
import { formatRupiah } from '@/lib/order/calculate-order-total';

interface Layanan {
  id: string;
  nama: string;
  harga: number;
}

export default function LayananPage() {
  const [layanan, setLayanan] = useState<Layanan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [nama, setNama] = useState('');
  const [harga, setHarga] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadLayanan();
  }, []);

  async function loadLayanan() {
    const res = await fetch('/api/layanan');
    const data = await res.json();
    if (data.data) setLayanan(data.data);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const hargaNum = parseInt(harga);
    if (isNaN(hargaNum) || hargaNum < 0) {
      setError('Harga harus berupa angka tidak negatif.');
      return;
    }

    const url = editId ? `/api/layanan/${editId}` : '/api/layanan';
    const method = editId ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, harga: hargaNum }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      return;
    }

    setShowForm(false);
    setEditId(null);
    setNama('');
    setHarga('');
    loadLayanan();
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus layanan ini?')) return;

    await fetch(`/api/layanan/${id}`, { method: 'DELETE' });
    loadLayanan();
  }

  function startEdit(l: Layanan) {
    setEditId(l.id);
    setNama(l.nama);
    setHarga(String(l.harga));
    setShowForm(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Layanan</h1>
          <p className="text-sm text-muted-foreground">Kelola layanan laundry</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setNama(''); setHarga(''); }}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-sm"
        >
          + Tambah
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-3">{editId ? 'Edit' : 'Tambah'} Layanan</h2>
          {error && <p className="text-sm text-error mb-3">{error}</p>}
          <form onSubmit={handleSave} className="space-y-3">
            <input
              type="text"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              placeholder="Nama layanan"
              className="w-full px-4 py-2 border border-border rounded-md"
              required
            />
            <input
              type="number"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              placeholder="Harga (Rp)"
              className="w-full px-4 py-2 border border-border rounded-md"
              required
              min={0}
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">
                Simpan
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-muted border border-border rounded-md text-sm">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-surface-muted rounded w-1/3 mb-2" />
              <div className="h-3 bg-surface-muted rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : layanan.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">Belum ada layanan</p>
        </div>
      ) : (
        <div className="space-y-2">
          {layanan.map((l) => (
            <div key={l.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{l.nama}</p>
                <p className="text-sm text-muted-foreground">{formatRupiah(l.harga)}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(l)} className="px-3 py-1 text-sm text-primary hover:underline">
                  Edit
                </button>
                <button onClick={() => handleDelete(l.id)} className="px-3 py-1 text-sm text-error hover:underline">
                  Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
