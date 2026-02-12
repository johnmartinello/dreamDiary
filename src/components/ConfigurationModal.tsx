import { useState } from 'react';
import { Zap, Key, Brain, Lock, Globe, Database } from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useDreamStore } from '../store/dreamStore';
import { useLanguageStore } from '../store/languageStore';
import { PasswordSettings } from './auth/PasswordSettings';
import { DataManagement } from './data/DataManagement';
import { useI18n } from '../hooks/useI18n';
import { getAvailableLanguages } from '../utils/i18n';
import type { AIProvider } from '../types';

export function ConfigurationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { aiConfig, updateAIConfig, setAIProvider } = useDreamStore();
  const { language, setLanguage } = useLanguageStore();
  const { t, tArray } = useI18n();
  
  const [enabled, setEnabled] = useState(aiConfig.enabled);
  const [provider, setProvider] = useState<AIProvider>(aiConfig.provider);
  const [apiKey, setApiKey] = useState(aiConfig.apiKey);
  const [completionEndpoint, setCompletionEndpoint] = useState(aiConfig.completionEndpoint || 'http://localhost:1234/v1/chat/completions');
  const [modelName, setModelName] = useState(aiConfig.modelName);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'password' | 'language' | 'data'>('ai');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updateAIConfig({
        enabled,
        provider,
        apiKey,
        completionEndpoint,
        modelName,
      });
      onClose();
    } catch (error) {
      console.error('Error saving AI configuration:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderChange = (newProvider: AIProvider) => {
    // Save current configuration before switching
    updateAIConfig({
      enabled,
      provider,
      apiKey,
      completionEndpoint,
      modelName,
    });
    
    // Switch to new provider
    setProvider(newProvider);
    setAIProvider(newProvider);
    
    // Update form fields with the new provider's config, but preserve the enabled state
    const newConfig = useDreamStore.getState().aiConfig;
    setEnabled(enabled); // Preserve the current enabled state
    setApiKey(newConfig.apiKey);
    setCompletionEndpoint(newConfig.completionEndpoint || 'http://localhost:1234/v1/chat/completions');
    setModelName(newConfig.modelName);
  };

  const handleCancel = () => {
    // Reset form to current values
    setEnabled(aiConfig.enabled);
    setProvider(aiConfig.provider);
    setApiKey(aiConfig.apiKey);
    setCompletionEndpoint(aiConfig.completionEndpoint || 'http://localhost:1234/v1/chat/completions');
    setModelName(aiConfig.modelName);
    onClose();
  };

  const getProviderInstructions = (provider: AIProvider) => {
    switch (provider) {
      case 'gemini':
        return {
          title: t('geminiInstructions.title'),
          description: t('geminiInstructions.description'),
          instructions: tArray('geminiInstructions.steps')
        };
      case 'lmstudio':
        return {
          title: t('lmStudioInstructions.title'),
          description: t('lmStudioInstructions.description'),
          instructions: tArray('lmStudioInstructions.steps')
        };
      default:
        return { title: '', description: '', instructions: [] };
    }
  };

  const providerInfo = getProviderInstructions(provider);

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={t('configurations')} className="max-w-lg">
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 p-1 glass rounded-lg border border-white/20">
        <button
          onClick={() => setActiveTab('ai')}
          className={`
            flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 relative overflow-hidden group
            ${activeTab === 'ai' 
              ? 'glass text-white/90 font-medium shadow-inner-lg border border-white/20' 
              : 'text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20'
            }
          `}
        >
          <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <div className="flex items-center justify-center gap-2 relative z-10">
            <Brain className="w-4 h-4" />
            {t('aiFeatures')}
          </div>
        </button>
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

      {activeTab === 'ai' ? (
        <div className="space-y-6">
          {/* AI Features Toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center border border-white/20">
                <Zap className="w-5 h-5 text-white/90" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white/90">{t('aiFeatures')}</h3>
                <p className="text-sm text-white/60">{t('aiFeaturesDescription')}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 glass rounded-xl border border-white/20">
              <span className="text-white/90">{t('enableAI')}</span>
              <button
                onClick={() => setEnabled(!enabled)}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200
                  ${enabled ? 'bg-white/20 border border-white/30' : 'bg-white/10 border border-white/20'}
                `}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200
                    ${enabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          </div>

          {enabled && (
            <>
                          {/* Provider Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl glass flex items-center justify-center border border-white/20">
                  <Brain className="w-5 h-5 text-white/90" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white/90">{t('aiProvider')}</h3>
                  <p className="text-sm text-white/60">{t('chooseAI')}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleProviderChange('gemini')}
                  className={`
                    p-4 rounded-xl border transition-all duration-200 text-left relative overflow-hidden group
                    ${provider === 'gemini' 
                      ? 'glass text-white/90 font-medium shadow-inner-lg border border-white/20' 
                      : 'border-white/20 text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20'
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                                      <div className="font-medium mb-1">{t('gemini')}</div>
                  <div className="text-xs text-white/50">{t('geminiDescription')}</div>
                  </div>
                </button>
                
                <button
                  onClick={() => handleProviderChange('lmstudio')}
                  className={`
                    p-4 rounded-xl border transition-all duration-200 text-left relative overflow-hidden group
                    ${provider === 'lmstudio' 
                      ? 'glass text-white/90 font-medium shadow-inner-lg border border-white/20' 
                      : 'border-white/20 text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20'
                    }
                  `}
                >
                  <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                                      <div className="font-medium mb-1">{t('lmStudio')}</div>
                  <div className="text-xs text-white/50">{t('lmStudioDescription')}</div>
                  </div>
                </button>
              </div>
            </div>

              {/* Provider Instructions */}
              <div className="p-4 glass rounded-xl border border-white/20">
                <h4 className="font-semibold text-white/90 mb-2">{providerInfo.title}</h4>
                <p className="text-sm text-white/60 mb-3">{providerInfo.description}</p>
                <div className="space-y-1">
                  {providerInfo.instructions.map((instruction, index) => (
                    <p key={index} className="text-xs text-white/50">{instruction}</p>
                  ))}
                </div>
              </div>

              {/* API Configuration */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl glass flex items-center justify-center border border-white/20">
                    <Key className="w-5 h-5 text-white/90" />
                  </div>
                                  <div>
                  <h3 className="text-lg font-semibold text-white/90">{t('apiConfiguration')}</h3>
                  <p className="text-sm text-white/60">{t('setupCredentials')}</p>
                </div>
                </div>
                
                <div className="space-y-4">
                  {provider === 'gemini' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t('apiKey')}
                        </label>
                                               <Input
                         type="password"
                         value={apiKey}
                         onChange={(e) => setApiKey(e.target.value)}
                         placeholder={t('enterGeminiKey')}
                         variant="transparent"
                         className="w-full hover:border-white/50 focus:border-white/70 focus:ring-2 focus:ring-white/20 transition-all duration-200"
                       />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t('modelName')}
                        </label>
                                               <Input
                         type="text"
                         value={modelName}
                         onChange={(e) => setModelName(e.target.value)}
                         placeholder={t('enterModelName')}
                         variant="transparent"
                         className="w-full hover:border-white/50 focus:border-white/70 focus:ring-2 focus:ring-white/20 transition-all duration-200"
                       />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t('completionEndpoint')}
                        </label>
                                               <Input
                         type="text"
                         value={completionEndpoint}
                         onChange={(e) => setCompletionEndpoint(e.target.value)}
                         placeholder={t('enterEndpoint')}
                         variant="transparent"
                         className="w-full hover:border-white/50 focus:border-white/70 focus:ring-2 focus:ring-white/20 transition-all duration-200"
                       />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t('modelName')}
                        </label>
                                               <Input
                         type="text"
                         value={modelName}
                         onChange={(e) => setModelName(e.target.value)}
                         placeholder={t('enterLocalModel')}
                         variant="transparent"
                         className="w-full hover:border-white/50 focus:border-white/70 focus:ring-2 focus:ring-white/20 transition-all duration-200"
                       />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="ghost"
              onClick={handleCancel}
              className="flex-1 text-white/60 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20 relative overflow-hidden group cursor-pointer transition-all duration-300"
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <span className="relative z-10">{t('cancel')}</span>
            </Button>
                      <Button
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving || (enabled && (
              (provider === 'gemini' && (!apiKey || !modelName)) ||
              (provider === 'lmstudio' && (!completionEndpoint || !modelName))
            ))}
            className="flex-1 glass text-white/90 font-medium shadow-inner-lg border border-white/20 hover:glass-hover hover:text-white hover:border-white/30 relative overflow-hidden group cursor-pointer transition-all duration-300"
          >
            {/* Shimmer effect on hover */}
            <div className="absolute inset-0 bg-gradient-shimmer bg-shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <span className="relative z-10">{isSaving ? t('saving') : t('saveConfiguration')}</span>
          </Button>
          </div>
        </div>
      ) : activeTab === 'language' ? (
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
