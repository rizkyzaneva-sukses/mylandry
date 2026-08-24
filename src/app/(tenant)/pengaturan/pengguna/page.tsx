'use client';

import { useState, useEffect } from 'react';
import { SearchableSelect } from '@/components/searchable-select';

interface User {
  id: string;
  nama: string;
  username: string;
  role: string;
}

export default function PenggunaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('KASIR');
  const [error, setError] = useState('');

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    const res = await fetch('/api/users');
    const data = await res.json();
    if (data.data) setUsers(data.data);
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama, username, password, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.message);
      return;
    }

    setShowForm(false);
    setNama('');
    setUsername('');
    setPassword('');
    setRole('KASIR');
    loadUsers();
  }

  const roleColors: Record<string, string> = {
    OWNER: 'bg-primary/10 text-primary',
    ADMIN: 'bg-info-subtle text-info',
    KASIR: 'bg-surface-muted text-muted-foreground',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pengguna</h1>
          <p className="text-sm text-muted-foreground">Kelola akun pengguna</p>
        </div>
        <button onClick={() => setShowForm(true)} className="px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg text-sm">
          + Tambah Pengguna
        </button>
      </div>

      {showForm && (
        <div className="bg-surface border border-border rounded-lg p-4 mb-6">
          <h2 className="font-semibold mb-3">Tambah Pengguna</h2>
          {error && <p className="text-sm text-error mb-3">{error}</p>}
          <form onSubmit={handleSave} className="space-y-3">
            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" className="w-full px-4 py-2 border border-border rounded-md" required />
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="w-full px-4 py-2 border border-border rounded-md" required minLength={3} />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full px-4 py-2 border border-border rounded-md" required minLength={8} />
            <SearchableSelect
              label="Role"
              options={[
                { value: 'ADMIN', label: 'Admin' },
                { value: 'KASIR', label: 'Kasir' },
              ]}
              value={role}
              onChange={setRole}
              placeholder="Pilih role"
            />
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium">Simpan</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-surface-muted border border-border rounded-md text-sm">Batal</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse h-16" />)}</div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{u.nama}</p>
                <p className="text-sm text-muted-foreground">@{u.username}</p>
              </div>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${roleColors[u.role] || ''}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
