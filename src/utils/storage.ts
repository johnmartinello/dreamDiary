import type { Dream, AIConfig, AIProvider, PasswordConfig } from '../types';
import type { UserCategory, DreamTag } from '../types/taxonomy';
import {
  buildTagId,
  DEFAULT_CATEGORY_PRESETS,
  UNCATEGORIZED_CATEGORY_ID,
  UNCATEGORIZED_COLOR,
} from '../types/taxonomy';

const DREAMS_STORAGE_KEY = 'dreams';
const TRASHED_DREAMS_STORAGE_KEY = 'trashed_dreams';
const CATEGORIES_STORAGE_KEY = 'categories';
const AI_CONFIG_GEMINI_KEY = 'ai_config_gemini';
const AI_CONFIG_LMSTUDIO_KEY = 'ai_config_lmstudio';
const PASSWORD_CONFIG_KEY = 'password_config';
const PASSWORD_HASH_KEY = 'password_hash';
const FIRST_LAUNCH_KEY = 'first_launch';
const MIGRATION_USER_CATEGORIES_KEY = 'migration_user_categories_applied_v1';

const defaultGeminiConfig: AIConfig = {
  enabled: false,
  provider: 'gemini',
  apiKey: '',
  completionEndpoint: '',
  modelName: 'gemini-2.0-flash',
};

const defaultLmStudioConfig: AIConfig = {
  enabled: false,
  provider: 'lmstudio',
  apiKey: '',
  completionEndpoint: 'http://localhost:1234/v1/chat/completions',
  modelName: 'local-model',
};

const defaultPasswordConfig: PasswordConfig = {
  isEnabled: false,
  autoLockTimeout: 10, // 10 minutes default
  lastActivity: Date.now(),
  failedAttempts: 0,
};

// Check if we're in an Electron environment
const isElectron = () => {
  return typeof window !== 'undefined' && 
         (window as any).process && 
         (window as any).process.type === 'renderer';
};

// Get Electron's app data path
const getElectronDataPath = () => {
  if (isElectron() && (window as any).require) {
    try {
      const { app } = (window as any).require('electron');
      return app.getPath('userData');
    } catch (error) {
      console.error('Error getting Electron data path:', error);
      return null;
    }
  }
  return null;
};

const LEGACY_CATEGORY_PRESETS: Record<string, { name: string; color: UserCategory['color'] }> = {
  emotions: { name: 'Emotions & Moods', color: 'amber' },
  characters: { name: 'Characters & Beings', color: 'indigo' },
  places: { name: 'Places & Environments', color: 'blue' },
  actions: { name: 'Actions & Events', color: 'orange' },
  objects: { name: 'Objects & Items', color: 'teal' },
  dreamTypes: { name: 'Dream Types & Styles', color: 'pink' },
};

const nowIso = () => new Date().toISOString();

const makeCategory = (id: string, name: string, color: UserCategory['color']): UserCategory => {
  const now = nowIso();
  return { id, name, color, createdAt: now, updatedAt: now };
};

const normalizeTag = (rawTag: any): DreamTag | null => {
  if (!rawTag || typeof rawTag !== 'object') return null;
  const categoryId = String(rawTag.categoryId || UNCATEGORIZED_CATEGORY_ID);
  const label = String(rawTag.label || '').trim();
  if (!label) return null;
  return {
    id: buildTagId(categoryId, label),
    label,
    categoryId,
    isCustom: Boolean(rawTag.isCustom),
  };
};

const normalizeDream = (dream: any): Dream => {
  const seen = new Set<string>();
  const sourceTags: any[] = Array.isArray(dream.tags) ? dream.tags : [];
  const normalizedTags = sourceTags
    .map(normalizeTag)
    .filter((tag): tag is DreamTag => Boolean(tag))
    .filter((tag) => {
      if (seen.has(tag.id)) return false;
      seen.add(tag.id);
      return true;
    });

  return {
    ...dream,
    tags: normalizedTags,
    citedDreams: Array.isArray(dream.citedDreams) ? dream.citedDreams : [],
    citedTags: Array.isArray(dream.citedTags) ? dream.citedTags : [],
  };
};

const buildInitialCategoriesFromDreams = (dreams: Dream[], trashedDreams: Dream[]): UserCategory[] => {
  const ids = new Set<string>();

  [...dreams, ...trashedDreams].forEach((dream) => {
    dream.tags.forEach((tag) => {
      if (tag.categoryId && tag.categoryId !== UNCATEGORIZED_CATEGORY_ID) {
        ids.add(tag.categoryId);
      }
    });
  });

  const fromExisting = Array.from(ids).map((id) => {
    const preset = LEGACY_CATEGORY_PRESETS[id];
    return makeCategory(id, preset?.name || id, preset?.color || UNCATEGORIZED_COLOR);
  });

  if (fromExisting.length > 0) {
    return fromExisting;
  }

  return DEFAULT_CATEGORY_PRESETS.map((preset) => makeCategory(preset.id, preset.name, preset.color));
};

// Migration function to ensure all dreams have required fields and convert legacy tags
const migrateDreams = (dreams: any[]): Dream[] => {
  return dreams.map(normalizeDream);
};

// Helpers for Electron migration flag
const electronMigration = {
  getApplied: (): boolean => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const flagPath = path.join(dataPath, `${MIGRATION_USER_CATEGORIES_KEY}.txt`);
          return fs.existsSync(flagPath);
        }
      }
      return false;
    } catch {
      return false;
    }
  },
  setApplied: (): void => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const flagPath = path.join(dataPath, `${MIGRATION_USER_CATEGORIES_KEY}.txt`);
          fs.writeFileSync(flagPath, 'done');
        }
      }
    } catch {}
  }
};

// File-based storage for Electron
const electronStorage = {
  getDreams: (): Dream[] => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const dreamsPath = path.join(dataPath, 'dreams.json');
          if (fs.existsSync(dreamsPath)) {
            const data = fs.readFileSync(dreamsPath, 'utf8');
            const dreams = JSON.parse(data);
            if (!electronMigration.getApplied()) {
              const migrated = migrateDreams(dreams);
              fs.writeFileSync(dreamsPath, JSON.stringify(migrated, null, 2));
              electronMigration.setApplied();
              return migrated;
            }
            return migrateDreams(dreams);
          }
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading dreams from Electron storage:', error);
      return [];
    }
  },

  saveDreams: (dreams: Dream[]): void => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const dreamsPath = path.join(dataPath, 'dreams.json');
          fs.writeFileSync(dreamsPath, JSON.stringify(dreams, null, 2));
        }
      }
    } catch (error) {
      console.error('Error saving dreams to Electron storage:', error);
    }
  },

  getTrashedDreams: (): Dream[] => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const trashedDreamsPath = path.join(dataPath, 'trashed_dreams.json');
          if (fs.existsSync(trashedDreamsPath)) {
            const data = fs.readFileSync(trashedDreamsPath, 'utf8');
            const dreams = JSON.parse(data);
            if (!electronMigration.getApplied()) {
              const migrated = migrateDreams(dreams);
              fs.writeFileSync(trashedDreamsPath, JSON.stringify(migrated, null, 2));
              electronMigration.setApplied();
              return migrated;
            }
            return migrateDreams(dreams);
          }
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading trashed dreams from Electron storage:', error);
      return [];
    }
  },

  saveTrashedDreams: (dreams: Dream[]): void => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const trashedDreamsPath = path.join(dataPath, 'trashed_dreams.json');
          fs.writeFileSync(trashedDreamsPath, JSON.stringify(dreams, null, 2));
        }
      }
    } catch (error) {
      console.error('Error saving trashed dreams to Electron storage:', error);
    }
  },

  getCategories: (): UserCategory[] => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const categoriesPath = path.join(dataPath, 'categories.json');
          if (fs.existsSync(categoriesPath)) {
            const data = fs.readFileSync(categoriesPath, 'utf8');
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed;
            }
          }

          const dreamsPath = path.join(dataPath, 'dreams.json');
          const trashedDreamsPath = path.join(dataPath, 'trashed_dreams.json');
          const dreams = fs.existsSync(dreamsPath) ? migrateDreams(JSON.parse(fs.readFileSync(dreamsPath, 'utf8'))) : [];
          const trashedDreams = fs.existsSync(trashedDreamsPath) ? migrateDreams(JSON.parse(fs.readFileSync(trashedDreamsPath, 'utf8'))) : [];
          const seeded = buildInitialCategoriesFromDreams(dreams, trashedDreams);
          fs.writeFileSync(categoriesPath, JSON.stringify(seeded, null, 2));
          return seeded;
        }
      }
      return [];
    } catch (error) {
      console.error('Error loading categories from Electron storage:', error);
      return [];
    }
  },

  saveCategories: (categories: UserCategory[]): void => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const categoriesPath = path.join(dataPath, 'categories.json');
          fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
        }
      }
    } catch (error) {
      console.error('Error saving categories to Electron storage:', error);
    }
  },

  getAIConfig: (provider: AIProvider = 'gemini'): AIConfig => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const configPath = path.join(dataPath, `ai_config_${provider}.json`);
          if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(data);
          }
        }
      }
      return provider === 'gemini' ? defaultGeminiConfig : defaultLmStudioConfig;
    } catch (error) {
      console.error('Error loading AI config from Electron storage:', error);
      return provider === 'gemini' ? defaultGeminiConfig : defaultLmStudioConfig;
    }
  },

  saveAIConfig: (config: AIConfig): void => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const configPath = path.join(dataPath, `ai_config_${config.provider}.json`);
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }
      }
    } catch (error) {
      console.error('Error saving AI config to Electron storage:', error);
    }
  },

  getAllAIConfigs: (): Record<AIProvider, AIConfig> => {
    return {
      gemini: electronStorage.getAIConfig('gemini'),
      lmstudio: electronStorage.getAIConfig('lmstudio'),
    };
  },

  // Password storage methods
  getPasswordConfig: (): PasswordConfig => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const configPath = path.join(dataPath, 'password_config.json');
          if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(data);
          }
        }
      }
      return defaultPasswordConfig;
    } catch (error) {
      console.error('Error loading password config from Electron storage:', error);
      return defaultPasswordConfig;
    }
  },

  savePasswordConfig: (config: PasswordConfig): void => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const configPath = path.join(dataPath, 'password_config.json');
          fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        }
      }
    } catch (error) {
      console.error('Error saving password config to Electron storage:', error);
    }
  },

  getPasswordHash: (): string | null => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const hashPath = path.join(dataPath, 'password_hash.txt');
          if (fs.existsSync(hashPath)) {
            return fs.readFileSync(hashPath, 'utf8');
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error loading password hash from Electron storage:', error);
      return null;
    }
  },

  savePasswordHash: (hash: string): void => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const hashPath = path.join(dataPath, 'password_hash.txt');
          fs.writeFileSync(hashPath, hash);
        }
      }
    } catch (error) {
      console.error('Error saving password hash to Electron storage:', error);
    }
  },

  isFirstLaunch: (): boolean => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const firstLaunchPath = path.join(dataPath, 'first_launch.txt');
          return !fs.existsSync(firstLaunchPath);
        }
      }
      return true;
    } catch (error) {
      console.error('Error checking first launch in Electron:', error);
      return true;
    }
  },

  setFirstLaunchComplete: (): void => {
    try {
      if (isElectron() && (window as any).require) {
        const fs = (window as any).require('fs');
        const path = (window as any).require('path');
        const dataPath = getElectronDataPath();
        if (dataPath) {
          const firstLaunchPath = path.join(dataPath, 'first_launch.txt');
          fs.writeFileSync(firstLaunchPath, 'completed');
        }
      }
    } catch (error) {
      console.error('Error setting first launch complete in Electron:', error);
    }
  },
};

// Browser-based storage (localStorage)
const browserStorage = {
  getDreams: (): Dream[] => {
    try {
      const stored = localStorage.getItem(DREAMS_STORAGE_KEY);
      const dreams = stored ? JSON.parse(stored) : [];
      const applied = localStorage.getItem(MIGRATION_USER_CATEGORIES_KEY) === 'true';
      if (!applied && dreams.length > 0) {
        const migrated = migrateDreams(dreams);
        localStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(migrated));
        localStorage.setItem(MIGRATION_USER_CATEGORIES_KEY, 'true');
        return migrated;
      }
      return migrateDreams(dreams);
    } catch (error) {
      console.error('Error loading dreams from storage:', error);
      return [];
    }
  },

  saveDreams: (dreams: Dream[]): void => {
    try {
      localStorage.setItem(DREAMS_STORAGE_KEY, JSON.stringify(dreams));
    } catch (error) {
      console.error('Error saving dreams to storage:', error);
    }
  },

  getTrashedDreams: (): Dream[] => {
    try {
      const stored = localStorage.getItem(TRASHED_DREAMS_STORAGE_KEY);
      const dreams = stored ? JSON.parse(stored) : [];
      const applied = localStorage.getItem(MIGRATION_USER_CATEGORIES_KEY) === 'true';
      if (!applied && dreams.length > 0) {
        const migrated = migrateDreams(dreams);
        localStorage.setItem(TRASHED_DREAMS_STORAGE_KEY, JSON.stringify(migrated));
        localStorage.setItem(MIGRATION_USER_CATEGORIES_KEY, 'true');
        return migrated;
      }
      return migrateDreams(dreams);
    } catch (error) {
      console.error('Error loading trashed dreams from storage:', error);
      return [];
    }
  },

  saveTrashedDreams: (dreams: Dream[]): void => {
    try {
      localStorage.setItem(TRASHED_DREAMS_STORAGE_KEY, JSON.stringify(dreams));
    } catch (error) {
      console.error('Error saving trashed dreams to storage:', error);
    }
  },

  getCategories: (): UserCategory[] => {
    try {
      const stored = localStorage.getItem(CATEGORIES_STORAGE_KEY);
      const categories = stored ? JSON.parse(stored) : [];
      if (Array.isArray(categories) && categories.length > 0) {
        return categories;
      }
      const dreams = browserStorage.getDreams();
      const trashedDreams = browserStorage.getTrashedDreams();
      const seeded = buildInitialCategoriesFromDreams(dreams, trashedDreams);
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    } catch (error) {
      console.error('Error loading categories from storage:', error);
      return [];
    }
  },

  saveCategories: (categories: UserCategory[]): void => {
    try {
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    } catch (error) {
      console.error('Error saving categories to storage:', error);
    }
  },

  getAIConfig: (provider: AIProvider = 'gemini'): AIConfig => {
    try {
      const key = provider === 'gemini' ? AI_CONFIG_GEMINI_KEY : AI_CONFIG_LMSTUDIO_KEY;
      const defaultConfig = provider === 'gemini' ? defaultGeminiConfig : defaultLmStudioConfig;
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultConfig;
    } catch (error) {
      console.error('Error loading AI config from storage:', error);
      return provider === 'gemini' ? defaultGeminiConfig : defaultLmStudioConfig;
    }
  },

  saveAIConfig: (config: AIConfig): void => {
    try {
      const key = config.provider === 'gemini' ? AI_CONFIG_GEMINI_KEY : AI_CONFIG_LMSTUDIO_KEY;
      localStorage.setItem(key, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving AI config to storage:', error);
    }
  },

  getAllAIConfigs: (): Record<AIProvider, AIConfig> => {
    return {
      gemini: browserStorage.getAIConfig('gemini'),
      lmstudio: browserStorage.getAIConfig('lmstudio'),
    };
  },

  // Password storage methods
  getPasswordConfig: (): PasswordConfig => {
    try {
      const stored = localStorage.getItem(PASSWORD_CONFIG_KEY);
      return stored ? JSON.parse(stored) : defaultPasswordConfig;
    } catch (error) {
      console.error('Error loading password config from storage:', error);
      return defaultPasswordConfig;
    }
  },

  savePasswordConfig: (config: PasswordConfig): void => {
    try {
      localStorage.setItem(PASSWORD_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
      console.error('Error saving password config to storage:', error);
    }
  },

  getPasswordHash: (): string | null => {
    try {
      return localStorage.getItem(PASSWORD_HASH_KEY);
    } catch (error) {
      console.error('Error loading password hash from storage:', error);
      return null;
    }
  },

  savePasswordHash: (hash: string): void => {
    try {
      localStorage.setItem(PASSWORD_HASH_KEY, hash);
    } catch (error) {
      console.error('Error saving password hash to storage:', error);
    }
  },

  isFirstLaunch: (): boolean => {
    try {
      return localStorage.getItem(FIRST_LAUNCH_KEY) === null;
    } catch (error) {
      console.error('Error checking first launch:', error);
      return true;
    }
  },

  setFirstLaunchComplete: (): void => {
    try {
      localStorage.setItem(FIRST_LAUNCH_KEY, 'completed');
    } catch (error) {
      console.error('Error setting first launch complete:', error);
    }
  },
};

// Choose storage method based on environment
const storage = isElectron() ? electronStorage : browserStorage;

export { storage };
