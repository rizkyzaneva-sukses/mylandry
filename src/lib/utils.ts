import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to WIB display format
 * Example: "20 Agu 2026, 14:30 WIB"
 */
export function formatDateWIB(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).replace('.', ':') + ' WIB';
}

/**
 * Get current WIB date components for quota calculation
 */
export function getWIBDateComponents(date?: Date): { year: number; month: number } {
  const d = date || new Date();
  const wibString = d.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' });
  const wibDate = new Date(wibString);
  return {
    year: wibDate.getFullYear(),
    month: wibDate.getMonth() + 1, // 1-indexed
  };
}

/**
 * Standard API response format
 */
export function apiSuccess(data: unknown, message = 'Berhasil') {
  return Response.json({ success: true, data, message, errors: null });
}

export function apiError(message: string, status = 400, errors?: unknown) {
  return Response.json(
    { success: false, data: null, message, errors },
    { status }
  );
}
