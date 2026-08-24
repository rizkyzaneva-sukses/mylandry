'use client';

import { useState, useEffect } from 'react';

interface Outlet {
  id: string;
  nama: string;
  alamat: string | null;
  telepon: string | null;
  isAktif: boolean;
}

export default function OutletPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState('');
  const [alamat, setAlamat] = useState('');
  const [telepon, setTelepon] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { loadOutlets(); }, []);

  async function loadOutlets() {
    const res = await fetch('/api/outlets');
    const data = await res.json();
    if (data.data) setOutlets(data.data);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/outlets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, alamat: alamat || undefined, telepon: telepon || undefined }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      return;
    }

    setShowForm(false);
    setNama('');
    setAlamat('');
    setTelepon('');
    loadOutlets();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Outlet</h1>
          <p className="text-sm text-muted-foreground">Kelola outlet laundry</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-sm"
        >
          + Tambah Outlet
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-3">Tambah Outlet</h2>
          {error && <p className="text-sm text-error mb-3">{error}</p>}
          <form onSubmit={handleSave} className="space-y-3">
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama outlet" className="w-full px-4 py-2 border border-border rounded-md" required />
            <input type="text" value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Alamat (opsional)" className="w-full px-4 py-2 border border-border rounded-md" />
            <input type="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)} placeholder="Telepon (opsional)" className="w-full px-4 py-2 border border-border rounded-md" />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Simpan</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-muted border border-border rounded-md text-sm">Batal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse h-20" />)}</div>
      ) : outlets.length === 0 ? (
        <div className="bg-surface border border-border rounded-lg p-8 text-center"><p className="text-muted-foreground">Belum ada outlet</p></div>
      ) : (
        <div className="space-y-2">
          {outlets.map((o) => (
            <div key={o.id} className="bg-surface border border-border rounded-lg p-4">
              <p className="font-medium">{o.nama}</p>
              {o.alamat && <p className="text-sm text-muted-foreground">{o.alamat}</p>}
              {o.telepon && <p className="text-sm text-muted-foreground">{o.telepon}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
