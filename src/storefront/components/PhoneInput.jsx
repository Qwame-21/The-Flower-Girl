import { useId, useRef } from 'react';

const COUNTRY_CODES = [
  { code: '+233', label: 'Ghana', short: 'GH', flag: '🇬🇭' },
  { code: '+234', label: 'Nigeria', short: 'NG', flag: '🇳🇬' },
  { code: '+225', label: 'Côte d’Ivoire', short: 'CI', flag: '🇨🇮' },
  { code: '+228', label: 'Togo', short: 'TG', flag: '🇹🇬' },
  { code: '+226', label: 'Burkina Faso', short: 'BF', flag: '🇧🇫' },
  { code: '+221', label: 'Senegal', short: 'SN', flag: '🇸🇳' },
  { code: '+254', label: 'Kenya', short: 'KE', flag: '🇰🇪' },
  { code: '+27', label: 'South Africa', short: 'ZA', flag: '🇿🇦' },
  { code: '+44', label: 'United Kingdom', short: 'GB', flag: '🇬🇧' },
  { code: '+1', label: 'United States / Canada', short: 'US', flag: '🇺🇸' },
];

function combinePhone(code, number) {
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
  const syncValue = countryCode => {
    if (hiddenRef.current) hiddenRef.current.value = combinePhone(countryCode, numberRef.current?.value);
  };

  return (
    <label className="phone-input-field" htmlFor={`${id}-number`}>
      {label}
      <span className="phone-input-control">
        <select
          aria-label="Country code"
          defaultValue="+233"
          disabled={disabled}
          onChange={event => syncValue(event.target.value)}
        >
          {COUNTRY_CODES.map(country => (
            <option key={`${country.label}-${country.code}`} value={country.code}>
              {country.flag} {country.short} {country.code}
            </option>
          ))}
        </select>
        <input
          id={`${id}-number`}
          ref={numberRef}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={placeholder}
          defaultValue={defaultValue}
          required={required}
          disabled={disabled}
          onInput={event => {
            const select = event.currentTarget.previousElementSibling;
            syncValue(select?.value || '+233');
          }}
        />
      </span>
      <input ref={hiddenRef} type="hidden" name={name} defaultValue={combinePhone('+233', defaultValue)} />
    </label>
  );
}
