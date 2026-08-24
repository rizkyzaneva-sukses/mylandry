import { cn } from '@/lib/utils';

type OrderStatus = 'DITERIMA' | 'DIPROSES' | 'SIAP_DIAMBIL' | 'SELESAI' | 'DIBATALKAN';

const statusConfig: Record<OrderStatus, { label: string; className: string }> = {
  DITERIMA: {
    label: 'Diterima',
    className: 'bg-info-subtle text-info',
  },
  DIPROSES: {
    label: 'Diproses',
    className: 'bg-warning-subtle text-warning',
  },
  SIAP_DIAMBIL: {
    label: 'Siap Diambil',
    className: 'bg-accent-subtle text-accent-strong',
  },
  SELESAI: {
    label: 'Selesai',
    className: 'bg-success-subtle text-success',
  },
  DIBATALKAN: {
    label: 'Dibatalkan',
    className: 'bg-error-subtle text-error',
  },
};

interface StatusBadgeProps {
  status: OrderStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

type PaymentStatus = 'DP' | 'LUNAS';

export function PaymentBadge({ status, sisa }: { status: PaymentStatus; sisa?: number }) {
  if (status === 'LUNAS') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-success-subtle text-success">
        LUNAS
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full bg-warning-subtle text-warning">
      DP / Kurang Rp {sisa?.toLocaleString('id-ID')}
    </span>
  );
}
