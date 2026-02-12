import type { Dream } from '../types';

export interface ExportData {
  dreams: Dream[];
  trashedDreams: Dream[];
  exportedAt: string;
  version?: string;
}

// Check if we're in an Electron environment
const isElectron = (): boolean => {
  return typeof window !== 'undefined' && 
         (window as any).process && 
         (window as any).process.type === 'renderer';
};

/**
 * Export data to JSON file
 * Works in both Electron and browser environments
 */
export const exportToJSON = async (data: { dreams: Dream[]; trashedDreams: Dream[] }): Promise<void> => {
  const exportData: ExportData = {
    ...data,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });

  if (isElectron() && (window as any).electronAPI) {
    // Electron: Use IPC to show save dialog
    try {
      const result = await (window as any).electronAPI.exportData(jsonString);
      if (!result.success) {
        if (result.cancelled) {
          return; // User cancelled, silently return
        }
        throw new Error(result.error || 'Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data in Electron:', error);
      throw new Error('Failed to export data');
    }
  } else {
    // Browser: Use download blob
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Generate filename with current date
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    link.download = `dream-diary-export-${dateStr}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};

/**
 * Import data from JSON file
 * Works in both Electron and browser environments
 */
export const importFromJSON = async (): Promise<{ dreams: Dream[]; trashedDreams: Dream[] }> => {
  if (isElectron() && (window as any).electronAPI) {
    // Electron: Use IPC to show file dialog
    try {
      const result = await (window as any).electronAPI.importData();
      if (!result.success) {
        if (result.cancelled) {
          throw new Error('Import cancelled');
        }
        throw new Error(result.error || 'Failed to import data');
      }
      if (!result.data) {
        throw new Error('No data received from file');
      }
      return parseImportData(result.data);
    } catch (error) {
      if (error instanceof Error && error.message === 'Import cancelled') {
        throw error;
      }
      console.error('Error importing data in Electron:', error);
      throw new Error('Failed to import data');
    }
  } else {
    // Browser: Use file input
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const text = e.target?.result as string;
            const data = parseImportData(text);
            resolve(data);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => {
          reject(new Error('Failed to read file'));
        };
        reader.readAsText(file);
      };
      
      input.click();
    });
  }
};

/**
 * Parse and validate imported JSON data
 */
const parseImportData = (jsonString: string): { dreams: Dream[]; trashedDreams: Dream[] } => {
  try {
    const data = JSON.parse(jsonString);
    
    // Handle both new format (with exportedAt) and old format (just arrays)
    let dreams: Dream[] = [];
    let trashedDreams: Dream[] = [];
    
    if (data.dreams && Array.isArray(data.dreams)) {
      dreams = data.dreams;
    } else if (Array.isArray(data)) {
      // Old format: just an array of dreams
      dreams = data;
    } else {
      throw new Error('Invalid file format: expected dreams array');
    }
    
    if (data.trashedDreams && Array.isArray(data.trashedDreams)) {
      trashedDreams = data.trashedDreams;
    }
    
    // Validate dream structure
    const validateDream = (dream: any): boolean => {
      return (
        dream &&
        typeof dream.id === 'string' &&
        typeof dream.title === 'string' &&
        typeof dream.date === 'string' &&
        typeof dream.description === 'string' &&
        Array.isArray(dream.tags) &&
        Array.isArray(dream.citedDreams) &&
        (dream.citedTags === undefined || Array.isArray(dream.citedTags))
      );
    };
    
    // Filter out invalid dreams
    dreams = dreams.filter(validateDream);
    trashedDreams = trashedDreams.filter(validateDream);
    
    if (dreams.length === 0 && trashedDreams.length === 0) {
      throw new Error('No valid dreams found in file');
    }
    
    return { dreams, trashedDreams };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Invalid JSON file');
  }
};

