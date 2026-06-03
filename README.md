# Sara Cosméticos

Projeto de vitrine/loja online estática para a marca Sara Cosméticos. A página foi simplificada para uma loja pequena, com foco em categorias, produtos, carrinho e contato direto.

## Estrutura

```text
Sara cosmeticos/
├── index.html
├── css/
│   └── styles.css
└── js/
    └── app.js
```

## Arquivos principais

- `index.html`: marcação da página, seções, textos e pontos de integração com o JavaScript via atributos `data-*`.
- `css/styles.css`: identidade visual, layout responsivo, animações, carrinho lateral, cards e estados de interface.
- `js/app.js`: dados temporários de produtos, renderização dos cards, filtros, carrinho, favoritos, toast e menu mobile.

## Como executar

Abra o arquivo `index.html` no navegador. O projeto não precisa de build nem servidor local neste momento, porque usa apenas HTML, CSS e JavaScript puro.

## Funcionalidades atuais

- Listagem de produtos gerada pelo JavaScript.
- Filtro por categoria.
- Carrinho lateral com total calculado.
- Botões de favoritos com feedback visual.
- Menu mobile.
- Toasts de confirmação e aviso.
- Animações de entrada ao rolar a página.
- Seção simples de contato para WhatsApp e Instagram.

## Melhorias aplicadas

- CSS separado em `css/styles.css`.
- JavaScript separado em `js/app.js` com carregamento `defer`.
- Remoção de `onclick` e estilos inline da maior parte do HTML.
- Eventos centralizados no JavaScript usando `data-*`.
- Renderização de produtos e carrinho com criação de elementos DOM, evitando interpolar HTML desnecessariamente.
- Melhorias de acessibilidade em botões, menu, cards clicáveis e foco por teclado.
- Links externos com `rel="noopener noreferrer"`.
- Meta description adicionada.
- Ano do rodapé atualizado automaticamente.
- Página reduzida para um fluxo mais direto: início, categorias, produtos, contato e rodapé.

## Próximos passos para backend

- Substituir o array `products` por chamadas a uma API.
- Persistir carrinho por usuário ou sessão.
- Criar fluxo real de checkout.
- Criar painel administrativo para cadastro de produtos, estoque, preços e imagens.
- Adicionar autenticação se houver área de cliente ou painel interno.
