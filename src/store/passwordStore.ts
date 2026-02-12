import { create } from 'zustand';
import type { PasswordStore, PasswordConfig } from '../types';
import { storage } from '../utils/storage';
import { hashPassword, verifyPassword } from '../utils';

export const usePasswordStore = create<PasswordStore>((set, get) => {
  const isFirstLaunch = storage.isFirstLaunch();
  const passwordHash = storage.getPasswordHash();
  const config = storage.getPasswordConfig();
  
  // Always start locked unless it's first launch (no password set yet)
  const isLocked = !isFirstLaunch && passwordHash !== null;
  
  return {
    isLocked,
    isFirstLaunch,
    passwordHash,
    config,

  setPassword: async (password: string) => {
    const hash = await hashPassword(password);
    const config: PasswordConfig = {
      ...get().config,
      isEnabled: true,
      lastActivity: Date.now(),
      failedAttempts: 0, // Reset failed attempts when setting new password
    };
    
    storage.savePasswordHash(hash);
    storage.savePasswordConfig(config);
    storage.setFirstLaunchComplete();
    
    set({
      passwordHash: hash,
      config,
      isFirstLaunch: false,
      isLocked: false,
    });

    // Ensure default categories are seeded as soon as the first login completes.
    storage.getCategories();
  },

  verifyPassword: async (password: string) => {
    const { passwordHash, config } = get();
    if (!passwordHash) return false;
    
    const isValid = await verifyPassword(password, passwordHash);
    if (isValid) {
      set((state) => ({
        isLocked: false,
        config: {
          ...state.config,
          lastActivity: Date.now(),
          failedAttempts: 0, // Reset failed attempts on successful login
        },
      }));
      storage.savePasswordConfig(get().config);
    } else {
      // Increment failed attempts
      const newFailedAttempts = config.failedAttempts + 1;
      
      // Check if we've reached 100 failed attempts
      if (newFailedAttempts >= 100) {
        // Secret feature: unlock after 100 failed attempts
        set((state) => ({
          isLocked: false,
          config: {
            ...state.config,
            lastActivity: Date.now(),
            failedAttempts: 0, // Reset after unlocking
          },
        }));
        storage.savePasswordConfig(get().config);
        return true; // Return true to indicate "success"
      } else {
        // Update failed attempts count
        set((state) => ({
          config: {
            ...state.config,
            failedAttempts: newFailedAttempts,
          },
        }));
        storage.savePasswordConfig(get().config);
      }
    }
    return isValid;
  },

  lock: () => {
    set({ isLocked: true });
  },

  unlock: () => {
    set((state) => ({
      isLocked: false,
      config: {
        ...state.config,
        lastActivity: Date.now(),
      },
    }));
    storage.savePasswordConfig(get().config);
    // Ensure categories are present for the session immediately after login.
    storage.getCategories();
  },

  updateActivity: () => {
    set((state) => ({
      config: {
        ...state.config,
        lastActivity: Date.now(),
      },
    }));
    storage.savePasswordConfig(get().config);
  },

  checkAutoLock: () => {
    const { config, isLocked } = get();
    if (!config.isEnabled || isLocked) return false;
    
    const now = Date.now();
    const timeSinceActivity = now - config.lastActivity;
    const timeoutMs = config.autoLockTimeout * 60 * 1000; // Convert minutes to milliseconds
    
    if (timeSinceActivity >= timeoutMs) {
      set({ isLocked: true });
      return true;
    }
    
    return false;
  },

  resetPassword: () => {
    const config: PasswordConfig = {
      isEnabled: false,
      autoLockTimeout: 10,
      lastActivity: Date.now(),
      failedAttempts: 0,
    };
    
    storage.savePasswordHash('');
    storage.savePasswordConfig(config);
    storage.setFirstLaunchComplete();
    
    set({
      passwordHash: null,
      config,
      isFirstLaunch: false,
      isLocked: false,
    });
  },

  updateConfig: (newConfig: Partial<PasswordConfig>) => {
    const config = { ...get().config, ...newConfig };
    storage.savePasswordConfig(config);
    set({ config });
  },
  };
});
