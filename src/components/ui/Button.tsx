import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cn } from '../../utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variantClasses = {
      primary: 'bg-gradient-to-r from-cyan-500 to-indigo-600 text-white hover:from-cyan-400 hover:to-indigo-500 shadow-glow-sky border border-gray-400/30 hover:border-gray-300/50',
      secondary: 'glass text-white hover:glass-hover border border-gray-400/30 hover:border-gray-300/50',
      ghost: 'text-gray-200 hover:text-white hover:bg-white/5 hover:glass border border-gray-400/30 hover:border-gray-300/50',
      gradient: 'bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 text-white hover:from-purple-400 hover:via-pink-400 hover:to-rose-400 shadow-glow-purple border border-gray-400/30 hover:border-gray-300/50',
      destructive: 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-400 hover:to-rose-500 shadow-glow-red border border-red-400/30 hover:border-red-300/50',
      outline: 'bg-transparent text-gray-200 border border-gray-400/30 hover:bg-white/5 hover:border-gray-300/50',
    };

    return (
      <button
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group cursor-pointer',
          variantClasses[variant],
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 py-2': size === 'md',
            'h-12 px-6 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {/* Shimmer effect for gradient buttons */}
        {(variant === 'primary' || variant === 'gradient') && (
          <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}
        <div className="relative z-10 flex items-center gap-2">{props.children}</div>
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
