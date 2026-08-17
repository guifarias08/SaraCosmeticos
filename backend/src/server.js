require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const produtosRoutes = require('./routes/produtos');

const app = express();

app.use(cors());
app.use(express.json());

// Painel admin (HTML/CSS/JS estáticos). Não tem nenhum link para cá
// a partir do site da loja - só quem souber o endereço /admin/login.html chega aqui.
// A proteção de verdade acontece nas rotas /api/admin/*, feita pelo middleware exigirAdmin.
app.use('/admin', express.static(path.join(__dirname, '..', 'public', 'admin')));

app.use('/api/admin', authRoutes);       // POST /api/admin/login
app.use('/api/produtos', produtosRoutes); // rotas públicas + /api/produtos/admin/*

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Painel admin em      http://localhost:${PORT}/admin/login.html`);
});
