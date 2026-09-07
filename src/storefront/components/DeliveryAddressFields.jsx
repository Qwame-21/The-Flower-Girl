import { COUNTRIES } from '../data/countries';

export default function DeliveryAddressFields({ disabled = false, streetName = 'address' }) {
  return <fieldset className="delivery-address-fields">
    <legend>Delivery address</legend>
    <label>Street address<input name={streetName} autoComplete="shipping address-line1" required disabled={disabled} /></label>
    <label><span>Apartment, suite, unit, etc. <small>(optional)</small></span><input name="addressLine2" autoComplete="shipping address-line2" disabled={disabled} /></label>
    <div className="delivery-address-grid">
      <label>Town / City<input name="city" autoComplete="shipping address-level2" required disabled={disabled} /></label>
      <label>Region / State<input name="region" autoComplete="shipping address-level1" disabled={disabled} /></label>
      <label>Country<select name="country" autoComplete="shipping country-name" defaultValue="Ghana" required disabled={disabled}>
        {COUNTRIES.map(({ code, name }) => <option key={code} value={name}>{name}</option>)}
      </select></label>
      <label><span>Postal code <small>(optional)</small></span><input name="postalCode" autoComplete="shipping postal-code" disabled={disabled} /></label>
    </div>
  </fieldset>;
}
