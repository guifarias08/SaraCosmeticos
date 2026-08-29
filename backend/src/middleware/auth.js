const jwt = require('jsonwebtoken');
const { config } = require('../config');

function requireAdmin(req, res, next) {
  const token = getSessionToken(req);

  if (!token) {
    return res.status(401).json({ erro: 'Login necessário.' });
  }

  try {
    req.admin = jwt.verify(token, config.jwtSecret, {
      algorithms: ['HS256'],
      audience: 'sara-admin',
      issuer: 'sara-cosmeticos',
    });
    return next();
  } catch {
    clearSessionCookie(res);
    return res.status(401).json({ erro: 'Sessão inválida ou expirada.' });
  }
}

function requireSameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

  const requestOrigin = req.get('origin');
  if (!requestOrigin) return next();

  const currentOrigin = `${req.protocol}://${req.get('host')}`;
  const trustedOrigins = new Set([config.appOrigin, currentOrigin]);

  if (!trustedOrigins.has(requestOrigin)) {
    return res.status(403).json({ erro: 'Origem da requisição não autorizada.' });
  }

  return next();
}

function getSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  return cookies[config.cookieName] || null;
}

function setSessionCookie(res, token) {
  res.cookie(config.cookieName, token, {
    httpOnly: true,
    maxAge: config.sessionDurationMs,
    path: '/',
    sameSite: 'strict',
    secure: config.isProduction,
  });
}

function clearSessionCookie(res) {
  res.clearCookie(config.cookieName, {
    httpOnly: true,
    path: '/',
    sameSite: 'strict',
    secure: config.isProduction,
  });
}

function parseCookies(cookieHeader) {
  return cookieHeader.split(';').reduce((cookies, item) => {
    const separatorIndex = item.indexOf('=');
    if (separatorIndex < 0) return cookies;

    const key = item.slice(0, separatorIndex).trim();
    const value = item.slice(separatorIndex + 1).trim();

    if (key) cookies[key] = decodeURIComponent(value);
    return cookies;
  }, {});
}

module.exports = {
  clearSessionCookie,
  requireAdmin,
  requireSameOrigin,
  setSessionCookie,
};
