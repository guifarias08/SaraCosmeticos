import assert from 'node:assert/strict';
import test from 'node:test';
import { getPricing, normalizeSearch } from '../js/catalog-utils.js';

test('normaliza acentos, caixa e espaços para a busca', () => {
  assert.equal(normalizeSearch('  Óleo Corporal AÇAÍ '), 'oleo corporal acai');
});

test('usa promoção válida e preserva o preço original', () => {
  assert.deepEqual(getPricing('99.90', '79.90'), { originalPrice: 99.9, price: 79.9 });
});

test('ignora promoção igual ou maior que o preço normal', () => {
  assert.deepEqual(getPricing(99.9, 99.9), { originalPrice: null, price: 99.9 });
  assert.deepEqual(getPricing(99.9, 120), { originalPrice: null, price: 99.9 });
});

test('preserva preço ausente para itens sob consulta', () => {
  assert.deepEqual(getPricing(null, null), { originalPrice: null, price: null });
  assert.deepEqual(getPricing('', null), { originalPrice: null, price: null });
});
