import { prisma } from '@/lib/prisma';
import { getWIBDateComponents } from '@/lib/utils';

interface SubscriptionLimits {
  maxOutlet: number;
  maxOrderPerBulan: number;
  hasWaNotif: boolean;
  hasExport: boolean;
  hasLaporanBulan: boolean;
  logoStrukAllowed: boolean;
  planCode: string;
  isTrial: boolean;
  isExpired: boolean;
}

/**
 * Get effective subscription limits for a tenant.
 * Falls back to FREE plan if no active subscription.
 */
export async function getSubscriptionLimits(tenantId: string): Promise<SubscriptionLimits> {
  const subscription = await prisma.subscription.findFirst({
    where: { tenantId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });

  if (!subscription) {
    // Default to FREE
    const freePlan = await prisma.plan.findUnique({ where: { kode: 'FREE' } });
    return {
      maxOutlet: freePlan?.maxOutlet ?? 1,
      maxOrderPerBulan: freePlan?.maxOrderPerBulan ?? 75,
      hasWaNotif: false,
      hasExport: false,
      hasLaporanBulan: false,
      logoStrukAllowed: false,
      planCode: 'FREE',
      isTrial: false,
      isExpired: true,
    };
  }

  const now = new Date();
  const isTrial = subscription.status === 'TRIAL';
  const isExpired =
    subscription.status === 'EXPIRED' ||
    (subscription.status === 'GRACE' && subscription.graceSampai && subscription.graceSampai < now);

  return {
    maxOutlet: subscription.plan.maxOutlet,
    maxOrderPerBulan: subscription.plan.maxOrderPerBulan,
    hasWaNotif: subscription.plan.hasWaNotif,
    hasExport: subscription.plan.hasExport,
    hasLaporanBulan: subscription.plan.hasLaporanBulan,
    logoStrukAllowed: subscription.plan.logoStrukAllowed,
    planCode: subscription.plan.kode,
    isTrial,
    isExpired,
  };
}

/**
 * Check if tenant has reached monthly order quota.
 * Uses WIB calendar month. Cancelled orders don't count.
 */
export async function checkOrderQuota(tenantId: string): Promise<{ allowed: boolean; used: number; max: number }> {
  const limits = await getSubscriptionLimits(tenantId);

  // Unlimited orders for PRO/CUSTOM
  if (limits.maxOrderPerBulan === -1 || limits.maxOrderPerBulan === 999999) {
    return { allowed: true, used: 0, max: -1 };
  }

  const { year, month } = getWIBDateComponents();

  // Count orders this WIB calendar month (excluding cancelled)
  const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  startOfMonth.setTime(startOfMonth.getTime() - 7 * 60 * 60 * 1000); // Adjust to WIB

  const endOfMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0));
  endOfMonth.setTime(endOfMonth.getTime() - 7 * 60 * 60 * 1000);

  const used = await prisma.order.count({
    where: {
      tenantId,
      status: { not: 'DIBATALKAN' },
      createdAt: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
  });

  return {
    allowed: used < limits.maxOrderPerBulan,
    used,
    max: limits.maxOrderPerBulan,
  };
}

/**
 * Check if tenant can create more outlets
 */
export async function checkOutletLimit(tenantId: string): Promise<{ allowed: boolean; used: number; max: number }> {
  const limits = await getSubscriptionLimits(tenantId);

  const used = await prisma.outlet.count({
    where: { tenantId, isAktif: true },
  });

  return {
    allowed: used < limits.maxOutlet,
    used,
    max: limits.maxOutlet,
  };
}
