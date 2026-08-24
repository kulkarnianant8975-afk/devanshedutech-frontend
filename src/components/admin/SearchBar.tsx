import React from 'react';
import { Search, X } from 'lucide-react';

/**
 * One search box, the same everywhere.
 *
 * <p>Four screens had a search and seven did not, and the four that did each styled it slightly
 * differently. Somebody who learns that typing filters the leads screen tries the same thing on
 * Media Library, finds nothing, and concludes the CRM is inconsistent rather than that this one
 * screen was never given the control.</p>
 *
 * <p>Filtering stays with the caller. Every screen searches different fields — a lead by name and
 * phone, an asset by filename, a batch by course — and a component that tried to guess would be
 * wrong on most of them.</p>
 */

interface Props {
  value: string;
  onChange: (value: string) => void;
  /** Says what typing here will actually search, rather than the bare word "Search". */
  placeholder: string;
  /** Shown beside the box: "12 of 48". Absent while loading. */
  count?: string;
  className?: string;
}

const SearchBar: React.FC<Props> = ({ value, onChange, placeholder, count, className = '' }) => (
  <div className={`relative flex-1 min-w-[200px] ${className}`}>
    <Search
      size={16}
      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
      aria-hidden="true"
    />
    <input
      type="search"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full pl-9 pr-16 py-2.5 text-sm border border-gray-200 rounded-xl bg-white
        focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
    />

    {/* A count beside the box, because a filtered list of three looks identical to a screen that
        only ever had three things on it. */}
    {value && count && (
      <span className="absolute right-9 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 tabular-nums pointer-events-none">
        {count}
      </span>
    )}

    {value && (
      <button
        type="button"
        onClick={() => onChange('')}
        aria-label="Clear search"
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 p-1"
      >
        <X size={14} />
      </button>
    )}
  </div>
);

export default SearchBar;
