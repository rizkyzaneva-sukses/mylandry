import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

const DEFAULT_LAYANAN = [
  { nama: 'Cuci Kemeja', harga: 0 },
  { nama: 'Cuci Jas', harga: 0 },
  { nama: 'Cuci Celana', harga: 0 },
  { nama: 'Cuci Dress', harga: 0 },
  { nama: 'Cuci Sepatu', harga: 0 },
  { nama: 'Cuci Tas', harga: 0 },
  { nama: 'Cuci Boneka', harga: 0 },
  { nama: 'Cuci Selimut', harga: 0 },
  { nama: 'Cuci Bed Cover', harga: 0 },
  { nama: 'Cuci Karpet', harga: 0 },
];

interface ProvisionTenantInput {
  namaLaundry: string;
  namaPemilik: string;
  nomorWa: string;
  username: string;
  passwordHash: string;
}

/**
 * Atomically provision a new tenant with all default data.
 * Creates: Tenant, Subscription (TRIAL PRO 14 days), User (OWNER),
 * Outlet, 3 TingkatLayanan, 10 Layanan defaults.
 * 
 * If any step fails, the entire transaction is rolled back.
 */
export async function provisionTenant(input: ProvisionTenantInput) {
  const { namaLaundry, namaPemilik, nomorWa, username, passwordHash } = input;

  // Get PRO plan
  const proPlan = await prisma.plan.findUnique({
    where: { kode: 'PRO' },
  });

  if (!proPlan) {
    throw new Error('PRO plan not found. Run seed first.');
  }

  // Calculate trial dates
  const now = new Date();
  const berlakuSampai = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

  // Use transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Tenant
    const tenant = await tx.tenant.create({
      data: {
        nama: namaLaundry,
        status: 'TRIAL',
      },
    });

    // 2. Create Subscription (TRIAL PRO 14 days)
    await tx.subscription.create({
      data: {
        tenantId: tenant.id,
        planId: proPlan.id,
        status: 'TRIAL',
        termBulan: 1,
        berlakuSampai,
      },
    });

    // 3. Create OWNER user
    const owner = await tx.user.create({
      data: {
        tenantId: tenant.id,
        username,
        passwordHash,
        nama: namaPemilik,
        role: 'OWNER',
      },
    });

    // 4. Create default outlet
    const outlet = await tx.outlet.create({
      data: {
        tenantId: tenant.id,
        nama: `${namaLaundry} - Utama`,
        isAktif: true,
      },
    });

    // 5. Create 3 default service levels
    const tingkatLayanan = await Promise.all([
      tx.tingkatLayanan.create({
        data: {
          tenantId: tenant.id,
          nama: 'Reguler',
          tipeBiaya: 'NOMINAL',
          nilaiBiaya: 0,
        },
      }),
      tx.tingkatLayanan.create({
        data: {
          tenantId: tenant.id,
          nama: 'Express',
          tipeBiaya: 'NOMINAL',
          nilaiBiaya: 0,
        },
      }),
      tx.tingkatLayanan.create({
        data: {
          tenantId: tenant.id,
          nama: 'Kilat',
          tipeBiaya: 'NOMINAL',
          nilaiBiaya: 0,
        },
      }),
    ]);

    // 6. Create 10 default services
    const layanan = await Promise.all(
      DEFAULT_LAYANAN.map((l) =>
        tx.layanan.create({
          data: {
            tenantId: tenant.id,
            nama: l.nama,
            harga: l.harga,
          },
        })
      )
    );

    // 7. Record provisioning event
    await tx.auditLog.create({
      data: {
        tenantId: tenant.id,
        userId: owner.id,
        aksi: 'TENANT_PROVISIONED',
        detail: `Tenant "${namaLaundry}" provisioned with PRO trial 14 days`,
      },
    });

    return {
      tenant,
      owner,
      outlet,
      tingkatLayanan,
      layanan,
    };
  });

  return result;
}
