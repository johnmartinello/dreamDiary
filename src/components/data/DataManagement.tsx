import { useState } from 'react';
import { Download, Upload, Database, CheckCircle, AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { useDreamStore } from '../../store/dreamStore';
import { exportToJSON, importFromJSON } from '../../utils/dataExport';
import { useI18n } from '../../hooks/useI18n';

export function DataManagement() {
  const { t } = useI18n();
  const dreams = useDreamStore((state) => state.dreams);
  const trashedDreams = useDreamStore((state) => state.trashedDreams);
  const exportData = useDreamStore((state) => state.exportData);
  const importData = useDreamStore((state) => state.importData);
  const resetAllData = useDreamStore((state) => state.resetAllData);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const handleExport = async () => {
    setIsExporting(true);
    setStatus({ type: null, message: '' });
    
    try {
      const data = exportData();
      await exportToJSON(data);
      setStatus({ type: 'success', message: t('exportSuccess') });
    } catch (error) {
      console.error('Export error:', error);
      setStatus({ 
        type: 'error', 
        message: error instanceof Error ? error.message : t('exportError') 
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setStatus({ type: null, message: '' });
    
    try {
      const { dreams: importedDreams, trashedDreams: importedTrashedDreams } = await importFromJSON();
      
      // Merge imported data with existing data
      importData(importedDreams, importedTrashedDreams);
      
      const totalImported = importedDreams.length + importedTrashedDreams.length;
      setStatus({ 
        type: 'success', 
        message: t('importSuccess', { count: totalImported }) 
      });
    } catch (error) {
      console.error('Import error:', error);
      if (error instanceof Error && error.message === 'Import cancelled') {
        setStatus({ type: null, message: '' });
      } else {
        setStatus({ 
          type: 'error', 
          message: error instanceof Error ? error.message : t('importError') 
        });
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteAllData = () => {
    resetAllData();
    setShowDeleteAllConfirm(false);
    setStatus({ type: 'success', message: t('deleteAllDataSuccess') });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl glass flex items-center justify-center border border-white/20">
            <Database className="w-5 h-5 text-white/90" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white/90">{t('dataManagement')}</h3>
            <p className="text-sm text-white/60">{t('dataManagementDescription')}</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 glass rounded-xl border border-white/20">
          <div className="text-sm text-white/60 mb-1">{t('dreamsCount')}</div>
          <div className="text-2xl font-semibold text-white/90">{dreams.length}</div>
        </div>
        <div className="p-4 glass rounded-xl border border-white/20">
          <div className="text-sm text-white/60 mb-1">{t('trashCount')}</div>
          <div className="text-2xl font-semibold text-white/90">{trashedDreams.length}</div>
        </div>
      </div>

      {/* Export Section */}
      <div className="space-y-3">
        <div className="p-4 glass rounded-xl border border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-5 h-5 text-white/90" />
            <div>
              <h4 className="font-semibold text-white/90">{t('exportData')}</h4>
              <p className="text-sm text-white/60">{t('exportDescription')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleExport}
            disabled={isExporting || (dreams.length === 0 && trashedDreams.length === 0)}
            className="w-full glass text-white/90 font-medium shadow-inner-lg border border-white/20 hover:glass-hover hover:text-white hover:border-white/30 relative overflow-hidden group cursor-pointer transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center gap-2">
              <Download className="w-4 h-4" />
              {isExporting ? t('exporting') : t('exportData')}
            </span>
          </Button>
        </div>
      </div>

      {/* Import Section */}
      <div className="space-y-3">
        <div className="p-4 glass rounded-xl border border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <Upload className="w-5 h-5 text-white/90" />
            <div>
              <h4 className="font-semibold text-white/90">{t('importData')}</h4>
              <p className="text-sm text-white/60">{t('importDescription')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleImport}
            disabled={isImporting}
            className="w-full glass text-white/90 font-medium shadow-inner-lg border border-white/20 hover:glass-hover hover:text-white hover:border-white/30 relative overflow-hidden group cursor-pointer transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10 flex items-center gap-2">
              <Upload className="w-4 h-4" />
              {isImporting ? t('importing') : t('importData')}
            </span>
          </Button>
        </div>
      </div>

      {/* Delete All Data Section */}
      <div className="space-y-3">
        <div className="p-4 glass rounded-xl border border-red-500/30 bg-red-500/10">
          <div className="flex items-center gap-3 mb-3">
            <Trash2 className="w-5 h-5 text-red-300" />
            <div>
              <h4 className="font-semibold text-red-200">{t('deleteAllData')}</h4>
              <p className="text-sm text-red-200/80">{t('deleteAllDataDescription')}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowDeleteAllConfirm(true)}
            disabled={dreams.length === 0 && trashedDreams.length === 0}
            className="w-full text-red-300 border-red-400/30 hover:bg-red-500/20 hover:border-red-400/50"
          >
            <span className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              {t('deleteAllData')}
            </span>
          </Button>

          {showDeleteAllConfirm && (
            <div className="mt-4 p-4 rounded-xl border border-red-400/30 bg-black/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h5 className="font-semibold text-red-200">{t('deleteAllData')}</h5>
              </div>
              <p className="text-sm text-white/75 mb-4">{t('deleteAllDataConfirm')}</p>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="flex-1"
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={handleDeleteAllData}
                  className="flex-1 text-red-400 border-red-400/20 hover:bg-red-400/10 hover:border-red-400/30"
                >
                  {t('deleteAllData')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Message */}
      {status.type && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          status.type === 'success' 
            ? 'glass border-green-500/30 bg-green-500/10' 
            : 'glass border-red-500/30 bg-red-500/10'
        }`}>
          {status.type === 'success' ? (
            <CheckCircle className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={`text-sm ${
            status.type === 'success' ? 'text-green-300' : 'text-red-300'
          }`}>
            {status.message}
          </span>
        </div>
      )}

    </div>
  );
}

