import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useDreamStore } from '../../store/dreamStore';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { CategoryAnalysis } from './CategoryAnalysis';
import { useI18n } from '../../hooks/useI18n';
 

type InsightView = 'overview' | 'analysis';

export function CategoryInsights() {
  const { t } = useI18n();
  const setCurrentView = useDreamStore((state) => state.setCurrentView);
  const dreams = useDreamStore((state) => state.dreams);
  const [currentInsightView, setCurrentInsightView] = useState<InsightView>('overview');

  const insightViews = [
    {
      id: 'overview' as InsightView,
      label: t('overview'),
      description: t('tagOverviewDescription'),
      color: 'blue'
    },
    {
      id: 'analysis' as InsightView,
      label: t('detailedAnalysis'),
      description: t('tagAnalysisDescription'),
      color: 'green'
    }
  ];

  const getCategoryStats = () => {
    const stats = {
      totalDreams: dreams.length,
      totalTags: 0,
      categoriesUsed: new Set<string>(),
      avgTagsPerDream: 0
    };

    dreams.forEach(dream => {
      stats.totalTags += dream.tags.length;
      dream.tags.forEach(tag => {
        stats.categoriesUsed.add(tag.categoryId);
      });
    });

    stats.avgTagsPerDream = stats.totalDreams > 0 ? stats.totalTags / stats.totalDreams : 0;
    return stats;
  };

  const stats = getCategoryStats();

  return (
    <div className="h-full flex flex-col">
      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {currentInsightView === 'overview' && (
          <div className="max-w-6xl mx-auto px-6 py-8">
            {/* Back Button */}
            <div className="mb-6">
              <Button 
                variant="ghost" 
                onClick={() => setCurrentView('home')} 
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('back')}
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card variant="glass" className="p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalDreams}</div>
                <div className="text-gray-400">{t('totalDreams')}</div>
              </Card>
              
              <Card variant="glass" className="p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{stats.totalTags}</div>
                <div className="text-gray-400">{t('totalTags')}</div>
              </Card>
              
              <Card variant="glass" className="p-6 text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">{stats.categoriesUsed.size}</div>
                <div className="text-gray-400">{t('categoriesUsed')}</div>
              </Card>
              
              <Card variant="glass" className="p-6 text-center">
                <div className="text-3xl font-bold text-orange-400 mb-2">{stats.avgTagsPerDream.toFixed(1)}</div>
                <div className="text-gray-400">{t('avgTagsPerDream')}</div>
              </Card>
            </div>

            {/* Insight Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {insightViews.slice(1).map(view => (
                <Card 
                  key={view.id}
                  variant="glass" 
                  className="p-8 cursor-pointer hover:bg-white/10 transition-all duration-200 group"
                  onClick={() => setCurrentInsightView(view.id)}
                >
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-3">{view.label}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{view.description}</p>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full group-hover:bg-white/10"
                  >
                    {t('explore')}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {currentInsightView === 'analysis' && (
          <div className="h-full overflow-auto">
            <div className="max-w-6xl mx-auto px-6 py-8">
              <div className="flex items-center gap-4 mb-6">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setCurrentInsightView('overview')}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('backToOverview')}
                </Button>
                <h2 className="text-xl font-semibold text-white">{t('detailedAnalysis')}</h2>
              </div>
              <CategoryAnalysis />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
