import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-surface border-b border-border px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">ML</span>
            </div>
            <span className="font-semibold text-foreground">MyLandry</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/daftar"
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary-hover transition-colors"
            >
              Daftar
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block px-3 py-1 bg-accent-subtle text-accent-strong text-xs font-semibold rounded-full mb-4 tracking-wide uppercase">
            LAUNDRY GAMPANGIN
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
            Kelola Laundry Satuan
            <br />
            <span className="text-primary">Lebih Cepat & Mudah</span>
          </h1>
          <p className="text-muted-foreground text-base mb-8 max-w-lg mx-auto">
            Platform SaaS untuk usaha laundry per pcs. Kasir bisa buat order dalam
            {'<'}60 detik. Multi-outlet, pembayaran bertahap, struk thermal, dan
            laporan lengkap.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/daftar"
              className="px-6 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary-hover transition-colors text-center"
            >
              Mulai Gratis
            </Link>
            <Link
              href="/login"
              className="px-6 py-3 bg-surface border border-border text-foreground font-semibold rounded-lg hover:bg-surface-muted transition-colors text-center"
            >
              Login Kasir
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 text-left">
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold text-sm mb-1">Order {'<'}60 Detik</h3>
              <p className="text-xs text-muted-foreground">
                Alur kasir cepat tanpa hambatan. Mobile-first untuk HP Android/iOS.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-sm mb-1">Laporan Real-time</h3>
              <p className="text-xs text-muted-foreground">
                Dashboard omzet, piutang, dan performa kasir harian & bulanan.
              </p>
            </div>
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="text-2xl mb-2">🏷️</div>
              <h3 className="font-semibold text-sm mb-1">Multi-Outlet</h3>
              <p className="text-xs text-muted-foreground">
                Kelola beberapa outlet dari satu akun. Isolasi data per tenant.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 text-center text-xs text-muted-foreground">
        &copy; 2026 MyLandry - LAUNDRY GAMPANGIN. Semua hak dilindungi.
      </footer>
    </div>
  );
}
