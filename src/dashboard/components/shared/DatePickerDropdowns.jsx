import { useState, useEffect } from 'react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

function getDaysInMonth(monthIndex, year) {
  if (monthIndex < 0 || monthIndex > 11) return 31;
  return new Date(year, monthIndex + 1, 0).getDate();
}

export default function DatePickerDropdowns({ value, onChange, hasError = false, disabled = false, minDate = new Date() }) {
  const currentYear = minDate.getFullYear();
  const currentMonthIndex = minDate.getMonth();
  const currentDayNum = minDate.getDate();

  // Available Years: current year + next 2 years
  const years = [currentYear, currentYear + 1, currentYear + 2];

  // Parse initial state from value (format: YYYY-MM-DD or date object)
  const parseInitialState = () => {
    if (!value) return { day: '', month: '', year: '' };
    try {
      const parts = String(value).split('T')[0].split('-');
      if (parts.length === 3) {
        return {
          year: parseInt(parts[0], 10) || '',
          month: parseInt(parts[1], 10) || '',
          day: parseInt(parts[2], 10) || ''
        };
      }
    } catch {}
    return { day: '', month: '', year: '' };
  };

  const [dateState, setDateState] = useState(parseInitialState);

  useEffect(() => {
    if (!value) {
      setDateState({ day: '', month: '', year: '' });
      return;
    }
    const parsed = parseInitialState();
    if (parsed.year && parsed.month && parsed.day) {
      setDateState(parsed);
    }
  }, [value]);

  const handleStateChange = (field, val) => {
    const next = { ...dateState, [field]: val ? parseInt(val, 10) : '' };
    
    // Reset day if it exceeds max days in new month
    if (next.year && next.month && next.day) {
      const maxDays = getDaysInMonth(next.month - 1, next.year);
      if (next.day > maxDays) {
        next.day = maxDays;
      }
    }

    setDateState(next);

    if (next.year && next.month && next.day) {
      const mStr = String(next.month).padStart(2, '0');
      const dStr = String(next.day).padStart(2, '0');
      onChange(`${next.year}-${mStr}-${dStr}`);
    } else {
      onChange('');
    }
  };

  const selectedYear = dateState.year ? parseInt(dateState.year, 10) : '';
  const selectedMonth = dateState.month ? parseInt(dateState.month, 10) : '';

  // Max days for currently selected month/year
  const maxDays = selectedMonth && selectedYear ? getDaysInMonth(selectedMonth - 1, selectedYear) : 31;
  const days = Array.from({ length: maxDays }, (_, i) => i + 1);

  return (
    <div className={`date-picker-dropdowns-group ${hasError ? 'shop-error has-error' : ''}`} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '8px' }}>
      {/* Month Dropdown */}
      <select
        className={`shop-field-input field-input ${hasError ? 'shop-error' : ''}`}
        value={selectedMonth}
        disabled={disabled}
        onChange={(e) => handleStateChange('month', e.target.value)}
        style={{ fontSize: '13px', padding: '8px 10px', height: '40px', borderRadius: '8px' }}
      >
        <option value="">Month</option>
        {MONTH_NAMES.map((name, idx) => {
          const mNum = idx + 1;
          const isPastMonth = selectedYear === currentYear && idx < currentMonthIndex;
          return (
            <option key={name} value={mNum} disabled={isPastMonth}>
              {name}
            </option>
          );
        })}
      </select>

      {/* Day Dropdown */}
      <select
        className={`shop-field-input field-input ${hasError ? 'shop-error' : ''}`}
        value={dateState.day}
        disabled={disabled || !selectedMonth || !selectedYear}
        onChange={(e) => handleStateChange('day', e.target.value)}
        style={{ fontSize: '13px', padding: '8px 10px', height: '40px', borderRadius: '8px' }}
      >
        <option value="">Day</option>
        {days.map(d => {
          const isPastDay = selectedYear === currentYear && selectedMonth === (currentMonthIndex + 1) && d < currentDayNum;
          return (
            <option key={d} value={d} disabled={isPastDay}>
              {d}
            </option>
          );
        })}
      </select>

      {/* Year Dropdown */}
      <select
        className={`shop-field-input field-input ${hasError ? 'shop-error' : ''}`}
        value={selectedYear}
        disabled={disabled}
        onChange={(e) => handleStateChange('year', e.target.value)}
        style={{ fontSize: '13px', padding: '8px 10px', height: '40px', borderRadius: '8px' }}
      >
        <option value="">Year</option>
        {years.map(y => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}
