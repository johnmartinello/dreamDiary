import { Calendar, Clock, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { useDreamStore } from '../../store/dreamStore';
import type { Dream } from '../../types';
import { formatDate, formatTime } from '../../utils';
import { TagPill } from './TagPill';
import { useI18n } from '../../hooks/useI18n';

interface DreamCardProps {
  dream: Dream;
}

export function DreamCard({ dream }: DreamCardProps) {
  const { language } = useI18n();
  const { setSelectedDream, getTagColor } = useDreamStore();

  const handleClick = () => {
    setSelectedDream(dream.id);
  };

  return (
    <Card
      variant="glass"
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 border border-white/10"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <h3 className="text-lg font-semibold text-white line-clamp-2">
          {dream.title}
        </h3>
        <div className="flex items-center text-sm text-gray-300 mt-2 gap-3">
          <span className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {formatDate(dream.date, language)}
          </span>
          {dream.time && (
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {formatTime(dream.time)}
            </span>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        {dream.description && (
          <p className="text-gray-200 text-sm line-clamp-3 mb-4">
            {dream.description}
          </p>
        )}
        
        {dream.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="w-3 h-3 text-gray-400" />
            {dream.tags.slice(0, 3).map((tag) => (
              <TagPill 
                key={tag.id} 
                tag={tag.label} 
                size="sm" 
                variant="gradient"
                color={getTagColor(tag.id)}
              />
            ))}
            {dream.tags.length > 3 && (
              <span className="text-xs text-gray-300">
                +{dream.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
