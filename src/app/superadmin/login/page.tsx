'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SuperadminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/platform-auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      router.push(data.data.redirectUrl);
    } catch {
      setError('Terjadi kesalahan.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-foreground">Superadmin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">MyLandry Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-border rounded-lg p-6 space-y-4">
          {error && <div className="p-3 bg-error-subtle border border-error/20 rounded-md text-sm text-error">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-4 py-2 border border-border rounded-md" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border border-border rounded-md" required />
          </div>

          <button type="submit" disabled={loading} className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary-hover disabled:opacity-50">
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
