import type { PropertyStatus } from '@/types/property';
import { statusMeta } from '@/utils/status';

interface StatusBadgeProps {
  status: PropertyStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const meta = statusMeta(status);
  const padding =
    size === 'sm' ? 'px-1.5 py-[2px] text-[9px]' : 'px-2 py-0.5 text-[10px]';

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium tracking-wide ${meta.className} ${padding}`}
    >
      <span className={`h-1 w-1 rounded-full ${meta.dotClass}`} />
      {meta.label}
    </span>
  );
}
