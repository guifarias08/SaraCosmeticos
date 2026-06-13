/**
 * routes/products.js
 * Rotas da API de produtos.
 *
 * GET /api/products          → lista todos os produtos (aceita ?category=xxx)
 * GET /api/products/:id      → retorna um produto pelo ID
 * GET /api/products/categories → lista as categorias únicas com contagem
 */

const express = require('express');
const router = express.Router();
const products = require('../data/products');

/**
 * GET /api/products
 * Query params opcionais:
 *   category  → filtra por categoria (ex: ?category=maquiagem)
 *   tag       → filtra por tag (ex: ?tag=new ou ?tag=off)
 */
router.get('/', (req, res) => {
  const { category, tag } = req.query;

  let result = [...products];

  if (category && category !== 'todos') {
    result = result.filter((p) => p.category === category);
  }

  if (tag) {
    result = result.filter((p) => p.tag === tag);
  }

  res.json({
    success: true,
    total: result.length,
    data: result,
  });
});

/**
 * GET /api/products/categories
 * Retorna lista de categorias com a contagem de produtos em cada uma.
 */
router.get('/categories', (req, res) => {
  const map = {};
  products.forEach((p) => {
    map[p.category] = (map[p.category] || 0) + 1;
  });

  const categories = Object.entries(map).map(([name, count]) => ({ name, count }));

  res.json({ success: true, data: categories });
});

/**
 * GET /api/products/:id
 * Retorna um único produto pelo ID numérico.
 */
router.get('/:id', (req, res) => {
  const id = Number(req.params.id);
  const product = products.find((p) => p.id === id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Produto não encontrado.' });
  }

  res.json({ success: true, data: product });
});

module.exports = router;
