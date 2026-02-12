import type { CSSProperties, MouseEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils';
import { resolveCategoryColorHex, type CategoryColor } from '../../types/taxonomy';

interface TagPillProps {
  tag: string;
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: (tag: string) => void;
  variant?: 'default' | 'gradient' | 'outline';
  color?: CategoryColor;
  tooltip?: string;
}

export function TagPill({ 
  tag, 
  size = 'md', 
  removable = false, 
  onRemove, 
  variant = 'default',
  color = 'cyan',
  tooltip
}: TagPillProps) {
  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    onRemove?.(tag);
  };

  const hex = resolveCategoryColorHex(color);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const rgba = (alpha: number) => `rgba(${r}, ${g}, ${b}, ${alpha})`;

  const variantStyles: Record<NonNullable<TagPillProps['variant']>, CSSProperties> = {
    default: {
      background: `linear-gradient(145deg, ${rgba(0.18)}, ${rgba(0.1)})`,
      borderColor: rgba(0.35),
      color: '#f1f5f9',
      boxShadow: `inset 0 1px 0 ${rgba(0.12)}`,
    },
    gradient: {
      background: `linear-gradient(145deg, ${rgba(0.3)}, ${rgba(0.12)})`,
      borderColor: rgba(0.5),
      color: '#f8fafc',
      boxShadow: `0 6px 16px ${rgba(0.22)}, inset 0 1px 0 ${rgba(0.14)}`,
    },
    outline: {
      background: rgba(0.08),
      borderColor: rgba(0.45),
      color: '#e2e8f0',
      boxShadow: `inset 0 0 0 1px ${rgba(0.18)}`,
    },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium rounded-full px-3 py-1 transition-all duration-300 ease-out border backdrop-blur-sm hover:-translate-y-[1px] hover:brightness-110',
        {
          'text-xs': size === 'sm',
          'text-sm': size === 'md',
        }
      )}
      style={variantStyles[variant]}
      title={tooltip}
    >
      <span className="truncate">{tag}</span>
      {removable && (
        <button
          onClick={handleRemove}
          className="ml-1 rounded-full p-0.5 transition-all duration-200 hover:bg-white/10 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-white/20"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}
