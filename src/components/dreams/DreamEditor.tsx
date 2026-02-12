import { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Calendar, Trash2, Edit3, AlertTriangle, Sparkles, X, Check, Link, Search } from 'lucide-react';
import { useDreamStore } from '../../store/dreamStore';
import { useI18n } from '../../hooks/useI18n';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { TagPill } from './TagPill';
import { Card } from '../ui/Card';
import { formatDateForInput, getCurrentDateString } from '../../utils';
import { useDebounce } from '@uidotdev/usehooks';
import { cn } from '../../utils';
import { buildTagId, getCategoryName, UNCATEGORIZED_CATEGORY_ID, CATEGORY_COLORS } from '../../types/taxonomy';
import type { DreamTag } from '../../types/taxonomy';



export function DreamEditor() {
  const { t, tArray, language } = useI18n();
  const {
    dreams,
    selectedDreamId,
    currentView,
    setCurrentView,
    updateDream,
    deleteDream,
    generateAITags,
    generateAITitle,
    aiConfig,
    getTagColor,
    getAllTags,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    addCitation,
    removeCitation,

    getDreamsThatCite,
  } = useDreamStore();

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
  const [showCreateCategoryInline, setShowCreateCategoryInline] = useState(false);
  const [newCategoryNameInline, setNewCategoryNameInline] = useState('');
  const [newCategoryColorInline, setNewCategoryColorInline] = useState<'cyan' | 'purple' | 'pink' | 'emerald' | 'amber' | 'blue' | 'indigo' | 'violet' | 'rose' | 'teal' | 'lime' | 'orange' | 'red' | 'green' | 'yellow'>('violet');
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
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [showAITagModal, setShowAITagModal] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<DreamTag[]>([]);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [suggestedTitle, setSuggestedTitle] = useState<string>('');
  const [showTitleSuggestion, setShowTitleSuggestion] = useState(false);
  const [editingTag, setEditingTag] = useState<string>('');
  const [editingId, setEditingId] = useState<string>('');
  const [editingCategory, setEditingCategory] = useState<string>('uncategorized');
  const [showManageCategoriesModal, setShowManageCategoriesModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState<'cyan' | 'purple' | 'pink' | 'emerald' | 'amber' | 'blue' | 'indigo' | 'violet' | 'rose' | 'teal' | 'lime' | 'orange' | 'red' | 'green' | 'yellow'>('violet');
  
  // Citation state
  const [showCitationSearch, setShowCitationSearch] = useState(false);
  const [citationSearchQuery, setCitationSearchQuery] = useState('');
  const [citedDreams, setCitedDreams] = useState<string[]>([]);

  // Inline mention ("@") state
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagAutocompleteRef = useRef<HTMLDivElement>(null);
  const mentionDropdownRef = useRef<HTMLDivElement>(null);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionSelectedIndex, setMentionSelectedIndex] = useState(0);
  const [mentionPosition, setMentionPosition] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 240 });

  // Modal refs (no longer using useClickOutside)
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const dateModalRef = useRef<HTMLDivElement>(null);
  const aiTagModalRef = useRef<HTMLDivElement>(null);

  // Debounced values for auto-save
  const debouncedTitle = useDebounce(title, 500);
  const debouncedDescription = useDebounce(description, 1000);
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
      
      // Reset initialization flag and set it after a small delay to ensure debounced values are ready
      setIsInitialized(false);
      setTimeout(() => setIsInitialized(true), 100);
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
  const matchingKnownTags = useMemo(
    () =>
      allKnownTags
        .filter((tag) => tag.label.toLowerCase().includes(newTag.trim().toLowerCase()))
        .slice(0, 8),
    [allKnownTags, newTag]
  );

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
      if (!clickedInsideMention) setMentionOpen(false);
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showTagAutocomplete, mentionOpen]);

  useEffect(() => {
    if (!mentionOpen) return;
    const handleReposition = () => updateMentionDropdownPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [mentionOpen]);

  // Auto-save effect - only runs after initialization and when values actually change
  useEffect(() => {
    if (dream && selectedDreamId && isInitialized) {
      // Detect citations created via inline "@Title" mentions and sync with citations
      const mentionsFromDescription: string[] = dreams
        .filter((d) => d.id !== selectedDreamId && description.includes(`@${d.title}`))
        .map((d) => d.id);
      
      // Remove citations that no longer exist in the description
      const updatedCitations = citedDreams.filter(citationId => {
        const citedDream = dreams.find(d => d.id === citationId);
        return citedDream && description.includes(`@${citedDream.title}`);
      });
      
      // Add new citations from mentions
      const finalCitations = Array.from(new Set([...updatedCitations, ...mentionsFromDescription]));
      
      if (JSON.stringify(finalCitations) !== JSON.stringify(citedDreams)) {
        setCitedDreams(finalCitations);
      }

      // Only save if the debounced values are different from the original dream values
      // and the debounced values are not empty (which happens during initialization)
      const hasChanges = 
        (debouncedTitle !== dream.title && debouncedTitle !== '') ||
        (debouncedDate !== dream.date && debouncedDate !== '') ||
        (debouncedDescription !== dream.description && debouncedDescription !== '') ||
        JSON.stringify(tags) !== JSON.stringify(dream.tags) ||
        JSON.stringify(finalCitations) !== JSON.stringify(dream.citedDreams || []);

      if (hasChanges) {
        setIsSaving(true);
        console.log('Auto-saving dream:', {
          id: selectedDreamId,
          title: debouncedTitle,
          date: debouncedDate,
          description: description, // Use current description instead of debounced
          tags,
          citedDreams: finalCitations
        });
        updateDream(selectedDreamId, {
          title: debouncedTitle,
          date: debouncedDate,
          description: description, // Use current description instead of debounced
          tags,
          citedDreams: finalCitations,
        });
        setTimeout(() => setIsSaving(false), 1000);
      }
    }
  }, [debouncedTitle, debouncedDate, debouncedDescription, tags, citedDreams, dream, selectedDreamId, updateDream, isInitialized, description]);

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

  const handleGenerateAITags = async () => {
    if (!description.trim()) {
      alert(t('pleaseAddContent'));
      return;
    }

    setIsGeneratingTags(true);
    try {
      const generatedTags = await generateAITags(
        description,
        language,
        (newTagCategory as any)
      );
      
      // Filter out tags that already exist
      const newTags = generatedTags.filter((tag) => !tags.some(t => t.id === tag.id));
      
      if (newTags.length > 0) {
        setSuggestedTags(newTags);
        setShowAITagModal(true);
      } else {
        alert(t('noNewTags'));
      }
    } catch (error) {
      console.error('Error generating categories:', error);
      alert(`Failed to generate categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleGenerateAITitle = async () => {
    if (!description.trim()) {
      alert(t('pleaseAddContent'));
      return;
    }

    setIsGeneratingTitle(true);
    try {
      const generatedTitle = await generateAITitle(description, language);
      
      if (generatedTitle && generatedTitle.trim()) {
        setSuggestedTitle(generatedTitle.trim());
        setShowTitleSuggestion(true);
      } else {
        alert(t('noTitleGenerated'));
      }
    } catch (error) {
      console.error('Error generating title:', error);
      alert(`Failed to generate title: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingTitle(false);
    }
  };

  const handleAcceptTitleSuggestion = () => {
    setTitle(suggestedTitle);
    setShowTitleSuggestion(false);
    setSuggestedTitle('');
  };

  const handleRejectTitleSuggestion = () => {
    setShowTitleSuggestion(false);
    setSuggestedTitle('');
  };

  const handleConfirmAITags = () => {
    setTags([...tags, ...suggestedTags]);
    setShowAITagModal(false);
    setSuggestedTags([]);
  };

  const handleCancelAITags = () => {
    setShowAITagModal(false);
    setSuggestedTags([]);
  };

  const handleRemoveSuggestedTag = (id: string) => {
    setSuggestedTags(suggestedTags.filter((t) => t.id !== id));
  };

  const handleEditSuggestedTag = (tag: DreamTag) => {
    setEditingId(tag.id);
    setEditingTag(tag.label);
    setEditingCategory(tag.categoryId);
  };

  const handleSaveEditedTag = () => {
    const label = editingTag.trim();
    if (!label || !editingId) return;
    const id = buildTagId(editingCategory as any, label);
    setSuggestedTags(suggestedTags.map(t => t.id === editingId ? {
      ...t,
      id,
      label,
      categoryId: editingCategory as any,
    } : t));
    setEditingId('');
    setEditingTag('');
  };



  const handleAddSuggestedTag = () => {
    const label = editingTag.trim();
    if (!label) return;
    const id = buildTagId(editingCategory as any, label);
    if (!suggestedTags.some(t => t.id === id)) {
      setSuggestedTags([...suggestedTags, { id, label, categoryId: editingCategory as any, isCustom: true }]);
      setEditingTag('');
    }
  };

  const handleCreateCategoryInline = () => {
    const name = newCategoryNameInline.trim();
    if (!name) return;
    const created = addCategory({ name, color: newCategoryColorInline });
    setNewTagCategory(created.id);
    setNewCategoryNameInline('');
    setShowCreateCategoryInline(false);
  };

  const handleCreateCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    addCategory({ name, color: newCategoryColor });
    setNewCategoryName('');
    setNewCategoryColor('violet');
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
        JSON.stringify(citedDreams) !== JSON.stringify(dream.citedDreams || []);

      if (hasChanges) {
        setIsSaving(true);
        console.log('Saving before navigation:', {
          id: selectedDreamId,
          title,
          date,
          description,
          tags,
          citedDreams
        });
        updateDream(selectedDreamId, {
          title,
          date,
          description,
          tags,
          citedDreams,
        });
        setTimeout(() => setIsSaving(false), 1000);
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

  const getFilteredDreamsForCitation = () => {
    return dreams.filter(d => 
      d.id !== selectedDreamId && // Don't show current dream
      !citedDreams.includes(d.id) && // Don't show already cited dreams
      (citationSearchQuery === '' || 
       d.title.toLowerCase().includes(citationSearchQuery.toLowerCase()) ||
       d.description.toLowerCase().includes(citationSearchQuery.toLowerCase()))
    );
  };

  // Inline mention helpers
  const getFilteredMentionDreams = () => {
    const query = mentionQuery.trim().toLowerCase();
    const list = dreams.filter((d) => d.id !== selectedDreamId);
    if (!query) return list.slice(0, 20);
    return list.filter((d) => d.title.toLowerCase().includes(query)).slice(0, 20);
  };

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

    const left = Math.max(12, Math.min(textareaRect.left + caretLeft, window.innerWidth - 260));
    const top = Math.max(12, Math.min(textareaRect.top + caretTop + 24, window.innerHeight - 64));

    setMentionPosition({ top, left, width: 240 });
    document.body.removeChild(div);
  };

  const insertMention = (d: { id: string; title: string }) => {
    const ta = textareaRef.current;
    if (!ta || mentionStart === null) return;
    const caret = ta.selectionStart || 0;
    const before = description.substring(0, mentionStart);
    const between = description.substring(mentionStart, caret);
    const after = description.substring(caret);
    const hasAt = between.startsWith('@') ? '' : '@';
    const insertText = `${hasAt}${d.title}`;
    const newValue = `${before}@${insertText.replace(/^@/, '')}${after}`;
    setDescription(newValue);
    // Move caret to end of inserted text
    const nextPos = before.length + insertText.length + 1; // include '@'
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(nextPos, nextPos);
    });
    // Add citation id locally (dedup later in autosave)
    if (!citedDreams.includes(d.id)) {
      setCitedDreams([...citedDreams, d.id]);
    }
    setMentionOpen(false);
    setMentionQuery('');
    setMentionStart(null);
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
                  <div className="flex items-center gap-3">
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t('titlePlaceholder')}
                      variant="transparent"
                      className="text-3xl font-bold px-0 py-2 rounded-xl border border-white/10 text-white/80 hover:glass hover:text-white/90 hover:font-medium hover:shadow-inner-lg hover:border-white/20 transition-all duration-300"
                    />
                    {/* AI Title Generation Button */}
                    {aiConfig.enabled && (
                      <Button
                        onClick={handleGenerateAITitle}
                        disabled={isGeneratingTitle || !description.trim()}
                        size="sm"
                        variant="ghost"
                        className="text-gray-300 hover:text-gray-200 hover:glass hover:bg-gray-500/10 px-3 py-1 rounded-xl transition-all duration-300 border border-gray-400/20"
                      >
                        {isGeneratingTitle ? t('thinking') : t('suggestion')}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300 ml-4">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <Button
                    variant="ghost"
                    onClick={() => setShowDateMenu(!showDateMenu)}
                    className="text-gray-300 hover:text-gray-200 px-2 py-1 relative"
                  >
                    {formatDateForInput(date)}
                  </Button>
                </div>
              </div>
              
              {/* Tags Row */}
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-300">{t('category')}:</span>
                    <select
                      value={newTagCategory}
                      onChange={(e) => {
                        if (e.target.value === '__create__') {
                          setShowCreateCategoryInline(true);
                          return;
                        }
                        setShowCreateCategoryInline(false);
                        setNewTagCategory(e.target.value);
                      }}
                      className="bg-transparent text-white/80 text-xs border border-white/10 rounded px-2 py-1"
                    >
                      <option value={UNCATEGORIZED_CATEGORY_ID} className="bg-gray-800">{t('uncategorized')}</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id} className="bg-gray-800">
                          {category.name}
                        </option>
                      ))}
                      <option value="__create__" className="bg-gray-800">{t('createNewCategory')}</option>
                    </select>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-gray-300 hover:text-white"
                      onClick={() => setShowManageCategoriesModal(true)}
                    >
                      {t('manageCategories')}
                    </Button>
                  </div>

                  {showCreateCategoryInline && (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newCategoryNameInline}
                        onChange={(e) => setNewCategoryNameInline(e.target.value)}
                        placeholder={t('createCategory')}
                        variant="transparent"
                        className="w-48 border-b border-white/20 focus:border-gray-400 px-0 py-1 text-sm"
                      />
                      <select
                        value={newCategoryColorInline}
                        onChange={(e) => setNewCategoryColorInline(e.target.value as any)}
                        className="bg-transparent text-white/80 text-xs border border-white/10 rounded px-2 py-1"
                      >
                        {CATEGORY_COLORS.map((color) => (
                          <option key={color} value={color} className="bg-gray-800">{color}</option>
                        ))}
                      </select>
                      <Button size="sm" variant="ghost" onClick={handleCreateCategoryInline}>
                        {t('add')}
                      </Button>
                    </div>
                  )}
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
                      onKeyDown={handleTagInputKeyDown}
                      placeholder={t('searchOrCreateTag')}
                      variant="transparent"
                      className="w-full border-b border-white/20 focus:border-gray-400 px-0 py-1 text-sm"
                    />
                    {showTagAutocomplete && newTag.trim() && createPortal(
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
                          const categoryName = getCategoryName(categoryId, categories, t('uncategorized'));
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
                  
                  {/* AI Tag Generation Button */}
                  {aiConfig.enabled && (
                    <Button
                      onClick={handleGenerateAITags}
                      disabled={isGeneratingTags || !description.trim()}
                      size="sm"
                      variant="ghost"
                      className="text-gray-300 hover:text-gray-200 hover:glass hover:bg-gray-500/10 px-3 py-1 rounded-xl transition-all duration-300 border border-gray-400/20"
                    >
                      {isGeneratingTags ? t('thinking') : t('suggestions')}
                    </Button>
                  )}
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
                          color={getTagColor(tag.id) as any}
                          tooltip={`${getCategoryName(tag.categoryId, categories, t('uncategorized'))} > ${tag.label}`}
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
                  if (mentionOpen && mentionStart !== null) {
                    const caret = (e.target as HTMLTextAreaElement).selectionStart || 0;
                    // Close if caret moved to/before trigger or '@' was deleted
                    if (caret <= mentionStart || value[mentionStart] !== '@') {
                      setMentionOpen(false);
                      setMentionQuery('');
                      setMentionStart(null);
                      return;
                    }
                    const slice = value.slice(mentionStart, caret);
                    if (/\s/.test(slice) || slice.includes('\n')) {
                      setMentionOpen(false);
                      setMentionQuery('');
                      setMentionStart(null);
                    } else {
                      setMentionQuery(slice.replace(/^@/, ''));
                      requestAnimationFrame(() => updateMentionDropdownPosition());
                    }
                  }
                }}
                onKeyDown={(e) => {
                  // Open mention dropdown when typing '@'
                  if (e.key === '@') {
                    setMentionOpen(true);
                    const ta = textareaRef.current;
                    if (ta) {
                      setMentionStart(ta.selectionStart);
                      setMentionQuery('');
                      setMentionSelectedIndex(0);
                      requestAnimationFrame(() => updateMentionDropdownPosition());
                    }
                    return; // allow input of '@'
                  }

                  if (mentionOpen) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setMentionSelectedIndex((idx) => Math.min(idx + 1, getFilteredMentionDreams().length - 1));
                      return;
                    }
                    if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setMentionSelectedIndex((idx) => Math.max(idx - 1, 0));
                      return;
                    }
                    if (e.key === 'Enter') {
                      const list = getFilteredMentionDreams();
                      if (list.length > 0) {
                        e.preventDefault();
                        insertMention(list[Math.max(0, Math.min(mentionSelectedIndex, list.length - 1))]);
                      }
                      return;
                    }
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      setMentionOpen(false);
                      return;
                    }
                  }
                }}
                onClick={() => {
                  if (mentionOpen) updateMentionDropdownPosition();
                }}
                onKeyUp={() => {
                  if (mentionOpen) updateMentionDropdownPosition();
                }}
                onScroll={() => {
                  if (mentionOpen) updateMentionDropdownPosition();
                }}
                placeholder={t('describeYourDream')}
                variant="transparent"
                className="min-h-[500px] text-base leading-relaxed w-full"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              />

              {mentionOpen && createPortal(
                <div
                  ref={mentionDropdownRef}
                  className="fixed z-[10000] max-h-56 overflow-y-auto bg-black/90 backdrop-blur rounded-lg border border-white/10 shadow-2xl"
                  style={{ top: mentionPosition.top, left: mentionPosition.left, width: mentionPosition.width }}
                >
                  {getFilteredMentionDreams().length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">{t('noResults')}</div>
                  ) : (
                    getFilteredMentionDreams().map((d, idx) => (
                      <div
                        key={d.id}
                        className={cn(
                          'px-3 py-2 cursor-pointer text-sm flex items-center justify-between',
                          idx === mentionSelectedIndex ? 'bg-white/10 text-white' : 'text-gray-200 hover:bg-white/5'
                        )}
                        onMouseDown={(e) => {
                          // prevent textarea blur before we insert
                          e.preventDefault();
                          insertMention(d);
                        }}
                      >
                        <span className="truncate flex-1">{d.title}</span>
                        <span className="ml-3 text-xs text-gray-400 w-20 text-right">{d.date}</span>
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
                    placeholder={t('searchDreamsToCite')}
                    variant="transparent"
                    className="bg-white/5 border-white/20 text-white placeholder-gray-400"
                  />
                  
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {getFilteredDreamsForCitation().length === 0 ? (
                      <div className="text-center py-4 text-gray-400">
                        {citationSearchQuery ? t('noDreamsFound') : t('noDreamsAvailable')}
                      </div>
                    ) : (
                      getFilteredDreamsForCitation().map((citedDream) => (
                        <div
                          key={citedDream.id}
                          className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-white">{citedDream.title}</div>
                            <div className="text-sm text-gray-400">{citedDream.date}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {citedDream.description.substring(0, 100)}...
                            </div>
                          </div>
                          <Button
                            onClick={() => handleAddCitation(citedDream.id)}
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
              {citedDreams.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-300">{t('citedDreams')}:</h4>
                  {citedDreams.map((citedDreamId) => {
                    const citedDream = dreams.find(d => d.id === citedDreamId);
                    if (!citedDream) return null;
                    
                    return (
                      <div
                        key={citedDreamId}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-white">{citedDream.title}</div>
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
                        color={getTagColor(tag.id) as any}
                        tooltip={`${getCategoryName(tag.categoryId, categories, t('uncategorized'))} > ${tag.label}`}
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
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
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

      {/* AI Tag Suggestion Modal */}
      {showAITagModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4" onClick={() => setShowAITagModal(false)}>
          <Card ref={aiTagModalRef} variant="glass" className="p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-white/70" />
                <h3 className="text-xl font-semibold text-white">{t('categorySuggestions')}</h3>
              </div>
              <Button variant="ghost" onClick={handleCancelAITags} className="text-gray-300 hover:text-white">
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Add new tag input */}
            <div className="mb-4">
              <div className="flex gap-2">
                <Input
                  value={editingTag}
                  onChange={(e) => setEditingTag(e.target.value)}
                  placeholder={t('addNewTagPlaceholder')}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSuggestedTag();
                    }
                  }}
                  className="flex-1 bg-white/5 border-white/20 text-white placeholder-gray-400"
                />
                <Button 
                  onClick={handleAddSuggestedTag}
                  disabled={!editingTag.trim()}
                  size="sm"
                  variant="ghost"
                  className="text-white/60 hover:glass hover:text-white/90 px-3"
                >
                  {t('add')}
                </Button>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {suggestedTags.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>{t('noTagsSuggested')}</p>
                  <p className="text-sm">{t('addTagsManually')}</p>
                </div>
              ) : (
                suggestedTags.map((tag) => (
                  <div key={tag.id} className="flex items-center justify-between bg-white/5 p-2 rounded border border-white/10">
                    {editingId === tag.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editingTag}
                          onChange={(e) => setEditingTag(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditedTag();
                            }
                          }}
                          className="bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-white/40 focus:ring-white/20"
                        />
                        <select
                          value={editingCategory}
                          onChange={(e) => setEditingCategory(e.target.value)}
                          className="bg-transparent text-white/80 text-xs border border-white/10 rounded px-2 py-1"
                        >
                          <option value={UNCATEGORIZED_CATEGORY_ID} className="bg-gray-800">{t('uncategorized')}</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id} className="bg-gray-800">
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <TagPill
                        tag={tag.label}
                        size="sm"
                        variant="gradient"
                        color={getTagColor(tag.id) as any}
                        tooltip={`${getCategoryName(tag.categoryId, categories, t('uncategorized'))} > ${tag.label}`}
                      />
                    )}
                    <div className="flex items-center gap-1">
                      {editingId === tag.id ? (
                        <>
                          <Button variant="ghost" onClick={handleSaveEditedTag} className="text-green-300 hover:text-green-200 p-1">
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" onClick={() => { setEditingId(''); setEditingTag(''); }} className="text-gray-300 hover:text-white p-1">
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" onClick={() => handleEditSuggestedTag(tag)} className="text-gray-300 hover:text-white p-1">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" onClick={() => handleRemoveSuggestedTag(tag.id)} className="text-red-300 hover:text-red-200 p-1">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={handleCancelAITags} className="text-gray-300 hover:text-white">
                {t('cancel')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleConfirmAITags} 
                disabled={suggestedTags.length === 0}
                className="text-white/60 hover:glass hover:text-white/90 hover:shadow-inner-lg hover:border-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('addTags', { count: suggestedTags.length })}
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
            <div className="flex gap-2">
              <Input
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder={t('categoryName')}
                variant="transparent"
                className="flex-1"
              />
              <select
                value={newCategoryColor}
                onChange={(e) => setNewCategoryColor(e.target.value as any)}
                className="bg-transparent text-white/80 text-xs border border-white/10 rounded px-2 py-1"
              >
                {CATEGORY_COLORS.map((color) => (
                  <option key={color} value={color} className="bg-gray-800">{color}</option>
                ))}
              </select>
              <Button size="sm" variant="ghost" onClick={handleCreateCategory}>
                {t('add')}
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-auto">
              {categories.length === 0 ? (
                <div className="text-sm text-gray-400">{t('noCategoriesYet')}</div>
              ) : (
                categories.map((category) => (
                  <div key={category.id} className="flex items-center gap-2 bg-white/5 p-2 rounded border border-white/10">
                    <Input
                      value={category.name}
                      onChange={(e) => updateCategory(category.id, { name: e.target.value })}
                      variant="transparent"
                      className="flex-1"
                    />
                    <select
                      value={category.color}
                      onChange={(e) => updateCategory(category.id, { color: e.target.value as any })}
                      className="bg-transparent text-white/80 text-xs border border-white/10 rounded px-2 py-1"
                    >
                      {CATEGORY_COLORS.map((color) => (
                        <option key={color} value={color} className="bg-gray-800">{color}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-300 hover:text-red-200"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Title Suggestion Modal */}
      {showTitleSuggestion && (
        <Modal
          isOpen={showTitleSuggestion}
          onClose={handleRejectTitleSuggestion}
          title={t('aiTitleSuggestion')}
          className="max-w-md"
        >
          <div className="space-y-4">
            <div className="text-center">
              <Sparkles className="w-8 h-8 mx-auto mb-3 text-blue-400" />
              <p className="text-gray-300 mb-2">{t('aiSuggestsTitle')}</p>
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                <h3 className="text-xl font-semibold text-white">{suggestedTitle}</h3>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={handleRejectTitleSuggestion} className="text-gray-300 hover:text-white">
                {t('reject')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleGenerateAITitle}
                disabled={isGeneratingTitle}
                className="text-blue-300 hover:text-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingTitle ? t('thinking') : t('tryDifferentTitle')}
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleAcceptTitleSuggestion}
                className="text-white/60 hover:glass hover:text-white/90 hover:shadow-inner-lg hover:border-white/20"
              >
                {t('useThisTitle')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
