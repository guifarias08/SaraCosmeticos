const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { config } = require('./config');

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

const db = new DatabaseSync(config.databasePath);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    marca TEXT,
    categoria TEXT NOT NULL,
    preco REAL NOT NULL CHECK (preco >= 0),
    preco_promocional REAL CHECK (preco_promocional IS NULL OR preco_promocional >= 0),
    quantidade_estoque INTEGER NOT NULL DEFAULT 0 CHECK (quantidade_estoque >= 0),
    descricao TEXT,
    imagem_url TEXT,
    ativo INTEGER NOT NULL DEFAULT 1 CHECK (ativo IN (0, 1)),
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now')),
    ultimo_login_em TEXT
  );

  CREATE TABLE IF NOT EXISTS admin_auditoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    acao TEXT NOT NULL,
    entidade TEXT NOT NULL,
    entidade_id INTEGER,
    detalhes TEXT,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (admin_id) REFERENCES admin_usuarios(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_produtos_ativos_categoria
    ON produtos (ativo, categoria);
  CREATE INDEX IF NOT EXISTS idx_produtos_nome
    ON produtos (nome);
  CREATE INDEX IF NOT EXISTS idx_auditoria_criado_em
    ON admin_auditoria (criado_em DESC);
`);

addColumnIfMissing('admin_usuarios', 'atualizado_em', "TEXT NOT NULL DEFAULT ''");
addColumnIfMissing('admin_usuarios', 'ultimo_login_em', 'TEXT');

function addColumnIfMissing(tableName, columnName, definition) {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  if (columns.some((column) => column.name === columnName)) return;

  db.exec(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
}

function runInTransaction(callback) {
  db.exec('BEGIN IMMEDIATE');

  try {
    const result = callback();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

function recordAudit({ adminId = null, action, entity, entityId = null, details = null }) {
  db.prepare(`
    INSERT INTO admin_auditoria (admin_id, acao, entidade, entidade_id, detalhes)
    VALUES (?, ?, ?, ?, ?)
  `).run(adminId, action, entity, entityId, details ? JSON.stringify(details) : null);
}

module.exports = {
  db,
  dbPath: config.databasePath,
  recordAudit,
  runInTransaction,
};
