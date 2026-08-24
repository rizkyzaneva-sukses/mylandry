import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';

const SETTINGS_MENU = [
  {
    href: '/pengaturan/outlet',
    icon: '🏪',
    title: 'Outlet',
    description: 'Kelola outlet laundry',
    roles: ['OWNER'],
  },
  {
    href: '/pengaturan/layanan',
    icon: '👔',
    title: 'Layanan',
    description: 'Kelola layanan dan harga',
    roles: ['OWNER', 'ADMIN'],
  },
  {
    href: '/pengaturan/tingkat-layanan',
    icon: '⚡',
    title: 'Tingkat Layanan',
    description: 'Reguler, Express, Kilat',
    roles: ['OWNER', 'ADMIN'],
  },
  {
    href: '/pengaturan/pengguna',
    icon: '👤',
    title: 'Pengguna',
    description: 'Kelola akun pengguna',
    roles: ['OWNER', 'ADMIN'],
  },
  {
    href: '/pengaturan/langganan',
    icon: '💳',
    title: 'Langganan',
    description: 'Paket dan billing',
    roles: ['OWNER'],
  },
];

export default async function PengaturanPage() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect('/login');

  const userRole = session.role || 'KASIR';

  const filteredMenu = SETTINGS_MENU.filter((m) => m.roles.includes(userRole));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Pengaturan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola konfigurasi laundry
        </p>
      </div>

      <div className="space-y-3">
        {filteredMenu.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-4 bg-surface border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <p className="font-semibold text-foreground">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <svg className="w-5 h-5 text-muted-foreground ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
