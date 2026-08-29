const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';
const projectRoot = path.join(__dirname, '..');

const config = {
  appOrigin: process.env.APP_ORIGIN || 'http://localhost:3000',
  cookieName: 'sara_admin_session',
  databasePath: process.env.DB_PATH
    ? path.resolve(process.env.DB_PATH)
    : path.join(projectRoot, 'loja.sqlite'),
  frontendOrigins: (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  isProduction,
  jwtSecret: process.env.JWT_SECRET || '',
  port: Number(process.env.PORT) || 3000,
  projectRoot,
  sessionDurationMs: 4 * 60 * 60 * 1000,
  uploadsPath: process.env.UPLOADS_PATH
    ? path.resolve(process.env.UPLOADS_PATH)
    : path.join(projectRoot, 'uploads'),
};

function validateServerConfig() {
  if (config.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET deve ter pelo menos 32 caracteres. Configure o arquivo .env.');
  }

  if (config.isProduction && !process.env.APP_ORIGIN) {
    throw new Error('APP_ORIGIN é obrigatório em produção.');
  }
}

module.exports = { config, validateServerConfig };
