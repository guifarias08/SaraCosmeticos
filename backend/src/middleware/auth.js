const jwt = require('jsonwebtoken');

// Essa função barra qualquer requisição que não tenha um token válido.
// É ela que garante que só quem fez login como admin consegue
// criar, editar ou apagar produtos - mesmo que alguém descubra a URL da API.
function exigirAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ erro: 'Login necessário.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload; // { id, email }
    next();
  } catch (erro) {
    return res.status(401).json({ erro: 'Sessão inválida ou expirada. Faça login novamente.' });
  }
}

module.exports = { exigirAdmin };
