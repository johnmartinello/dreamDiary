import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Calendar, ChevronDown, Clock, Trash2, Edit3, AlertTriangle, Link, Search, Tag, X } from 'lucide-react';
import { useDreamStore } from '../../store/dreamStore';
import { useI18n } from '../../hooks/useI18n';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { TagPill } from './TagPill';
import { CategoryColorPickerModal } from './CategoryColorPickerModal';
import { Card } from '../ui/Card';
import { formatDateForInput, getCurrentDateString, formatTime } from '../../utils';
import { useDebounce } from '@uidotdev/usehooks';
import { cn } from '../../utils';
import {
  buildTagId,
  getFixedCategoryDefaultName,
  getFixedCategoryLabelKey,
  resolveCategoryColorHex,
  UNCATEGORIZED_CATEGORY_ID,
} from '../../types/taxonomy';
import type { CategoryColor, DreamTag } from '../../types/taxonomy';

type MentionSearchItem = {
  kind: 'dream' | 'tag';
  id: string;
  label: string;
  secondary: string;
};

type MentionDropdownItem =
  | MentionSearchItem
  | { kind: 'tag-create'; id: string; label: string; secondary: string }
  | { kind: 'tag-category'; id: string; label: string; secondary: string; categoryId: string };



export function DreamEditor() {
  const { t, tArray } = useI18n();
  const dreams = useDreamStore((state) => state.dreams);
  const selectedDreamId = useDreamStore((state) => state.selectedDreamId);
  const currentView = useDreamStore((state) => state.currentView);
  const setCurrentView = useDreamStore((state) => state.setCurrentView);
  const updateDream = useDreamStore((state) => state.updateDream);
  const deleteDream = useDreamStore((state) => state.deleteDream);
  const getTagColor = useDreamStore((state) => state.getTagColor);
  const getAllTags = useDreamStore((state) => state.getAllTags);
  const categories = useDreamStore((state) => state.categories);
  const updateCategory = useDreamStore((state) => state.updateCategory);
  const addCitation = useDreamStore((state) => state.addCitation);
  const removeCitation = useDreamStore((state) => state.removeCitation);
  const getDreamsThatCite = useDreamStore((state) => state.getDreamsThatCite);

  const dream = dreams.find((d) => d.id === selectedDreamId);

  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<DreamTag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [newTagCategory, setNewTagCategory] = useState<string>(UNCATEGORIZED_CATEGORY_ID);
  const [showTagAutocomplete, setShowTagAutocomplete] = useState(false);
  const [tagAutocompleteIndex, setTagAutocompleteIndex] = useState(0);
  const [tagAutocompletePosition, setTagAutocompletePosition] = useState({ top: 0, left: 0, width: 0 });
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCitedDreamModal, setShowCitedDreamModal] = useState(false);
  const [citedDreamPreview, setCitedDreamPreview] = useState<{
    id: string;
    title: string;
    date: string;
    description: string;
    tags: DreamTag[];
  } | null>(null);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [showColorPickerModal, setShowColorPickerModal] = useState(false);
  const [colorPickerTarget, setColorPickerTarget] = useState<{
    mode: 'modal-edit';
    categoryId?: string;
  } | null>(null);
  const [colorPickerInitialColor, setColorPickerInitialColor] = useState<CategoryColor>('violet');
  
  // Citation state
  const [showCitationSearch, setShowCitationSearch] = useState(false);
  const [citationSearchQuery, setCitationSearchQuery] = useState('');
  const [citedDreams, setCitedDreams] = useState<string[]>([]);
  const [citedTags, setCitedTags] = useState<string[]>([]);

  // Inline mention ("#" dreams, "@" tags) state
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagAutocompleteRef = useRef<HTMLDivElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionTrigger, setMentionTrigger] = useState<'#' | '@' | null>(null);
  const [mentionMode, setMentionMode] = useState<'search' | 'pick-category'>('search');
  const [pendingMentionTagLabel, setPendingMentionTagLabel] = useState('');
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 320 });
  const mentionPositionFrameRef = useRef<number | null>(null);

  // Modal refs (no longer using useClickOutside)
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const dateModalRef = useRef<HTMLDivElement>(null);

  const SAVING_INDICATOR_MS = 220;

  // Debounced values for auto-save
  const debouncedTitle = useDebounce(title, 500);
  const debouncedDescription = useDebounce(description, 600);
  const debouncedDate = useDebounce(date, 500);

  // Initialize form when dream changes
  useEffect(() => {
    if (dream) {
      const formattedDate = dream.date ? formatDateForInput(dream.date) : getCurrentDateString();
      setTitle(dream.title);
      setDate(formattedDate);
      setDescription(dream.description);
      setTags(dream.tags);
      setCitedDreams(dream.citedDreams || []);
      setCitedTags(dream.citedTags || []);
      
      // Initialize date picker state with dream's date
      if (dream.date) {
        const dreamDate = new Date(dream.date);
        setSelectedYear(dreamDate.getFullYear());
        setSelectedMonth(dreamDate.getMonth());
        setSelectedDay(dreamDate.getDate());
      } else {
        // If no date, use current date
        const today = new Date();
        setSelectedYear(today.getFullYear());
        setSelectedMonth(today.getMonth());
        setSelectedDay(today.getDate());
      }
      
      // Reset initialization flag and wait one frame for local state to settle.
      setIsInitialized(false);
      requestAnimationFrame(() => setIsInitialized(true));
    } else {
      setIsInitialized(false);
    }
  }, [dream]);

  useEffect(() => {
    if (newTagCategory !== UNCATEGORIZED_CATEGORY_ID && !categories.some((category) => category.id === newTagCategory)) {
      setNewTagCategory(categories[0]?.id || UNCATEGORIZED_CATEGORY_ID);
    }
  }, [categories, newTagCategory]);

  const allKnownTags = useMemo(() => getAllTags(), [dreams, getAllTags]);
  const matchingKnownTags = useMemo(() => {
    const query = newTag.trim().toLowerCase();
    return allKnownTags
      .filter((tag) => (tag.id.split('/')[0] || UNCATEGORIZED_CATEGORY_ID) === newTagCategory)
      .filter((tag) => tag.label.toLowerCase().includes(query))
      .slice(0, 8);
  }, [allKnownTags, newTag, newTagCategory]);

  const canCreateTypedTag = newTag.trim().length > 0 && !matchingKnownTags.some(
    (tag) => tag.label.toLowerCase() === newTag.trim().toLowerCase()
  );

  useEffect(() => {
    setTagAutocompleteIndex(0);
  }, [newTag, showTagAutocomplete]);

  const updateTagAutocompletePosition = () => {
    const input = tagInputRef.current;
    if (!input) return;
    const rect = input.getBoundingClientRect();
    setTagAutocompletePosition({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  };

  const closeMentionDropdown = useCallback(() => {
    setMentionOpen(false);
    setMentionQuery('');
    setMentionStart(null);
    setMentionTrigger(null);
    setMentionMode('search');
    setPendingMentionTagLabel('');
    setMentionSelectedIndex(0);
  }, []);

  useEffect(() => {
    if (!showTagAutocomplete) return;
    updateTagAutocompletePosition();

    const handleReposition = () => updateTagAutocompletePosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [showTagAutocomplete]);

  useEffect(() => {
    if (!showTagAutocomplete && !mentionOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as Node;
      const tagInput = tagInputRef.current;
      const tagDropdown = tagAutocompleteRef.current;
      const mentionDropdown = mentionDropdownRef.current;
      const textarea = textareaRef.current;

      const clickedInsideTag = Boolean(
        (tagInput && tagInput.contains(target)) || (tagDropdown && tagDropdown.contains(target))
      );
      const clickedInsideMention = Boolean(
        (textarea && textarea.contains(target)) || (mentionDropdown && mentionDropdown.contains(target))
      );

      if (!clickedInsideTag) setShowTagAutocomplete(false);
      if (!clickedInsideMention) closeMentionDropdown();
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showTagAutocomplete, mentionOpen, closeMentionDropdown]);

  useEffect(() => {
    if (!mentionOpen) return;
    const handleReposition = () => scheduleMentionDropdownPositionUpdate();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [mentionOpen]);

  useEffect(
    () => () => {
      if (mentionPositionFrameRef.current !== null) {
        cancelAnimationFrame(mentionPositionFrameRef.current);
      }
    },
    []
  );

  // Auto-save effect - only runs after initialization and when values actually change
  useEffect(() => {
    if (dream && selectedDreamId && isInitialized) {
      // Detect citations created via inline "#Title" mentions and sync with citations
      const mentionsFromDescription: string[] = dreams
        .filter((d) => d.id !== selectedDreamId && description.includes(`#${d.title}`))
        .map((d) => d.id);

      // Detect tag citations created via inline "@tag" mentions and sync with citations
      const tagMentionsFromDescription: string[] = allKnownTags
        .filter((tag) => description.includes(`@${tag.label}`))
        .map((tag) => tag.id);
      
      // Remove citations that no longer exist in the description
      const updatedCitations = citedDreams.filter(citationId => {
        const citedDream = dreams.find(d => d.id === citationId);
        // Keep backward compatibility with older "@dream" mentions.
        return citedDream && (
          description.includes(`#${citedDream.title}`) ||
          description.includes(`@${citedDream.title}`)
        );
      });

      const updatedTagCitations = citedTags.filter((citationTagId) => {
        const citedTag = allKnownTags.find((tag) => tag.id === citationTagId);
        return citedTag && description.includes(`@${citedTag.label}`);
      });
      
      // Add new citations from mentions
      const finalCitations = Array.from(new Set([...updatedCitations, ...mentionsFromDescription]));
      const finalTagCitations = Array.from(new Set([...updatedTagCitations, ...tagMentionsFromDescription]));
      
      if (JSON.stringify(finalCitations) !== JSON.stringify(citedDreams)) {
        setCitedDreams(finalCitations);
      }
      if (JSON.stringify(finalTagCitations) !== JSON.stringify(citedTags)) {
        setCitedTags(finalTagCitations);
      }

      // Only save if the debounced values are different from the original dream values
      // and the debounced values are not empty (which happens during initialization)
      const hasChanges = 
        (debouncedTitle !== dream.title && debouncedTitle !== '') ||
        (debouncedDate !== dream.date && debouncedDate !== '') ||
        (debouncedDescription !== dream.description && debouncedDescription !== '') ||
        JSON.stringify(tags) !== JSON.stringify(dream.tags) ||
        JSON.stringify(finalCitations) !== JSON.stringify(dream.citedDreams || []) ||
        JSON.stringify(finalTagCitations) !== JSON.stringify(dream.citedTags || []);

      if (hasChanges) {
        setIsSaving(true);
        console.log('Auto-saving dream:', {
          id: selectedDreamId,
          title: debouncedTitle,
          date: debouncedDate,
          description: description, // Use current description instead of debounced
          tags,
          citedDreams: finalCitations,
          citedTags: finalTagCitations,
        });
        updateDream(selectedDreamId, {
          title: debouncedTitle,
          date: debouncedDate,
          description: description, // Use current description instead of debounced
          tags,
          citedDreams: finalCitations,
          citedTags: finalTagCitations,
        });
        setTimeout(() => setIsSaving(false), SAVING_INDICATOR_MS);
      }
    }
  }, [debouncedTitle, debouncedDate, debouncedDescription, tags, citedDreams, citedTags, dream, selectedDreamId, updateDream, isInitialized, description, allKnownTags, dreams]);

  const handleAddTag = (labelOverride?: string, categoryOverride?: string) => {
    const label = (labelOverride || newTag).trim();
    if (!label) return;
    const categoryId = categoryOverride || newTagCategory || UNCATEGORIZED_CATEGORY_ID;
    const id = buildTagId(categoryId, label);
    if (!tags.some(t => t.id === id)) {
      setTags([...tags, { id, label, categoryId, isCustom: true }]);
      setNewTag('');
      setShowTagAutocomplete(false);
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag.id !== tagToRemove));
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const canSelectExisting = showTagAutocomplete && matchingKnownTags.length > 0;

    if (e.key === 'ArrowDown' && canSelectExisting) {
      e.preventDefault();
      setTagAutocompleteIndex((prev) => Math.min(prev + 1, matchingKnownTags.length - 1));
      return;
    }

    if (e.key === 'ArrowUp' && canSelectExisting) {
      e.preventDefault();
      setTagAutocompleteIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (e.key === 'Escape') {
      setShowTagAutocomplete(false);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (canSelectExisting) {
        const selected = matchingKnownTags[Math.max(0, Math.min(tagAutocompleteIndex, matchingKnownTags.length - 1))];
        const categoryId = selected.id.split('/')[0] || UNCATEGORIZED_CATEGORY_ID;
        handleAddTag(selected.label, categoryId);
      } else {
        handleAddTag();
      }
    }
  };

  const getCategoryDisplayName = (categoryId: string): string => {
    if (!categoryId || categoryId === UNCATEGORIZED_CATEGORY_ID) {
      return t('uncategorized');
    }
    const key = getFixedCategoryLabelKey(categoryId);
    if (key) {
      const translated = t(key);
      if (translated !== key) return translated;
      return getFixedCategoryDefaultName(categoryId) || translated;
    }
    return categories.find((category) => category.id === categoryId)?.name || categoryId;
  };

  const openCategoryColorPicker = (target: { mode: 'modal-edit'; categoryId?: string }, color: CategoryColor) => {
    setColorPickerTarget(target);
    setColorPickerInitialColor(color);
    setShowColorPickerModal(true);
  };

  const handleCategoryColorPick = (color: CategoryColor) => {
    if (!colorPickerTarget) return;

    if (colorPickerTarget.mode === 'modal-edit' && colorPickerTarget.categoryId) {
      updateCategory(colorPickerTarget.categoryId, { color });
    }

    setShowColorPickerModal(false);
    setColorPickerTarget(null);
  };

  const getColorChipStyle = (color: CategoryColor) => {
    const hex = resolveCategoryColorHex(color);
    return {
      background: `linear-gradient(145deg, ${hex}44, ${hex}26)`,
      borderColor: `${hex}88`,
    };
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (dream) {
      deleteDream(dream.id);
      setShowDeleteModal(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  const handleBack = () => {
    // Save current state before navigating away
    if (dream && selectedDreamId) {
      const hasChanges = 
        title !== dream.title ||
        date !== dream.date ||
        description !== dream.description ||
        JSON.stringify(tags) !== JSON.stringify(dream.tags) ||
        JSON.stringify(citedDreams) !== JSON.stringify(dream.citedDreams || []) ||
        JSON.stringify(citedTags) !== JSON.stringify(dream.citedTags || []);

      if (hasChanges) {
        setIsSaving(true);
        console.log('Saving before navigation:', {
          id: selectedDreamId,
          title,
          date,
          description,
          tags,
          citedDreams,
          citedTags,
        });
        updateDream(selectedDreamId, {
          title,
          date,
          description,
          tags,
          citedDreams,
          citedTags,
        });
        setTimeout(() => setIsSaving(false), SAVING_INDICATOR_MS);
      }
    }
    setCurrentView('home');
  };

  // Citation handlers
  const handleAddCitation = (citedDreamId: string) => {
    if (selectedDreamId) {
      addCitation(selectedDreamId, citedDreamId);
      setCitedDreams([...citedDreams, citedDreamId]);
      setShowCitationSearch(false);
      setCitationSearchQuery('');
    }
  };

  const handleRemoveCitation = (citedDreamId: string) => {
    if (selectedDreamId) {
      removeCitation(selectedDreamId, citedDreamId);
      setCitedDreams(citedDreams.filter(id => id !== citedDreamId));
    }
  };

  const handleRemoveTagCitation = (tagId: string) => {
    setCitedTags(citedTags.filter((id) => id !== tagId));
  };

  const filteredCitationItems = useMemo(() => {
    const query = citationSearchQuery.trim().toLowerCase();
    const dreamItems = dreams
      .filter((d) => d.id !== selectedDreamId)
      .filter((d) => !citedDreams.includes(d.id))
      .filter((d) =>
        !query ||
        d.title.toLowerCase().includes(query) ||
        d.description.toLowerCase().includes(query)
      )
      .map((d) => ({
        kind: 'dream' as const,
        id: d.id,
        title: d.title,
        subtitle: d.date,
        preview: d.description.substring(0, 100),
      }));

    const tagItems = allKnownTags
      .filter((tag) => !citedTags.includes(tag.id))
      .filter((tag) => !query || tag.label.toLowerCase().includes(query))
      .map((tag) => ({
        kind: 'tag' as const,
        id: tag.id,
        title: tag.label,
        subtitle: getCategoryDisplayName(tag.id.split('/')[0] || UNCATEGORIZED_CATEGORY_ID),
      }));

    return [...dreamItems, ...tagItems].slice(0, 30);
  }, [allKnownTags, citationSearchQuery, citedDreams, citedTags, dreams, selectedDreamId, categories, t]);

  const filteredMentionItems = useMemo<MentionSearchItem[]>(() => {
    const query = mentionQuery.trim().toLowerCase();
    if (mentionTrigger === '#') {
      return dreams
        .filter((d) => d.id !== selectedDreamId)
        .filter((d) => !query || d.title.toLowerCase().includes(query))
        .slice(0, 20)
        .map((d) => ({ kind: 'dream' as const, id: d.id, label: d.title, secondary: d.date }));
    }
    if (mentionTrigger === '@') {
      return allKnownTags
        .filter((tag) => !query || tag.label.toLowerCase().includes(query))
        .slice(0, 20)
        .map((tag) => ({
          kind: 'tag' as const,
          id: tag.id,
          label: tag.label,
          secondary: getCategoryDisplayName(tag.id.split('/')[0] || UNCATEGORIZED_CATEGORY_ID),
        }));
    }
    return [];
  }, [allKnownTags, mentionQuery, dreams, selectedDreamId, categories, t, mentionTrigger]);

  const canCreateMentionTag = useMemo(() => {
    if (mentionTrigger !== '@') return false;
    const rawLabel = mentionQuery.trim();
    if (!rawLabel) return false;
    const normalized = rawLabel.toLowerCase();
    return !allKnownTags.some((tag) => tag.label.toLowerCase() === normalized);
  }, [allKnownTags, mentionQuery, mentionTrigger]);

  const categorySelectionItems = useMemo<Array<{ id: string; categoryId: string; label: string; secondary: string }>>(
    () => [
      {
        id: `category-${UNCATEGORIZED_CATEGORY_ID}`,
        categoryId: UNCATEGORIZED_CATEGORY_ID,
        label: getCategoryDisplayName(UNCATEGORIZED_CATEGORY_ID),
        secondary: t('uncategorized'),
      },
      ...categories.map((category) => ({
        id: `category-${category.id}`,
        categoryId: category.id,
        label: getCategoryDisplayName(category.id),
        secondary: category.id,
      })),
    ],
    [categories, t]
  );

  const mentionDropdownItems = useMemo<MentionDropdownItem[]>(() => {
    if (mentionMode === 'pick-category' && pendingMentionTagLabel.trim()) {
      return categorySelectionItems.map((item) => ({
        kind: 'tag-category' as const,
        id: item.id,
        label: item.label,
        secondary: item.secondary,
        categoryId: item.categoryId,
      }));
    }
    if (!canCreateMentionTag) return filteredMentionItems;
    const categoryId = categories.some((category) => category.id === newTagCategory)
      ? newTagCategory
      : UNCATEGORIZED_CATEGORY_ID;
    return [
      ...filteredMentionItems,
      {
        kind: 'tag-create' as const,
        id: buildTagId(categoryId, mentionQuery.trim()),
        label: mentionQuery.trim(),
        secondary: t('selectCategory'),
      },
    ];
  }, [
    mentionMode,
    pendingMentionTagLabel,
    categorySelectionItems,
    canCreateMentionTag,
    filteredMentionItems,
    categories,
    newTagCategory,
    mentionQuery,
    t,
  ]);

  const updateMentionDropdownPosition = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const caretIndex = ta.selectionStart || 0;

    // Create mirror element to measure caret position
    const div = document.createElement('div');
    const style = window.getComputedStyle(ta);
    const properties = [
      'boxSizing','width','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth',
      'fontStyle','fontVariant','fontWeight','fontStretch','fontSize','fontFamily','lineHeight','letterSpacing','textTransform','textIndent','textAlign'
    ];
    properties.forEach((prop) => {
      // @ts-expect-error
      div.style[prop] = style.getPropertyValue(prop);
    });
    div.style.position = 'absolute';
    div.style.top = '0px';
    div.style.left = '0px';
    div.style.whiteSpace = 'pre-wrap';
    div.style.visibility = 'hidden';
    div.style.wordWrap = 'break-word';
    div.style.overflow = 'hidden';
    div.style.width = `${ta.clientWidth}px`;
    div.style.height = `${ta.clientHeight}px`;

    const before = ta.value.substring(0, caretIndex);
    const span = document.createElement('span');
    span.textContent = '\u200b'; // zero-width marker at caret

    const pre = document.createElement('span');
    pre.textContent = before;
    div.appendChild(pre);
    div.appendChild(span);

    document.body.appendChild(div);
    const textareaRect = ta.getBoundingClientRect();
    const spanRect = span.getBoundingClientRect();

    const caretTop = spanRect.top - ta.scrollTop;
    const caretLeft = spanRect.left - ta.scrollLeft;

    const dropdownWidth = Math.min(360, Math.max(300, ta.clientWidth * 0.6));
    const left = Math.max(12, Math.min(textareaRect.left + caretLeft, window.innerWidth - dropdownWidth - 12));
    const top = Math.max(12, Math.min(textareaRect.top + caretTop + 24, window.innerHeight - 64));

    setMentionPosition({ top, left, width: dropdownWidth });
    document.body.removeChild(div);
  };

  const scheduleMentionDropdownPositionUpdate = () => {
    if (mentionPositionFrameRef.current !== null) return;
    mentionPositionFrameRef.current = requestAnimationFrame(() => {
      mentionPositionFrameRef.current = null;
      updateMentionDropdownPosition();
    });
  };

  useEffect(() => {
    setMentionSelectedIndex((prev) => Math.max(0, Math.min(prev, mentionDropdownItems.length - 1)));
  }, [mentionDropdownItems.length]);

  useEffect(() => {
    if (!mentionOpen) return;
    const dropdown = mentionDropdownRef.current;
    if (!dropdown) return;
    const selectedItem = dropdown.querySelector<HTMLElement>(`[data-mention-index="${mentionSelectedIndex}"]`);
    if (!selectedItem) return;
    selectedItem.scrollIntoView({ block: 'nearest' });
  }, [mentionOpen, mentionSelectedIndex, mentionDropdownItems.length]);

  const insertMention = (item: { kind: 'dream' | 'tag'; id: string; label: string }) => {
    const ta = textareaRef.current;
    if (!ta || mentionStart === null) return;
    const caret = ta.selectionStart || 0;
    const before = description.substring(0, mentionStart);
    const after = description.substring(caret);
    const mentionText = item.kind === 'dream' ? `#${item.label}` : `@${item.label}`;
    const newValue = `${before}${mentionText}${after}`;
    setDescription(newValue);
    // Move caret to end of inserted text
    const nextPos = before.length + mentionText.length;
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(nextPos, nextPos);
    });
    // Add citation id locally (dedup later in autosave).
    if (item.kind === 'dream' && !citedDreams.includes(item.id)) {
      setCitedDreams([...citedDreams, item.id]);
    }
    if (item.kind === 'tag' && !citedTags.includes(item.id)) {
      setCitedTags([...citedTags, item.id]);
    }
    if (item.kind === 'tag') {
      const categoryId = item.id.split('/')[0] || UNCATEGORIZED_CATEGORY_ID;
      const tagToAttach: DreamTag = { id: item.id, label: item.label, categoryId };
      setTags((prev) => (prev.some((tag) => tag.id === item.id) ? prev : [...prev, tagToAttach]));
    }
    closeMentionDropdown();
  };

  const createAndInsertTagMention = (label: string, categoryOverride?: string) => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    const hasOverrideCategory = Boolean(
      categoryOverride &&
      (categoryOverride === UNCATEGORIZED_CATEGORY_ID || categories.some((category) => category.id === categoryOverride))
    );
    const categoryId = hasOverrideCategory
      ? categoryOverride!
      : categories.some((category) => category.id === newTagCategory)
        ? newTagCategory
        : UNCATEGORIZED_CATEGORY_ID;
    const id = buildTagId(categoryId, trimmedLabel);

    if (!tags.some((tag) => tag.id === id)) {
      setTags([...tags, { id, label: trimmedLabel, categoryId, isCustom: true }]);
    }
    setNewTagCategory(categoryId);
    insertMention({ kind: 'tag', id, label: trimmedLabel });
  };

  const openMentionCategorySelection = (label: string) => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) return;
    const currentCategoryId =
      newTagCategory === UNCATEGORIZED_CATEGORY_ID || categories.some((category) => category.id === newTagCategory)
        ? newTagCategory
        : UNCATEGORIZED_CATEGORY_ID;
    const selectedIndex = Math.max(
      0,
      categorySelectionItems.findIndex((item) => item.categoryId === currentCategoryId)
    );
    setPendingMentionTagLabel(trimmedLabel);
    setMentionMode('pick-category');
    setMentionSelectedIndex(selectedIndex);
  };

  // Custom date picker helpers
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };



  const handleDateSelect = (day: number) => {
    setSelectedDay(day);
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  };

  // Generate years for dropdown (from 2020 to current year + 10)
  const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = 2020; year <= currentYear + 10; year++) {
      years.push(year);
    }
    return years;
  };

  // Generate months for dropdown
  const generateMonthOptions = () => {
    return tArray('months').map((month, index) => ({
      value: index,
      label: month
    }));
  };

  // Validate and adjust selected day when month/year changes
  const validateSelectedDay = (year: number, month: number, day: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    return Math.min(day, daysInMonth);
  };

  // Handle month change
  const handleMonthChange = (newMonth: number) => {
    const validatedDay = validateSelectedDay(selectedYear, newMonth, selectedDay);
    setSelectedMonth(newMonth);
    setSelectedDay(validatedDay);
  };

  // Handle year change
  const handleYearChange = (newYear: number) => {
    const validatedDay = validateSelectedDay(newYear, selectedMonth, selectedDay);
    setSelectedYear(newYear);
    setSelectedDay(validatedDay);
  };

  if (!dream) {
    // Avoid showing the fallback while navigating away to home to prevent flicker
    if (currentView !== 'dream') return null;
    return (
      <div className="h-full flex items-center justify-center">
        <Card variant="glass" className="text-center p-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-6 border border-red-400/30">
            <Edit3 className="w-8 h-8 text-red-300" />
          </div>
          <h2 className="text-2xl font-semibold text-gradient-pink mb-4">{t('dreamNotFound')}</h2>
          <Button onClick={handleBack} variant="primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDreams')}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="h-full overflow-auto">
        {/* Top Navigation Bar - unified transparent style */}
        <div className="sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={handleBack} className="flex items-center justify-center">
                <ArrowLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-3">
                
                <Button 
                  variant="secondary" 
                  onClick={handleDelete} 
                  className="text-red-300 hover:text-red-200 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Combined Dream Info Card */}
          <Card variant="glass" className="p-6 mb-8">
            <div className="space-y-4">
              {/* Title and Date Row */}
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('titlePlaceholder')}
                    variant="transparent"
                    className="text-3xl font-bold px-0 py-2 rounded-xl border border-white/10 text-white/80 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20 transition-all duration-300"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-300 ml-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <Button
                      variant="ghost"
                      onClick={() => setShowDateMenu(!showDateMenu)}
                      className="text-gray-300 hover:text-gray-200 px-2 py-1 relative"
                    >
                      {formatDateForInput(date)}
                    </Button>
                  </div>
                  {dream.time && (
                    <div className="flex items-center gap-1 text-gray-300 px-2 py-1">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{formatTime(dream.time)}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Tags Row */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">{t('category')}:</span>
                    <div className="relative">
                      <select
                        value={newTagCategory}
                        onChange={(e) => setNewTagCategory(e.target.value)}
                        className="appearance-none h-8 rounded-xl border border-gray-400/30 bg-transparent pl-3 pr-8 text-sm text-gray-200 transition-all duration-300 ease-out hover:text-white hover:bg-white/5 hover:glass hover:border-gray-300/50 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 [&>option]:bg-gray-900"
                      >
                        <option value={UNCATEGORIZED_CATEGORY_ID}>{t('uncategorized')}</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {getCategoryDisplayName(category.id)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-300" />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-200 hover:text-white"
                      onClick={() => setShowManageCategoriesModal(true)}
                    >
                      {t('manageCategories')}
                    </Button>
                  </div>

                </div>

                {/* Tag Input (Option A: search existing first, then create) */}
                <div className="flex items-start gap-3">
                  <div className="relative flex-1">
                    <Input
                      ref={tagInputRef}
                      value={newTag}
                      onChange={(e) => {
                        setNewTag(e.target.value);
                        setShowTagAutocomplete(true);
                        requestAnimationFrame(() => updateTagAutocompletePosition());
                      }}
                      onFocus={() => {
                        setShowTagAutocomplete(true);
                        requestAnimationFrame(() => updateTagAutocompletePosition());
                      }}
                      onClick={() => {
                        setShowTagAutocomplete(true);
                        requestAnimationFrame(() => updateTagAutocompletePosition());
                      }}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder={t('searchOrCreateTag')}
                      variant="transparent"
                      className="w-full border-b border-white/20 focus:border-gray-400 px-0 py-1 text-sm"
                    />
                    {showTagAutocomplete && createPortal(
                      <div
                        ref={tagAutocompleteRef}
                        className="fixed z-[10000] max-h-56 overflow-auto bg-black/90 border border-white/10 rounded-lg p-2 space-y-1 shadow-2xl"
                        style={{
                          top: tagAutocompletePosition.top,
                          left: tagAutocompletePosition.left,
                          width: tagAutocompletePosition.width,
                        }}
                      >
                        {matchingKnownTags.map((knownTag) => {
                          const categoryId = knownTag.id.split('/')[0] || UNCATEGORIZED_CATEGORY_ID;
                          const categoryName = getCategoryDisplayName(categoryId);
                          const itemIndex = matchingKnownTags.findIndex((item) => item.id === knownTag.id);
                          return (
                            <button
                              key={knownTag.id}
                              className={cn(
                                'w-full text-left px-2 py-1 rounded text-sm text-white/90 flex items-center justify-between',
                                tagAutocompleteIndex === itemIndex ? 'bg-white/15' : 'hover:bg-white/10'
                              )}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleAddTag(knownTag.label, categoryId);
                              }}
                              onMouseEnter={() => setTagAutocompleteIndex(itemIndex)}
                            >
                              <span>{knownTag.label}</span>
                              <span className="text-xs text-white/50">{categoryName}</span>
                            </button>
                          );
                        })}
                        {canCreateTypedTag && (
                          <button
                            className="w-full text-left px-2 py-1 rounded hover:bg-white/10 text-sm text-emerald-300"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleAddTag(newTag, newTagCategory);
                            }}
                          >
                            {t('newTag')}: "{newTag.trim()}"
                          </button>
                        )}
                      </div>,
                      document.body
                    )}
                  </div>
                </div>
                
                {/* Tag Listing */}
                {tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {tags.map((tag) => (
                                              <TagPill
                          key={tag.id}
                          tag={tag.label}
                          removable
                          onRemove={() => handleRemoveTag(tag.id)}
                          size="sm"
                          variant="gradient"
                          color={getTagColor(tag.id)}
                          tooltip={`${getCategoryDisplayName(tag.categoryId)} > ${tag.label}`}
                        />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Enhanced Description Section */}
          <Card variant="glass" className="p-8 shadow-depth-3">
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => {
                  const value = e.target.value;
                  setDescription(value);
                  if (mentionOpen && mentionStart !== null && mentionTrigger) {
                    const caret = (e.target as HTMLTextAreaElement).selectionStart || 0;
                    // Close if caret moved to/before trigger or trigger char was deleted.
                    if (caret <= mentionStart || value[mentionStart] !== mentionTrigger) {
                      closeMentionDropdown();
                      return;
                    }
                    const slice = value.slice(mentionStart, caret);
                    if (/\s/.test(slice) || slice.includes('\n')) {
                      closeMentionDropdown();
                    } else {
                      if (mentionMode === 'pick-category') {
                        setMentionMode('search');
                        setPendingMentionTagLabel('');
                      }
                      setMentionQuery(slice.slice(1));
                      scheduleMentionDropdownPositionUpdate();
                    }
                  }
                }}
                onKeyDown={(e) => {
                  // Open mention dropdown when typing a citation trigger.
                  if (e.key === '@' || e.key === '#') {
                    setMentionOpen(true);
                    const ta = textareaRef.current;
                    if (ta) {
                      setMentionStart(ta.selectionStart);
                      setMentionTrigger(e.key === '#' ? '#' : '@');
                      setMentionQuery('');
                      setMentionMode('search');
                      setPendingMentionTagLabel('');
                      setMentionSelectedIndex(0);
                      scheduleMentionDropdownPositionUpdate();
                    }
                    return; // allow input of the trigger character
                  }

                  if (mentionOpen) {
                    if (e.key === 'ArrowDown') {
                      if (mentionDropdownItems.length === 0) return;
                      e.preventDefault();
                      setMentionSelectedIndex((idx) => Math.min(idx + 1, mentionDropdownItems.length - 1));
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      if (mentionDropdownItems.length === 0) return;
                      e.preventDefault();
                      setMentionSelectedIndex((idx) => Math.max(idx - 1, 0));
                      return;
                    }
                    if (e.key === 'Enter') {
                      const list = mentionDropdownItems;
                      if (list.length > 0) {
                        e.preventDefault();
                        const selected = list[Math.max(0, Math.min(mentionSelectedIndex, list.length - 1))];
                        if (selected.kind === 'tag-create') {
                          openMentionCategorySelection(selected.label);
                        } else if (selected.kind === 'tag-category') {
                          createAndInsertTagMention(pendingMentionTagLabel || mentionQuery, selected.categoryId);
                        } else {
                          insertMention(selected);
                        }
                      }
                      return;
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      if (mentionMode === 'pick-category') {
                        setMentionMode('search');
                        setPendingMentionTagLabel('');
                        setMentionSelectedIndex(0);
                        return;
                      }
                      closeMentionDropdown();
                      return;
                    }
                  }
                }}
                onClick={() => {
                  if (mentionOpen) scheduleMentionDropdownPositionUpdate();
                }}
                onKeyUp={() => {
                  if (mentionOpen) scheduleMentionDropdownPositionUpdate();
                }}
                onScroll={() => {
                  if (mentionOpen) scheduleMentionDropdownPositionUpdate();
                }}
                placeholder={t('describeYourDream')}
                variant="transparent"
                className="min-h-[500px] text-base leading-relaxed w-full"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              />

              {mentionOpen && createPortal(
                <div
                  ref={mentionDropdownRef}
                  role="listbox"
                  aria-label={mentionMode === 'pick-category' ? t('selectCategory') : t('citations')}
                  className="fixed z-[10000] max-h-56 overflow-y-auto overflow-x-hidden bg-black/90 backdrop-blur rounded-lg border border-white/10 shadow-2xl"
                  style={{ top: mentionPosition.top, left: mentionPosition.left, width: mentionPosition.width }}
                >
                  {mentionDropdownItems.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">{t('noResults')}</div>
                  ) : (
                    mentionDropdownItems.map((item, idx) => (
                      <div
                        key={`${item.kind}-${item.id}`}
                        data-mention-index={idx}
                        role="option"
                        aria-selected={idx === mentionSelectedIndex}
                        className={cn(
                          'px-3 py-2 cursor-pointer text-sm flex items-center gap-2',
                          idx === mentionSelectedIndex ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/5'
                        )}
                        onMouseDown={(e) => {
                          // prevent textarea blur before we insert
                          e.preventDefault();
                          if (item.kind === 'tag-create') {
                            openMentionCategorySelection(item.label);
                            return;
                          }
                          if (item.kind === 'tag-category') {
                            createAndInsertTagMention(pendingMentionTagLabel || mentionQuery, item.categoryId);
                            return;
                          }
                          insertMention(item);
                        }}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="whitespace-nowrap shrink-0">
                            {item.label.length > 25 ? `${item.label.slice(0, 25)}...` : item.label}
                          </span>
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/20 text-gray-300">
                            {item.kind === 'tag' || item.kind === 'tag-create'
                              ? t('tags')
                              : item.kind === 'tag-category'
                                ? t('category')
                                : t('dream')}
                          </span>
                        </div>
                        <span className="shrink-0 text-xs text-gray-400 max-w-[110px] flex items-center gap-1">
                          {item.kind === 'tag' || item.kind === 'tag-create' || item.kind === 'tag-category'
                            ? <Tag className="w-3 h-3" />
                            : <Link className="w-3 h-3" />}
                          {item.kind === 'tag-create'
                            ? `${t('newTag')}: ${item.secondary}`
                            : item.kind === 'tag-category'
                              ? t('selectCategory')
                              : item.secondary}
                        </span>
                      </div>
                    ))
                  )}
                </div>,
                document.body
              )}
            </div>
          </Card>

          {/* Citation Section */}
          <Card variant="glass" className="p-6 shadow-depth-3 mt-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link className="w-5 h-5 text-grey-300" />
                  <h3 className="text-lg font-semibold text-white">{t('dreamCitations')}</h3>
                </div>
                                 <Button
                   onClick={() => setShowCitationSearch(!showCitationSearch)}
                   variant="ghost"
                   size="sm"
                   className="text-grey-300 hover:text-purple-200 hover:glass hover:bg-purple-500/10 p-2 rounded-xl transition-all duration-300 border border-purple-400/20 flex items-center justify-center"
                 >
                   <Search className="w-4 h-4" />
                 </Button>
              </div>

              {/* Citation Search */}
              {showCitationSearch && (
                <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <Input
                    value={citationSearchQuery}
                    onChange={(e) => setCitationSearchQuery(e.target.value)}
                    placeholder={t('searchCitationsToAdd')}
                    variant="transparent"
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                  />
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredCitationItems.length === 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        {citationSearchQuery ? t('noResults') : t('noCitationsAvailable')}
                      </div>
                    ) : (
                      filteredCitationItems.map((item) => (
                        <div
                          key={`${item.kind}-${item.id}`}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-white">{item.title}</div>
                              <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/20 text-gray-300">
                                {item.kind === 'dream' ? t('dream') : t('tags')}
                              </span>
                            </div>
                            <div className="text-sm text-gray-400">{item.subtitle}</div>
                            {item.kind === 'dream' && item.preview && (
                              <div className="text-xs text-gray-500 mt-1">
                                {item.preview}...
                              </div>
                            )}
                            {item.kind === 'dream' && (
                              <div className="text-xs text-gray-500 mt-1">
                                #{item.title}
                              </div>
                            )}
                            {item.kind === 'tag' && (
                              <div className="text-xs text-gray-500 mt-1">
                                @{item.title}
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => {
                              if (item.kind === 'dream') {
                                handleAddCitation(item.id);
                                return;
                              }
                              if (!citedTags.includes(item.id)) {
                                setCitedTags([...citedTags, item.id]);
                              }
                              setCitationSearchQuery('');
                            }}
                            variant="ghost"
                            size="sm"
                            className="text-purple-300 hover:text-purple-200 hover:glass hover:bg-purple-500/10"
                          >
                            <Link className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Current Citations */}
              {(citedDreams.length > 0 || citedTags.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">{t('citedItems')}:</h4>
                  {citedDreams.map((citedDreamId) => {
                    const citedDream = dreams.find(d => d.id === citedDreamId);
                    if (!citedDream) return null;
                    
                    return (
                      <div
                        key={`dream-${citedDreamId}`}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-white">{citedDream.title}</div>
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/20 text-gray-300">
                              {t('dream')}
                            </span>
                            </div>
                          <div className="text-sm text-gray-400">{citedDream.date}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {citedDream.description.substring(0, 80)}...
                          </div>
                        </div>
                        <Button
                          onClick={() => handleRemoveCitation(citedDreamId)}
                          variant="ghost"
                          size="sm"
                          className="text-red-300 hover:text-red-200 hover:glass hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}

                  {citedTags.map((tagId) => {
                    const tag = allKnownTags.find((knownTag) => knownTag.id === tagId);
                    if (!tag) return null;
                    return (
                      <div
                        key={`tag-${tag.id}`}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center gap-2">
                          <TagPill
                            tag={tag.label}
                            size="sm"
                            variant="gradient"
                            color={getTagColor(tag.id)}
                            tooltip={`${getCategoryDisplayName(tag.id.split('/')[0] || UNCATEGORIZED_CATEGORY_ID)} > ${tag.label}`}
                          />
                          <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border border-white/20 text-gray-300">
                            {t('tags')}
                          </span>
                          </div>
                          <Button
                          onClick={() => handleRemoveTagCitation(tag.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-300 hover:text-red-200 hover:glass hover:bg-red-500/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dreams that cite this dream */}
              {dream && getDreamsThatCite(dream.id).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">{t('dreamsThatCite')}:</h4>
                  {getDreamsThatCite(dream.id).map((citingDream) => (
                    <div
                      key={citingDream.id}
                      className="p-3 bg-white/5 rounded-lg border border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                      onClick={() => {
                        setCitedDreamPreview({
                          id: citingDream.id,
                          title: citingDream.title,
                          date: citingDream.date,
                          description: citingDream.description,
                          tags: citingDream.tags,
                        });
                        setShowCitedDreamModal(true);
                      }}
                    >
                      <div className="font-medium text-white">{citingDream.title}</div>
                      <div className="text-sm text-gray-400">{citingDream.date}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {citingDream.description.substring(0, 80)}...
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
          {/* Cited Dream Preview Modal */}
          <Modal
            isOpen={showCitedDreamModal}
            onClose={() => setShowCitedDreamModal(false)}
            title={citedDreamPreview?.title || t('dreamPreview')}
            className="max-w-4xl max-h-[80vh]"
          >
            {citedDreamPreview && (
              <div className="space-y-4">
                <div className="text-sm text-gray-300">{citedDreamPreview.date}</div>
                {citedDreamPreview.tags.length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {citedDreamPreview.tags.map((tag) => (
                      <TagPill
                        key={tag.id}
                        tag={tag.label}
                        size="sm"
                        variant="gradient"
                        color={getTagColor(tag.id)}
                        tooltip={`${getCategoryDisplayName(tag.categoryId)} > ${tag.label}`}
                      />
                    ))}
                  </div>
                )}
                <div className="text-gray-200 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto pr-2 break-words overflow-x-hidden" style={{ wordWrap: 'break-word', wordBreak: 'break-word' }}>
                  {citedDreamPreview.description}
                </div>
                
              </div>
            )}
          </Modal>

          {/* Enhanced Auto-save indicator */}
          <div className="mt-6 text-center">
            <div className={cn(
              "inline-flex items-center px-4 py-2 rounded-lg text-sm transition-all duration-300",
              isSaving 
                ? "text-gray-300 bg-gradient-to-r from-gray-500/10 to-gray-600/10 border border-gray-400/30" 
                : "text-gray-400 bg-white/5 border border-white/10"
            )}>
              {isSaving ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-600 mr-2 animate-pulse"></div>
                  {t('savingChanges')}
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-600 mr-2"></div>
                  {t('allChangesSaved')}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowDeleteModal(false)}>
          <Card ref={deleteModalRef} variant="glass-dark" className="p-6 w-96 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4 border border-red-400/30">
                <AlertTriangle className="w-8 h-8 text-red-300" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">{t('deleteDream')}</h3>
              <p className="text-gray-300 mb-6">
                {t('deleteDreamConfirm', { title: dream?.title })}
              </p>
              <div className="flex gap-3">
                                  <Button
                    variant="ghost"
                    onClick={cancelDelete}
                    className="flex-1 text-gray-300 hover:text-white hover:glass"
                  >
                    {t('cancel')}
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={confirmDelete}
                    className="flex-1 text-red-300 hover:text-red-200 hover:bg-red-500/10"
                  >
                    {t('delete')}
                  </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Date Modal - Rendered outside main content to ensure it appears above everything */}
      {showDateMenu && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowDateMenu(false)}>
          <Card ref={dateModalRef} variant="glass" className="p-4 w-80" onClick={(e) => e.stopPropagation()}>
            {/* Month/Year Navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedMonth === 0) {
                    handleYearChange(selectedYear - 1);
                    handleMonthChange(11);
                  } else {
                    handleMonthChange(selectedMonth - 1);
                  }
                }}
                className="text-gray-400 hover:text-white"
              >
                ←
              </Button>
              <div className="text-center">
                <div className="font-semibold text-white">
                  <select
                    value={selectedMonth}
                    onChange={(e) => handleMonthChange(parseInt(e.target.value))}
                    className="bg-transparent text-white border-none outline-none cursor-pointer hover:text-white/80 transition-colors font-semibold"
                  >
                    {generateMonthOptions().map(month => (
                      <option key={month.value} value={month.value} className="bg-gray-800 text-white">
                        {month.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="text-sm text-gray-300">
                  <select
                    value={selectedYear}
                    onChange={(e) => handleYearChange(parseInt(e.target.value))}
                    className="bg-transparent text-gray-300 border-none outline-none cursor-pointer hover:text-white transition-colors"
                  >
                    {generateYearOptions().map(year => (
                      <option key={year} value={year} className="bg-gray-800 text-white">
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (selectedMonth === 11) {
                    handleYearChange(selectedYear + 1);
                    handleMonthChange(0);
                  } else {
                    handleMonthChange(selectedMonth + 1);
                  }
                }}
                className="text-gray-400 hover:text-white"
              >
                →
              </Button>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-3">
              {tArray('weekdays').map(day => (
                <div key={day} className="text-center text-xs text-gray-400 py-1">
                  {day}
                </div>
              ))}
              {generateCalendarDays().map((day, index) => (
                <div key={index} className="text-center">
                  {day ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDateSelect(day)}
                      className={cn(
                        "w-8 h-8 text-sm p-0",
                        day === selectedDay 
                          ? "bg-gray-600 text-white" 
                          : "text-gray-300 hover:text-white hover:bg-white/10"
                      )}
                    >
                      {day}
                    </Button>
                  ) : (
                    <div className="w-8 h-8"></div>
                  )}
                </div>
              ))}
            </div>
            
            {/* Quick Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDateMenu(false)}
                className="flex-1 text-xs"
              >
                {t('cancel')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const newDate = new Date(selectedYear, selectedMonth, selectedDay);
                  setDate(formatDateForInput(newDate.toISOString().split('T')[0]));
                  setShowDateMenu(false);
                }}
                className="flex-1 text-xs"
                              >
                {t('save')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Category Management Modal */}
      {showManageCategoriesModal && (
        <Modal
          isOpen={showManageCategoriesModal}
          onClose={() => setShowManageCategoriesModal(false)}
          title={t('manageCategories')}
          className="max-w-lg"
        >
          <div className="space-y-4">
            <div className="space-y-2 max-h-64 overflow-auto">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/10">
                  <div className="flex-1 text-sm text-white/90">{getCategoryDisplayName(category.id)}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2 text-xs"
                    onClick={() =>
                      openCategoryColorPicker(
                        { mode: 'modal-edit', categoryId: category.id },
                        category.color
                      )
                    }
                  >
                    <span className="w-4 h-4 rounded-full border" style={getColorChipStyle(category.color)} />
                    {t('changeColor')}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}

      {showColorPickerModal && colorPickerTarget && (
        <CategoryColorPickerModal
          isOpen={showColorPickerModal}
          initialColor={colorPickerInitialColor}
          onClose={() => {
            setShowColorPickerModal(false);
            setColorPickerTarget(null);
          }}
          onConfirm={handleCategoryColorPick}
        />
      )}

    </>
  );
}
