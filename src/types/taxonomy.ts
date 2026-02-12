export type CategoryColor =
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
export const UNCATEGORIZED_COLOR: CategoryColor = 'violet';

export const DEFAULT_CATEGORY_PRESETS: Array<{ id: string; name: string; color: CategoryColor }> = [
  { id: 'emotions', name: 'Emotions', color: 'amber' },
  { id: 'characters', name: 'Characters', color: 'indigo' },
  { id: 'places', name: 'Places', color: 'blue' },
  { id: 'dream-types', name: 'Dream Types', color: 'pink' },
];

export const CATEGORY_COLORS: CategoryColor[] = [
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
  return category?.color || UNCATEGORIZED_COLOR;
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
