import { motion } from 'framer-motion';
import { Calendar, Clock, Plus } from 'lucide-react';
import { useDreamStore } from '../../store/dreamStore';
import { compareDates, getCurrentDateString, getTodayFormatted } from '../../utils';
import { formatDate } from '../../utils';
import { TagPill } from './TagPill';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { SearchBar } from './SearchBar';
import { DateFilter } from './DateFilter';
import { useI18n } from '../../hooks/useI18n';

export function DreamList() {
  const { t } = useI18n();
  const { 
    getFilteredDreams, 
    setSelectedDream, 
    searchQuery, 
    selectedTag, 
    dateRange,
    getTagColor,
    addDream,
    setSearchQuery,
    setDateRange
  } = useDreamStore();
  const dreams = getFilteredDreams();

  const handleNewDream = () => {
    addDream({
      title: `${getTodayFormatted()}`,
      date: getCurrentDateString(),
      description: '',
      tags: [],
      citedDreams: [],
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
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
                    ? `Search results for "${searchQuery}"`
                    : selectedTag 
                    ? `Dreams tagged with "${selectedTag}"` 
                    : dateRange.startDate || dateRange.endDate
                    ? 'Filtered dreams'
                    : ''}
                </h2>
                <p className="text-gray-300">
                  {dreams.length === 0
                    ? searchQuery 
                      ? 'No dreams found.'
                      : 'No dreams found. Start by logging your first dream.'
                    : `${dreams.length} dream${dreams.length === 1 ? '' : 's'} found`}
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
            />
          </div>
        </div>

        {dreams.length === 0 ? (
          <Card variant="glass" className="text-center py-16">
            <h3 className="text-xl font-semibold text-white mb-3">
              {searchQuery 
                ? 'No dreams found matching your search'
                : selectedTag 
                ? 'No dreams with this tag' 
                : dateRange.startDate || dateRange.endDate
                ? 'No dreams found in selected date range'
                : 'No dreams yet'}
            </h3>
            <p className="text-gray-300 max-w-md mx-auto">
              {searchQuery
                ? 'Try adjusting your search terms or browse all dreams.'
                : selectedTag
                ? 'Try selecting a different tag or create a new dream to get started.'
                : dateRange.startDate || dateRange.endDate
                ? 'Try adjusting your date range or browse all dreams.'
                : 'Click "Create Dream" to start logging your dreams.'}
            </p>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {dreams
              .sort((a, b) => compareDates(a.date, b.date))
              .map((dream) => (
                <motion.div 
                  key={dream.id} 
                  variants={itemVariants}
                  onClick={() => handleDreamClick(dream.id)}
                  className="group cursor-pointer"
                >
                  <Card 
                    variant="glass" 
                    className="p-4 hover:-translate-y-1 transition-all duration-300 ease-out relative overflow-hidden h-full min-h-[280px]"
                  >
                    {/* Shimmer effect on hover */}
                    <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10 h-full flex flex-col">
                      {/* Title and Date */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white group-hover:text-gray-200 transition-all duration-300 line-clamp-2 mb-2">
                            {dream.title}
                          </h3>
                          <div className="flex items-center text-sm text-gray-300">
                            <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                            {formatDate(dream.date)}
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
                              color={getTagColor(tag.id) as any}
                              tooltip={`${tag.categoryId} > ${tag.subcategoryId} > ${tag.label}`}
                            />
                          ))}
                          {dream.tags.length > 3 && (
                            <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                              +{dream.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Enhanced Hover indicator */}
                      <div className="pt-3 border-t border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-auto">
                        <div className="flex items-center justify-between">
                                                                        <div className="flex items-center text-xs text-gray-400">
                        <Clock className="w-3 h-3 mr-2 text-gray-500" />
                        {t('clickToViewDetails')}
                      </div>
                          
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
