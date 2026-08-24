import { prisma } from '@/lib/prisma';

const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MINUTES = 15;

export async function checkLoginRateLimit(identifier: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - LOGIN_WINDOW_MINUTES * 60 * 1000);

  const recentAttempts = await prisma.auditLog.count({
    where: {
      aksi: 'LOGIN_FAILED',
      detail: { contains: identifier },
      timestamp: { gte: windowStart },
    },
  });

  return recentAttempts < LOGIN_MAX_ATTEMPTS;
}

export async function recordLoginAttempt(
  identifier: string,
  success: boolean,
  tenantId?: string
) {
  if (success) return;

  await prisma.auditLog.create({
    data: {
      tenantId: tenantId || 'system',
      userId: 'anonymous',
      aksi: 'LOGIN_FAILED',
      detail: `Failed login for: ${identifier}`,
    },
  });
}
