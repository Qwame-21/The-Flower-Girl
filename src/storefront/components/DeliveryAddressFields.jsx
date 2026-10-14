import { COUNTRIES } from '../data/countries';
import CustomSelect from './CustomSelect';

export default function DeliveryAddressFields({ disabled = false, streetName = 'address', isCollection = false, defaultValues = {} }) {
  return <fieldset className="delivery-address-fields">
    <legend>{isCollection ? 'Collection details' : 'Delivery address'}</legend>
    <label>Street address<input name={streetName} defaultValue={defaultValues[streetName] || ''} autoComplete="shipping address-line1" required={!isCollection} disabled={disabled} placeholder={isCollection ? 'Shop collection' : ''} /></label>
    <label><span>Apartment, suite, unit, etc. <small>(optional)</small></span><input name="addressLine2" defaultValue={defaultValues.addressLine2 || ''} autoComplete="shipping address-line2" disabled={disabled} /></label>
    <div className="delivery-address-grid">
      <label>Town / City<input name="city" defaultValue={defaultValues.city || ''} autoComplete="shipping address-level2" required={!isCollection} disabled={disabled} /></label>
      <label>Region / State<input name="region" defaultValue={defaultValues.region || ''} autoComplete="shipping address-level1" disabled={disabled} /></label>
      <CustomSelect
        name="country"
        label="Country"
        options={COUNTRIES}
        value={defaultValues.country || "Ghana"}
        onChange={() => {}}
        getValue={opt => opt.name}
        getLabel={opt => opt.name}
        required={!isCollection}
        disabled={disabled}
      />
      <label><span>Postal code <small>(optional)</small></span><input name="postalCode" defaultValue={defaultValues.postalCode || ''} autoComplete="shipping postal-code" disabled={disabled} /></label>
    </div>
  </fieldset>;
}
