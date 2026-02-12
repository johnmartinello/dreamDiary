import { useEffect, useRef } from 'react';
import { usePasswordStore } from '../store/passwordStore';

export function useActivityTracker() {
  const { updateActivity, checkAutoLock, config } = usePasswordStore();
  const autoLockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityUpdateRef = useRef(0);

  useEffect(() => {
    if (!config.isEnabled) return;

    const handleActivity = () => {
      const now = Date.now();
      // Avoid writing to storage on every high-frequency pointer event.
      if (now - lastActivityUpdateRef.current < 1500) {
        return;
      }
      lastActivityUpdateRef.current = now;
      updateActivity();
    };

    const startAutoLockCheck = () => {
      // Check for auto-lock every 30 seconds
      autoLockIntervalRef.current = setInterval(() => {
        checkAutoLock();
      }, 30000);
    };

    const stopAutoLockCheck = () => {
      if (autoLockIntervalRef.current) {
        clearInterval(autoLockIntervalRef.current);
        autoLockIntervalRef.current = null;
      }
    };

    // Track meaningful user interactions while avoiding high-frequency noise.
    const events = ['mousedown', 'keydown', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Start auto-lock checking
    startAutoLockCheck();

    // Initial activity update
    lastActivityUpdateRef.current = Date.now();
    updateActivity();

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      stopAutoLockCheck();
    };
  }, [config.isEnabled, updateActivity, checkAutoLock]);

  return null;
}
