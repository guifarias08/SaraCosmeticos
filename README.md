# Sara Cosméticos

Front-end responsivo da Sara Cosméticos, loja de perfumes e cuidados pessoais em Maracanaú - CE. O catálogo funciona como uma vitrine e o pedido é enviado diretamente para o WhatsApp da loja.

## Estrutura

```text
Sara cosmeticos/
├── assets/
│   └── logo-sara-cosmeticos.jpg
├── css/
│   └── styles.css
├── js/
│   └── app.js
├── index.html
└── README.md
```

## Como executar

Não existe etapa de build. Para uma visualização rápida, abra `index.html` no navegador.

No VS Code, também é possível usar a extensão Live Server: clique com o botão direito em `index.html` e escolha **Open with Live Server**.

## Funcionalidades

- Layout responsivo para computador, tablet e celular.
- Filtros por categoria.
- Carrinho persistido no `localStorage`.
- Alteração de quantidade e cálculo de total.
- Pedido formatado e enviado para o WhatsApp `+55 85 8854-0534`.
- Links oficiais para o WhatsApp e o Instagram da loja.
- Menu mobile, foco visível, textos alternativos e suporte a movimento reduzido.

## Organização do código

- `index.html`: conteúdo e estrutura sem estilos ou eventos inline.
- `css/styles.css`: variáveis, componentes, seções, carrinho e responsividade, organizados nessa ordem.
- `js/app.js`: catálogo temporário, estado do carrinho, renderização e eventos.

## Catálogo temporário

Os produtos e preços em `js/app.js` são demonstrativos. Na próxima etapa, o array `products` deverá ser substituído pelos produtos reais vindos do backend.

O formato esperado pelo front é:

```js
{
  id: 1,
  name: 'Nome do produto',
  brand: 'Marca',
  category: 'perfumaria',
  price: 49.9,
  tone: 'rose',
}
```

## Próxima etapa: backend

1. Buscar produtos ativos pela API.
2. Usar a imagem cadastrada de cada produto no lugar do bloco colorido.
3. Manter o fechamento do pedido pelo WhatsApp, sem API de pagamento.
4. Fazer o painel administrativo controlar nome, marca, categoria, preço, estoque e imagem.
