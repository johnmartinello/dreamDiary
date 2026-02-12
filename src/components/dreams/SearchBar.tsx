import { Search, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Input } from '../ui/Input';
import { useI18n } from '../../hooks/useI18n';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  showClearButton?: boolean;
}

export function SearchBar({ onSearch, placeholder, showClearButton = false }: SearchBarProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const resolvedPlaceholder = placeholder ?? t('searchPlaceholder');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={resolvedPlaceholder}
          className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder-gray-400 hover:bg-white/10 hover:border-white/20 focus:bg-white/10 focus:border-white/30 focus:ring-white/20 transition-all duration-300"
        />
        {(query || showClearButton) && (
          <button
            type="button"
            aria-label={t('clear')}
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
