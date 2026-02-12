import { motion, useReducedMotion } from 'framer-motion';
import { useMemo } from 'react';
import { Calendar, Clock, Plus } from 'lucide-react';
import { useDreamStore } from '../../store/dreamStore';
import { compareDates, getCurrentDateString, getCurrentTimeString, getTodayFormatted } from '../../utils';
import { formatDate, formatTime } from '../../utils';
import { TagPill } from './TagPill';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SearchBar } from './SearchBar';
import { DateFilter } from './DateFilter';
import { useI18n } from '../../hooks/useI18n';
import { DreamCalendarHeatmap } from './DreamCalendarHeatmap';

export function DreamList() {
  const { t, language } = useI18n();
  const prefersReducedMotion = useReducedMotion();
  const getFilteredDreams = useDreamStore((state) => state.getFilteredDreams);
  const setSelectedDream = useDreamStore((state) => state.setSelectedDream);
  const searchQuery = useDreamStore((state) => state.searchQuery);
  const selectedTag = useDreamStore((state) => state.selectedTag);
  const dateRange = useDreamStore((state) => state.dateRange);
  const timeRange = useDreamStore((state) => state.timeRange);
  const getTagColor = useDreamStore((state) => state.getTagColor);
  const addDream = useDreamStore((state) => state.addDream);
  const setSearchQuery = useDreamStore((state) => state.setSearchQuery);
  const setDateRange = useDreamStore((state) => state.setDateRange);
  const setTimeRange = useDreamStore((state) => state.setTimeRange);
  const dreams = getFilteredDreams();
  const sortedDreams = useMemo(
    () => [...dreams].sort((a, b) => compareDates(a.date, b.date, a.time, b.time)),
    [dreams]
  );
  const disableListAnimations = prefersReducedMotion || sortedDreams.length > 60;

  const handleNewDream = () => {
    addDream({
      title: `${getTodayFormatted(language)}`,
      date: getCurrentDateString(),
      time: getCurrentTimeString(),
      description: '',
      tags: [],
      citedDreams: [],
      citedTags: [],
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  const handleDreamClick = (dreamId: string) => {
    setSelectedDream(dreamId);
  };

  return (
    <div className="h-full overflow-auto relative">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div>
                <h2 className="text-3xl font-bold text-white mb-1">
                  {searchQuery 
                    ? t('searchResultsFor', { query: searchQuery })
                    : selectedTag 
                    ? t('dreamsTaggedWith', { tag: selectedTag })
                    : dateRange.startDate || dateRange.endDate
                    ? t('filteredDreams')
                    : ''}
                </h2>
                <p className="text-gray-300">
                  {dreams.length === 0
                    ? searchQuery 
                      ? t('noDreamsFound')
                      : t('createFirstDream')
                    : t('dreamsFound', { count: dreams.length })}
                </p>
              </div>
            </div>
            
            {/* New Dream Button */}
            <Button
              variant="ghost"
              className="text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20 relative overflow-hidden group cursor-pointer transition-all duration-300 flex items-center justify-center"
              onClick={handleNewDream}
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Plus className="w-5 h-5 relative z-10" />
            </Button>
          </div>

          <DreamCalendarHeatmap />
          
          {/* Search and Filter Row */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <SearchBar 
                onSearch={setSearchQuery}
                placeholder={t('searchPlaceholder')}
                showClearButton={!!searchQuery}
              />
            </div>
            <DateFilter
              onDateRangeChange={setDateRange}
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onTimeRangeChange={setTimeRange}
              startTime={timeRange.startTime}
              endTime={timeRange.endTime}
            />
          </div>
        </div>

        {dreams.length === 0 ? (
          <Card variant="glass" className="text-center py-16">
            <h3 className="text-xl font-semibold text-white mb-3">
              {searchQuery 
                ? t('noDreamsMatchingSearch')
                : selectedTag 
                ? t('noDreamsWithTag')
                : dateRange.startDate || dateRange.endDate
                ? t('noDreamsInDateRange')
                : t('noDreams')}
            </h3>
            <p className="text-gray-300 max-w-md mx-auto">
              {searchQuery
                ? t('tryAdjustingSearch')
                : selectedTag
                ? t('tryDifferentTag')
                : dateRange.startDate || dateRange.endDate
                ? t('tryAdjustingDateRange')
                : t('clickCreateDream')}
            </p>
          </Card>
        ) : (
          <motion.div
            variants={disableListAnimations ? undefined : containerVariants}
            initial={disableListAnimations ? false : 'hidden'}
            animate={disableListAnimations ? false : 'visible'}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {sortedDreams.map((dream) => (
                <motion.div 
                  key={dream.id} 
                  variants={disableListAnimations ? undefined : itemVariants}
                  onClick={() => handleDreamClick(dream.id)}
                  className="group cursor-pointer"
                  style={{ contentVisibility: 'auto', containIntrinsicSize: '280px' }}
                >
                  <Card 
                    variant="glass" 
                    className="p-4 hover:-translate-y-1 transition-all duration-300 ease-out relative overflow-hidden h-full min-h-[280px]"
                  >
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    <div className="relative z-10 h-full flex flex-col">
                      {/* Title and Date */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-gray-200 transition-all duration-300 line-clamp-2 mb-2">
                            {dream.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-300 gap-3">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
                              {formatDate(dream.date, language)}
                            </span>
                            {dream.time && (
                              <span className="flex items-center">
                                <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                                {formatTime(dream.time)}
                              </span>
                            )}
                          </div>
                        </div>
        
                      </div>

                      {/* Description */}
                      {dream.description && (
                        <p className="text-gray-200/90 text-sm leading-relaxed mb-3 line-clamp-3 group-hover:text-gray-100 transition-colors duration-300 flex-1">
                          {dream.description}
                        </p>
                      )}

                      {/* Enhanced Tags */}
                      {dream.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                          {dream.tags.slice(0, 3).map((tag) => (
                            <TagPill 
                              key={tag.id} 
                              tag={tag.label} 
                              size="sm" 
                              variant="gradient"
                              color={getTagColor(tag.id)}
                              tooltip={`${tag.categoryId} > ${tag.label}`}
                            />
                          ))}
                          {dream.tags.length > 3 && (
                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                              {t('moreResults', { count: dream.tags.length - 3 })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Enhanced Hover indicator */}
                      <div className="pt-3 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-auto">
                        <div className="flex items-center text-xs text-gray-400">
                          <Clock className="w-3 h-3 mr-2 text-gray-500" />
                          {t('clickToViewDetails')}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
