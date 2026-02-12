import type { DreamTag, CategoryColor, UserCategory } from './taxonomy';

export interface Dream {
  id: string;
  title: string;
  date: string;
  time?: string; // Format: HH:mm:ss (hour, minute, second)
  description: string;
  tags: DreamTag[];
  citedDreams: string[]; // Array of dream IDs that this dream cites
  citedTags: string[]; // Array of tag IDs that this dream cites
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // When the dream was moved to trash
}

export interface Tag {
  id: string;
  label: string;
  count: number;
}

export interface TagWithColor {
  id: string; // tag id
  label: string;
  count: number;
  color: CategoryColor;
}

export type ViewType = 'home' | 'dream' | 'graph' | 'insights';

export type AIProvider = 'gemini' | 'lmstudio';
export type Language = 'en' | 'pt-BR';

export interface AIConfig {
  enabled: boolean;
  provider: AIProvider;
  apiKey: string;
  completionEndpoint: string;
  modelName: string;
}

// Graph-related types
export interface GraphNode {
  id: string;
  title: string;
  date: string;
  tags: DreamTag[];
  citedDreams: string[];
  citationCount: number; // How many dreams cite this dream
  x?: number;
  y?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  strength: number; // Could be used for edge thickness
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface GraphFilters {
  dateRange: { startDate: string | null; endDate: string | null };
  selectedTags: string[]; // tag ids
  showIsolated: boolean;
  layout: 'force' | 'hierarchical' | 'circular';
}

// Password protection types
export interface PasswordConfig {
  isEnabled: boolean;
  autoLockTimeout: number; // in minutes
  lastActivity: number; // timestamp
  failedAttempts: number; // track failed password attempts
}

export interface PasswordStore {
  isLocked: boolean;
  isFirstLaunch: boolean;
  passwordHash: string | null;
  config: PasswordConfig;
  
  // Actions
  setPassword: (password: string) => void;
  verifyPassword: (password: string) => Promise<boolean>;
  lock: () => void;
  unlock: () => void;
  updateActivity: () => void;
  checkAutoLock: () => boolean;
  resetPassword: () => void;
  updateConfig: (config: Partial<PasswordConfig>) => void;
}

export interface DreamStore {
  dreams: Dream[];
  categories: UserCategory[];
  trashedDreams: Dream[]; // Array of dreams in trash
  selectedDreamId: string | null;
  currentView: ViewType;
  selectedTag: string | null; // tag id
  searchQuery: string;
  dateRange: { startDate: string | null; endDate: string | null };
  timeRange: { startTime: string | null; endTime: string | null };
  aiConfig: AIConfig;
  graphFilters: GraphFilters;
  
  // Actions
  addDream: (dream: Omit<Dream, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateDream: (id: string, updates: Partial<Omit<Dream, 'id' | 'createdAt'>>) => void;
  deleteDream: (id: string) => void;
  restoreDream: (id: string) => void;
  permanentlyDeleteDream: (id: string) => void;
  clearTrash: () => void;
  getTrashedDreams: () => Dream[];
  setSelectedDream: (id: string | null) => void;
  setCurrentView: (view: ViewType) => void;
  setSelectedTag: (tag: string | null) => void;
  setSearchQuery: (query: string) => void;
  setDateRange: (startDate: string | null, endDate: string | null) => void;
  setTimeRange: (startTime: string | null, endTime: string | null) => void;
  getFilteredDreams: () => Dream[];
  getAllTags: () => Tag[];
  getAllTagsWithColors: () => TagWithColor[];
  getTagColor: (tagIdOrCategory: string) => CategoryColor;
  getCategories: () => UserCategory[];
  addCategory: (category: Omit<UserCategory, 'id' | 'createdAt' | 'updatedAt'>) => UserCategory;
  updateCategory: (id: string, updates: Partial<Pick<UserCategory, 'name' | 'color'>>) => void;
  deleteCategory: (id: string) => void;
  updateAIConfig: (config: Partial<AIConfig>) => void;
  setAIProvider: (provider: AIProvider) => void;
  generateAITags: (
    dreamContent: string,
    language?: Language,
    categoryId?: string
  ) => Promise<DreamTag[]>;
  generateAITitle: (dreamContent: string, language?: Language) => Promise<string>;
  
  // Citation methods
  addCitation: (dreamId: string, citedDreamId: string) => void;
  removeCitation: (dreamId: string, citedDreamId: string) => void;
  getCitedDreams: (dreamId: string) => Dream[];
  getDreamsThatCite: (dreamId: string) => Dream[];
  
  // Graph methods
  getGraphData: () => GraphData;
  updateGraphFilters: (filters: Partial<GraphFilters>) => void;
  getDreamById: (id: string) => Dream | undefined;
  
  // Data export/import methods
  exportData: () => { dreams: Dream[]; trashedDreams: Dream[]; categories: UserCategory[] };
  importData: (dreams: Dream[], trashedDreams: Dream[], categories?: UserCategory[]) => void;
}
