import { ArrowLeft } from 'lucide-react';
import { useDreamStore } from '../../store/dreamStore';
import { Button } from '../ui/Button';
import { CategoryAnalysis } from './CategoryAnalysis';
import { useI18n } from '../../hooks/useI18n';
 
export function CategoryInsights() {
  const { t } = useI18n();
  const setCurrentView = useDreamStore((state) => state.setCurrentView);

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
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
          <CategoryAnalysis />
        </div>
      </div>
    </div>
  );
}
