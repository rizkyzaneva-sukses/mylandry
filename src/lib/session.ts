import { getIronSession, type IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { type ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';

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

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore as unknown as ReadonlyRequestCookies, sessionOptions);
}

export async function getPlatformSession(): Promise<IronSession<PlatformSessionData>> {
  const cookieStore = await cookies();
  return getIronSession<PlatformSessionData>(cookieStore as unknown as ReadonlyRequestCookies, platformSessionOptions);
}

export async function setSession(data: SessionData): Promise<void> {
  const session = await getSession();
  Object.assign(session, data);
  await session.save();
}

export async function setPlatformSession(data: PlatformSessionData): Promise<void> {
  const session = await getPlatformSession();
  Object.assign(session, data);
  await session.save();
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function destroyPlatformSession(): Promise<void> {
  const session = await getPlatformSession();
  session.destroy();
}
