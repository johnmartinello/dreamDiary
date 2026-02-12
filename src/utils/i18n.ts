import { en } from '../locales/en';
import { ptBR } from '../locales/pt-BR';

export type Language = 'en' | 'pt-BR';

export const translations = {
  en,
  'pt-BR': ptBR,
};

export type TranslationKey = keyof typeof en | string;

// Function to get nested object properties
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

// Function to handle pluralization
function handlePluralization(text: string, count: number, locale: Language): string {
  // Find plural patterns like {count} and {plural}
  return text.replace(/\{count\}/g, count.toString()).replace(/\{plural\}/g, () => {
    // Determine which plural form to use based on count
    if (count === 1) {
      return '';
    }
    
    // For Portuguese, add 's' for most words, but handle special cases
    if (locale === 'pt-BR') {
      // Special cases for Portuguese pluralization
      if (text.includes('categoria')) {
        return 's';
      }
      if (text.includes('sonho')) {
        return 's';
      }
      if (text.includes('citação')) {
        return 'ões';
      }
      return 's';
    }
    
    // For English, just add 's' for most cases
    return 's';
  });
}

// Function to interpolate variables in translation strings
function interpolate(text: string, variables: Record<string, any> = {}, locale: Language): string {
  let result = text;
  
  // Handle pluralization first
  if (variables.count !== undefined) {
    result = handlePluralization(result, variables.count, locale);
  }
  
  // Then handle other variables
  Object.entries(variables).forEach(([key, value]) => {
    if (key !== 'count') {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
  });
  
  return result;
}

export function t(key: TranslationKey, variables: Record<string, any> = {}, locale: Language = 'en'): string {
  const translation = translations[locale];
  if (!translation) {
    console.warn(`Translation for locale '${locale}' not found`);
    return key;
  }
  
  const value = getNestedValue(translation, key);
  if (value === undefined) {
    console.warn(`Translation key '${key}' not found for locale '${locale}'`);
    return key;
  }
  
  if (typeof value === 'string') {
    return interpolate(value, variables, locale);
  }
  
  return String(value);
}

export function tArray(key: TranslationKey, locale: Language = 'en'): string[] {
  const translation = translations[locale];
  if (!translation) {
    console.warn(`Translation for locale '${locale}' not found`);
    return [];
  }
  
  const value = getNestedValue(translation, key);
  if (value === undefined || !Array.isArray(value)) {
    console.warn(`Translation key '${key}' not found or not an array for locale '${locale}'`);
    return [];
  }
  
  return value;
}

// Hook for React components
export function useTranslation(locale: Language = 'en') {
  return {
    t: (key: TranslationKey, variables: Record<string, any> = {}) => t(key, variables, locale),
    tArray: (key: TranslationKey) => tArray(key, locale),
    locale,
  };
}

// Get available languages
export function getAvailableLanguages(): Array<{ code: Language; name: string; nativeName: string }> {
  return [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)' },
  ];
}

// Get language name by code
export function getLanguageName(code: Language): string {
  const languages = getAvailableLanguages();
  const language = languages.find(lang => lang.code === code);
  return language ? language.name : code;
}

// Get native language name by code
export function getNativeLanguageName(code: Language): string {
  const languages = getAvailableLanguages();
  const language = languages.find(lang => lang.code === code);
  return language ? language.nativeName : code;
}
