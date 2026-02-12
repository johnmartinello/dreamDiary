import { useState } from 'react';
import { Lock, Globe, Database } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { useLanguageStore } from '../store/languageStore';
import { PasswordSettings } from './auth/PasswordSettings';
import { DataManagement } from './data/DataManagement';
import { useI18n } from '../hooks/useI18n';
import { getAvailableLanguages } from '../utils/i18n';

export function ConfigurationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { language, setLanguage } = useLanguageStore();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'password' | 'language' | 'data'>('password');

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={t('configurations')} className="max-w-lg">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 p-1 glass rounded-lg border border-white/20">
        <button
          onClick={() => setActiveTab('password')}
          className={`
            flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 relative overflow-hidden group
            ${activeTab === 'password' 
              ? 'glass text-white/90 font-medium shadow-inner-lg border border-white/20' 
              : 'text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20'
            }
          `}
        >
          <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <Lock className="w-4 h-4" />
            {t('lockscreen')}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('language')}
          className={`
            flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 relative overflow-hidden group
            ${activeTab === 'language' 
              ? 'glass text-white/90 font-medium shadow-inner-lg border border-white/20' 
              : 'text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20'
            }
          `}
        >
          <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <Globe className="w-4 h-4" />
            {t('language')}
          </div>
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`
            flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 relative overflow-hidden group
            ${activeTab === 'data' 
              ? 'glass text-white/90 font-medium shadow-inner-lg border border-white/20' 
              : 'text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20'
            }
          `}
        >
          <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <Database className="w-4 h-4" />
            {t('dataManagement')}
          </div>
        </button>
      </div>
      {activeTab === 'language' ? (
        <div className="space-y-6">
          {/* Language Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center border border-white/20">
                <Globe className="w-5 h-5 text-white/90" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white/90">{t('language')}</h3>
                <p className="text-sm text-white/60">{t('choosePreferredLanguage')}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {getAvailableLanguages().map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  className={`
                    w-full p-4 rounded-xl border transition-all duration-200 text-left relative overflow-hidden group
                    ${language === lang.code 
                      ? 'glass text-white/90 font-medium shadow-inner-lg border border-white/20' 
                      : 'border-white/20 text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20'
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="font-medium mb-1">{lang.nativeName}</div>
                    <div className="text-xs text-white/50">{lang.name}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex-1 text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20 relative overflow-hidden group cursor-pointer transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{t('cancel')}</span>
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1 glass text-white/90 font-medium shadow-inner-lg border border-white/20 hover:glass-hover hover:text-white hover:border-white/30 relative overflow-hidden group cursor-pointer transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{t('save')}</span>
            </Button>
          </div>
        </div>
      ) : activeTab === 'data' ? (
        <DataManagement />
      ) : (
        <PasswordSettings onClose={onClose} />
      )}
    </Modal>
  );
}
