require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const multer = require('multer');
const { rateLimit } = require('express-rate-limit');
const { config, validateServerConfig } = require('./config');
const { db } = require('./db');
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/produtos');

validateServerConfig();

const app = express();

app.disable('x-powered-by');
if (config.isProduction) app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
    },
  },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(express.json({ limit: '100kb', strict: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

app.use('/admin', express.static(path.join(config.projectRoot, 'public', 'admin'), {
  etag: true,
  index: false,
  setHeaders: (res) => res.set('Cache-Control', 'no-store'),
}));

app.get('/admin', (req, res) => {
  res.redirect('/admin/login.html');
});

app.use('/uploads', express.static(config.uploadsPath, {
  immutable: true,
  maxAge: '30d',
}));

const publicCors = cors({
  allowedHeaders: ['Content-Type'],
  methods: ['GET', 'HEAD', 'OPTIONS'],
  origin: (origin, callback) => {
    if (!origin || isAllowedFrontendOrigin(origin)) return callback(null, true);
    return callback(new Error('Origem não autorizada pelo CORS.'));
  },
});

app.use('/api/admin', authRoutes);
app.use('/api/produtos', (req, res, next) => {
  if (req.path.startsWith('/admin')) return next();
  return publicCors(req, res, next);
}, productsRoutes);

app.get('/api/health', (req, res) => {
  db.prepare('SELECT 1').get();
  res.json({ banco: 'ok', status: 'ok' });
});

app.use('/api', (req, res) => {
  res.status(404).json({ erro: 'Rota não encontrada.' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ erro: 'A imagem deve ter no máximo 5 MB.' });
    }
    return res.status(400).json({ erro: 'Envie uma imagem JPG, PNG ou WebP.' });
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ erro: 'JSON inválido.' });
  }

  if (String(error.message).includes('CORS')) {
    return res.status(403).json({ erro: 'Origem não autorizada.' });
  }

  console.error(error);
  return res.status(500).json({ erro: 'Erro interno do servidor.' });
});

function isAllowedFrontendOrigin(origin) {
  if (config.frontendOrigins.includes(origin)) return true;
  if (config.isProduction) return false;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
}

function startServer() {
  return app.listen(config.port, () => {
    console.log(`Servidor:     http://localhost:${config.port}`);
    console.log(`Painel admin: http://localhost:${config.port}/admin/login.html`);
    console.log(`Banco SQLite: ${config.databasePath}`);
  });
}

if (require.main === module) startServer();

module.exports = { app, startServer };
