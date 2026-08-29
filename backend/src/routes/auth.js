const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { rateLimit } = require('express-rate-limit');
const { config } = require('../config');
const { db, recordAudit } = require('../db');
const {
  clearSessionCookie,
  requireAdmin,
  requireSameOrigin,
  setSessionCookie,
} = require('../middleware/auth');

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { erro: 'Muitas tentativas. Aguarde 15 minutos antes de tentar novamente.' },
});

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

router.post('/login', loginLimiter, requireSameOrigin, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase().slice(0, 160);
  const password = String(req.body?.senha || '').slice(0, 200);

  if (!email || !password) {
    return res.status(400).json({ erro: 'Informe email e senha.' });
  }

  const admin = db.prepare(`
    SELECT id, nome, email, senha_hash
    FROM admin_usuarios
    WHERE email = ?
  `).get(email);

  if (!admin || !bcrypt.compareSync(password, admin.senha_hash)) {
    return res.status(401).json({ erro: 'Email ou senha incorretos.' });
  }

  const token = jwt.sign(
    { id: admin.id, email: admin.email, nome: admin.nome },
    config.jwtSecret,
    {
      algorithm: 'HS256',
      audience: 'sara-admin',
      expiresIn: Math.floor(config.sessionDurationMs / 1000),
      issuer: 'sara-cosmeticos',
    },
  );

  db.prepare(`
    UPDATE admin_usuarios
    SET ultimo_login_em = datetime('now')
    WHERE id = ?
  `).run(admin.id);

  recordAudit({
    adminId: admin.id,
    action: 'login',
    entity: 'admin_usuarios',
    entityId: admin.id,
  });

  setSessionCookie(res, token);
  return res.json({ nome: admin.nome, email: admin.email });
});

router.get('/session', requireAdmin, (req, res) => {
  res.json({
    autenticado: true,
    admin: {
      email: req.admin.email,
      nome: req.admin.nome,
    },
  });
});

router.post('/logout', requireSameOrigin, (req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
});

module.exports = router;
