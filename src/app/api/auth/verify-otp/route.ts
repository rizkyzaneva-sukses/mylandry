import { prisma } from '@/lib/prisma';
import { normalizeIndonesiaPhone } from '@/lib/phone/normalize-indonesia-phone';
import { hashPassword } from '@/lib/auth/password';
import { provisionTenant } from '@/server/services/provision-tenant';
import { setSession } from '@/lib/session';
import { apiSuccess, apiError } from '@/lib/utils';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const MAX_OTP_ATTEMPTS = 5;

const verifyOtpSchema = z.object({
  nomorWa: z.string().min(1, 'Nomor WhatsApp wajib diisi.'),
  otp: z.string().length(6, 'OTP harus 6 digit.'),
  namaLaundry: z.string().min(1, 'Nama laundry wajib diisi.'),
  namaPemilik: z.string().min(1, 'Nama pemilik wajib diisi.'),
  username: z.string().min(3, 'Username minimal 3 karakter.').max(50),
  password: z.string().min(8, 'Password minimal 8 karakter.'),
  kodeKupon: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyOtpSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      return apiError(firstError.message, 422);
    }

    const { nomorWa, otp, namaLaundry, namaPemilik, username, password, kodeKupon } = parsed.data;

    // Normalize phone
    const normalizedPhone = normalizeIndonesiaPhone(nomorWa);
    if (!normalizedPhone) {
      return apiError('Nomor WhatsApp tidak valid.', 422);
    }

    // Find OTP record
    const otpRecord = await prisma.otpVerification.findUnique({
      where: { nomorWa: normalizedPhone },
    });

    if (!otpRecord) {
      return apiError('OTP belum diminta. Silakan minta OTP terlebih dahulu.', 422);
    }

    // Check if already verified
    if (otpRecord.isVerified) {
      return apiError('OTP sudah diverifikasi. Silakan login.', 422);
    }

    // Check attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      return apiError('Terlalu banyak percobaan. Silakan minta OTP baru.', 422);
    }

    // Check expiry
    if (new Date() > otpRecord.expiresAt) {
      return apiError('OTP sudah kedaluwarsa. Silakan minta OTP baru.', 422);
    }

    // Verify OTP (timing-safe comparison)
    const isValid = await bcrypt.compare(otp, otpRecord.otpHash);

    if (!isValid) {
      // Increment attempts
      await prisma.otpVerification.update({
        where: { nomorWa: normalizedPhone },
        data: { attempts: otpRecord.attempts + 1 },
      });

      const remaining = MAX_OTP_ATTEMPTS - otpRecord.attempts - 1;
      return apiError(
        `OTP salah. Sisa percobaan: ${remaining}`,
        422
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findFirst({
      where: { username },
    });

    if (existingUser) {
      return apiError('Username sudah digunakan. Pilih username lain.', 422);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Provision tenant atomically
    const result = await provisionTenant({
      namaLaundry,
      namaPemilik,
      nomorWa: normalizedPhone,
      username,
      passwordHash,
    });

    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { nomorWa: normalizedPhone },
      data: { isVerified: true },
    });

    // Create session for the new owner
    await setSession({
      userId: result.owner.id,
      tenantId: result.tenant.id,
      username: result.owner.username,
      nama: result.owner.nama,
      role: result.owner.role,
      isLoggedIn: true,
    });

    return apiSuccess(
      {
        tenantId: result.tenant.id,
        redirectUrl: '/dashboard',
      },
      'Pendaftaran berhasil! Selamat datang di MyLandry.'
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return apiError('Pendaftaran belum dapat diproses. Silakan coba kembali.', 500);
  }
}
