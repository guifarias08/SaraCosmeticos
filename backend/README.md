# Backend da Sara Cosméticos

API, banco SQLite e painel administrativo da loja. O pagamento continua sendo combinado pelo WhatsApp; este backend cuida apenas de acesso administrativo, catálogo, preços, estoque e imagens.

## O que está pronto

- SQLite usando o módulo nativo `node:sqlite` do Node.js.
- Conta administrativa única, sem cadastro público de usuários.
- Senha armazenada somente como hash BCrypt.
- Sessão em cookie `HttpOnly`, `SameSite=Strict` e `Secure` em produção.
- Limite de cinco tentativas de login a cada 15 minutos.
- Validação de todos os campos no servidor.
- Upload de JPG, PNG e WebP com limite de 5 MB e validação do conteúdo do arquivo.
- Produtos podem ser publicados ou ocultados sem apagar o histórico.
- Registro de auditoria para login, cadastro, edição, status e upload.
- CORS restrito e cabeçalhos de segurança.
- Teste automatizado do fluxo completo.

## Executar localmente

```powershell
cd "C:\Users\gpfa1\OneDrive\Documents\Sara cosmeticos\backend"
npm ci
Copy-Item .env.example .env
# Edite JWT_SECRET, ADMIN_EMAIL e ADMIN_SENHA no arquivo .env.
npm run admin:seed
npm start
```

O arquivo `.env` e o banco `loja.sqlite` são locais e não vão para o Git. Na primeira execução em outra máquina, crie o `.env`, configure as credenciais e rode `npm run admin:seed` antes de iniciar o servidor.

Acessos:

- Painel: `http://localhost:3000/admin/login.html`
- API pública: `http://localhost:3000/api/produtos`
- Verificação: `http://localhost:3000/api/health`

O email e a senha locais são definidos por `ADMIN_EMAIL` e `ADMIN_SENHA` no arquivo `.env`, que é ignorado pelo Git.

## Trocar email ou senha da Sara

1. Abra `.env`.
2. Altere `ADMIN_EMAIL` e `ADMIN_SENHA`.
3. A senha deve ter pelo menos 12 caracteres.
4. Execute:

```powershell
npm run admin:seed
```

O comando atualiza a única conta existente. Não existe rota para criar outros administradores.

## Ver o banco de dados

Para conferir tabelas, colunas, administrador e produtos pelo terminal:

```powershell
npm run db:inspect
```

Arquivo do banco:

```text
backend/loja.sqlite
```

Também é possível abrir esse arquivo no aplicativo DB Browser for SQLite. Prefira abrir em modo somente leitura enquanto o servidor estiver rodando.

Tabelas:

- `produtos`: catálogo, preços, estoque, imagem e status.
- `admin_usuarios`: conta e hash da senha da Sara.
- `admin_auditoria`: histórico das alterações administrativas.

## Backup

Antes de importar o catálogo ou fazer uma alteração grande:

```powershell
npm run db:backup
```

O comando cria uma pasta em `backend/backups/` contendo uma cópia consistente de `loja.sqlite` e das imagens de `backend/uploads/`.

## Painel administrativo

No painel, a Sara pode:

- cadastrar nome, código, marca, categoria e descrição;
- informar preço normal e promocional;
- controlar a quantidade em estoque;
- enviar uma foto do computador ou usar uma URL HTTPS;
- publicar ou ocultar um produto;
- buscar e filtrar o catálogo;
- editar produtos sem perder o histórico.

Uma alteração salva no painel entra imediatamente no SQLite e na API pública. O frontend vê a nova versão ao recarregar a página; WebSocket não é necessário para esse volume de loja.

## Rotas principais

Públicas:

- `GET /api/produtos`
- `GET /api/produtos/:id`
- `GET /api/health`

Administrativas:

- `POST /api/admin/login`
- `GET /api/admin/session`
- `POST /api/admin/logout`
- `GET /api/produtos/admin/todos`
- `POST /api/produtos/admin`
- `PUT /api/produtos/admin/:id`
- `PATCH /api/produtos/admin/:id/status`
- `POST /api/produtos/admin/upload`

## Variáveis de ambiente

Use `.env.example` como referência. As principais são:

- `JWT_SECRET`: segredo aleatório com no mínimo 32 caracteres.
- `ADMIN_EMAIL` e `ADMIN_SENHA`: usados somente pelo script de criação/rotação da conta.
- `APP_ORIGIN`: endereço público do backend.
- `FRONTEND_ORIGINS`: endereços autorizados a consultar a API no navegador.
- `DB_PATH`: caminho opcional para armazenar o SQLite em disco persistente.
- `UPLOADS_PATH`: caminho opcional para imagens em disco persistente.

## Comandos úteis

```powershell
npm run check       # valida a sintaxe dos arquivos principais
npm test            # testa login, cookie, CRUD, upload, API pública e auditoria
npm run db:inspect  # mostra as tabelas e os dados principais
npm run db:backup   # copia banco e imagens
npm run dev         # servidor com reinício automático
```

## Publicação

SQLite é adequado para esta loja enquanto houver apenas um painel administrativo e um volume pequeno de acessos. Na hospedagem, `DB_PATH` e `UPLOADS_PATH` precisam apontar para um disco persistente. Serviços que apagam o disco a cada deploy exigem armazenamento persistente ou migração futura para PostgreSQL e armazenamento de imagens externo.
