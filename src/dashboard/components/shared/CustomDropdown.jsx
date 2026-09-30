// src/components/shared/CustomDropdown.jsx
// React port of window.createCustomDropdown from admin-monolith.html (lines 18702–18800)

import { useState, useRef, useEffect } from 'react';

export default function CustomDropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  style = {},
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef(null);

  const selectedOption = options.find(o => String(o.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const openMenu = () => {
    if (disabled) return;
    setIsOpen(true);
    const idx = options.findIndex(o => String(o.value) === String(value));
    setHighlightedIndex(idx >= 0 ? idx : 0);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const handleOptionSelect = (val) => {
    if (onChange) {
      onChange(val);
    }
    closeMenu();
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
        e.preventDefault();
        openMenu();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 + options.length) % options.length);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < options.length) {
        handleOptionSelect(options[highlightedIndex].value);
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-container ${isOpen ? 'open' : ''} ${className}`}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={handleKeyDown}
      style={style}
    >
      <div className="field-select-trigger" onClick={handleTriggerClick}>
        <span className="field-select-label">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="field-select-chevron">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>
      {isOpen && (
        <div className="field-select-menu" role="listbox">
          {options.map((opt, i) => {
            const isSelected = String(opt.value) === String(value);
            const isHighlighted = i === highlightedIndex;
            return (
              <div
                key={String(opt.value)}
                className={`field-select-option ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                data-value={opt.value}
                data-index={i}
                onMouseEnter={() => setHighlightedIndex(i)}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionSelect(opt.value);
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
