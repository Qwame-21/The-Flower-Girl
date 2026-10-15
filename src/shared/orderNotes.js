/**
 * Parses combined admin/customer order notes into structured blocks:
 * Delivery instructions, Gift message, Card style.
 * Splits on markers ("Gift card:", "Card style:") with fallback to Delivery instructions.
 */
export function parseAdminOrderNotes(text) {
  if (!text || typeof text !== 'string') return [];
  const trimmed = text
    .trim()
    .replace(/^[\"'“‘]/, '')
    .replace(/[\"'”’]$/, '')
    .trim();
  if (!trimmed) return [];

  const giftCardRegex = /Gift\s*card\s*:/i;
  const cardStyleRegex = /Card\s*style\s*:/i;

  const giftCardMatch = giftCardRegex.exec(trimmed);
  const cardStyleMatch = cardStyleRegex.exec(trimmed);

  if (!giftCardMatch && !cardStyleMatch) {
    return [
      { id: 'instructions', label: 'Delivery instructions', content: trimmed }
    ];
  }

  const markers = [];
  if (giftCardMatch) {
    markers.push({
      id: 'gift-message',
      label: 'Gift message',
      start: giftCardMatch.index,
      end: giftCardMatch.index + giftCardMatch[0].length
    });
  }
  if (cardStyleMatch) {
    markers.push({
      id: 'card-style',
      label: 'Card style',
      start: cardStyleMatch.index,
      end: cardStyleMatch.index + cardStyleMatch[0].length
    });
  }

  markers.sort((a, b) => a.start - b.start);

  const blocks = [];
  const preText = trimmed.slice(0, markers[0].start).trim();
  if (preText) {
    blocks.push({
      id: 'instructions',
      label: 'Delivery instructions',
      content: preText
    });
  }

  for (let i = 0; i < markers.length; i++) {
    const current = markers[i];
    const nextStart = markers[i + 1] ? markers[i + 1].start : trimmed.length;
    const content = trimmed.slice(current.end, nextStart).trim();
    if (content) {
      blocks.push({
        id: current.id,
        label: current.label,
        content
      });
    }
  }

  return blocks;
}
