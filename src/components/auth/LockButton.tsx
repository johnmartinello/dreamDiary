import { Button } from '../ui/Button';
import { usePasswordStore } from '../../store/passwordStore';
import { useI18n } from '../../hooks/useI18n';

interface LockButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gradient' | 'destructive' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function LockButton({ 
  variant = 'ghost', 
  size = 'md', 
  className = '',
  showText = false 
}: LockButtonProps) {
  const { t } = useI18n();
  const lock = usePasswordStore((state) => state.lock);

  const handleLock = () => {
    lock();
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleLock}
      title={t('lock')}
    >
      {/* Shimmer effect on hover */}
      <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10 flex items-center">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {showText && <span className="ml-2">{t('lock')}</span>}
      </div>
    </Button>
  );
}
