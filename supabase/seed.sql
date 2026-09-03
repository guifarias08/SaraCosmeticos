-- Catálogo público do WhatsApp da Sara Cosméticos, consultado em 03/09/2026.
-- Estoque inicial = 1 para permitir pedidos; confirme e ajuste no painel administrativo.
insert into public.produtos
  (codigo, nome, marca, categoria, preco, preco_promocional, preco_a_partir_de,
   quantidade_estoque, descricao, destaque, ordem)
values
  ('CAT-001', 'Produtos disponíveis Eudora Siàge', 'Eudora Siàge', 'cabelos', null, null, false,
   1, 'Consulte as linhas e produtos disponíveis.', false, 10),
  ('CAT-002', 'Presentes femininos', 'Sara Cosméticos', 'kits', null, null, false,
   1, 'Opções de presentes femininos. Consulte os kits disponíveis.', false, 20),
  ('CAT-003', 'Luna', 'Natura', 'perfumaria', 190.00, 130.00, false,
   1, 'Fragrâncias Luna disponíveis em promoção.', true, 30),
  ('CAT-004', 'Kaiak Feminino', 'Natura', 'perfumaria', 190.00, 140.00, false,
   1, 'Kaiak Feminino em promoção.', true, 40),
  ('CAT-005', 'Perfumaria feminina O Boticário', 'O Boticário', 'perfumaria', 125.00, null, true,
   1, 'Fragrâncias femininas disponíveis a partir do valor anunciado.', false, 50),
  ('CAT-006', 'Colônias Aquavibe Avon de 1 litro', 'Avon', 'perfumaria', 80.00, 65.00, false,
   1, 'Colônias Aquavibe Avon de 1 litro em promoção.', true, 60),
  ('CAT-007', 'Águas de colônia disponíveis', 'Sara Cosméticos', 'perfumaria', 125.00, null, true,
   1, 'Consulte as fragrâncias disponíveis.', false, 70),
  ('CAT-008', 'Ilía', 'Natura', 'perfumaria', 186.00, 140.00, false,
   1, 'Fragrâncias Ilía disponíveis em promoção.', true, 80),
  ('CAT-009', 'Presentes masculinos', 'Sara Cosméticos', 'kits', 65.00, null, true,
   1, 'Opções de presentes masculinos a partir do valor anunciado.', false, 90),
  ('CAT-010', 'Egeo disponíveis', 'O Boticário', 'perfumaria', 90.00, null, true,
   1, 'Fragrâncias Egeo disponíveis a partir do valor anunciado.', false, 100),
  ('CAT-011', 'Natura Humor', 'Natura', 'perfumaria', 155.00, 100.00, false,
   1, 'Fragrâncias Natura Humor em promoção.', true, 110),
  ('CAT-012', 'Essencial', 'Natura', 'perfumaria', 280.00, 140.00, false,
   1, 'Fragrâncias Essencial em promoção.', true, 120)
on conflict (codigo) do update set
  nome = excluded.nome,
  marca = excluded.marca,
  categoria = excluded.categoria,
  preco = excluded.preco,
  preco_promocional = excluded.preco_promocional,
  preco_a_partir_de = excluded.preco_a_partir_de,
  quantidade_estoque = excluded.quantidade_estoque,
  descricao = excluded.descricao,
  destaque = excluded.destaque,
  ordem = excluded.ordem,
  ativo = true;
