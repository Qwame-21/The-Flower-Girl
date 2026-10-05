import { COUNTRIES } from '../data/countries';
import CustomSelect from './CustomSelect';

export default function DeliveryAddressFields({ disabled = false, streetName = 'address', isCollection = false }) {
  return <fieldset className="delivery-address-fields">
    <legend>{isCollection ? 'Collection details' : 'Delivery address'}</legend>
    <label>Street address<input name={streetName} autoComplete="shipping address-line1" required={!isCollection} disabled={disabled} placeholder={isCollection ? 'Shop collection' : ''} /></label>
    <label><span>Apartment, suite, unit, etc. <small>(optional)</small></span><input name="addressLine2" autoComplete="shipping address-line2" disabled={disabled} /></label>
    <div className="delivery-address-grid">
      <label>Town / City<input name="city" autoComplete="shipping address-level2" required={!isCollection} disabled={disabled} /></label>
      <label>Region / State<input name="region" autoComplete="shipping address-level1" disabled={disabled} /></label>
      <CustomSelect
        name="country"
        label="Country"
        options={COUNTRIES}
        value="Ghana"
        onChange={() => {}}
        getValue={opt => opt.name}
        getLabel={opt => opt.name}
        required={!isCollection}
        disabled={disabled}
      />
      <label><span>Postal code <small>(optional)</small></span><input name="postalCode" autoComplete="shipping postal-code" disabled={disabled} /></label>
    </div>
  </fieldset>;
}
