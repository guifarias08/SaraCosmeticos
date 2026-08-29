require('dotenv').config();

const bcrypt = require('bcryptjs');
const { db, recordAudit, runInTransaction } = require('./db');

const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_SENHA || '');
const name = String(process.env.ADMIN_NOME || 'Sara').trim();

if (!isValidEmail(email)) {
  fail('Defina um ADMIN_EMAIL válido no arquivo .env.');
}

if (password.length < 12) {
  fail('ADMIN_SENHA deve ter pelo menos 12 caracteres.');
}

const existingAdmins = db.prepare('SELECT id, email FROM admin_usuarios ORDER BY id').all();

if (existingAdmins.length > 0 && !existingAdmins.some((admin) => admin.email === email)) {
  fail('Já existe outro administrador. Este projeto aceita apenas a conta da Sara.');
}

const passwordHash = bcrypt.hashSync(password, 12);

runInTransaction(() => {
  const existingAdmin = db.prepare('SELECT id FROM admin_usuarios WHERE email = ?').get(email);

  if (existingAdmin) {
    db.prepare(`
      UPDATE admin_usuarios
      SET nome = ?, senha_hash = ?, atualizado_em = datetime('now')
      WHERE id = ?
    `).run(name, passwordHash, existingAdmin.id);

    recordAudit({
      adminId: existingAdmin.id,
      action: 'senha_atualizada',
      entity: 'admin_usuarios',
      entityId: existingAdmin.id,
    });

    console.log(`Acesso administrativo atualizado para ${email}.`);
    return;
  }

  const result = db.prepare(`
    INSERT INTO admin_usuarios (nome, email, senha_hash)
    VALUES (?, ?, ?)
  `).run(name, email, passwordHash);

  recordAudit({
    adminId: Number(result.lastInsertRowid),
    action: 'admin_criado',
    entity: 'admin_usuarios',
    entityId: Number(result.lastInsertRowid),
  });

  console.log(`Acesso administrativo criado para ${email}.`);
});

console.log('Nenhum produto de exemplo foi criado. O catálogo real pode ser cadastrado pelo painel.');

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
