// Keep the existing order API/storage contract while retaining every address line.
export function formatDeliveryAddress(data, streetName = 'address') {
  return [streetName, 'addressLine2', 'city', 'region', 'postalCode', 'country']
    .map(key => String(data.get(key) || '').trim()).filter(Boolean).join(', ');
}
