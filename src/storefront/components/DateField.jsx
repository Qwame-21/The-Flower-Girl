import { useState } from 'react';

function DateSelect({ name, placeholder, options }) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  return <div className={`custom-select ${open ? 'open' : ''}`}><input className="date-value" required name={name} value={value} onChange={() => {}} /><button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}><span>{value || placeholder}</span><i /></button>{open && <div className="custom-select-menu" role="listbox" aria-label={placeholder}>{options.map(option => <button type="button" role="option" aria-selected={value === String(option)} key={option} onClick={() => { setValue(String(option)); setOpen(false); }}>{option}</button>)}</div>}</div>;
}

export default function DateField({ label, prefix }) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return <fieldset className="date-field"><legend>{label}</legend><div><DateSelect name={`${prefix}-day`} placeholder="Day" options={Array.from({ length: 31 }, (_, index) => index + 1)} /><DateSelect name={`${prefix}-month`} placeholder="Month" options={months} /><DateSelect name={`${prefix}-year`} placeholder="Year" options={Array.from({ length: 4 }, (_, index) => 2026 + index)} /></div></fieldset>;
}
