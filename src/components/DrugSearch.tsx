import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Pill, X, ScanLine } from 'lucide-react';
import { searchDrugs, getDrugById } from '../mocks/drugs';
import type { Drug } from '../data/drugTypes';
import { useI18n } from '../hooks/useI18n';

const RECENT_SEARCH_KEY = 'capsula.search.recent';
const MAX_RECENT = 6;

function getRecentSearches(): string[] {
  try {
    const data = localStorage.getItem(RECENT_SEARCH_KEY);
    if (!data) return [];
    const parsed: { ids: string[] } = JSON.parse(data);
    return parsed.ids || [];
  } catch {
    return [];
  }
}

function addRecentSearch(drugId: string): void {
  try {
    const recent = getRecentSearches();
    const filtered = recent.filter(id => id !== drugId);
    const updated = [drugId, ...filtered].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify({ ids: updated }));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
}

interface DrugSearchProps {
  onSelect?: (drug: Drug) => void;
  placeholder?: string;
  className?: string;
  showScanButton?: boolean;
  onScan?: () => void;
  autoFocus?: boolean;
}

export function DrugSearch({ 
  onSelect, 
  placeholder, 
  className,
  showScanButton = false,
  onScan,
  autoFocus = false
}: DrugSearchProps) {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Drug[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<number>();

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (query.trim()) {
      const searchResults = searchDrugs(query);
      setResults(searchResults);
    } else {
      // При пустом запросе показываем популярные + недавние
      const popular = searchDrugs('');
      const recentIds = getRecentSearches();
      const recent = recentIds
        .map(id => getDrugById(id))
        .filter((drug): drug is Drug => drug !== undefined);
      
      // Объединяем, убирая дубликаты
      const all = [...recent, ...popular];
      const unique = Array.from(new Map(all.map(d => [d.id, d])).values());
      setResults(unique.slice(0, 8));
    }
  }, [query]);

  useEffect(() => {
    if (isOpen && results.length > 0) {
      setHighlightedIndex(-1);
    }
  }, [query, isOpen, results.length]);

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }
    setIsOpen(true);
  };

  const handleBlur = () => {
    blurTimeoutRef.current = window.setTimeout(() => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }, 200);
  };

  const handleSelect = (drug: Drug) => {
    addRecentSearch(drug.id);
    setQuery('');
    setIsOpen(false);
    if (onSelect) {
      onSelect(drug);
    } else {
      navigate(`/drug/${drug.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleClear = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const handleScan = () => {
    if (onScan) {
      onScan();
    } else {
      // Default scan behavior - could open a barcode scanner
      // For now, just show a placeholder
      if (locale === 'ru') {
        alert('Функция сканирования будет реализована в ближайшее время');
      } else {
        alert('Barcode scanning will be implemented soon');
      }
    }
  };

  // Calculate padding-right based on visible buttons
  const rightPadding = showScanButton 
    ? (query ? 'pr-20' : 'pr-11')  // Space for both scan and clear buttons, or just scan
    : (query ? 'pr-8' : 'pr-3');   // Space for clear button, or minimal

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <div className="relative">
        <Search 
          size={16} 
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted2)] pointer-events-none z-10"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || (locale === 'ru' ? 'Поиск препаратов...' : 'Search drugs...')}
          className={`w-full h-[42px] pl-10 ${rightPadding} rounded-[18px] border border-[var(--stroke)] bg-[var(--surface)] text-[var(--text)] font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-[var(--acc2)] focus:border-transparent placeholder:text-[var(--muted2)]`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showScanButton && (
            <button
              onClick={handleScan}
              className="p-1.5 hover:bg-[var(--stroke)] rounded-full transition-colors flex-shrink-0"
              aria-label={locale === 'ru' ? 'Сканировать штрихкод' : 'Scan barcode'}
              type="button"
            >
              <ScanLine size={16} className="text-[var(--muted2)] hover:text-[var(--text)]" />
            </button>
          )}
          {query && (
            <button
              onClick={handleClear}
              className="p-1 hover:bg-[var(--stroke)] rounded-full transition-colors flex-shrink-0"
              aria-label={locale === 'ru' ? 'Очистить' : 'Clear'}
              type="button"
            >
              <X size={14} className="text-[var(--muted2)]" />
            </button>
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-[18px] border border-[var(--stroke)] bg-[var(--surface)] shadow-lg z-[100] max-h-[400px] overflow-y-auto">
          {results.map((drug, index) => (
            <button
              key={drug.id}
              onClick={() => handleSelect(drug)}
              className={`
                w-full flex items-center gap-3 p-3 hover:bg-[var(--surface2)] transition-colors text-left
                ${index === highlightedIndex ? 'bg-[var(--surface2)]' : ''}
                ${index > 0 ? 'border-t border-[var(--stroke)]' : ''}
              `}
            >
              <Pill size={20} className="text-[var(--acc2)] flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[var(--text)] truncate">{drug.name}</p>
                <p className="text-xs text-[var(--muted2)] truncate">
                  {drug.manufacturer} • {drug.form}
                </p>
              </div>
              <span className="text-xs text-[var(--muted2)] whitespace-nowrap flex-shrink-0">
                {drug.packCount} {locale === 'ru' ? 'шт' : 'pcs'}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

