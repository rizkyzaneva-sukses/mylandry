import { prisma } from '@/lib/prisma';
import { getSession, type SessionData } from '@/lib/session';
import { NextResponse } from 'next/server';

type Role = 'OWNER' | 'ADMIN' | 'KASIR';

export async function requireTenantUser(): Promise<SessionData> {
  const session = await getSession();
  if (!session.isLoggedIn || !session.tenantId || !session.userId) {
    throw new ResponseError(401, 'Silakan login terlebih dahulu.');
  }

  // Read fresh role from DB
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, nama: true, tenantId: true },
  });

  if (!user || user.tenantId !== session.tenantId) {
    throw new ResponseError(401, 'Sesi tidak valid.');
  }

  return { ...session, role: user.role };
}

export async function requireRole(...allowedRoles: Role[]): Promise<SessionData> {
  const session = await requireTenantUser();
  if (!allowedRoles.includes(session.role as Role)) {
    throw new ResponseError(403, 'Anda tidak memiliki akses untuk fitur ini.');
  }
  return session;
}

export async function requirePlatformUser() {
  const { getPlatformSession } = await import('@/lib/session');
  const session = await getPlatformSession();
  if (!session.isLoggedIn || !session.userId) {
    throw new ResponseError(401, 'Silakan login sebagai superadmin.');
  }
  return session;
}

export class ResponseError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'ResponseError';
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof ResponseError) {
    return NextResponse.json(
      { success: false, message: error.message, errors: null },
      { status: error.statusCode }
    );
  }
  console.error('Unexpected error:', error);
  return NextResponse.json(
    { success: false, message: 'Terjadi kesalahan internal.', errors: null },
    { status: 500 }
  );
}
