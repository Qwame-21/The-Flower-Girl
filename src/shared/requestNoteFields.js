function normalizeFieldKey(key) {
  return String(key || '').trim().replace(/[\s_-]+/g, '').toLowerCase();
}

export function readRequestNoteField(notes, key) {
  if (typeof notes !== 'string' || !notes) return undefined;

  const normalizedKey = normalizeFieldKey(key);
  const linePattern = /^[ \t]*([^:\r\n]+):[ \t]*([^\r\n]*)$/gm;
  let match;

  while ((match = linePattern.exec(notes))) {
    if (normalizeFieldKey(match[1]) === normalizedKey) {
      return match[2].trim();
    }
  }

  return undefined;
}
