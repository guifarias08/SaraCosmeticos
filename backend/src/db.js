const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'loja.sqlite');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

// Tabela de produtos que a dona da loja vai gerenciar pelo painel admin
db.exec(`
  CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    codigo TEXT UNIQUE NOT NULL,
    nome TEXT NOT NULL,
    marca TEXT,
    categoria TEXT NOT NULL,
    preco REAL NOT NULL,
    preco_promocional REAL,
    quantidade_estoque INTEGER NOT NULL DEFAULT 0,
    descricao TEXT,
    imagem_url TEXT,
    ativo INTEGER NOT NULL DEFAULT 1,
    criado_em TEXT NOT NULL DEFAULT (datetime('now')),
    atualizado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Tabela de usuários admin (só quem estiver aqui consegue entrar no painel)
db.exec(`
  CREATE TABLE IF NOT EXISTS admin_usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    criado_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;
