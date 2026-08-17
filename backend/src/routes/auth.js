const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();

// POST /api/admin/login
// Recebe email + senha, confere no banco e devolve um token JWT
// que precisa ser enviado nas próximas requisições do painel admin.
router.post('/login', (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe email e senha.' });
  }

  const usuario = db.prepare('SELECT * FROM admin_usuarios WHERE email = ?').get(email);

  // Mensagem genérica de propósito: não revela se o erro foi o email ou a senha
  if (!usuario || !bcrypt.compareSync(senha, usuario.senha_hash)) {
    return res.status(401).json({ erro: 'Email ou senha incorretos.' });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, nome: usuario.nome, email: usuario.email });
});

module.exports = router;
