const ALLOWED_CATEGORIES = new Set([
  'perfumaria',
  'corpo',
  'maquiagem',
  'skincare',
  'cabelos',
  'kits',
  'outros',
]);

function validateProduct(input) {
  const errors = [];
  const data = {
    codigo: cleanText(input.codigo, 40).toUpperCase(),
    nome: cleanText(input.nome, 120),
    marca: cleanOptionalText(input.marca, 80),
    categoria: cleanText(input.categoria, 40).toLowerCase(),
    preco: toMoney(input.preco),
    preco_promocional: toOptionalMoney(input.preco_promocional),
    quantidade_estoque: toNonNegativeInteger(input.quantidade_estoque),
    descricao: cleanOptionalText(input.descricao, 1200),
    imagem_url: cleanOptionalText(input.imagem_url, 500),
    ativo: toBooleanInteger(input.ativo, 1),
  };

  if (!/^[A-Z0-9._-]{2,40}$/.test(data.codigo)) {
    errors.push('O código deve ter de 2 a 40 caracteres: letras, números, ponto, hífen ou sublinhado.');
  }

  if (!data.nome) errors.push('Informe o nome do produto.');
  if (!ALLOWED_CATEGORIES.has(data.categoria)) errors.push('Selecione uma categoria válida.');
  if (data.preco === null) errors.push('Informe um preço válido e maior ou igual a zero.');

  if (data.preco_promocional === false) {
    errors.push('O preço promocional precisa ser um valor válido.');
    data.preco_promocional = null;
  }

  if (data.preco_promocional !== null && data.preco !== null && data.preco_promocional >= data.preco) {
    errors.push('O preço promocional deve ser menor que o preço normal.');
  }

  if (data.quantidade_estoque === null) {
    errors.push('O estoque deve ser um número inteiro maior ou igual a zero.');
  }

  if (data.imagem_url && !isAllowedImageUrl(data.imagem_url)) {
    errors.push('Use uma imagem enviada pelo painel ou uma URL HTTPS válida.');
  }

  return { data, errors };
}

function cleanText(value, maxLength) {
  return String(value ?? '').trim().slice(0, maxLength);
}

function cleanOptionalText(value, maxLength) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function toMoney(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return null;
  return Math.round(number * 100) / 100;
}

function toOptionalMoney(value) {
  if (value === '' || value === null || value === undefined) return null;
  const money = toMoney(value);
  return money === null ? false : money;
}

function toNonNegativeInteger(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 ? number : null;
}

function toBooleanInteger(value, fallback) {
  if (value === undefined || value === null) return fallback;
  return value === true || value === 1 || value === '1' ? 1 : 0;
}

function isAllowedImageUrl(value) {
  if (value.startsWith('/uploads/')) return /^\/uploads\/[a-zA-Z0-9._-]+$/.test(value);

  try {
    return new URL(value).protocol === 'https:';
  } catch {
    return false;
  }
}

module.exports = { ALLOWED_CATEGORIES, validateProduct };
