import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { usePasswordStore } from '../../store/passwordStore';
import { useI18n } from '../../hooks/useI18n';

interface LockScreenProps {
  isFirstLaunch?: boolean;
}

export function LockScreen({ isFirstLaunch = false }: LockScreenProps) {
  const { t } = useI18n();
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  const { setPassword, verifyPassword, unlock } = usePasswordStore();

  useEffect(() => {
    // Focus password input on mount
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isFirstLaunch) {
        // First launch - create password
        if (passwordInput !== confirmPassword) {
          setError(t('passwordsDoNotMatch'));
          return;
        }
        if (passwordInput.length < 1) {
          setError(t('passwordRequired'));
          return;
        }
        await setPassword(passwordInput);
      } else {
        // Regular login
        const isValid = await verifyPassword(passwordInput);
        if (!isValid) {
          setError(t('wrongPassword'));
          setPasswordInput('');
          return;
        }
        unlock();
      }
    } catch (err) {
      setError(t('errorOccurred'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      {/* Animated background elements - more subtle */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-white/4 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="glass rounded-2xl p-8 shadow-2xl border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 glass rounded-2xl flex items-center justify-center border border-white/20 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <svg className="w-8 h-8 text-white/90 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isFirstLaunch ? t('welcomeToDreamWeave') : 'Dream Diary'}
            </h1>
            <p className="text-white/60 text-sm">
              {isFirstLaunch 
                ? t('createPasswordToProtect') 
                : t('enterPasswordToContinue')
              }
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                ref={passwordInputRef}
                type="password"
                variant="glass"
                placeholder={t('password')}
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full"
                disabled={isLoading}
              />
            </div>

            {isFirstLaunch && (
              <div>
                <Input
                  type="password"
                  variant="glass"
                  placeholder={t('confirmPassword')}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
            )}

            {error && (
              <div className="text-red-300 text-sm text-center glass rounded-lg p-3 border border-red-400/30 bg-red-500/5">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="ghost"
              size="lg"
              className="w-full glass text-white/90 font-medium shadow-inner-lg border border-white/20 hover:glass-hover hover:text-white hover:border-white/30 relative overflow-hidden group cursor-pointer transition-all duration-300"
              disabled={isLoading}
            >
              <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    {isFirstLaunch ? t('creating') : t('unlocking')}
                  </div>
                ) : (
                  isFirstLaunch ? t('createPassword') : t('unlock')
                )}
              </span>
            </Button>
          </form>

          {/* Additional info for first launch */}
          {isFirstLaunch && (
            <div className="mt-6 p-4 glass rounded-lg border border-white/20">
              <p className="text-white/70 text-xs text-center">
                {t('noPasswordRecovery')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
