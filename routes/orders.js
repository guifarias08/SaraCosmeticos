/**
 * routes/orders.js
 * Rotas de pedido e checkout.
 *
 * POST /api/orders/checkout
 *   Recebe os itens do carrinho e a forma de pagamento,
 *   valida os dados, e retorna uma URL do WhatsApp
 *   com o resumo do pedido pronto para enviar à loja.
 */

const express = require('express');
const router = express.Router();
const products = require('../data/products');

/** Número WhatsApp da loja (só dígitos, com DDI). */
const STORE_WHATSAPP = '558588540534';

/** Formas de pagamento aceitas. */
const PAYMENT_METHODS = {
  pix: 'PIX (à vista)',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto Bancário',
  dinheiro: 'Dinheiro na entrega',
};

/**
 * Formata um valor numérico para o padrão BRL.
 * @param {number} value
 * @returns {string}
 */
function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/**
 * Monta a mensagem de texto do pedido para enviar ao WhatsApp.
 * @param {object[]} enrichedItems  - itens com dados completos do produto
 * @param {number}   total          - total calculado no servidor
 * @param {string}   paymentLabel   - label legível da forma de pagamento
 * @param {string}   [note]         - observação opcional do cliente
 * @returns {string}
 */
function buildWhatsAppMessage(enrichedItems, total, paymentLabel, note) {
  const lines = ['*🛍️ Novo Pedido — Sara Cosméticos*', ''];

  enrichedItems.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.emoji} *${item.name}* (${item.brand})`);
    lines.push(`   Qtd: ${item.qty}  |  ${formatBRL(item.unitPrice)} cada`);
    lines.push(`   Subtotal: ${formatBRL(item.subtotal)}`);
    lines.push('');
  });

  lines.push(`💳 *Forma de pagamento:* ${paymentLabel}`);
  lines.push(`💰 *Total: ${formatBRL(total)}*`);

  if (note && note.trim()) {
    lines.push('');
    lines.push(`📝 *Observação:* ${note.trim()}`);
  }

  lines.push('');
  lines.push('_Pedido enviado pelo site Sara Cosméticos_ ✨');

  return lines.join('\n');
}

/**
 * POST /api/orders/checkout
 *
 * Body esperado:
 * {
 *   items: [
 *     { productId: 1, qty: 2 },
 *     { productId: 4, qty: 1 }
 *   ],
 *   paymentMethod: "pix",   // chave de PAYMENT_METHODS
 *   note: "Entregar à tarde" // opcional
 * }
 *
 * Resposta de sucesso:
 * {
 *   success: true,
 *   whatsappUrl: "https://wa.me/...",
 *   summary: { items: [...], total: 197.80 }
 * }
 */
router.post('/checkout', (req, res) => {
  const { items, paymentMethod, note } = req.body;

  // --- Validações básicas ---
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'O carrinho está vazio.' });
  }

  if (!paymentMethod || !PAYMENT_METHODS[paymentMethod]) {
    return res.status(400).json({
      success: false,
      message: `Forma de pagamento inválida. Opções: ${Object.keys(PAYMENT_METHODS).join(', ')}.`,
    });
  }

  // --- Enriquecer itens com dados do servidor ---
  const enrichedItems = [];
  const errors = [];

  for (const item of items) {
    const { productId, qty } = item;

    if (!Number.isInteger(Number(productId)) || !Number.isInteger(Number(qty)) || Number(qty) < 1) {
      errors.push(`Item inválido: productId=${productId}, qty=${qty}.`);
      continue;
    }

    const product = products.find((p) => p.id === Number(productId));
    if (!product) {
      errors.push(`Produto #${productId} não encontrado.`);
      continue;
    }

    if (product.stock < Number(qty)) {
      errors.push(`Estoque insuficiente para "${product.name}" (disponível: ${product.stock}).`);
      continue;
    }

    enrichedItems.push({
      id: product.id,
      name: product.name,
      brand: product.brand,
      emoji: product.emoji,
      unitPrice: product.price,
      qty: Number(qty),
      subtotal: product.price * Number(qty),
    });
  }

  if (errors.length > 0) {
    return res.status(422).json({ success: false, message: errors.join(' ') });
  }

  const total = enrichedItems.reduce((sum, i) => sum + i.subtotal, 0);
  const paymentLabel = PAYMENT_METHODS[paymentMethod];

  // --- Montar URL do WhatsApp ---
  const message = buildWhatsAppMessage(enrichedItems, total, paymentLabel, note);
  const whatsappUrl = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(message)}`;

  res.json({
    success: true,
    whatsappUrl,
    summary: {
      items: enrichedItems,
      total,
      paymentMethod,
      paymentLabel,
    },
  });
});

/**
 * GET /api/orders/payment-methods
 * Retorna as formas de pagamento disponíveis.
 */
router.get('/payment-methods', (req, res) => {
  const methods = Object.entries(PAYMENT_METHODS).map(([key, label]) => ({ key, label }));
  res.json({ success: true, data: methods });
});

module.exports = router;
