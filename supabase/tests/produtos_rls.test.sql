begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select has_table('public', 'produtos', 'a tabela de produtos existe');
select is(
  (select relrowsecurity from pg_class where oid = 'public.produtos'::regclass),
  true,
  'RLS esta habilitada em produtos'
);

insert into public.produtos
  (id, codigo, nome, marca, categoria, preco, quantidade_estoque, ativo)
values
  (9000000001, 'TESTE-ATIVO', 'Produto ativo', 'Teste', 'outros', 10, 1, true),
  (9000000002, 'TESTE-OCULTO', 'Produto oculto', 'Teste', 'outros', 20, 1, false);

set local role anon;
select results_eq(
  $$select count(*) from public.produtos where id between 9000000001 and 9000000002$$,
  array[1::bigint],
  'visitante enxerga somente o produto ativo'
);
select throws_ok(
  $$insert into public.produtos (codigo, nome, marca, categoria, preco) values ('INVASAO-ANON', 'Invasao', 'Teste', 'outros', 1)$$,
  '42501',
  'visitante nao cadastra produtos'
);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated","app_metadata":{}}';
select results_eq(
  $$select count(*) from public.produtos where id between 9000000001 and 9000000002$$,
  array[1::bigint],
  'usuario comum enxerga somente o produto ativo'
);
select throws_ok(
  $$insert into public.produtos (codigo, nome, marca, categoria, preco) values ('INVASAO-AUTH', 'Invasao', 'Teste', 'outros', 1)$$,
  '42501',
  'usuario comum nao cadastra produtos'
);

set local "request.jwt.claims" = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated","app_metadata":{"role":"admin"}}';
select results_eq(
  $$select count(*) from public.produtos where id between 9000000001 and 9000000002$$,
  array[2::bigint],
  'administrador enxerga produtos ativos e ocultos'
);
select lives_ok(
  $$insert into public.produtos (id, codigo, nome, marca, categoria, preco) values (9000000003, 'TESTE-NOVO', 'Novo', 'Teste', 'outros', 30)$$,
  'administrador cadastra produto'
);
select lives_ok(
  $$update public.produtos set preco = 31 where id = 9000000003$$,
  'administrador atualiza produto'
);
select lives_ok(
  $$delete from public.produtos where id = 9000000003$$,
  'administrador remove produto'
);

select * from finish();
rollback;
