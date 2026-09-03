# Sara Cosméticos

Loja virtual responsiva com catálogo, busca, filtros, carrinho e fechamento do pedido pelo WhatsApp. O backend usa Supabase (Postgres, Auth, Row Level Security e Storage) e o site é preparado para deploy estático na Vercel.

## Arquitetura

- `index.html`, `css/` e `js/`: vitrine pública.
- `js/catalog-data.js`: catálogo de segurança exibido enquanto o Supabase não estiver configurado ou estiver indisponível.
- `admin/`: painel autenticado para cadastrar produtos, preços, estoque e imagens.
- Branch `backend`: esquema do banco, índices, RLS, seed e políticas do Storage.
- Supabase Auth: login administrativo.
- Supabase Storage: imagens públicas de produtos; upload, alteração e exclusão restritos a administradores.
- Vercel: build e CDN, com CSP e cabeçalhos de segurança em `vercel.json`.

SQLite não é usado em produção: as Vercel Functions têm filesystem somente leitura, com `/tmp` temporário, portanto um arquivo SQLite não seria uma fonte persistente confiável.

## Executar localmente

Requisitos: Node.js 22.12 ou superior e um projeto no Supabase.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Preencha no `.env.local`:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_COLE_AQUI
```

A chave `publishable` pode ficar no navegador. Nunca use `service_role`, `secret key` ou senha do banco em variáveis `VITE_*`.

## Preparar o Supabase

1. Crie um projeto Supabase na região mais próxima disponível.
2. Na branch `backend`, abra **SQL Editor** e execute `supabase/migrations/202609030001_initial_catalog.sql`.
3. Ainda na branch `backend`, execute `supabase/seed.sql` para cadastrar os 12 itens levantados do catálogo público do WhatsApp. Confirme o estoque inicial no painel.
4. Em **Authentication > Users**, crie a conta da administradora com senha forte e e-mail confirmado.
5. Copie o UUID exato dessa usuária.
6. Abra `supabase/promote-admin.sql` na branch `backend`, substitua o UUID de exemplo e execute no SQL Editor.
7. Saia e entre novamente no painel para renovar o token com `app_metadata.role = admin`.

O painel fica em `/admin/`. O cadastro público deve permanecer desativado: contas são criadas somente pelo responsável no Dashboard.

### Segurança implementada

- RLS obrigatória na tabela `produtos`.
- Visitantes leem somente produtos publicados.
- Somente JWTs com a função administrativa em `app_metadata` alteram o catálogo.
- Privilégios de tabela revogados e concedidos por operação, além das políticas RLS.
- Imagens limitadas a JPG, PNG e WebP, com até 5 MB.
- Uploads ficam em pasta vinculada ao UUID da administradora.
- Nenhuma chave privilegiada é enviada ao frontend.
- CSP bloqueia scripts, frames e conexões fora das origens necessárias.
- Painel sem cache e fora da indexação de buscadores.

## Verificar antes do deploy

```bash
npm run check
npm run build
npm audit --omit=dev
```

No Supabase CLI, quando conectado ao projeto, execute também:

```bash
supabase db advisors
supabase test db
```

## Publicar na Vercel

1. Importe este repositório na Vercel.
2. Cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` em **Settings > Environment Variables** para Production e Preview.
3. Use `npm run build` e diretório de saída `dist` (o `vercel.json` já configura ambos).
4. Faça o deploy e teste a vitrine e `/admin/`.
5. No Supabase, em **Authentication > URL Configuration**, informe o domínio final da Vercel como Site URL.

## Fluxo do pedido

O carrinho fica no `localStorage` do cliente. Ao finalizar, a loja monta uma mensagem com itens, subtotal conhecido e eventuais valores a confirmar, então abre uma conversa com `+55 85 8854-0534`. Pagamento, disponibilidade e entrega são confirmados diretamente com a Sara; o site não coleta dados pessoais nem processa pagamentos.
