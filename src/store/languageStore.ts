import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '../utils/i18n';

interface LanguageStore {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language: Language) => set({ language }),
    }),
    {
      name: 'dream-diary-language',
    }
  )
);
