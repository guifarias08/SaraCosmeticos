const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const bcrypt = require('bcryptjs');

const testDirectory = path.join(__dirname, '.tmp');
const testDatabasePath = path.join(testDirectory, 'api-smoke.sqlite');

fs.rmSync(testDirectory, { force: true, recursive: true });
fs.mkdirSync(testDirectory, { recursive: true });

process.env.DB_PATH = testDatabasePath;
process.env.UPLOADS_PATH = path.join(testDirectory, 'uploads');
process.env.JWT_SECRET = 'segredo-exclusivo-de-teste-com-mais-de-32-caracteres';
process.env.APP_ORIGIN = 'http://127.0.0.1';
process.env.NODE_ENV = 'test';

const { app } = require('../src/server');
const { db } = require('../src/db');

test('fluxo protegido de produtos funciona de ponta a ponta', async (context) => {
  const password = 'SenhaSeguraDeTeste#2026';
  const passwordHash = bcrypt.hashSync(password, 4);

  db.prepare(`
    INSERT INTO admin_usuarios (nome, email, senha_hash)
    VALUES (?, ?, ?)
  `).run('Sara', 'sara@teste.local', passwordHash);

  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));

  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    db.close();
    fs.rmSync(testDirectory, { force: true, recursive: true });
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const unauthorized = await fetch(`${baseUrl}/api/produtos/admin/todos`);
  assert.equal(unauthorized.status, 401);

  const login = await fetch(`${baseUrl}/api/admin/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl,
    },
    body: JSON.stringify({ email: 'sara@teste.local', senha: password }),
  });
  assert.equal(login.status, 200);

  const cookie = login.headers.get('set-cookie').split(';')[0];
  assert.match(login.headers.get('set-cookie'), /HttpOnly/i);
  assert.match(login.headers.get('set-cookie'), /SameSite=Strict/i);

  const imageForm = new FormData();
  const imageBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  );
  imageForm.append('imagem', new Blob([imageBytes], { type: 'image/png' }), 'produto.png');

  const upload = await fetch(`${baseUrl}/api/produtos/admin/upload`, {
    method: 'POST',
    headers: {
      Cookie: cookie,
      Origin: baseUrl,
    },
    body: imageForm,
  });
  const uploadedImage = await upload.json();
  assert.equal(upload.status, 201);
  assert.match(uploadedImage.url, /^\/uploads\/[a-f0-9-]+\.png$/);

  const created = await requestJson(`${baseUrl}/api/produtos/admin`, {
    method: 'POST',
    cookie,
    origin: baseUrl,
    body: {
      ativo: true,
      categoria: 'perfumaria',
      codigo: 'PERF-001',
      descricao: 'Produto usado apenas no teste automatizado.',
      marca: 'Eudora',
      nome: 'Perfume de Teste',
      preco: 129.9,
      preco_promocional: 109.9,
      quantidade_estoque: 5,
      imagem_url: uploadedImage.url,
    },
  });
  assert.equal(created.response.status, 201);
  assert.equal(created.data.codigo, 'PERF-001');

  const publicList = await requestJson(`${baseUrl}/api/produtos`);
  assert.equal(publicList.response.status, 200);
  assert.equal(publicList.data.length, 1);
  assert.equal(publicList.data[0].disponivel, 1);
  assert.equal('quantidade_estoque' in publicList.data[0], false);

  const invalid = await requestJson(`${baseUrl}/api/produtos/admin`, {
    method: 'POST',
    cookie,
    origin: baseUrl,
    body: {
      categoria: 'perfumaria',
      codigo: 'INVALIDO',
      nome: 'Preço inválido',
      preco: -1,
      quantidade_estoque: 0,
    },
  });
  assert.equal(invalid.response.status, 400);

  const hidden = await requestJson(`${baseUrl}/api/produtos/admin/${created.data.id}/status`, {
    method: 'PATCH',
    cookie,
    origin: baseUrl,
    body: { ativo: false },
  });
  assert.equal(hidden.response.status, 200);
  assert.equal(hidden.data.ativo, 0);

  const publicListAfterHide = await requestJson(`${baseUrl}/api/produtos`);
  assert.equal(publicListAfterHide.data.length, 0);

  const auditCount = db.prepare('SELECT COUNT(*) AS total FROM admin_auditoria').get().total;
  assert.ok(auditCount >= 3);
});

async function requestJson(url, options = {}) {
  const headers = new Headers();
  if (options.body) headers.set('Content-Type', 'application/json');
  if (options.cookie) headers.set('Cookie', options.cookie);
  if (options.origin) headers.set('Origin', options.origin);

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  return { data, response };
}
