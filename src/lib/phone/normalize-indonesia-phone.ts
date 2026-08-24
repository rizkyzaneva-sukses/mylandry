/**
 * Normalize Indonesian phone number to E.164 format without + prefix
 * Accepts: 08xxx, 628xxx, +628xxx, 0812xxx, etc.
 * Returns: 628xxxxxxxxxx or null if invalid
 */
export function normalizeIndonesiaPhone(phone: string): string | null {
  // Remove all whitespace, dashes, and parentheses
  let cleaned = phone.replace(/[\s\-()]/g, '');

  // Remove leading +
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }

  // Convert 08xxx to 628xxx
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  }

  // Must start with 62 and have at least 10 digits total (62 + 8+ digits)
  if (!/^62\d{8,13}$/.test(cleaned)) {
    return null;
  }

  return cleaned;
}

/**
 * Format phone number for display: 6281234567890 -> 0812-3456-7890
 */
export function formatPhoneDisplay(phone: string): string {
  if (phone.startsWith('62')) {
    const local = '0' + phone.slice(2);
    if (local.length >= 11) {
      return `${local.slice(0, 4)}-${local.slice(4, 8)}-${local.slice(8)}`;
    }
    return local;
  }
  return phone;
}
