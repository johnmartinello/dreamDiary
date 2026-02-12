import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useI18n } from '../../hooks/useI18n';
import {
  CATEGORY_COLORS,
  isPresetCategoryColor,
  normalizeCategoryColor,
  normalizeHexColor,
  resolveCategoryColorHex,
  type CategoryColor,
} from '../../types/taxonomy';

interface CategoryColorPickerModalProps {
  isOpen: boolean;
  title?: string;
  initialColor: CategoryColor;
  onClose: () => void;
  onConfirm: (color: CategoryColor) => void;
}

export function CategoryColorPickerModal({
  isOpen,
  title,
  initialColor,
  onClose,
  onConfirm,
}: CategoryColorPickerModalProps) {
  const { t } = useI18n();
  const [selectedColor, setSelectedColor] = useState<CategoryColor>(normalizeCategoryColor(initialColor));
  const [customHexInput, setCustomHexInput] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const normalizedInitial = normalizeCategoryColor(initialColor);
    setSelectedColor(normalizedInitial);
    setCustomHexInput(
      isPresetCategoryColor(normalizedInitial) ? resolveCategoryColorHex(normalizedInitial) : normalizedInitial
    );
  }, [initialColor, isOpen]);

  const normalizedCustomHex = useMemo(
    () => normalizeHexColor(customHexInput),
    [customHexInput]
  );

  const previewColor = useMemo(() => {
    if (isPresetCategoryColor(selectedColor)) {
      return resolveCategoryColorHex(selectedColor);
    }
    return resolveCategoryColorHex(normalizedCustomHex || selectedColor);
  }, [normalizedCustomHex, selectedColor]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || t('chooseCategoryColor')}
      className="max-w-md"
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400 mb-3">{t('presetColors')}</p>
          <div className="grid grid-cols-5 gap-2.5">
            {CATEGORY_COLORS.map((preset) => {
              const swatchHex = resolveCategoryColorHex(preset);
              const isSelected = selectedColor === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  className="h-10 rounded-xl border transition-all duration-200 hover:scale-[1.03] hover:brightness-110"
                  style={{
                    background: `linear-gradient(145deg, ${swatchHex}D6, ${swatchHex}96)`,
                    borderColor: isSelected ? '#FFFFFFCC' : '#FFFFFF26',
                    boxShadow: isSelected
                      ? `0 0 0 2px #FFFFFF44, 0 6px 14px ${swatchHex}55`
                      : `0 4px 10px ${swatchHex}33`,
                  }}
                  onClick={() => setSelectedColor(preset)}
                  aria-label={preset}
                  title={preset}
                >
                  {isSelected && <Check className="w-4 h-4 mx-auto text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-white/10 bg-black/30 p-4">
          <p className="text-xs uppercase tracking-wide text-gray-400">{t('customColor')}</p>
          <div className="flex items-center gap-2">
            <Input
              value={customHexInput}
              onChange={(e) => setCustomHexInput(e.target.value)}
              placeholder="#7C3AED"
              variant="glass"
              className="h-9 bg-black/30 border-white/15 text-white placeholder:text-gray-500"
            />
            <input
              type="color"
              value={normalizedCustomHex || '#7C3AED'}
              onChange={(e) => {
                setCustomHexInput(e.target.value);
                setSelectedColor(e.target.value.toUpperCase() as CategoryColor);
              }}
              className="h-9 w-12 cursor-pointer rounded-lg border border-white/20 bg-black/40"
              aria-label={t('customColor')}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (normalizedCustomHex) {
                  setSelectedColor(normalizedCustomHex);
                }
              }}
              disabled={!normalizedCustomHex}
              className="whitespace-nowrap"
            >
              {t('useCustom')}
            </Button>
          </div>
          {!normalizedCustomHex && customHexInput.trim() && (
            <p className="text-xs text-amber-300">{t('invalidHexColor')}</p>
          )}
        </div>

        <div className="rounded-xl border border-white/15 bg-black/35 p-3 flex items-center justify-between">
          <span className="text-sm text-gray-300">{t('preview')}</span>
          <span
            className="inline-flex items-center px-3 py-1 rounded-full text-sm border"
            style={{
              background: `linear-gradient(145deg, ${previewColor}45, ${previewColor}24)`,
              borderColor: `${previewColor}88`,
              color: '#F8FAFC',
            }}
          >
            {isPresetCategoryColor(selectedColor) ? selectedColor : (normalizeHexColor(selectedColor) || selectedColor)}
          </span>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onConfirm(normalizeCategoryColor(selectedColor))}
          >
            {t('applyColor')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
