import { cn } from '@/lib/utils';

type BadgeVariant =
  | 'gray'
  | 'yellow'
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'navy';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gray: 'bg-gray-100 text-gray-700',
  yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  green: 'bg-green-50 text-green-700 border-green-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  orange: 'bg-orange-50 text-orange-700 border-orange-200',
  navy: 'bg-navy-50 text-navy-800 border-navy-200',
};

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  PROFILE_INCOMPLETE: 'gray',
  KYC_PENDING: 'yellow',
  KYC_SUBMITTED: 'blue',
  KYC_APPROVED: 'green',
  ACTIVE: 'green',
  SUSPENDED: 'orange',
  BANNED: 'red',
  INACTIVE: 'gray',
  ADMIN: 'navy',
  MANAGER: 'blue',
  FINANCE: 'yellow',
  VIEWER: 'gray',
};

export function StatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const variant = STATUS_VARIANT_MAP[status] ?? 'gray';
  const label = status.replace(/_/g, ' ');
  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
}
