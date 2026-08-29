const express = require('express');
const { db, recordAudit, runInTransaction } = require('../db');
const { requireAdmin, requireSameOrigin } = require('../middleware/auth');
const {
  hasValidImageSignature,
  removeUploadedFile,
  uploadProductImage,
} = require('../upload');
const { validateProduct } = require('../validation');

const router = express.Router();

router.use('/admin', requireAdmin, requireSameOrigin);

router.get('/admin/todos', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const products = db.prepare(`
    SELECT *
    FROM produtos
    ORDER BY atualizado_em DESC, id DESC
  `).all();
  res.json(products);
});

router.post('/admin/upload', (req, res, next) => {
  uploadProductImage(req, res, (error) => {
    if (error) return next(error);
    if (!req.file) return res.status(400).json({ erro: 'Selecione uma imagem.' });

    if (!hasValidImageSignature(req.file)) {
      removeUploadedFile(req.file);
      return res.status(400).json({ erro: 'O arquivo enviado não é uma imagem válida.' });
    }

    recordAudit({
      adminId: req.admin.id,
      action: 'imagem_enviada',
      entity: 'uploads',
      details: { arquivo: req.file.filename },
    });

    return res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

router.post('/admin', (req, res) => {
  const validation = validateProduct(req.body || {});
  if (validation.errors.length) {
    return res.status(400).json({ erro: validation.errors.join(' ') });
  }

  try {
    const product = runInTransaction(() => {
      const data = validation.data;
      const result = db.prepare(`
        INSERT INTO produtos (
          codigo, nome, marca, categoria, preco, preco_promocional,
          quantidade_estoque, descricao, imagem_url, ativo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.codigo,
        data.nome,
        data.marca,
        data.categoria,
        data.preco,
        data.preco_promocional,
        data.quantidade_estoque,
        data.descricao,
        data.imagem_url,
        data.ativo,
      );

      const created = db.prepare('SELECT * FROM produtos WHERE id = ?').get(result.lastInsertRowid);
      recordAudit({
        adminId: req.admin.id,
        action: 'produto_criado',
        entity: 'produtos',
        entityId: created.id,
        details: { codigo: created.codigo, nome: created.nome },
      });
      return created;
    });

    return res.status(201).json(product);
  } catch (error) {
    return handleDatabaseError(error, res, 'criar');
  }
});

router.put('/admin/:id(\\d+)', (req, res) => {
  const existing = db.prepare('SELECT * FROM produtos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Produto não encontrado.' });

  const validation = validateProduct({ ...existing, ...req.body });
  if (validation.errors.length) {
    return res.status(400).json({ erro: validation.errors.join(' ') });
  }

  try {
    const product = runInTransaction(() => {
      const data = validation.data;
      db.prepare(`
        UPDATE produtos SET
          codigo = ?, nome = ?, marca = ?, categoria = ?,
          preco = ?, preco_promocional = ?, quantidade_estoque = ?,
          descricao = ?, imagem_url = ?, ativo = ?, atualizado_em = datetime('now')
        WHERE id = ?
      `).run(
        data.codigo,
        data.nome,
        data.marca,
        data.categoria,
        data.preco,
        data.preco_promocional,
        data.quantidade_estoque,
        data.descricao,
        data.imagem_url,
        data.ativo,
        existing.id,
      );

      const updated = db.prepare('SELECT * FROM produtos WHERE id = ?').get(existing.id);
      recordAudit({
        adminId: req.admin.id,
        action: 'produto_atualizado',
        entity: 'produtos',
        entityId: updated.id,
        details: { codigo: updated.codigo, nome: updated.nome },
      });
      return updated;
    });

    return res.json(product);
  } catch (error) {
    return handleDatabaseError(error, res, 'atualizar');
  }
});

router.patch('/admin/:id(\\d+)/status', (req, res) => {
  const active = req.body?.ativo === true || req.body?.ativo === 1 ? 1 : 0;
  const existing = db.prepare('SELECT id, nome FROM produtos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Produto não encontrado.' });

  runInTransaction(() => {
    db.prepare(`
      UPDATE produtos
      SET ativo = ?, atualizado_em = datetime('now')
      WHERE id = ?
    `).run(active, existing.id);

    recordAudit({
      adminId: req.admin.id,
      action: active ? 'produto_ativado' : 'produto_desativado',
      entity: 'produtos',
      entityId: existing.id,
      details: { nome: existing.nome },
    });
  });

  return res.json(db.prepare('SELECT * FROM produtos WHERE id = ?').get(existing.id));
});

router.delete('/admin/:id(\\d+)', (req, res) => {
  const existing = db.prepare('SELECT id, nome FROM produtos WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ erro: 'Produto não encontrado.' });

  runInTransaction(() => {
    db.prepare(`
      UPDATE produtos
      SET ativo = 0, atualizado_em = datetime('now')
      WHERE id = ?
    `).run(existing.id);

    recordAudit({
      adminId: req.admin.id,
      action: 'produto_desativado',
      entity: 'produtos',
      entityId: existing.id,
      details: { nome: existing.nome },
    });
  });

  return res.json({ ok: true, mensagem: 'Produto desativado e preservado no histórico.' });
});

router.get('/', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const products = db.prepare(`
    SELECT
      id, codigo, nome, marca, categoria, preco, preco_promocional,
      imagem_url, descricao,
      CASE WHEN quantidade_estoque > 0 THEN 1 ELSE 0 END AS disponivel
    FROM produtos
    WHERE ativo = 1
    ORDER BY atualizado_em DESC, nome ASC
  `).all();
  res.json(products);
});

router.get('/:id(\\d+)', (req, res) => {
  res.set('Cache-Control', 'no-store');
  const product = db.prepare(`
    SELECT
      id, codigo, nome, marca, categoria, preco, preco_promocional,
      imagem_url, descricao,
      CASE WHEN quantidade_estoque > 0 THEN 1 ELSE 0 END AS disponivel
    FROM produtos
    WHERE id = ? AND ativo = 1
  `).get(req.params.id);

  if (!product) return res.status(404).json({ erro: 'Produto não encontrado.' });
  return res.json(product);
});

function handleDatabaseError(error, res, action) {
  if (String(error.message).includes('UNIQUE')) {
    return res.status(409).json({ erro: 'Já existe um produto com esse código.' });
  }

  console.error(`Erro ao ${action} produto:`, error);
  return res.status(500).json({ erro: `Não foi possível ${action} o produto.` });
}

module.exports = router;
