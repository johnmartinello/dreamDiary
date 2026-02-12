export type PresetCategoryColor =
  | 'cyan'
  | 'purple'
  | 'pink'
  | 'emerald'
  | 'amber'
  | 'blue'
  | 'indigo'
  | 'violet'
  | 'rose'
  | 'teal'
  | 'lime'
  | 'orange'
  | 'red'
  | 'green'
  | 'yellow';

export type CategoryColor = PresetCategoryColor | `#${string}`;

export interface UserCategory {
  id: string;
  name: string;
  color: CategoryColor;
  createdAt: string;
  updatedAt: string;
}

export interface DreamTag {
  id: string; // stable slug id: category/label
  label: string; // e.g. "Flying", "City", "Fear"
  categoryId: string;
  isCustom?: boolean;
}

export const UNCATEGORIZED_CATEGORY_ID = 'uncategorized';
export const UNCATEGORIZED_COLOR: PresetCategoryColor = 'violet';
export const FIXED_CATEGORY_IDS = ['emotions', 'characters', 'places', 'dream-types'] as const;
export type FixedCategoryId = typeof FIXED_CATEGORY_IDS[number];
export type FixedCategoryLabelKey =
  | 'categoryEmotions'
  | 'categoryCharacters'
  | 'categoryPlaces'
  | 'categoryDreamTypes';

export const DEFAULT_CATEGORY_PRESETS: Array<{ id: string; name: string; color: PresetCategoryColor }> = [
  { id: 'emotions', name: 'Emotions', color: 'amber' },
  { id: 'characters', name: 'Characters', color: 'indigo' },
  { id: 'places', name: 'Places', color: 'blue' },
  { id: 'dream-types', name: 'Dream Types', color: 'pink' },
];

export const FIXED_CATEGORY_LABEL_KEYS: Record<FixedCategoryId, FixedCategoryLabelKey> = {
  emotions: 'categoryEmotions',
  characters: 'categoryCharacters',
  places: 'categoryPlaces',
  'dream-types': 'categoryDreamTypes',
};

export const CATEGORY_COLORS: PresetCategoryColor[] = [
  'cyan',
  'purple',
  'pink',
  'emerald',
  'amber',
  'blue',
  'indigo',
  'violet',
  'rose',
  'teal',
  'lime',
  'orange',
  'red',
  'green',
  'yellow',
];

export const PRESET_CATEGORY_COLOR_HEX: Record<PresetCategoryColor, string> = {
  cyan: '#22d3ee',
  purple: '#a78bfa',
  pink: '#f472b6',
  emerald: '#34d399',
  amber: '#fbbf24',
  blue: '#60a5fa',
  indigo: '#818cf8',
  violet: '#a78bfa',
  rose: '#fb7185',
  teal: '#2dd4bf',
  lime: '#a3e635',
  orange: '#fb923c',
  red: '#f87171',
  green: '#4ade80',
  yellow: '#facc15',
};

export function isPresetCategoryColor(value: string): value is PresetCategoryColor {
  return (CATEGORY_COLORS as string[]).includes(value);
}

export function isFixedCategory(id: string): id is FixedCategoryId {
  return (FIXED_CATEGORY_IDS as readonly string[]).includes(id);
}

export function getFixedCategoryLabelKey(id: string): FixedCategoryLabelKey | null {
  if (!isFixedCategory(id)) return null;
  return FIXED_CATEGORY_LABEL_KEYS[id];
}

export function getFixedCategoryDefaultName(id: string): string | null {
  if (!isFixedCategory(id)) return null;
  return DEFAULT_CATEGORY_PRESETS.find((preset) => preset.id === id)?.name ?? null;
}

export function normalizeHexColor(value?: string | null): `#${string}` | null {
  if (!value) return null;
  const trimmed = value.trim();
  const normalized = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  const match = normalized.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return null;
  const full = match[1].length === 3
    ? `#${match[1].split('').map((char) => `${char}${char}`).join('')}`
    : `#${match[1]}`;
  return full.toUpperCase() as `#${string}`;
}

export function normalizeCategoryColor(value?: string | null): CategoryColor {
  if (!value) return UNCATEGORIZED_COLOR;
  if (isPresetCategoryColor(value)) return value;
  const hex = normalizeHexColor(value);
  return hex || UNCATEGORIZED_COLOR;
}

export function resolveCategoryColorHex(value?: string | null): string {
  const color = normalizeCategoryColor(value);
  if (isPresetCategoryColor(color)) {
    return PRESET_CATEGORY_COLOR_HEX[color];
  }
  return color;
}

const slug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export function buildTagId(categoryId: string, label: string): string {
  return `${slug(categoryId || UNCATEGORIZED_CATEGORY_ID)}/${slug(label)}`;
}

export function getCategoryColor(categoryId: string, categories: UserCategory[]): CategoryColor {
  if (!categoryId || categoryId === UNCATEGORIZED_CATEGORY_ID) {
    return UNCATEGORIZED_COLOR;
  }

  const category = categories.find((item) => item.id === categoryId);
  return normalizeCategoryColor(category?.color);
}

export function getCategoryName(
  categoryId: string,
  categories: UserCategory[],
  uncategorizedLabel: string
): string {
  if (!categoryId || categoryId === UNCATEGORIZED_CATEGORY_ID) {
    return uncategorizedLabel;
  }
  return categories.find((item) => item.id === categoryId)?.name || categoryId;
}
