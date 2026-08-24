'use client';

import { useState, useEffect } from 'react';
import { SearchableSelect } from '@/components/searchable-select';

interface TingkatLayanan {
  id: string;
  nama: string;
  tipeBiaya: string;
  nilaiBiaya: number;
}

export default function TingkatLayananPage() {
  const [tingkat, setTingkat] = useState<TingkatLayanan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/tingkat-layanan');
      const data = await res.json();
      if (data.data) setTingkat(data.data);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Tingkat Layanan</h1>
        <p className="text-sm text-muted-foreground">Kelola tingkat layanan (Reguler, Express, Kilat)</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-surface border border-border rounded-lg p-4 animate-pulse h-20" />)}</div>
      ) : (
        <div className="space-y-3">
          {tingkat.map((t) => (
            <div key={t.id} className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{t.nama}</p>
                <p className="text-sm text-muted-foreground">
                  {t.tipeBiaya === 'PERSEN' ? `+${t.nilaiBiaya}%` : `+Rp ${t.nilaiBiaya.toLocaleString('id-ID')}`}
                </p>
              </div>
              <span className={`px-2 py-0.5 text-xs rounded-full ${t.tipeBiaya === 'PERSEN' ? 'bg-info-subtle text-info' : 'bg-accent-subtle text-accent-strong'}`}>
                {t.tipeBiaya}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
