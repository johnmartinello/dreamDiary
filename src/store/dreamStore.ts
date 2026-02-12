import { create } from 'zustand';
import type { Dream, DreamStore, TagWithColor, GraphData, GraphFilters } from '../types';
import type { CategoryColor, UserCategory } from '../types/taxonomy';
import { getCategoryColor, normalizeCategoryColor, UNCATEGORIZED_CATEGORY_ID } from '../types/taxonomy';
import { storage } from '../utils/storage';
import { generateId, getCurrentTimeString } from '../utils';

// Resolve a category color from a tag id or a category id
const resolveTagColor = (tagIdOrCategory: string, categories: UserCategory[]): CategoryColor => {
  // Try to parse from tag id pattern category/label
  const parts = tagIdOrCategory.split('/');
  if (parts.length >= 1) {
    return getCategoryColor(parts[0], categories);
  }
  return getCategoryColor(UNCATEGORIZED_CATEGORY_ID, categories);
};

export const useDreamStore = create<DreamStore>((set, get) => ({
  dreams: storage.getDreams(),
  categories: storage.getCategories(),
  trashedDreams: storage.getTrashedDreams(),
  selectedDreamId: null,
  currentView: 'home',
  selectedTag: null,
  searchQuery: '',
  dateRange: { startDate: null, endDate: null },
  timeRange: { startTime: null, endTime: null },
  graphFilters: {
    dateRange: { startDate: null, endDate: null },
    selectedTags: [],
    showIsolated: true,
    layout: 'force'
  },

  addDream: (dreamData) => {
    const now = new Date().toISOString();
    const newDream: Dream = {
      ...dreamData,
      tags: Array.isArray((dreamData as any).tags) ? (dreamData as any).tags : [],
      citedDreams: dreamData.citedDreams || [], // Initialize empty citations
      citedTags: dreamData.citedTags || [], // Initialize empty tag citations
      time: dreamData.time || getCurrentTimeString(), // Set current time if not provided
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    
    set((state) => {
      const updatedDreams = [...state.dreams, newDream];
      storage.saveDreams(updatedDreams);
      return {
        dreams: updatedDreams,
        selectedDreamId: newDream.id,
        currentView: 'dream',
      };
    });
  },

  updateDream: (id, updates) => {
    set((state) => {
      const updatedDreams = state.dreams.map((dream) =>
        dream.id === id
          ? { ...dream, ...updates, updatedAt: new Date().toISOString() }
          : dream
      );
      storage.saveDreams(updatedDreams);
      return { dreams: updatedDreams };
    });
  },

  deleteDream: (id) => {
    set((state) => {
      const dreamToDelete = state.dreams.find(dream => dream.id === id);
      if (!dreamToDelete) return state;

      // Move dream to trash instead of permanent deletion
      const trashedDream = {
        ...dreamToDelete,
        deletedAt: new Date().toISOString()
      };

      const updatedDreams = state.dreams.filter((dream) => dream.id !== id);
      const updatedTrashedDreams = [...state.trashedDreams, trashedDream];

      storage.saveDreams(updatedDreams);
      storage.saveTrashedDreams(updatedTrashedDreams);

      return {
        dreams: updatedDreams,
        trashedDreams: updatedTrashedDreams,
        selectedDreamId: state.selectedDreamId === id ? null : state.selectedDreamId,
        currentView: state.selectedDreamId === id ? 'home' : state.currentView,
      };
    });
  },

  restoreDream: (id) => {
    set((state) => {
      const dreamToRestore = state.trashedDreams.find(dream => dream.id === id);
      if (!dreamToRestore) return state;

      // Remove deletedAt field and move back to dreams
      const { deletedAt, ...restoredDream } = dreamToRestore;
      const updatedTrashedDreams = state.trashedDreams.filter((dream) => dream.id !== id);
      const updatedDreams = [...state.dreams, restoredDream];

      storage.saveDreams(updatedDreams);
      storage.saveTrashedDreams(updatedTrashedDreams);

      return {
        dreams: updatedDreams,
        trashedDreams: updatedTrashedDreams,
      };
    });
  },

  permanentlyDeleteDream: (id) => {
    set((state) => {
      const updatedTrashedDreams = state.trashedDreams.filter((dream) => dream.id !== id);
      storage.saveTrashedDreams(updatedTrashedDreams);
      return {
        trashedDreams: updatedTrashedDreams,
      };
    });
  },

  clearTrash: () => {
    set(() => {
      storage.saveTrashedDreams([]);
      return {
        trashedDreams: [],
      };
    });
  },

  getTrashedDreams: () => {
    return get().trashedDreams;
  },

  setSelectedDream: (id) => {
    set({
      selectedDreamId: id,
      currentView: id ? 'dream' : 'home',
    });
  },

  setCurrentView: (view) => {
    set({
      currentView: view,
      selectedDreamId: view === 'home' || view === 'graph' ? null : get().selectedDreamId,
    });
  },

  setSelectedTag: (tag) => {
    set({
      selectedTag: tag,
      currentView: 'home',
    });
  },

  setSearchQuery: (query) => {
    set({
      searchQuery: query,
      currentView: 'home',
    });
  },

  setDateRange: (startDate: string | null, endDate: string | null) => {
    set({
      dateRange: { startDate, endDate },
      currentView: 'home',
    });
  },

  setTimeRange: (startTime: string | null, endTime: string | null) => {
    set({
      timeRange: { startTime, endTime },
      currentView: 'home',
    });
  },

  getCategories: () => get().categories,

  addCategory: (categoryInput) => {
    const now = new Date().toISOString();
    const baseId = categoryInput.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    const fallbackId = baseId || generateId();

    const existing = new Set(get().categories.map((c) => c.id));
    let uniqueId = fallbackId;
    let suffix = 2;
    while (existing.has(uniqueId)) {
      uniqueId = `${fallbackId}-${suffix}`;
      suffix += 1;
    }

    const category: UserCategory = {
      id: uniqueId,
      name: categoryInput.name.trim(),
      color: normalizeCategoryColor(categoryInput.color),
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const categories = [...state.categories, category];
      storage.saveCategories(categories);
      return { categories };
    });

    return category;
  },

  updateCategory: (id, updates) => {
    set((state) => {
      const categories = state.categories.map((category) =>
        category.id === id
          ? {
              ...category,
              ...updates,
              name: (updates.name ?? category.name).trim(),
              color: normalizeCategoryColor(updates.color ?? category.color),
              updatedAt: new Date().toISOString(),
            }
          : category
      );
      storage.saveCategories(categories);
      return { categories };
    });
  },

  deleteCategory: (id) => {
    if (id === UNCATEGORIZED_CATEGORY_ID) return;
    set((state) => {
      const categories = state.categories.filter((category) => category.id !== id);
      const dreams = state.dreams.map((dream) => ({
        ...dream,
        tags: dream.tags.filter((tag) => tag.categoryId !== id),
      }));
      const trashedDreams = state.trashedDreams.map((dream) => ({
        ...dream,
        tags: dream.tags.filter((tag) => tag.categoryId !== id),
      }));
      storage.saveCategories(categories);
      storage.saveDreams(dreams);
      storage.saveTrashedDreams(trashedDreams);
      return { categories, dreams, trashedDreams };
    });
  },

  getFilteredDreams: () => {
    const { dreams, selectedTag, searchQuery, dateRange, timeRange } = get();
    let filteredDreams = dreams;

    // Filter by tag if selected
    if (selectedTag) {
      if (selectedTag.startsWith('category:')) {
        const category = selectedTag.split(':')[1];
        filteredDreams = filteredDreams.filter((dream) => dream.tags.some(t => t.categoryId === category));
      } else {
        filteredDreams = filteredDreams.filter((dream) => dream.tags.some(t => t.id === selectedTag));
      }
    }

    // Filter by search query if provided
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filteredDreams = filteredDreams.filter((dream) => 
        dream.title.toLowerCase().includes(query) ||
        dream.description.toLowerCase().includes(query) ||
        dream.tags.some(tag => tag.label.toLowerCase().includes(query))
      );
    }

    // Filter by date range if provided
    if (dateRange.startDate || dateRange.endDate) {
      filteredDreams = filteredDreams.filter((dream) => {
        const dreamDate = dream.date;
        
        if (dateRange.startDate && dateRange.endDate) {
          return dreamDate >= dateRange.startDate && dreamDate <= dateRange.endDate;
        } else if (dateRange.startDate) {
          return dreamDate >= dateRange.startDate;
        } else if (dateRange.endDate) {
          return dreamDate <= dateRange.endDate;
        }
        
        return true;
      });
    }

    // Filter by time range if provided
    if (timeRange.startTime || timeRange.endTime) {
      filteredDreams = filteredDreams.filter((dream) => {
        const dreamTime = dream.time || '00:00:00';
        
        if (timeRange.startTime && timeRange.endTime) {
          return dreamTime >= timeRange.startTime && dreamTime <= timeRange.endTime;
        } else if (timeRange.startTime) {
          return dreamTime >= timeRange.startTime;
        } else if (timeRange.endTime) {
          return dreamTime <= timeRange.endTime;
        }
        
        return true;
      });
    }

    return filteredDreams;
  },

  getAllTags: () => {
    const { dreams } = get();
    const tagCounts: Record<string, { label: string; count: number }> = {};
    
    dreams.forEach((dream) => {
      dream.tags.forEach((tag) => {
        if (!tagCounts[tag.id]) tagCounts[tag.id] = { label: tag.label, count: 0 };
        tagCounts[tag.id].count += 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([id, info]) => ({ id, label: info.label, count: info.count }))
      .sort((a, b) => b.count - a.count);
  },

  getAllTagsWithColors: (): TagWithColor[] => {
    const { dreams, categories } = get();
    const tagCounts: Record<string, { label: string; category: string; count: number }> = {};
    
    dreams.forEach((dream) => {
      dream.tags.forEach((tag) => {
        if (!tagCounts[tag.id]) tagCounts[tag.id] = { label: tag.label, category: tag.categoryId, count: 0 };
        tagCounts[tag.id].count += 1;
      });
    });

    return Object.entries(tagCounts)
      .map(([id, info]) => ({ 
        id,
        label: info.label,
        count: info.count,
        color: resolveTagColor(info.category, categories)
      }))
      .sort((a, b) => b.count - a.count);
  },

  getTagColor: (tagIdOrCategory: string): CategoryColor => {
    return resolveTagColor(tagIdOrCategory, get().categories);
  },

  // Citation methods
  addCitation: (dreamId: string, citedDreamId: string) => {
    const { dreams } = get();
    const dream = dreams.find(d => d.id === dreamId);
    const citedDream = dreams.find(d => d.id === citedDreamId);
    
    if (!dream || !citedDream) return;
    
    // Prevent self-citation
    if (dreamId === citedDreamId) return;
    
    // Prevent duplicate citations
    if (dream.citedDreams.includes(citedDreamId)) return;
    
    set((state) => {
      const updatedDreams = state.dreams.map((d) =>
        d.id === dreamId
          ? { ...d, citedDreams: [...d.citedDreams, citedDreamId], updatedAt: new Date().toISOString() }
          : d
      );
      storage.saveDreams(updatedDreams);
      return { dreams: updatedDreams };
    });
  },

  removeCitation: (dreamId: string, citedDreamId: string) => {
    set((state) => {
      const updatedDreams = state.dreams.map((d) =>
        d.id === dreamId
          ? { ...d, citedDreams: d.citedDreams.filter(id => id !== citedDreamId), updatedAt: new Date().toISOString() }
          : d
      );
      storage.saveDreams(updatedDreams);
      return { dreams: updatedDreams };
    });
  },

  getCitedDreams: (dreamId: string) => {
    const { dreams } = get();
    const dream = dreams.find(d => d.id === dreamId);
    if (!dream) return [];
    return dreams.filter(d => dream.citedDreams.includes(d.id));
  },

  getDreamsThatCite: (dreamId: string) => {
    const { dreams } = get();
    return dreams.filter(d => d.citedDreams.includes(dreamId));
  },

  // Graph methods
  getGraphData: (): GraphData => {
    const { dreams, graphFilters } = get();
    
    // Apply filters
    let filteredDreams = dreams;
    
    // Filter by date range
    if (graphFilters.dateRange.startDate || graphFilters.dateRange.endDate) {
      filteredDreams = filteredDreams.filter((dream) => {
        const dreamDate = dream.date;
        
        if (graphFilters.dateRange.startDate && graphFilters.dateRange.endDate) {
          return dreamDate >= graphFilters.dateRange.startDate && dreamDate <= graphFilters.dateRange.endDate;
        } else if (graphFilters.dateRange.startDate) {
          return dreamDate >= graphFilters.dateRange.startDate;
        } else if (graphFilters.dateRange.endDate) {
          return dreamDate <= graphFilters.dateRange.endDate;
        }
        
        return true;
      });
    }
    
    // Filter by tags
    if (graphFilters.selectedTags.length > 0) {
      filteredDreams = filteredDreams.filter((dream) =>
        graphFilters.selectedTags.some(tagId => dream.tags.some(t => t.id === tagId))
      );
    }
    
    // Filter out isolated dreams if needed
    if (!graphFilters.showIsolated) {
      filteredDreams = filteredDreams.filter((dream) =>
        dream.citedDreams.length > 0 || get().getDreamsThatCite(dream.id).length > 0
      );
    }
    
    // Create nodes
    const nodes = filteredDreams.map((dream) => ({
      id: dream.id,
      title: dream.title,
      date: dream.date,
      tags: dream.tags,
      citedDreams: dream.citedDreams,
      citationCount: get().getDreamsThatCite(dream.id).length,
    }));
    
    // Create edges
    const edges: { source: string; target: string; strength: number }[] = [];
    filteredDreams.forEach((dream) => {
      dream.citedDreams.forEach((citedDreamId) => {
        // Only create edge if the cited dream is also in the filtered set
        if (filteredDreams.some(d => d.id === citedDreamId)) {
          edges.push({
            source: dream.id,
            target: citedDreamId,
            strength: 1
          });
        }
      });
    });
    
    return { nodes, edges };
  },

  updateGraphFilters: (filters: Partial<GraphFilters>) => {
    set((state) => ({
      graphFilters: { ...state.graphFilters, ...filters }
    }));
  },

  getDreamById: (id: string) => {
    const { dreams } = get();
    return dreams.find(d => d.id === id);
  },

  // Data export/import methods
  exportData: () => {
    const { dreams, trashedDreams, categories } = get();
    return { dreams, trashedDreams, categories };
  },

  importData: (
    importedDreams: Dream[],
    importedTrashedDreams: Dream[],
    importedCategories: UserCategory[] = []
  ) => {
    set((state) => {
      const existingDreamIds = new Set(state.dreams.map(d => d.id));
      const existingTrashedIds = new Set(state.trashedDreams.map(d => d.id));
      const existingCategoryIds = new Set(state.categories.map(c => c.id));
      
      // Create ID mapping for imported dreams to handle duplicates
      const idMapping = new Map<string, string>();
      
      // Process imported dreams - generate new IDs for duplicates
      const processedDreams = importedDreams.map((dream) => {
        if (existingDreamIds.has(dream.id)) {
          // Generate new ID for duplicate
          const newId = generateId();
          idMapping.set(dream.id, newId);
          return {
            ...dream,
            id: newId,
            // Update citedDreams to use new IDs if they were also imported
            citedDreams: dream.citedDreams.map(citedId => idMapping.get(citedId) || citedId),
            citedTags: dream.citedTags || [],
          };
        }
        return {
          ...dream,
          citedTags: dream.citedTags || [],
        };
      });
      
      // Process imported trashed dreams - generate new IDs for duplicates
      const processedTrashedDreams = importedTrashedDreams.map((dream) => {
        if (existingTrashedIds.has(dream.id) || existingDreamIds.has(dream.id)) {
          // Generate new ID for duplicate
          const newId = generateId();
          idMapping.set(dream.id, newId);
          return {
            ...dream,
            id: newId,
            // Update citedDreams to use new IDs if they were also imported
            citedDreams: dream.citedDreams.map(citedId => idMapping.get(citedId) || citedId),
            citedTags: dream.citedTags || [],
          };
        }
        return {
          ...dream,
          citedTags: dream.citedTags || [],
        };
      });
      
      // Update citedDreams in processed dreams to reference new IDs
      const finalProcessedDreams = processedDreams.map((dream) => {
        const updatedCitedDreams = dream.citedDreams.map(citedId => {
          // If the cited dream was imported and got a new ID, use the new ID
          // Otherwise, keep the original ID (might reference existing dreams)
          return idMapping.get(citedId) || citedId;
        });
        return {
          ...dream,
          citedDreams: updatedCitedDreams,
          citedTags: dream.citedTags || [],
        };
      });
      
      const finalProcessedTrashedDreams = processedTrashedDreams.map((dream) => {
        const updatedCitedDreams = dream.citedDreams.map(citedId => {
          return idMapping.get(citedId) || citedId;
        });
        return {
          ...dream,
          citedDreams: updatedCitedDreams,
          citedTags: dream.citedTags || [],
        };
      });
      
      // Merge with existing data
      const mergedDreams = [...state.dreams, ...finalProcessedDreams];
      const mergedTrashedDreams = [...state.trashedDreams, ...finalProcessedTrashedDreams];
      const mergedCategories = [
        ...state.categories,
        ...importedCategories.filter(category => !existingCategoryIds.has(category.id)),
      ];
      
      // Save to storage
      storage.saveDreams(mergedDreams);
      storage.saveTrashedDreams(mergedTrashedDreams);
      storage.saveCategories(mergedCategories);
      
      return {
        dreams: mergedDreams,
        trashedDreams: mergedTrashedDreams,
        categories: mergedCategories,
      };
    });
  },
}));
