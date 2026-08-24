import { destroySession } from '@/lib/session';
import { apiSuccess } from '@/lib/utils';

export async function POST() {
  await destroySession();
  return apiSuccess(null, 'Logout berhasil.');
}
