// Catálogo público de segurança. O Supabase substitui estes dados quando configurado.
export const CATALOG_FALLBACK = [
  {
    id: 10001, codigo: 'CAT-001', nome: 'Produtos disponíveis Eudora Siàge', marca: 'Eudora Siàge',
    categoria: 'cabelos', preco: null, preco_promocional: null, preco_a_partir_de: false,
    quantidade_estoque: 99, descricao: 'Consulte as linhas e produtos disponíveis.', destaque: false, ordem: 10,
  },
  {
    id: 10002, codigo: 'CAT-002', nome: 'Presentes femininos', marca: 'Sara Cosméticos',
    categoria: 'kits', preco: null, preco_promocional: null, preco_a_partir_de: false,
    quantidade_estoque: 99, descricao: 'Opções de presentes femininos. Consulte os kits disponíveis.', destaque: false, ordem: 20,
  },
  {
    id: 10003, codigo: 'CAT-003', nome: 'Luna', marca: 'Natura', categoria: 'perfumaria',
    preco: 190, preco_promocional: 130, preco_a_partir_de: false, quantidade_estoque: 99,
    descricao: 'Fragrâncias Luna disponíveis em promoção.', destaque: true, ordem: 30,
  },
  {
    id: 10004, codigo: 'CAT-004', nome: 'Kaiak Feminino', marca: 'Natura', categoria: 'perfumaria',
    preco: 190, preco_promocional: 140, preco_a_partir_de: false, quantidade_estoque: 99,
    descricao: 'Kaiak Feminino em promoção.', destaque: true, ordem: 40,
  },
  {
    id: 10005, codigo: 'CAT-005', nome: 'Perfumaria feminina O Boticário', marca: 'O Boticário',
    categoria: 'perfumaria', preco: 125, preco_promocional: null, preco_a_partir_de: true,
    quantidade_estoque: 99, descricao: 'Fragrâncias femininas disponíveis.', destaque: false, ordem: 50,
  },
  {
    id: 10006, codigo: 'CAT-006', nome: 'Colônias Aquavibe Avon de 1 litro', marca: 'Avon',
    categoria: 'perfumaria', preco: 80, preco_promocional: 65, preco_a_partir_de: false,
    quantidade_estoque: 99, descricao: 'Colônias Aquavibe Avon de 1 litro em promoção.', destaque: true, ordem: 60,
  },
  {
    id: 10007, codigo: 'CAT-007', nome: 'Águas de colônia disponíveis', marca: 'Sara Cosméticos',
    categoria: 'perfumaria', preco: 125, preco_promocional: null, preco_a_partir_de: true,
    quantidade_estoque: 99, descricao: 'Consulte as fragrâncias disponíveis.', destaque: false, ordem: 70,
  },
  {
    id: 10008, codigo: 'CAT-008', nome: 'Ilía', marca: 'Natura', categoria: 'perfumaria',
    preco: 186, preco_promocional: 140, preco_a_partir_de: false, quantidade_estoque: 99,
    descricao: 'Fragrâncias Ilía disponíveis em promoção.', destaque: true, ordem: 80,
  },
  {
    id: 10009, codigo: 'CAT-009', nome: 'Presentes masculinos', marca: 'Sara Cosméticos',
    categoria: 'kits', preco: 65, preco_promocional: null, preco_a_partir_de: true,
    quantidade_estoque: 99, descricao: 'Opções de presentes masculinos.', destaque: false, ordem: 90,
  },
  {
    id: 10010, codigo: 'CAT-010', nome: 'Egeo disponíveis', marca: 'O Boticário', categoria: 'perfumaria',
    preco: 90, preco_promocional: null, preco_a_partir_de: true, quantidade_estoque: 99,
    descricao: 'Fragrâncias Egeo disponíveis.', destaque: false, ordem: 100,
  },
  {
    id: 10011, codigo: 'CAT-011', nome: 'Natura Humor', marca: 'Natura', categoria: 'perfumaria',
    preco: 155, preco_promocional: 100, preco_a_partir_de: false, quantidade_estoque: 99,
    descricao: 'Fragrâncias Natura Humor em promoção.', destaque: true, ordem: 110,
  },
  {
    id: 10012, codigo: 'CAT-012', nome: 'Essencial', marca: 'Natura', categoria: 'perfumaria',
    preco: 280, preco_promocional: 140, preco_a_partir_de: false, quantidade_estoque: 99,
    descricao: 'Fragrâncias Essencial em promoção.', destaque: true, ordem: 120,
  },
];
