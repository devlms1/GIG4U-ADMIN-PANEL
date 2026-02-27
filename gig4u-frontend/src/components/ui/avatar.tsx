import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name?: string | null;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles: Record<string, string> = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  const initials = name ? getInitials(name) : '?';

  const pixelSizes: Record<string, number> = { sm: 32, md: 40, lg: 56, xl: 80 };

  if (src) {
    return (
      <Image
        src={src}
        alt={name || 'Avatar'}
        width={pixelSizes[size]}
        height={pixelSizes[size]}
        className={cn(
          'rounded-full object-cover',
          sizeStyles[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-navy-100 text-navy-700 flex items-center justify-center font-semibold',
        sizeStyles[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
