import { useRef, useState } from 'react';
import { MONTHS, validFutureDate } from '../utils/date';

function DateSelect({ name, placeholder, options, value, onChange, error }) {
  const [open, setOpen] = useState(false);
  const button = useRef(null);
  return <div className={`custom-select ${open ? 'open' : ''}`} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); button.current?.focus(); } }}>
    <input className="date-value" required name={name} value={value} onChange={() => {}} ref={node => node?.setCustomValidity(error || '')} onInvalid={() => button.current?.focus()} />
    <button ref={button} type="button" aria-label={placeholder} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}><span>{value || placeholder}</span><i /></button>
    {open && <div className="custom-select-menu" role="listbox" aria-label={placeholder}>{options.map(option => <button type="button" role="option" aria-selected={value === String(option)} key={option} onClick={() => { onChange(String(option)); setOpen(false); button.current?.focus(); }}>{option}</button>)}</div>}
  </div>;
}

export default function DateField({ label, prefix }) {
  const [values, setValues] = useState({ day: '', month: '', year: '' });
  const now = new Date();
  const year = Number(values.year) || now.getFullYear();
  const month = MONTHS.indexOf(values.month) + 1;
  const days = month ? new Date(year, month, 0).getDate() : 31;
  const complete = values.day && values.month && values.year;
  const error = complete && !validFutureDate(Number(values.year), month, Number(values.day)) ? 'Choose a valid date today or later.' : '';
  const change = key => value => setValues(current => ({ ...current, [key]: value }));
  return <fieldset className="date-field"><legend>{label}</legend><div>
    <DateSelect name={`${prefix}-day`} placeholder="Day" value={values.day} onChange={change('day')} error={error} options={Array.from({ length: days }, (_, i) => i + 1)} />
    <DateSelect name={`${prefix}-month`} placeholder="Month" value={values.month} onChange={change('month')} options={MONTHS} />
    <DateSelect name={`${prefix}-year`} placeholder="Year" value={values.year} onChange={change('year')} options={Array.from({ length: 4 }, (_, i) => now.getFullYear() + i)} />
  </div>{error && <small role="alert">{error}</small>}</fieldset>;
}
