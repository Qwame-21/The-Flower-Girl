import { useId, useRef, useState } from 'react';
import CustomSelect from './CustomSelect';

const COUNTRY_CODES = [
  { code: '+233', label: 'Ghana', short: 'GH', flag: '🇬🇭' },
  { code: '+234', label: 'Nigeria', short: 'NG', flag: '🇳🇬' },
  { code: '+225', label: 'Côte d\u2019Ivoire', short: 'CI', flag: '🇨🇮' },
  { code: '+228', label: 'Togo', short: 'TG', flag: '🇹🇬' },
  { code: '+226', label: 'Burkina Faso', short: 'BF', flag: '🇧🇫' },
  { code: '+221', label: 'Senegal', short: 'SN', flag: '🇸🇳' },
  { code: '+254', label: 'Kenya', short: 'KE', flag: '🇰🇪' },
  { code: '+27', label: 'South Africa', short: 'ZA', flag: '🇿🇦' },
  { code: '+44', label: 'United Kingdom', short: 'GB', flag: '🇬🇧' },
  { code: '+1', label: 'United States / Canada', short: 'US', flag: '🇺🇸' },
];

export function combinePhone(code, number) {
  const value = String(number || '').trim();
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (value.startsWith('+')) return `+${digits}`;
  return `${code}${digits.replace(/^0+/, '')}`;
}

export default function PhoneInput({
  label = 'Phone or WhatsApp',
  name = 'phone',
  required = false,
  disabled = false,
  defaultValue = '',
  placeholder = '24 000 0000',
}) {
  const id = useId();
  const numberRef = useRef(null);
  const hiddenRef = useRef(null);
  const [countryCode, setCountryCode] = useState('+233');

  // Single sync function — reads directly from refs, no DOM traversal.
  const sync = () => {
    if (hiddenRef.current) {
      hiddenRef.current.value = combinePhone(
        countryCode,
        numberRef.current?.value,
      );
    }
  };

  const handleCountryChange = (newCode) => {
    setCountryCode(newCode);
    sync();
  };

  return (
    <label className="phone-input-field" htmlFor={`${id}-number`}>
      {label}
      <span className="phone-input-control">
        <div className="phone-country-select">
          <CustomSelect
            name={`${name}-code`}
            label=""
            options={COUNTRY_CODES}
            value={countryCode}
            onChange={handleCountryChange}
            getValue={opt => opt.code}
            getLabel={opt => `${opt.flag} ${opt.short} ${opt.code}`}
            disabled={disabled}
            placeholder=""
          />
        </div>
        <input
          id={`${id}-number`}
          ref={numberRef}
          name={`${name}-number`}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          disabled={disabled}
          onInput={sync}
          onChange={sync}
          onBlur={sync}
          // onAnimationStart fires when Chrome applies :-webkit-autofill,
          // the only reliable hook to sync the hidden field after browser autofill.
          onAnimationStart={sync}
        />
      </span>
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={combinePhone('+233', defaultValue)} />
    </label>
  );
}
