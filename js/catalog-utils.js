export function normalizeSearch(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

export function getPricing(regularValue, promotionalValue) {
  const regularPrice = regularValue == null || regularValue === '' ? null : Number(regularValue);
  const promotionalPrice = promotionalValue == null ? null : Number(promotionalValue);
  const hasRegularPrice = Number.isFinite(regularPrice) && regularPrice >= 0;
  const hasPromotion = hasRegularPrice
    && Number.isFinite(promotionalPrice)
    && promotionalPrice >= 0
    && promotionalPrice < regularPrice;

  return {
    originalPrice: hasPromotion ? regularPrice : null,
    price: hasPromotion ? promotionalPrice : (hasRegularPrice ? regularPrice : null),
  };
}
