import { Button } from '../ui/Button';
import { useDreamStore } from '../../store/dreamStore';
import { useI18n } from '../../hooks/useI18n';
import { cn } from '../../utils';
import { TagPill } from '../dreams/TagPill';
import { Settings, Trash2, ChevronDown, ChevronRight, FolderTree } from 'lucide-react';
import { ConfigurationModal } from '../ConfigurationModal';
import { TrashModal } from '../dreams/TrashModal';
import { LockButton } from '../auth/LockButton';
import { useMemo, useState } from 'react';
import { CATEGORY_META, UNCATEGORIZED_META, SUBCATEGORY_OPTIONS, getTranslatedSubcategory } from '../../types/taxonomy';

export function Sidebar() {
  const { t, language } = useI18n();
  const currentView = useDreamStore((state) => state.currentView);
  const selectedTag = useDreamStore((state) => state.selectedTag);
  const trashedDreams = useDreamStore((state) => state.trashedDreams);
  const setCurrentView = useDreamStore((state) => state.setCurrentView);
  const setSelectedTag = useDreamStore((state) => state.setSelectedTag);
  const getAllTagsWithColors = useDreamStore((state) => state.getAllTagsWithColors);
  

  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const tags = getAllTagsWithColors();

  const groupedByCategory = useMemo(() => {
    const groups: Record<string, { label: string; color: string; open: boolean; items: typeof tags; subcategories?: Record<string, typeof tags> }> = {} as any;
    Object.values(CATEGORY_META).forEach(meta => {
      groups[meta.id] = { label: t(`categoryNames.${meta.id}`), color: meta.color, open: true, items: [] as any, subcategories: {} };
      // initialize subcategories buckets
      (SUBCATEGORY_OPTIONS[meta.id as keyof typeof SUBCATEGORY_OPTIONS] || []).forEach((sub) => {
        if (groups[meta.id].subcategories) groups[meta.id].subcategories![sub] = [] as any;
      });
    });
    groups[UNCATEGORIZED_META.id] = { label: t(`categoryNames.${UNCATEGORIZED_META.id}`), color: UNCATEGORIZED_META.color, open: true, items: [] as any };
    tags.forEach(t => {
      const categoryId = (t.id.split('/')[0] || UNCATEGORIZED_META.id);
      if (!groups[categoryId]) {
        groups[categoryId] = { label: categoryId, color: 'violet', open: true, items: [] as any };
      }
      // push into subcategory bucket when available
      const sub = t.id.split('/')[1];
      if (groups[categoryId].subcategories && sub && groups[categoryId].subcategories![sub]) {
        groups[categoryId].subcategories![sub].push(t);
      } else {
        groups[categoryId].items.push(t);
      }
    });
    return groups;
  }, [tags]);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({});
  const toggleCategory = (id: string) => setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));

  const handleTagClick = (tagName: string) => {
    if (selectedTag === tagName) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tagName);
    }
  };

  return (
    <>
      <div className="w-80 relative">
        
        <div className="h-full p-6 relative z-10 flex flex-col">
          {/* Enhanced Navigation */}
          <div className="space-y-3 mb-8">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-12 text-base rounded-xl relative overflow-hidden group cursor-pointer",
                currentView === 'home' && !selectedTag
                  ? "glass text-white/90 font-medium shadow-inner-lg border border-white/20"
                  : "text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20"
              )}
              onClick={() => {
                setCurrentView('home');
                setSelectedTag(null);
              }}
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10">{t('home')}</span>
            </Button>

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-12 text-base rounded-xl relative overflow-hidden group cursor-pointer",
                currentView === 'graph'
                  ? "glass text-white/90 font-medium shadow-inner-lg border border-white/20"
                  : "text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20"
              )}
              onClick={() => {
                setSelectedTag(null);
                setTimeout(() => {
                  setCurrentView('graph');
                }, 0);
              }}
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10">{t('connections')}</span>
            </Button>

            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start h-12 text-base rounded-xl relative overflow-hidden group cursor-pointer",
                currentView === 'insights'
                  ? "glass text-white/90 font-medium shadow-inner-lg border border-white/20"
                  : "text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20"
              )}
              onClick={() => {
                setSelectedTag(null);
                setTimeout(() => {
                  setCurrentView('insights');
                }, 0);
              }}
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="relative z-10 flex items-center gap-2">
                {t('tagInsights')}
              </span>
            </Button>
          </div>

          {/* Hierarchical Tag Tree */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center mb-4">
              <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-white/60" /> {t('categories')}
              </h3>
            </div>
            
            {tags.length === 0 ? (
              <div className="text-center py-8 glass rounded-xl border border-white/10">

                <p className="text-sm text-white/50 mb-1">{t('noTagsYet')}</p>
                <p className="text-xs text-white/40">{t('tagsWillAppear')}</p>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent hover:scrollbar-thumb-white/30">
                {Object.entries(groupedByCategory).map(([categoryId, group]) => {
                  const isOpen = openCategories[categoryId] ?? true;
                  const isSelected = selectedTag === `category:${categoryId}`;
                  return (
                    <div key={categoryId}>
                      <button
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer flex items-center justify-between',
                          isSelected ? 'glass text-white/90 font-medium border border-white/20' : 'text-white/70 hover:glass hover:text-white/90 hover:border-white/20'
                        )}
                        onClick={() => {
                          if (selectedTag === `category:${categoryId}`) setSelectedTag(null);
                          else setSelectedTag(`category:${categoryId}`);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <button
                            className="text-white/60 hover:text-white"
                            onClick={(e) => { e.stopPropagation(); toggleCategory(categoryId); }}
                            aria-label={isOpen ? 'Collapse' : 'Expand'}
                            title={isOpen ? 'Collapse' : 'Expand'}
                          >
                            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </button>
                          <TagPill
                            tag={group.label}
                            size="sm"
                            variant="gradient"
                            color={group.color as any}
                          />
                        </div>
                        <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">{group.items.reduce((s, i) => s + i.count, 0)}</span>
                      </button>
                      {isOpen && (
                        <div className="pl-6 mt-1 space-y-2">
                          {/* Subcategories */}
                          {group.subcategories && Object.entries(group.subcategories).map(([sub, items]) => (
                            items.length > 0 ? (
                              <div key={sub}>
                                <div className="text-[11px] text-white/60 mb-1">{getTranslatedSubcategory(sub, language)}</div>
                                <div className="space-y-1">
                                  {items.map((tag) => (
                                    <button
                                      key={tag.id}
                                      onClick={() => handleTagClick(tag.id)}
                                      className={cn(
                                        'w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer flex items-center justify-between',
                                        selectedTag === tag.id ? 'glass text-white/90 font-medium border border-white/20' : 'text-white/70 hover:glass hover:text-white/90 hover:border-white/20'
                                      )}
                                      title={tag.label}
                                    >
                                      <TagPill tag={tag.label} size="sm" variant="gradient" color={tag.color as any} />
                                      <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">{tag.count}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null
                          ))}
                          {/* Or uncategorized items directly under category */}
                          {group.items.length > 0 && (
                            <div className="space-y-1">
                              {group.items.map((tag) => (
                                <button
                                  key={tag.id}
                                  onClick={() => handleTagClick(tag.id)}
                                  className={cn(
                                    'w-full text-left px-3 py-2 rounded-lg text-xs transition-all duration-300 ease-out relative overflow-hidden group cursor-pointer flex items-center justify-between',
                                    selectedTag === tag.id ? 'glass text-white/90 font-medium border border-white/20' : 'text-white/70 hover:glass hover:text-white/90 hover:border-white/20'
                                  )}
                                  title={tag.label}
                                >
                                  <TagPill tag={tag.label} size="sm" variant="gradient" color={tag.color as any} />
                                  <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10">{tag.count}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Enhanced Footer */}
          <div className="mt-auto">
            <div className="text-center mb-4">
              <p className="text-xs text-white/50">
                {t('dreamsStoredLocally')}
              </p>
            </div>
            <div className="pt-4 border-t border-white/10 flex items-center justify-center">
              <div className="flex items-center gap-2">
                <LockButton
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-lg relative overflow-hidden group cursor-pointer text-white/60 hover:glass hover:text-white/90 hover:shadow-inner-lg hover:border-white/20"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-lg relative overflow-hidden group cursor-pointer text-white/60 hover:glass hover:text-white/90 hover:shadow-inner-lg hover:border-white/20"
                  onClick={() => setShowTrashModal(true)}
                  title={t('trash')}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <Trash2 className="w-3 h-3" />
                    {trashedDreams.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-400 rounded-full text-[8px] text-white flex items-center justify-center">
                        {trashedDreams.length > 9 ? '9+' : trashedDreams.length}
                      </span>
                    )}
                  </div>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 rounded-lg relative overflow-hidden group cursor-pointer text-white/60 hover:glass hover:text-white/90 hover:shadow-inner-lg hover:border-white/20"
                  onClick={() => setShowConfigModal(true)}
                  title={t('settings')}
                >
                  {/* Shimmer effect on hover */}
                  <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Settings className="w-3 h-3 relative z-10" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfigurationModal 
        isOpen={showConfigModal} 
        onClose={() => setShowConfigModal(false)} 
      />
      <TrashModal 
        isOpen={showTrashModal} 
        onClose={() => setShowTrashModal(false)} 
      />
    </>
  );
}
