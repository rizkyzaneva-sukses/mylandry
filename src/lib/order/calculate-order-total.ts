export interface OrderItemInput {
  hargaSnapshot: number;
  qty: number;
}

export interface CalculateOrderParams {
  items: OrderItemInput[];
  feeType: 'PERSEN' | 'NOMINAL';
  feeValue: number;
  biayaAntarJemput: number;
  diskon: number;
}

export interface OrderCalculationResult {
  subtotal: number;
  biayaTingkat: number;
  total: number;
}

/**
 * Pure function to calculate order totals.
 * All values are integer rupiah (no decimals).
 * 
 * Formulas:
 *   subtotal = Σ(hargaSnapshot × qty)
 *   biayaTingkat = PERSEN ? round(subtotal × nilai / 100) : nilai
 *   total = max(0, subtotal + biayaTingkat + biayaAntarJemput - diskon)
 */
export function calculateOrderTotal(params: CalculateOrderParams): OrderCalculationResult {
  const { items, feeType, feeValue, biayaAntarJemput, diskon } = params;

  // Calculate subtotal
  const subtotal = items.reduce((sum, item) => {
    return sum + item.hargaSnapshot * item.qty;
  }, 0);

  // Calculate service level fee
  let biayaTingkat = 0;
  if (feeType === 'PERSEN') {
    biayaTingkat = Math.round((subtotal * feeValue) / 100);
  } else {
    biayaTingkat = feeValue;
  }

  // Calculate total (minimum 0)
  const total = Math.max(0, subtotal + biayaTingkat + biayaAntarJemput - diskon);

  return {
    subtotal,
    biayaTingkat,
    total,
  };
}

/**
 * Calculate remaining balance
 * sisa = total - Σ(payments)
 */
export function calculateSisa(total: number, totalPembayaran: number): number {
  return total - totalPembayaran;
}

/**
 * Format integer rupiah to display string
 * Example: 15000 -> "Rp 15.000"
 */
export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Generate invoice number: INV-YYMMDD-XXX
 * Uses Asia/Jakarta timezone
 */
export function generateInvoiceDate(): string {
  const now = new Date();
  // Convert to WIB (UTC+7)
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const yy = String(wib.getUTCFullYear()).slice(2);
  const mm = String(wib.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(wib.getUTCDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}
