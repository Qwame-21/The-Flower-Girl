import { useState } from 'react';
import DeliveryAddressFields from './DeliveryAddressFields';
import PhoneInput from './PhoneInput';
import CustomSelect from './CustomSelect';

const FULFILMENT_OPTIONS = [
  { value: 'delivery', label: 'Delivery' },
  { value: 'collection', label: 'Collect from the shop' },
];

export default function RequestDeliveryFields() {
  const [method, setMethod] = useState('delivery');
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
    <label>Recipient name <small>(optional)</small><input name="recipient" placeholder="Leave blank if you are receiving it" /></label>
    <PhoneInput name="recipientPhone" label="Recipient phone (optional)" />
    {method === 'delivery' ? <>
      <DeliveryAddressFields />
      <label>Nearest landmark<input name="landmark" /></label>
      <label>Google Maps or location link <small>(optional)</small><input name="locationLink" type="url" placeholder="https://maps.google.com/..." /></label>
    </> : <p>Collection from ACP Estate Junction, Kwabenya, Accra. The team will confirm the time.</p>}
    <label>Delivery / collection instructions<textarea name="deliveryInstructions" rows="2" placeholder="Gate, floor, contact person, preferred time or surprise-delivery instructions" /></label>
    <label>Budget (GHS) <small>(optional)</small><input name="budget" type="number" min="1" step="0.01" inputMode="decimal" /></label>
  </section>;
}
