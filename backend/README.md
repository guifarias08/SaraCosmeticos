# Backend — Sara Cosméticos

API + painel administrativo em **Node.js + Express + SQLite**.

## Estrutura

```text
backend/
├── src/
│   ├── server.js         # ponto de entrada
│   ├── db.js              # conexão e criação das tabelas
│   ├── seed.js             # cria o admin e produtos de exemplo (rodar 1x)
│   ├── middleware/auth.js  # protege as rotas de admin
│   └── routes/
│       ├── auth.js         # POST /api/admin/login
│       └── produtos.js     # rotas públicas + rotas de admin
└── public/admin/           # painel visual (login + dashboard)
```

## Como rodar

```bash
cd backend
npm install
cp .env.example .env
```

Abra o `.env` e troque:
- `JWT_SECRET` por um texto longo e aleatório
- `ADMIN_EMAIL` e `ADMIN_SENHA` pelo login que a dona da loja vai usar

Depois:

```bash
npm run seed   # cria o usuário admin (só precisa rodar uma vez)
npm start      # sobe o servidor em http://localhost:3000
```

- Loja consome a API em: `http://localhost:3000/api/produtos`
- Painel admin fica em: `http://localhost:3000/admin/login.html`

## Tabela `produtos`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | INTEGER | gerado automaticamente |
| codigo | TEXT (único) | código interno do produto |
| nome | TEXT | nome do produto |
| marca | TEXT | marca/fabricante |
| categoria | TEXT | maquiagem, skincare, cabelos, perfumaria... |
| preco | REAL | preço normal |
| preco_promocional | REAL | preço com desconto (opcional) |
| quantidade_estoque | INTEGER | quantidade disponível |
| descricao | TEXT | descrição opcional |
| imagem_url | TEXT | link da foto do produto |
| ativo | INTEGER (0/1) | se aparece na loja |
| criado_em / atualizado_em | TEXT | datas automáticas |

## Tabela `admin_usuarios`

| Coluna | Tipo | Descrição |
|---|---|---|
| id | INTEGER | gerado automaticamente |
| nome | TEXT | nome de quem loga |
| email | TEXT (único) | login |
| senha_hash | TEXT | senha criptografada (nunca fica em texto puro) |

## Rotas da API

**Públicas** (loja/clientes usam, sem login):
- `GET /api/produtos` — lista produtos ativos (sem quantidade em estoque)
- `GET /api/produtos/:id` — detalhe de um produto

**Protegidas** (exigem `Authorization: Bearer <token>` do login):
- `POST /api/admin/login` — login, devolve o token
- `GET /api/produtos/admin/todos` — lista tudo, incluindo estoque e inativos
- `POST /api/produtos/admin` — cria produto
- `PUT /api/produtos/admin/:id` — edita produto
- `DELETE /api/produtos/admin/:id` — apaga produto

## Como funciona a segurança

1. O painel (`/admin/login.html`) não tem nenhum link a partir do site da loja.
2. Mesmo que alguém digite a URL direto, a página de dashboard não mostra nada sem um token salvo (`exigirLoginOuRedirecionar()` no admin.js).
3. **A proteção de verdade está na API**: toda rota `/api/produtos/admin/*` passa pelo middleware `exigirAdmin`, que confere um token JWT válido gerado no login. Sem login, o servidor recusa (401) — não importa a URL usada.

## Conectar ao frontend existente

No `js/app.js` da loja, troque o array fixo `products` por uma chamada à API:

```js
async function carregarProdutos() {
  const resposta = await fetch('http://localhost:3000/api/produtos');
  const produtos = await resposta.json();
  // usar "produtos" no lugar do array fixo
}
```

Quando publicar online, troque `http://localhost:3000` pela URL do backend hospedado.

## Publicando de graça (Render ou Railway)

1. Suba a pasta `backend/` para um repositório no GitHub.
2. No Render/Railway, crie um "Web Service" apontando pro repositório, com:
   - Build command: `npm install`
   - Start command: `npm start`
   - Variáveis de ambiente: `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_SENHA`
3. **Atenção**: no plano gratuito, o disco é apagado a cada novo deploy — o SQLite (`loja.sqlite`) perderia os dados. Para produção de verdade, o próximo passo é trocar o SQLite por um banco PostgreSQL gratuito do próprio Render/Railway (a estrutura das tabelas é praticamente a mesma, muda só a biblioteca de conexão). Posso te ajudar a fazer essa troca quando for hospedar.
