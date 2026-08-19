const db = require('./db');

function printSection(title) {
  console.log(`\n=== ${title} ===`);
}

function listTables() {
  return db.prepare(`
    SELECT name
    FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();
}

function listColumns(tableName) {
  return db.prepare(`PRAGMA table_info(${tableName})`).all();
}

printSection('Tabelas');
const tables = listTables();
console.table(tables);

for (const table of tables) {
  printSection(`Colunas: ${table.name}`);
  console.table(listColumns(table.name).map((column) => ({
    nome: column.name,
    tipo: column.type,
    obrigatorio: column.notnull ? 'sim' : 'não',
    padrao: column.dflt_value || '',
    pk: column.pk ? 'sim' : 'não',
  })));
}

printSection('Resumo');
const totalProdutos = db.prepare('SELECT COUNT(*) AS total FROM produtos').get().total;
const totalAdmins = db.prepare('SELECT COUNT(*) AS total FROM admin_usuarios').get().total;
console.table([
  { item: 'produtos', total: totalProdutos },
  { item: 'admin_usuarios', total: totalAdmins },
]);

printSection('Produtos');
const produtos = db.prepare(`
  SELECT id, codigo, nome, marca, categoria, preco, preco_promocional, quantidade_estoque, ativo
  FROM produtos
  ORDER BY id
`).all();

if (produtos.length === 0) {
  console.log('Nenhum produto cadastrado.');
} else {
  console.table(produtos);
}
