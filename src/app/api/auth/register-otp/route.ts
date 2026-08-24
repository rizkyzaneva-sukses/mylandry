import { prisma } from '@/lib/prisma';
import { normalizeIndonesiaPhone } from '@/lib/phone/normalize-indonesia-phone';
import { apiSuccess, apiError } from '@/lib/utils';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const OTP_COOLDOWN_SECONDS = 60;
const OTP_MAX_HOURLY = 3;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nomorWa } = body;

    if (!nomorWa) {
      return apiError('Nomor WhatsApp wajib diisi.', 422);
    }

    // Normalize phone
    const normalizedPhone = normalizeIndonesiaPhone(nomorWa);
    if (!normalizedPhone) {
      return apiError('Nomor WhatsApp tidak valid. Gunakan format 08xxx atau 62xxx.', 422);
    }

    // Check cooldown (60 seconds since last send)
    const lastOtp = await prisma.otpVerification.findUnique({
      where: { nomorWa: normalizedPhone },
    });

    if (lastOtp) {
      const secondsSinceLastSend = (Date.now() - lastOtp.lastSentAt.getTime()) / 1000;
      if (secondsSinceLastSend < OTP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(OTP_COOLDOWN_SECONDS - secondsSinceLastSend);
        return apiError(
          `Tunggu ${remaining} detik sebelum meminta OTP lagi.`,
          429
        );
      }

      // Check hourly limit
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      if (lastOtp.lastSentAt > hourAgo && lastOtp.hourlySentCount >= OTP_MAX_HOURLY) {
        return apiError(
          'Batas pengiriman OTP tercapai. Coba lagi dalam 1 jam.',
          429
        );
      }
    }

    // Generate OTP
    const otp = String(crypto.randomInt(10 ** (OTP_LENGTH - 1), 10 ** OTP_LENGTH));
    const otpHash = await bcrypt.hash(otp, 12);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Upsert OTP record
    await prisma.otpVerification.upsert({
      where: { nomorWa: normalizedPhone },
      create: {
        nomorWa: normalizedPhone,
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
        hourlySentCount: 1,
        isVerified: false,
      },
      update: {
        otpHash,
        expiresAt,
        attempts: 0,
        lastSentAt: new Date(),
        hourlySentCount: lastOtp
          ? (lastOtp.lastSentAt > hourAgo ? lastOtp.hourlySentCount + 1 : 1)
          : 1,
        isVerified: false,
      },
    });

    // Create outbox message (worker will send via WAHA)
    await prisma.pesanWaOutbox.create({
      data: {
        nomorTujuan: normalizedPhone,
        pesan: `Kode OTP MyLandry Anda: ${otp}\nBerlaku selama ${OTP_EXPIRY_MINUTES} menit.\nJangan bagikan kode ini kepada siapapun.`,
        tipe: 'SIGNUP_OTP',
        status: 'PENDING',
      },
    });

    return apiSuccess(null, 'Kode OTP telah dikirimkan ke WhatsApp Anda.');
  } catch (error) {
    console.error('Register OTP error:', error);
    return apiError('Terjadi kesalahan. Silakan coba kembali.', 500);
  }
}
