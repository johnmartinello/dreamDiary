import { useState, useEffect } from 'react';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDate = (dateString: string, locale: string = 'en-US'): string => {
  // Validate input
  if (!dateString || typeof dateString !== 'string') {
    return 'Invalid Date';
  }
  
  // Handle date strings safely by ensuring they're treated as local dates
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return 'Invalid Date';
  }
  
  const [year, month, day] = parts.map(Number);
  
  // Validate date components
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return 'Invalid Date';
  }
  
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return 'Invalid Date';
  }
  
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const normalizedLocale = locale.toLowerCase();
  const yearFormatted = date.getFullYear();
  const monthFormatted = String(date.getMonth() + 1).padStart(2, '0');
  const dayFormatted = String(date.getDate()).padStart(2, '0');

  if (normalizedLocale.startsWith('pt')) {
    return `${dayFormatted}/${monthFormatted}/${yearFormatted}`;
  }

  // Default to month/day for English-like locales.
  return `${monthFormatted}/${dayFormatted}/${yearFormatted}`;
};

export const formatDateForInput = (dateString: string): string => {
  // Validate input
  if (!dateString || typeof dateString !== 'string') {
    return getCurrentDateString();
  }
  
  // Handle date strings safely by ensuring they're treated as local dates
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return getCurrentDateString();
  }
  
  const [year, month, day] = parts.map(Number);
  
  // Validate date components
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return getCurrentDateString();
  }
  
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return getCurrentDateString();
  }
  
  const date = new Date(year, month - 1, day); // month is 0-indexed
  
  // Check if the date is valid before calling toISOString
  if (isNaN(date.getTime())) {
    return getCurrentDateString();
  }
  
  try {
    return date.toISOString().split('T')[0];
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return getCurrentDateString();
  }
};

export const getCurrentDateString = (): string => {
  // Get current date in local timezone as YYYY-MM-DD
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentTimeString = (): string => {
  // Get current time in local timezone as HH:mm:ss
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const formatTime = (timeString?: string): string => {
  if (!timeString || typeof timeString !== 'string') return '';
  
  const parts = timeString.split(':');
  if (parts.length < 2) return '';
  
  const [hours, minutes, seconds] = parts.map(Number);
  
  if (isNaN(hours) || isNaN(minutes)) return '';
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return '';
  
  const h = String(hours).padStart(2, '0');
  const m = String(minutes).padStart(2, '0');
  const s = seconds !== undefined && !isNaN(seconds) ? `:${String(seconds).padStart(2, '0')}` : '';
  
  return `${h}:${m}${s}`;
};

export const formatDateTime = (dateString: string, timeString?: string, locale: string = 'en-US'): string => {
  const formattedDate = formatDate(dateString, locale);
  if (formattedDate === 'Invalid Date') return formattedDate;
  
  const formattedTime = formatTime(timeString);
  if (!formattedTime) return formattedDate;
  
  return `${formattedDate} ${formattedTime}`;
};

export const getTodayFormatted = (locale: string = 'en-US'): string => {
  // Get today's date in a locale-aware title format.
  const now = new Date();
  const normalizedLocale = locale.toLowerCase();
  const dayFormatted = String(now.getDate()).padStart(2, '0');
  const yearFormatted = now.getFullYear();
  const monthLong = new Intl.DateTimeFormat(locale, { month: 'long' }).format(now);

  if (normalizedLocale.startsWith('pt')) {
    const monthCapitalized = monthLong.charAt(0).toUpperCase() + monthLong.slice(1);
    return `${dayFormatted} de ${monthCapitalized}, ${yearFormatted}`;
  }

  return `${monthLong} ${dayFormatted}, ${yearFormatted}`;
};

export const compareDates = (dateA: string, dateB: string, timeA?: string, timeB?: string): number => {
  // Safe date comparison that treats dates as local dates, with optional time
  try {
    const [yearA, monthA, dayA] = dateA.split('-').map(Number);
    const [yearB, monthB, dayB] = dateB.split('-').map(Number);
    
    // Validate dates
    if (isNaN(yearA) || isNaN(monthA) || isNaN(dayA) || 
        isNaN(yearB) || isNaN(monthB) || isNaN(dayB)) {
      return 0;
    }
    
    const stampA = new Date(yearA, monthA - 1, dayA).getTime();
    const stampB = new Date(yearB, monthB - 1, dayB).getTime();
    
    // Check if dates are valid
    if (isNaN(stampA) || isNaN(stampB)) {
      return 0;
    }
    
    // If dates are equal, compare by time
    if (stampA === stampB && (timeA || timeB)) {
      const parseTime = (t?: string): number => {
        if (!t) return 0;
        const parts = t.split(':').map(Number);
        const h = parts[0] || 0;
        const m = parts[1] || 0;
        const s = parts[2] || 0;
        return h * 3600 + m * 60 + s;
      };
      const secondsA = parseTime(timeA);
      const secondsB = parseTime(timeB);
      return secondsB - secondsA; // Descending order (newest first)
    }
    
    return stampB - stampA; // Descending order (newest first)
  } catch (error) {
    console.error('Error comparing dates:', error);
    return 0;
  }
};

export const cn = (...classes: (string | undefined | null | false | Record<string, boolean>)[]): string => {
  return classes
    .filter(Boolean)
    .map(cls => {
      if (typeof cls === 'object' && cls !== null) {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(' ');
      }
      return cls;
    })
    .filter(Boolean)
    .join(' ');
};

// Custom hook for window size tracking
export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call once to set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
};

// Password utilities
export const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyPassword = async (password: string, hash: string): Promise<boolean> => {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
};
