# Frontend da Sara Cosméticos

Vitrine responsiva da Sara Cosméticos. Os produtos vêm da API da branch `backend`, o carrinho fica no navegador e o pedido final é enviado para o WhatsApp `+55 85 8854-0534`.

## Executar localmente

1. Mantenha a branch `backend` rodando em outro checkout na porta `3000`.
2. Nesta branch, abra `index.html` com a extensão Live Server do VS Code.
3. Acesse normalmente `http://127.0.0.1:5500`.

Em desenvolvimento, o frontend detecta `localhost` ou `127.0.0.1` e consulta automaticamente `http://localhost:3000/api/produtos`.

## Estrutura

```text
Sara cosmeticos/
|-- assets/
|   `-- logo-sara-cosmeticos.jpg
|-- css/
|   `-- styles.css
|-- js/
|   `-- app.js
|-- .gitignore
|-- index.html
`-- README.md
```

## Funcionalidades

- Catálogo carregado do SQLite por meio da API.
- Filtros criados apenas para as categorias que possuem produtos.
- Fotos enviadas pelo painel administrativo.
- Preço normal e promocional.
- Indicação de produto indisponível.
- Carrinho persistido no `localStorage`.
- Pedido formatado para o WhatsApp da Sara.
- Menu e layout responsivos para computador e celular.
- Estado amigável quando o catálogo está vazio ou a API está indisponível.

## API

O frontend usa estas informações públicas:

```js
{
  id: 1,
  nome: 'Nome do produto',
  marca: 'Marca',
  categoria: 'perfumaria',
  preco: 49.9,
  preco_promocional: null,
  imagem_url: '/uploads/produto.jpg',
  disponivel: 1,
}
```

Para hospedar frontend e backend em domínios diferentes, preencha a meta `api-origin` em `index.html` com a origem pública do backend, sem `/api/produtos`:

```html
<meta name="api-origin" content="https://api.exemplo.com">
```

Se ambos forem publicados no mesmo domínio por um proxy, mantenha o conteúdo vazio.

## Organização

- `index.html`: estrutura, acessibilidade e links oficiais.
- `css/styles.css`: componentes, catálogo, carrinho e responsividade.
- `js/app.js`: consulta da API, filtros, carrinho e montagem do pedido.

O cadastro, estoque, imagens e autenticação da Sara ficam exclusivamente na branch `backend`.
