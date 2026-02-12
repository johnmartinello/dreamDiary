import { useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { TagPill } from './TagPill';
import { useI18n } from '../../hooks/useI18n';
import { useDreamStore } from '../../store/dreamStore';
import { cn } from '../../utils';
import { getFixedCategoryDefaultName, getFixedCategoryLabelKey, UNCATEGORIZED_CATEGORY_ID } from '../../types/taxonomy';
import type { CategoryColor } from '../../types/taxonomy';

interface TagStats {
  id: string;
  label: string;
  categoryId: string;
  categoryLabel: string;
  color: CategoryColor;
  count: number;
  percentage: number;
  coOccurrences: Record<string, number>;
  isCustom: boolean;
}

interface TagRelationship {
  source: string;
  target: string;
  sourceLabel: string;
  targetLabel: string;
  sourceCategory: string;
  targetCategory: string;
  strength: number;
  count: number;
}

interface CategoryTagSummary {
  categoryId: string;
  categoryLabel: string;
  color: CategoryColor;
  totalTags: number;
  totalUsage: number;
  mostUsedTags: TagStats[];
}

export function CategoryAnalysis() {
  const { t } = useI18n();
  const { dreams, categories, getTagColor } = useDreamStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'tags' | 'relationships' | 'categories' | 'trends'>('overview');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [textFilter, setTextFilter] = useState('');

  const getCategoryDisplayName = (categoryId: string): string => {
    if (!categoryId || categoryId === UNCATEGORIZED_CATEGORY_ID) {
      return t('uncategorized');
    }
    const key = getFixedCategoryLabelKey(categoryId);
    if (key) {
      const translated = t(key);
      if (translated !== key) return translated;
      return getFixedCategoryDefaultName(categoryId) || translated;
    }
    return categories.find((category) => category.id === categoryId)?.name || categoryId;
  };

  const tagStats = useMemo(() => {
    const stats: Record<string, TagStats> = {};
    const totalDreams = dreams.length;

    dreams.forEach((dream) => {
      const dreamTags = new Set<string>();
      dream.tags.forEach((tag) => {
        if (!stats[tag.id]) {
          stats[tag.id] = {
            id: tag.id,
            label: tag.label,
            categoryId: tag.categoryId,
            categoryLabel: getCategoryDisplayName(tag.categoryId),
            color: getTagColor(tag.id),
            count: 0,
            percentage: 0,
            coOccurrences: {},
            isCustom: Boolean(tag.isCustom),
          };
        }
        stats[tag.id].count += 1;
        dreamTags.add(tag.id);
      });

      const tagIds = Array.from(dreamTags);
      tagIds.forEach((source, index) => {
        tagIds.slice(index + 1).forEach((target) => {
          stats[source].coOccurrences[target] = (stats[source].coOccurrences[target] || 0) + 1;
          stats[target].coOccurrences[source] = (stats[target].coOccurrences[source] || 0) + 1;
        });
      });
    });

    Object.values(stats).forEach((tag) => {
      tag.percentage = totalDreams > 0 ? (tag.count / totalDreams) * 100 : 0;
    });

    return Object.values(stats).sort((a, b) => b.count - a.count);
  }, [categories, dreams, t]);

  const tagRelationships = useMemo(() => {
    const relationships: TagRelationship[] = [];
    const seen = new Set<string>();

    tagStats.forEach((left) => {
      tagStats.forEach((right) => {
        if (left.id === right.id) return;
        const pairKey = [left.id, right.id].sort().join(':');
        if (seen.has(pairKey)) return;
        seen.add(pairKey);
        const count = left.coOccurrences[right.id] || 0;
        if (count > 0) {
          relationships.push({
            source: left.id,
            target: right.id,
            sourceLabel: left.label,
            targetLabel: right.label,
            sourceCategory: left.categoryId,
            targetCategory: right.categoryId,
            strength: count / Math.min(left.count, right.count),
            count,
          });
        }
      });
    });

    return relationships.sort((a, b) => b.strength - a.strength);
  }, [tagStats]);

  const categorySummaries = useMemo(() => {
    const summaries: Record<string, CategoryTagSummary> = {};

    summaries[UNCATEGORIZED_CATEGORY_ID] = {
      categoryId: UNCATEGORIZED_CATEGORY_ID,
      categoryLabel: t('uncategorized'),
      color: 'violet',
      totalTags: 0,
      totalUsage: 0,
      mostUsedTags: [],
    };

    categories.forEach((category) => {
      summaries[category.id] = {
        categoryId: category.id,
        categoryLabel: getCategoryDisplayName(category.id),
        color: category.color,
        totalTags: 0,
        totalUsage: 0,
        mostUsedTags: [],
      };
    });

    tagStats.forEach((tag) => {
      if (!summaries[tag.categoryId]) {
        summaries[tag.categoryId] = {
          categoryId: tag.categoryId,
          categoryLabel: getCategoryDisplayName(tag.categoryId),
          color: 'violet',
          totalTags: 0,
          totalUsage: 0,
          mostUsedTags: [],
        };
      }
      summaries[tag.categoryId].totalTags += 1;
      summaries[tag.categoryId].totalUsage += tag.count;
      summaries[tag.categoryId].mostUsedTags.push(tag);
    });

    return Object.values(summaries)
      .map((summary) => ({
        ...summary,
        mostUsedTags: summary.mostUsedTags.sort((a, b) => b.count - a.count).slice(0, 5),
      }))
      .sort((a, b) => b.totalUsage - a.totalUsage);
  }, [categories, getTagColor, tagStats, t]);

  const filteredTags = useMemo(() => {
    let list = tagStats;
    if (selectedCategory) list = list.filter((tag) => tag.categoryId === selectedCategory);
    if (textFilter.trim()) {
      const query = textFilter.trim().toLowerCase();
      list = list.filter((tag) => tag.label.toLowerCase().includes(query) || tag.categoryLabel.toLowerCase().includes(query));
    }
    return list;
  }, [selectedCategory, tagStats, textFilter]);

  const filteredRelationships = useMemo(() => {
    if (!textFilter.trim()) return tagRelationships;
    const query = textFilter.trim().toLowerCase();
    return tagRelationships.filter((rel) => rel.sourceLabel.toLowerCase().includes(query) || rel.targetLabel.toLowerCase().includes(query));
  }, [tagRelationships, textFilter]);

  const tabs = [
    { id: 'overview', label: t('overview') },
    { id: 'tags', label: t('tags') },
    { id: 'relationships', label: t('relationships') },
    { id: 'categories', label: t('categories') },
    { id: 'trends', label: t('trends') },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">{t('tagAnalysis')}</h2>
        <div className="text-sm text-gray-400">
          {t('totalTags')}: {tagStats.length} | {t('totalDreams')}: {dreams.length}
        </div>
      </div>

      <div className="flex space-x-1 bg-white/5 rounded-lg p-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab);
              setTextFilter('');
            }}
            className={cn(
              'flex items-center gap-2',
              activeTab === tab.id
                ? 'glass text-white/90 font-medium shadow-inner-lg border border-white/20'
                : 'text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20'
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {activeTab !== 'overview' && (
        <Card variant="glass" className="p-4">
          <div className="flex gap-4 items-end">
            {activeTab === 'tags' && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">{t('filterByCategory')}</label>
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value || null)}
                  className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm [&>option]:bg-gray-800"
                >
                  <option value="">{t('allCategories')}</option>
                  {categorySummaries.map((summary) => (
                    <option key={summary.categoryId} value={summary.categoryId}>
                      {summary.categoryLabel}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium text-gray-300 mb-2 block">{t('searchByName')}</label>
              <Input
                type="text"
                variant="glass"
                placeholder={t('searchTagsPlaceholder')}
                value={textFilter}
                onChange={(e) => setTextFilter(e.target.value)}
              />
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card variant="glass" className="p-6 text-center"><div className="text-3xl font-bold text-blue-400 mb-2">{tagStats.length}</div><div className="text-gray-400">{t('uniqueTags')}</div></Card>
          <Card variant="glass" className="p-6 text-center"><div className="text-3xl font-bold text-green-400 mb-2">{tagStats.reduce((sum, tag) => sum + tag.count, 0)}</div><div className="text-gray-400">{t('totalTagUsage')}</div></Card>
          <Card variant="glass" className="p-6 text-center"><div className="text-3xl font-bold text-purple-400 mb-2">{tagStats.filter((tag) => tag.isCustom).length}</div><div className="text-gray-400">{t('customTags')}</div></Card>
          <Card variant="glass" className="p-6 text-center"><div className="text-3xl font-bold text-orange-400 mb-2">{dreams.length > 0 ? (tagStats.reduce((sum, tag) => sum + tag.count, 0) / dreams.length).toFixed(1) : '0.0'}</div><div className="text-gray-400">{t('avgTagsPerDream')}</div></Card>
        </div>
      )}

      {activeTab === 'tags' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTags.slice(0, 20).map((tag) => (
            <Card key={tag.id} variant="glass" className="p-6">
              <h3 className="font-semibold text-white truncate">{tag.label}</h3>
              <div className="text-sm text-gray-400 mt-2">{tag.categoryLabel}</div>
              <div className="text-sm text-gray-300 mt-2">{t('usage')}: {tag.count} ({tag.percentage.toFixed(1)}%)</div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'relationships' && (
        <Card variant="glass" className="p-6 space-y-3">
          {filteredRelationships.slice(0, 15).map((rel) => (
            <div key={`${rel.source}-${rel.target}`} className="flex items-center justify-between p-3 bg-white/5 rounded">
              <span className="text-white">{rel.sourceLabel} → {rel.targetLabel}</span>
              <span className="text-gray-400 text-sm">{t('coOccurrences')}: {rel.count}</span>
            </div>
          ))}
        </Card>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-4">
          {categorySummaries.map((summary) => (
            <Card key={summary.categoryId} variant="glass" className="p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{summary.categoryLabel}</h3>
                <span className="text-sm text-gray-400">{summary.totalTags} {t('tags')} | {summary.totalUsage} {t('uses')}</span>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {summary.mostUsedTags.map((tag) => (
                  <TagPill
                    key={tag.id}
                    tag={`${tag.label} (${tag.count})`}
                    size="sm"
                    variant="gradient"
                    color={tag.color}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'trends' && (
        <Card variant="glass" className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('tagTrends')}</h3>
          <p className="text-gray-400">{t('trendsComingSoon')}</p>
        </Card>
      )}
    </div>
  );
}
