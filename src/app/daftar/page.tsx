'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SearchableSelect } from '@/components/searchable-select';

const PAKET_OPTIONS = [
  { value: 'FREE', label: 'FREE', description: '1 outlet, 75 order/bulan' },
  { value: 'PRO', label: 'PRO', description: '3 outlet, order unlimited' },
  { value: 'CUSTOM', label: 'CUSTOM', description: 'Sesuai kesepakatan' },
];

const DURASI_OPTIONS = [
  { value: '1', label: '1 Bulan - Rp 79.000/bulan' },
  { value: '3', label: '3 Bulan - Rp 71.000/bulan' },
  { value: '6', label: '6 Bulan - Rp 66.000/bulan' },
  { value: '12', label: '12 Bulan - Rp 59.000/bulan' },
];

export default function DaftarPage() {
  const router = useRouter();
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [paket, setPaket] = useState('FREE');
  const [durasi, setDurasi] = useState('1');
  const [namaLaundry, setNamaLaundry] = useState('');
  const [namaPemilik, setNamaPemilik] = useState('');
  const [nomorWa, setNomorWa] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [kodeKupon, setKodeKupon] = useState('');
  const [otp, setOtp] = useState('');

  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomorWa }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      setStep('otp');
    } catch {
      setError('Terjadi kesalahan. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nomorWa,
          otp,
          namaLaundry,
          namaPemilik,
          username,
          password,
          kodeKupon: kodeKupon || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message);
        return;
      }

      router.push(data.data.redirectUrl);
    } catch {
      setError('Terjadi kesalahan. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-primary-foreground font-bold text-lg">ML</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">Daftar MyLandry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Buat akun laundry Anda
          </p>
        </div>

        {step === 'form' ? (
          <form onSubmit={handleRequestOtp} className="bg-surface border border-border rounded-lg p-6 space-y-4">
            {error && (
              <div className="p-3 bg-error-subtle border border-error/20 rounded-md text-sm text-error">
                {error}
              </div>
            )}

            <SearchableSelect
              label="Paket"
              options={PAKET_OPTIONS}
              value={paket}
              onChange={setPaket}
              placeholder="Pilih paket"
            />

            {paket === 'PRO' && (
              <SearchableSelect
                label="Durasi Langganan"
                options={DURASI_OPTIONS}
                value={durasi}
                onChange={setDurasi}
                placeholder="Pilih durasi"
              />
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nama Laundry</label>
              <input
                type="text"
                value={namaLaundry}
                onChange={(e) => setNamaLaundry(e.target.value)}
                placeholder="Contoh: Berkah Laundry"
                className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nama Pemilik</label>
              <input
                type="text"
                value={namaPemilik}
                onChange={(e) => setNamaPemilik(e.target.value)}
                placeholder="Nama lengkap"
                className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Nomor WhatsApp</label>
              <input
                type="tel"
                value={nomorWa}
                onChange={(e) => setNomorWa(e.target.value)}
                placeholder="08xxxxxxxxxx"
                className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username untuk login"
                className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 8 karakter"
                className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Kode Kupon (opsional)</label>
              <input
                type="text"
                value={kodeKupon}
                onChange={(e) => setKodeKupon(e.target.value)}
                placeholder="Masukkan kode kupon"
                className="w-full px-4 py-2 bg-surface border border-border rounded-md focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Mengirim OTP...' : 'Kirim OTP ke WhatsApp'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="bg-surface border border-border rounded-lg p-6 space-y-4">
            {error && (
              <div className="p-3 bg-error-subtle border border-error/20 rounded-md text-sm text-error">
                {error}
              </div>
            )}

            <div className="text-center mb-4">
              <p className="text-sm text-muted-foreground">
                Kode OTP telah dikirim ke WhatsApp
              </p>
              <p className="font-semibold text-foreground">{nomorWa}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Kode OTP (6 digit)</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 bg-surface border border-border rounded-md focus:outline-none focus:border-primary text-center text-2xl tracking-[0.5em] font-mono"
                required
                maxLength={6}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-md hover:bg-primary-hover transition-colors disabled:opacity-50"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi & Daftar'}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('form');
                setError('');
              }}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Kembali ke form
            </button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
