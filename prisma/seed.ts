import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Plans
  const freePlan = await prisma.plan.upsert({
    where: { kode: 'FREE' },
    update: {},
    create: {
      kode: 'FREE',
      nama: 'Gratis',
      hargaPerBulan1: 0,
      hargaPerBulan3: 0,
      hargaPerBulan6: 0,
      hargaPerBulan12: 0,
      maxOutlet: 1,
      maxOrderPerBulan: 75,
      hasWaNotif: false,
      hasExport: false,
      hasLaporanBulan: false,
      logoStrukAllowed: false,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { kode: 'PRO' },
    update: {},
    create: {
      kode: 'PRO',
      nama: 'Professional',
      hargaPerBulan1: 79000,
      hargaPerBulan3: 71000,
      hargaPerBulan6: 66000,
      hargaPerBulan12: 59000,
      maxOutlet: 3,
      maxOrderPerBulan: 999999, // unlimited
      hasWaNotif: true,
      hasExport: true,
      hasLaporanBulan: true,
      logoStrukAllowed: true,
    },
  });

  const customPlan = await prisma.plan.upsert({
    where: { kode: 'CUSTOM' },
    update: {},
    create: {
      kode: 'CUSTOM',
      nama: 'Custom',
      hargaPerBulan1: 0,
      hargaPerBulan3: 0,
      hargaPerBulan6: 0,
      hargaPerBulan12: 0,
      maxOutlet: 999,
      maxOrderPerBulan: 999999,
      hasWaNotif: true,
      hasExport: true,
      hasLaporanBulan: true,
      logoStrukAllowed: true,
    },
  });

  console.log('✅ Plans seeded:', { freePlan: freePlan.kode, proPlan: proPlan.kode, customPlan: customPlan.kode });

  // Create default superadmin
  const bcrypt = await import('bcryptjs');
  const superadminHash = await bcrypt.hash('SuperAdmin123!', 12);

  await prisma.platformUser.upsert({
    where: { username: 'superadmin' },
    update: {},
    create: {
      username: 'superadmin',
      passwordHash: superadminHash,
      nama: 'Super Admin',
      role: 'SUPERADMIN',
    },
  });

  console.log('✅ Superadmin created (username: superadmin, password: SuperAdmin123!)');

  console.log('🌱 Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
