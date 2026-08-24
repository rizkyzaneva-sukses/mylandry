import { getIronSession } from 'iron-session';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRequest = any;

async function getSessionFromRequest(req: AnyRequest, options: typeof sessionOptions) {
  // Build a cookie header string from next/headers
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  // Create a minimal Request-like object
  const fakeReq = new Request('http://localhost', {
    headers: { cookie: cookieHeader },
  });

  const fakeRes = new Response();
  const session = await getIronSession(fakeReq, fakeRes, options);
  return { session, fakeRes };
}

export async function getSession(): Promise<SessionData> {
  const { session } = await getSessionFromRequest(null, sessionOptions);
  return session as unknown as SessionData;
}

export async function getPlatformSession(): Promise<PlatformSessionData> {
  const { session } = await getSessionFromRequest(null, platformSessionOptions);
  return session as unknown as PlatformSessionData;
}

export async function setSession(data: SessionData) {
  const { session, fakeRes } = await getSessionFromRequest(null, sessionOptions);
  Object.assign(session, data);
  await session.save();
  return fakeRes;
}

export async function setPlatformSession(data: PlatformSessionData) {
  const { session, fakeRes } = await getSessionFromRequest(null, platformSessionOptions);
  Object.assign(session, data);
  await session.save();
  return fakeRes;
}

export async function destroySession() {
  const { session, fakeRes } = await getSessionFromRequest(null, sessionOptions);
  await session.destroy();
  return fakeRes;
}

export async function destroyPlatformSession() {
  const { session, fakeRes } = await getSessionFromRequest(null, platformSessionOptions);
  await session.destroy();
  return fakeRes;
}
