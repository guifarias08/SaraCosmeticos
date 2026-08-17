require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./db');

function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const senha = process.env.ADMIN_SENHA;

  if (!email || !senha) {
    console.error('Defina ADMIN_EMAIL e ADMIN_SENHA no arquivo .env antes de rodar o seed.');
    process.exit(1);
  }

  const existente = db.prepare('SELECT id FROM admin_usuarios WHERE email = ?').get(email);
  if (existente) {
    console.log(`Usuário admin "${email}" já existe. Nada foi alterado.`);
    return;
  }

  const senhaHash = bcrypt.hashSync(senha, 10);
  db.prepare(
    'INSERT INTO admin_usuarios (nome, email, senha_hash) VALUES (?, ?, ?)'
  ).run('Sara', email, senhaHash);

  console.log(`Usuário admin criado com sucesso: ${email}`);
}

function seedProdutos() {
  const total = db.prepare('SELECT COUNT(*) AS total FROM produtos').get().total;
  if (total > 0) {
    console.log('Já existem produtos cadastrados. Seed de produtos pulado.');
    return;
  }

  const produtos = [
    { codigo: 'MAQ-001', nome: 'Base Líquida HD', marca: 'Maybelline', categoria: 'maquiagem', preco: 38.9, preco_promocional: null, quantidade_estoque: 20 },
    { codigo: 'SKI-001', nome: 'Sérum Vitamina C', marca: "L'Oréal", categoria: 'skincare', preco: 89.9, preco_promocional: null, quantidade_estoque: 15 },
    { codigo: 'CAB-001', nome: 'Máscara Capilar', marca: 'Kerastase', categoria: 'cabelos', preco: 95.0, preco_promocional: 72.0, quantidade_estoque: 10 },
  ];

  const insert = db.prepare(`
    INSERT INTO produtos (codigo, nome, marca, categoria, preco, preco_promocional, quantidade_estoque)
    VALUES (@codigo, @nome, @marca, @categoria, @preco, @preco_promocional, @quantidade_estoque)
  `);

  const insertMany = db.transaction((lista) => {
    for (const produto of lista) insert.run(produto);
  });

  insertMany(produtos);
  console.log(`${produtos.length} produtos de exemplo criados.`);
}

seedAdmin();
seedProdutos();
