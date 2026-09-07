import { formatDeliveryAddress } from './address';

export function requestDeliveryDetails(data) {
  return {
    fulfilment: data.get('fulfilment') || 'delivery',
    recipient: data.get('recipient') || data.get('name'),
    recipientPhone: data.get('recipientPhone') || data.get('phone'),
    deliveryAddress: data.get('fulfilment') === 'collection' ? 'Shop collection — ACP Estate Junction, Kwabenya, Accra' : formatDeliveryAddress(data),
    landmark: data.get('landmark') || '',
    locationLink: data.get('locationLink') || '',
    deliveryInstructions: data.get('deliveryInstructions') || '',
    budget: data.get('budget') || '',
  };
}

export function requestWhatsAppUrl(request) {
  const lines = [
    `Hello The Gifting Factory, please help with request ${request.reference}.`,
    `Service: ${request.service || 'Custom gift'}`,
    `Customer: ${request.name}`,
    `Phone: ${request.phone}`,
    request.email && `Email: ${request.email}`,
    request.occasion && `Occasion: ${request.occasion}`,
    `Quantity: ${request.quantity || 1}`,
    request.selections?.length && `Selections: ${request.selections.join(', ')}`,
    `Preferred date: ${request.preferredDate}`,
    `Fulfilment: ${request.fulfilment}`,
    `Recipient: ${request.recipient} (${request.recipientPhone})`,
    `Location: ${request.deliveryAddress}`,
    request.landmark && `Landmark: ${request.landmark}`,
    request.locationLink && `Map: ${request.locationLink}`,
    request.budget && `Budget: GHS ${request.budget}`,
    request.estimateHigh && `Estimate: GHS ${request.estimateLow}–${request.estimateHigh}`,
    request.deliveryInstructions && `Delivery / collection instructions: ${request.deliveryInstructions}`,
    request.note && `Brief: ${request.note}`,
    request.cardMessage && `Card message: ${request.cardMessage}`,
    request.cardStyleNotes && `Card style: ${request.cardStyleNotes}`,
    request.inspirationName && `Inspiration file to send in chat: ${request.inspirationName}`,
  ].filter(Boolean);
  // Destination verified against the existing business WhatsApp short link.
  return `https://wa.me/233202417072?text=${encodeURIComponent(lines.join('\n'))}`;
}
