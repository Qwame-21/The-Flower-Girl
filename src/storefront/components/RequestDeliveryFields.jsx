import { useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import DeliveryAddressFields from './DeliveryAddressFields';
import PhoneInput from './PhoneInput';
import CustomSelect from './CustomSelect';
import OutlineActionButton from './OutlineActionButton';

const FULFILMENT_OPTIONS = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'collection', label: 'Collect from the shop' },
];

export default function RequestDeliveryFields({ defaultValues = {} }) {
  const [method, setMethod] = useState(() => defaultValues.fulfilment || 'delivery');
  const [locationLink, setLocationLink] = useState(() => defaultValues.locationLink || '');
  const [locationStatus, setLocationStatus] = useState('');
  const [locating, setLocating] = useState(false);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    setLocationStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;
        setLocationLink(`https://www.google.com/maps?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`);
        setLocationStatus('Current location added. You can still edit the link.');
        setLocating(false);
      },
      () => {
        setLocationStatus('Location permission was not granted. Paste a Maps link instead.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return <section className="request-delivery-fields">
    <CustomSelect
      name="fulfilment"
      label="Delivery or collection"
      options={FULFILMENT_OPTIONS}
      value={method}
      onChange={setMethod}
      getValue={opt => opt.value}
      getLabel={opt => opt.label}
    />
    <label>Recipient name <small>(optional)</small><input name="recipient" defaultValue={defaultValues.recipient || ''} placeholder="Leave blank if you are receiving it" /></label>
    <PhoneInput name="recipientPhone" label="Recipient phone (optional)" defaultValue={defaultValues['recipientPhone-number'] || defaultValues.recipientPhone || ''} />
    {method === 'delivery' ? <>
      <DeliveryAddressFields defaultValues={defaultValues} />
      <label>Nearest landmark<input name="landmark" defaultValue={defaultValues.landmark || ''} /></label>
      <div className="location-field">
        <label>Google Maps or location link <small>(optional)</small>
          <input
            name="locationLink"
            type="url"
            value={locationLink}
            onChange={event => setLocationLink(event.target.value)}
            placeholder="https://maps.google.com/..."
          />
        </label>
        <OutlineActionButton
          icon={<LocateFixed size={16} strokeWidth={1.6} />}
          label="USE MY LOCATION"
          onClick={useCurrentLocation}
          loading={locating}
          loadingLabel="LOCATING…"
        />
        {locationStatus && <small><MapPin size={13} />{locationStatus}</small>}
      </div>
    </> : <p>Collection from ACP Estate Junction, Kwabenya, Accra. The team will confirm the time.</p>}
    <label>Delivery / collection instructions<textarea name="deliveryInstructions" defaultValue={defaultValues.deliveryInstructions || ''} rows="2" placeholder="Gate, floor, contact person, preferred time or surprise-delivery instructions" /></label>
    <label>Budget (GHS) <small>(optional)</small><input name="budget" defaultValue={defaultValues.budget || ''} type="number" min="1" step="0.01" inputMode="decimal" /></label>
  </section>;
}
