/**
 * server.js
 * Ponto de entrada do backend — Sara Cosméticos
 *
 * Inicia o servidor Express, configura middlewares de segurança,
 * CORS, rate limit e registra as rotas da API.
 *
 * Rotas disponíveis:
 *   GET  /api/products                → lista produtos (aceita ?category=)
 *   GET  /api/products/categories     → lista categorias com contagem
 *   GET  /api/products/:id            → produto por ID
 *   POST /api/orders/checkout         → gera link WhatsApp do pedido
 *   GET  /api/orders/payment-methods  → formas de pagamento aceitas
 *   GET  /health                      → status do servidor
 */
require('dotenv').config();
const PORT = process.env.PORT || 3000;
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------------------------------------------------------------------------
// Segurança e middlewares globais
// ---------------------------------------------------------------------------

// Adiciona headers de segurança HTTP (X-Content-Type-Options, etc.)
app.use(helmet({ contentSecurityPolicy: false }));

// Permite requisições do front-end local (ajuste a origem em produção)
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000', 'null'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// Parseia JSON no corpo das requisições
app.use(express.json());

// Rate limit: máximo 60 requisições por IP por minuto (proteção contra abuso)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Muitas requisições. Tente novamente em breve.' },
});
app.use('/api/', limiter);

// Serve os arquivos estáticos do front-end (pasta ../frontend)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------------------------------------------------------------------------
// Rotas da API
// ---------------------------------------------------------------------------

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

/**
 * GET /health
 * Verifica se o servidor está no ar. Útil para monitoramento (UptimeRobot, etc.).
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rota catch-all: devolve o index.html para navegação no front-end
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ---------------------------------------------------------------------------
// Tratamento de erros global
// ---------------------------------------------------------------------------

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Erro interno]', err.message);
  res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
});

// ---------------------------------------------------------------------------
// Inicialização
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`\n✅  Sara Cosméticos — API rodando em http://localhost:${PORT}`);
  console.log(`📦  Produtos:  http://localhost:${PORT}/api/products`);
  console.log(`🛒  Checkout:  POST http://localhost:${PORT}/api/orders/checkout`);
  console.log(`💳  Pagamentos:http://localhost:${PORT}/api/orders/payment-methods\n`);
});
