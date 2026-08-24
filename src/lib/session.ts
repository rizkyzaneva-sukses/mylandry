import { ironSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  userId?: string;
  tenantId?: string;
  username?: string;
  nama?: string;
  role?: string;
  isLoggedIn: boolean;
}

export interface PlatformSessionData {
  userId?: string;
  username?: string;
  nama?: string;
  role?: string;
  isLoggedIn: boolean;
}

const sessionOptions = {
  password: process.env.SESSION_PASSWORD || 'complex-password-at-least-32-characters-long',
  cookieName: 'mylandry-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

const platformSessionOptions = {
  password: process.env.SESSION_PASSWORD || 'complex-password-at-least-32-characters-long',
  cookieName: 'mylandry-platform-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
};

export async function getSession(): Promise<SessionData> {
  const cookieStore = await cookies();
  const session = ironSession(sessionOptions);
  return session.get(cookieStore) as SessionData;
}

export async function getPlatformSession(): Promise<PlatformSessionData> {
  const cookieStore = await cookies();
  const session = ironSession(platformSessionOptions);
  return session.get(cookieStore) as PlatformSessionData;
}

export async function setSession(data: SessionData) {
  const cookieStore = await cookies();
  const session = ironSession(sessionOptions);
  await session.set(cookieStore, data);
}

export async function setPlatformSession(data: PlatformSessionData) {
  const cookieStore = await cookies();
  const session = ironSession(platformSessionOptions);
  await session.set(cookieStore, data);
}

export async function destroySession() {
  const cookieStore = await cookies();
  const session = ironSession(sessionOptions);
  await session.destroy(cookieStore);
}

export async function destroyPlatformSession() {
  const cookieStore = await cookies();
  const session = ironSession(platformSessionOptions);
  await session.destroy(cookieStore);
}
