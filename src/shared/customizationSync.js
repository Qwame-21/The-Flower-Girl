export const CUSTOMIZATION_SYNC_CHANNEL = 'flowergirl-customization-options-sync';

export function buildStorefrontCustomizationSnapshot(categories) {
  const options = {};
  const estimates = {};

  for (const category of categories) {
    for (const option of category.options || []) {
      estimates[option.name] = Number(option.price) || 0;
      if (category.visible !== false && option.visible !== false) {
        (options[category.name] ||= []).push(option.name);
      }
    }
  }

  return { options, estimates };
}
