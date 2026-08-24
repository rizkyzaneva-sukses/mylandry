'use client';

import { useState, useEffect } from 'react';

interface Pelanggan {
  id: string;
  nama: string;
  nomorWa: string;
  alamat: string | null;
}

export default function PelangganPage() {
  const [pelanggan, setPelanggan] = useState<Pelanggan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  const [alamat, setAlamat] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadPelanggan(); }, []);

  async function loadPelanggan() {
    const res = await fetch('/api/pelanggan');
    const data = await res.json();
    if (data.data) setPelanggan(data.data);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/pelanggan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, nomorWa, alamat: alamat || undefined }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      return;
    }

    setShowForm(false);
    setNama('');
    setNomorWa('');
    setAlamat('');
    loadPelanggan();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pelanggan</h1>
          <p className="text-sm text-muted-foreground">Kelola data pelanggan</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-sm">
          + Tambah Pelanggan
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-3">Tambah Pelanggan</h2>
          {error && <p className="text-sm text-error mb-3">{error}</p>}
          <form onSubmit={handleSave} className="space-y-3">
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama pelanggan" className="w-full px-4 py-2 border border-border rounded-md" required />
            <input type="tel" value={nomorWa} onChange={(e) => setNomorWa(e.target.value)} placeholder="Nomor WhatsApp" className="w-full px-4 py-2 border border-border rounded-md" required />
            <input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Alamat (opsional)" className="w-full px-4 py-2 border border-border rounded-md" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Simpan</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-muted border border-border rounded-md text-sm">Batal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse h-16" />)}</div>
      ) : pelanggan.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center"><p className="text-muted-foreground">Belum ada pelanggan</p></div>
      ) : (
        <div className="space-y-2">
          {pelanggan.map((p) => (
            <div key={p.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{p.nama}</p>
                <p className="text-sm text-muted-foreground">{p.nomorWa}</p>
                {p.alamat && <p className="text-xs text-muted-foreground">{p.alamat}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
