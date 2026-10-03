import { useId, useRef, useState, useEffect } from 'react';

export default function CustomSelect({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
  required = false,
  disabled = false,
  placeholder = 'Select…',
  getLabel = opt => opt,
  getValue = opt => opt,
}) {
  const id = useId();
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const hiddenRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState('below');
  const [internalValue, setInternalValue] = useState(value ?? defaultValue ?? '');

  const currentValue = value !== undefined ? value : internalValue;
  const selectedOption = options.find(opt => getValue(opt) === currentValue);
  const displayValue = selectedOption ? getLabel(selectedOption) : '';

  const handleOptionSelect = (optionValue) => {
    if (value === undefined) {
      setInternalValue(optionValue);
    }
    onChange?.(optionValue);
  };

  useEffect(() => {
    if (!open || !buttonRef.current || !menuRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current.offsetHeight || 200;
    const spaceBelow = window.innerHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;

    setPosition(spaceBelow < menuHeight + 10 && spaceAbove > spaceBelow ? 'above' : 'below');
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && !buttonRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleKeyDown = (event) => {
    if (disabled) return;

    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault();
        setOpen(current => !current);
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        if (!open) {
          event.preventDefault();
          setOpen(true);
        }
        break;
      case 'Tab':
        setOpen(false);
        break;
    }
  };

  const handleOptionKeyDown = (event, optionValue) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleOptionSelect(optionValue);
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'Escape':
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        break;
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        const buttons = menuRef.current?.querySelectorAll('button[role="option"]') || [];
        const currentIndex = Array.from(buttons).findIndex(btn => btn === event.target);
        const nextIndex = event.key === 'ArrowDown'
          ? Math.min(currentIndex + 1, buttons.length - 1)
          : Math.max(currentIndex - 1, 0);
        buttons[nextIndex]?.focus();
        break;
      case 'Tab':
        event.preventDefault();
        handleOptionSelect(optionValue);
        break;
    }
  };

  const handleFocus = () => {
    if (hiddenRef.current) {
      hiddenRef.current.value = currentValue ?? '';
    }
  };

  return (
    <label className="custom-select-field" htmlFor={`${id}-button`}>
      {label}
      <div className={`custom-select-wrapper ${open ? 'open' : ''}`}>
        <input
          ref={hiddenRef}
          type="hidden"
          name={name}
          value={currentValue ?? ''}
          required={required}
          onChange={() => {}}
          onFocus={handleFocus}
        />
        <button
          ref={buttonRef}
          id={`${id}-button`}
          type="button"
          className="custom-select-button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-label={label || placeholder}
          disabled={disabled}
          onClick={() => !disabled && setOpen(current => !current)}
          onKeyDown={handleKeyDown}
        >
          <span className="custom-select-value">{displayValue || placeholder}</span>
          <span className="custom-select-chevron" aria-hidden="true">
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </button>
        {open && (
          <div
            ref={menuRef}
            className={`custom-select-menu custom-select-menu--${position}`}
            role="listbox"
            aria-label={label || placeholder}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                setOpen(false);
                buttonRef.current?.focus();
              }
            }}
          >
            {options.map((option, index) => {
              const optionValue = getValue(option);
              const optionLabel = getLabel(option);
              const isSelected = optionValue === currentValue;
              return (
                <button
                  key={optionValue ?? index}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    handleOptionSelect(optionValue);
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  onKeyDown={(e) => handleOptionKeyDown(e, optionValue)}
                >
                  {optionLabel}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </label>
  );
}
