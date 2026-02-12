import { useState } from 'react';
import { useDreamStore } from '../../store/dreamStore';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { TagPill } from './TagPill';
import { Trash2, RotateCcw, AlertTriangle, MoreHorizontal } from 'lucide-react';
import { useI18n } from '../../hooks/useI18n';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrashModal({ isOpen, onClose }: TrashModalProps) {
  const { t, language } = useI18n();
  const trashedDreams = useDreamStore((state) => state.trashedDreams);
  const restoreDream = useDreamStore((state) => state.restoreDream);
  const permanentlyDeleteDream = useDreamStore((state) => state.permanentlyDeleteDream);
  const clearTrash = useDreamStore((state) => state.clearTrash);
  const getTagColor = useDreamStore((state) => state.getTagColor);

  const [processingDreamId, setProcessingDreamId] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<'restore' | 'delete' | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleRestore = (id: string) => {
    setProcessingDreamId(id);
    setProcessingAction('restore');
    restoreDream(id);
    setProcessingDreamId(null);
    setProcessingAction(null);
  };

  const handlePermanentlyDelete = (id: string) => {
    setProcessingDreamId(id);
    setProcessingAction('delete');
    permanentlyDeleteDream(id);
    setProcessingDreamId(null);
    setProcessingAction(null);
  };

  const handleClearTrash = async () => {
    setShowClearConfirm(false);
    clearTrash();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDeletedDate = (deletedAt: string) => {
    return new Date(deletedAt).toLocaleDateString(language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('trash')} className="max-w-6xl max-h-[80vh]">
      <div className="space-y-6 h-full flex flex-col">
        {/* Header with clear trash button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white/90">{t('trash')}</h2>
            <p className="text-sm text-white/60">
              {t('dreamsInTrash', { count: trashedDreams.length })}
            </p>
          </div>
          {trashedDreams.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-2 text-red-400 border-red-400/20 hover:bg-red-400/10 hover:border-red-400/30"
            >
              
              {t('clearTrash')}
            </Button>
          )}
        </div>

        {/* Trashed dreams grid */}
        {trashedDreams.length === 0 ? (
          <div className="text-center py-12 flex-1 flex items-center justify-center">
            <div>
              <Trash2 className="w-12 h-12 text-white/30 mx-auto mb-4" />
              <p className="text-white/60 mb-2">{t('noDreamsInTrash')}</p>
              <p className="text-sm text-white/40">
                {t('deletedDreamsAppearHere')}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trashedDreams.map((dream) => (
                <Card key={dream.id} className="p-4 bg-black/20 border-white/10 hover:glass-hover transition-all duration-300 group min-h-[200px]">
                  <div className="space-y-3 h-full flex flex-col justify-between">
                    {/* Dream header */}
                    <div className="flex-1">
                      <h3 className="font-medium text-white/90 truncate mb-2">
                        {dream.title}
                      </h3>
                      <p className="text-sm text-white/60 mb-1">
                        {t('dreamedOn')} {formatDate(dream.date)}
                      </p>
                      <p className="text-xs text-white/40">
                        {t('deletedOn')} {formatDeletedDate(dream.deletedAt!)}
                      </p>
                    </div>

                    {/* Dream description */}
                    {dream.description && (
                      <div className="flex-1 min-h-0 mb-4">
                        <p className="text-sm text-white/70 line-clamp-3 leading-relaxed">
                          {dream.description}
                        </p>
                      </div>
                    )}

                    {/* Tags */}
                    {dream.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {dream.tags.slice(0, 3).map((tag) => (
                          <TagPill
                            key={tag.id}
                            tag={tag.label}
                            size="sm"
                            variant="outline"
                            color={getTagColor(tag.id)}
                          />
                        ))}
                        {dream.tags.length > 3 && (
                          <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-full border border-white/10">
                            {t('moreResults', { count: dream.tags.length - 3 })}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-white/10">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestore(dream.id)}
                        disabled={processingDreamId === dream.id}
                        className="flex-1 flex items-center justify-center text-emerald-400 hover:bg-emerald-400/10 hover:border-emerald-400/30 border border-emerald-400/20"
                        title={t('restoreDream')}
                      >
                        {processingDreamId === dream.id && processingAction === 'restore' ? (
                          <MoreHorizontal className="w-4 h-4 animate-pulse" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePermanentlyDelete(dream.id)}
                        disabled={processingDreamId === dream.id}
                        className="flex-1 flex items-center justify-center text-red-400 hover:bg-red-400/10 hover:border-red-400/30 border border-red-400/20"
                        title={t('permanentlyDelete')}
                      >
                        {processingDreamId === dream.id && processingAction === 'delete' ? (
                          <MoreHorizontal className="w-4 h-4 animate-pulse" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Clear trash confirmation modal */}
      {showClearConfirm && (
        <Modal 
          isOpen={showClearConfirm} 
          onClose={() => setShowClearConfirm(false)} 
          title={t('clearTrash')}
          className="max-w-md"
          showCloseButton={false}
        >
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h3 className="text-lg font-semibold text-white/90">
              {t('clearTrash')}
            </h3>
          </div>
          <p className="text-white/70 mb-6">
            {t('clearTrashConfirm', { count: trashedDreams.length })}
          </p>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowClearConfirm(false)}
              className="flex-1"
            >
              {t('cancel')}
            </Button>
            <Button
              variant="ghost"
              onClick={handleClearTrash}
              className="flex-1 text-red-400 border-red-400/20 hover:bg-red-400/10 hover:border-red-400/30"
            >
              {t('clearTrash')}
            </Button>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
