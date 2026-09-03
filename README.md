# Backend da Sara Cosméticos

Backend serverless da loja baseado em Supabase: PostgreSQL, Auth, Row Level Security e Storage. Esta arquitetura substitui o servidor Express/SQLite anterior, cujo disco local não seria persistente na Vercel.

## Conteúdo

- `supabase/migrations/202609030001_initial_catalog.sql`: tabela, validações, índices, gatilho de atualização, RLS e políticas do Storage.
- `supabase/seed.sql`: 12 itens levantados do catálogo público da Sara Cosméticos.
- `supabase/promote-admin.sql`: modelo para conceder a função administrativa a uma usuária criada no Auth.
- `supabase/tests/produtos_rls.test.sql`: testes pgTAP das permissões públicas, autenticadas e administrativas.

## Aplicação

1. Crie ou escolha o projeto no Supabase.
2. Execute a migration pelo Supabase CLI ou no SQL Editor.
3. Execute `supabase/seed.sql` e confira preços e estoque.
4. Crie a administradora em **Authentication > Users**, com e-mail confirmado e senha forte.
5. Substitua o UUID de exemplo em `supabase/promote-admin.sql` pelo UUID exato da usuária e execute o arquivo.
6. Saia e entre novamente no painel da loja para renovar o JWT.

## Segurança

- Visitantes leem somente produtos publicados.
- Usuários autenticados comuns também não alteram o catálogo.
- Somente JWTs com `app_metadata.role = admin` podem inserir, editar ou excluir produtos.
- A chave privilegiada `service_role`, a senha do banco e chaves secretas nunca pertencem ao frontend ou ao Git.
- Uploads são limitados a JPG, PNG e WebP de até 5 MB e ficam em uma pasta vinculada ao UUID da administradora.
- Preços, estoque, categorias e caminhos de imagem possuem validações no banco.

## Verificação

Depois de vincular o Supabase CLI ao projeto:

```bash
supabase db push
supabase test db
supabase db advisors
```

Revise os avisos de segurança e desempenho antes da publicação final.
