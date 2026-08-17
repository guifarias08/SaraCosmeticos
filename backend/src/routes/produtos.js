const express = require('express');
const db = require('../db');
const { exigirAdmin } = require('../middleware/auth');

const router = express.Router();

/* ---------- ROTAS PÚBLICAS (usadas pela loja / clientes) ---------- */

// GET /api/produtos -> só produtos ativos, sem dados sensíveis
router.get('/', (req, res) => {
  const produtos = db
    .prepare(
      `SELECT id, codigo, nome, marca, categoria, preco, preco_promocional, imagem_url, descricao
       FROM produtos WHERE ativo = 1 ORDER BY criado_em DESC`
    )
    .all();
  res.json(produtos);
});

// GET /api/produtos/:id -> detalhe de um produto ativo
router.get('/:id', (req, res) => {
  const produto = db
    .prepare(
      `SELECT id, codigo, nome, marca, categoria, preco, preco_promocional, imagem_url, descricao
       FROM produtos WHERE id = ? AND ativo = 1`
    )
    .get(req.params.id);

  if (!produto) return res.status(404).json({ erro: 'Produto não encontrado.' });
  res.json(produto);
});

/* ---------- ROTAS DE ADMIN (exigem login, usadas só no painel) ---------- */

// GET /api/admin/produtos -> lista TODOS os produtos, incluindo estoque e inativos
router.get('/admin/todos', exigirAdmin, (req, res) => {
  const produtos = db.prepare('SELECT * FROM produtos ORDER BY criado_em DESC').all();
  res.json(produtos);
});

// POST /api/admin/produtos -> cria novo produto
router.post('/admin', exigirAdmin, (req, res) => {
  const {
    codigo, nome, marca, categoria,
    preco, preco_promocional, quantidade_estoque,
    descricao, imagem_url,
  } = req.body;

  if (!codigo || !nome || !categoria || preco == null) {
    return res.status(400).json({ erro: 'Preencha ao menos código, nome, categoria e preço.' });
  }

  try {
    const resultado = db.prepare(`
      INSERT INTO produtos (codigo, nome, marca, categoria, preco, preco_promocional, quantidade_estoque, descricao, imagem_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      codigo, nome, marca || null, categoria,
      preco, preco_promocional || null, quantidade_estoque || 0,
      descricao || null, imagem_url || null
    );

    const novoProduto = db.prepare('SELECT * FROM produtos WHERE id = ?').get(resultado.lastInsertRowid);
    res.status(201).json(novoProduto);
  } catch (erro) {
    if (erro.message.includes('UNIQUE')) {
      return res.status(409).json({ erro: 'Já existe um produto com esse código.' });
    }
    res.status(500).json({ erro: 'Erro ao criar produto.' });
  }
});

// PUT /api/admin/produtos/:id -> edita produto existente
router.put('/admin/:id', exigirAdmin, (req, res) => {
  const existente = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const dados = { ...existente, ...req.body };

  db.prepare(`
    UPDATE produtos SET
      codigo = ?, nome = ?, marca = ?, categoria = ?,
      preco = ?, preco_promocional = ?, quantidade_estoque = ?,
      descricao = ?, imagem_url = ?, ativo = ?,
      atualizado_em = datetime('now')
    WHERE id = ?
  `).run(
    dados.codigo, dados.nome, dados.marca, dados.categoria,
    dados.preco, dados.preco_promocional, dados.quantidade_estoque,
    dados.descricao, dados.imagem_url, dados.ativo ? 1 : 0,
    req.params.id
  );

  const atualizado = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  res.json(atualizado);
});

// DELETE /api/admin/produtos/:id -> remove produto
router.delete('/admin/:id', exigirAdmin, (req, res) => {
  const info = db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
  res.json({ ok: true });
});

module.exports = router;
