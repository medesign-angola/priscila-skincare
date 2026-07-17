# Seção de produtos destacados — Home

## Referência analisada

- Figma: node `161:3325`.
- Frame desktop: `1440 × 533 px`.
- Padding externo de referência: `32px`.
- Conteúdo: `1376 × 469 px`.
- Coluna lateral “Destaques”: `87px`.
- Distância entre heading e produtos: `32px`.
- Três cards com aproximadamente `413.67px` de largura e gap de `8px`.
- Área visual de cada produto: proporção aproximada de `413.67 / 364`.

Todas essas medidas serão convertidas em proporções, `rem` e `clamp()`, mantendo `1440px` como referência sem congelar o layout nessa largura.

## Branch

Criar a próxima branch sequencial a partir do commit atual dos pilares:

```text
codex/feature/home-featured-products
```

A branch herdará a hero original e a seção de pilares. A correção independente da transição da hero continuará somente em `codex/fix/home-hero-transition` até a integração posterior.

## Dados do domínio

O design exige três produtos e informações comerciais ainda ausentes no `Product`.

### Destaques

1. Manter `prod-1` com `featuredOrder: 1`.
2. Marcar `prod-2` e `prod-3` como destacados, nas ordens 2 e 3.
3. Continuar consumindo exclusivamente `facade.featuredProducts()`; nenhum ID ficará codificado na home.

### Informações comerciais

Adicionar ao produto uma estrutura opcional de merchandising/comércio para não colocar preço e badge no componente:

```ts
type ProductBadge =
  | { type: 'discount'; percentage: number }
  | { type: 'new' }
  | { type: 'coming-soon' };

interface ProductCommerce {
  prices: {
    AOA: number;
    EUR: number;
  };
  availability: 'in-stock' | 'coming-soon';
  badge?: ProductBadge;
}
```

O campo `commerce?` ficará opcional no `Product`, permitindo que produtos ainda sem preço continuem válidos. Os três destaques receberão dados mockados:

- `prod-1`: desconto de 50%;
- `prod-2`: novo;
- `prod-3`: em breve e indisponível para adição;
- valores mockados em AOA e EUR para responder corretamente ao seletor de moeda, sem conversão cambial em runtime.

## View model

Criar na home um computed que combine:

- `facade.featuredProducts()`;
- `facade.currentLanguage()`;
- traduções do produto;
- `HeaderService.currency()`;
- média e total de avaliações;
- primeira imagem do produto;
- preço correspondente à moeda selecionada.

O template receberá um objeto pronto para apresentação, sem navegar repetidamente por estruturas profundas.

## Product card reutilizável

Criar um componente standalone compartilhado para evitar que a futura página de catálogo duplique o card:

```text
packages/shared/src/lib/components/product-card/
```

O componente receberá inputs de apresentação e emitirá:

- `productSelect` ao selecionar imagem/nome;
- `addToCart` ao acionar o botão.

Nesta etapa, `addToCart` será ligado a um handler da home, mas não criará estado de carrinho, porque o serviço/bloco flutuante do cesto ainda não foi implementado. Produtos `coming-soon` não emitirão adição e terão estado acessível indisponível.

Como se trata da criação de um novo componente no workspace Nx, a implementação utilizará o generator apropriado do Nx e depois adaptará o resultado ao padrão existente.

## Estrutura visual

1. Inserir a seção imediatamente depois dos pilares.
2. Usar Flexbox, sem CSS Grid:
   - container principal com heading lateral e lista flexível;
   - três cards com participação igual `flex: 1 1 0`;
   - gaps fluidos.
3. Heading lateral sticky dentro da seção, como indicado pelo node.
4. Card:
   - imagem com `aspect-ratio` derivado do Figma, sem altura rígida;
   - fundo `#f4f4f2` e radius proporcional;
   - badge no canto superior esquerdo;
   - botão castanho que sobe a partir da base no hover/focus-within;
   - categoria, nome, descrição e avaliação abaixo da imagem;
   - estrela como SVG inline, evitando uma requisição adicional.
5. Usar `clamp()` para padding, gaps, tipografia e dimensões editoriais.
6. Não truncar nome ou descrição com `line-clamp`; o conteúdo ficará completo.

## Imagens e desempenho

1. Usar a primeira imagem existente de `prod-1`, `prod-2` e `prod-3`.
2. Criar derivados WebP determinísticos em resolução adequada para cards retina, preservando os originais.
3. Guardar os derivados em:

```text
packages/storefront/public/assets/images/products/featured/
```

4. Usar `loading="lazy"`, `decoding="async"`, dimensões/aspect-ratio reservados e `object-fit: cover`.
5. Inspecionar visualmente os três WebP após conversão e comparar o peso total com os JPG originais.

## Responsividade

1. Desktop e ecrãs maiores:
   - heading lateral;
   - três cards na mesma linha;
   - expansão proporcional em 1440, 1536, 1920 e superiores.
2. Tablet:
   - heading passa para uma linha própria;
   - cards usam Flexbox com wrap e dois por linha.
3. Mobile:
   - cards em fluxo horizontal com scroll e `scroll-snap`, permitindo ver parcialmente o próximo card;
   - botão de adicionar permanece acessível sem depender exclusivamente de hover;
   - área de toque adequada.

## Traduções

Adicionar chaves equivalentes em PT/FR:

- heading “Destaques”;
- categoria;
- adicionar ao carrinho;
- novo;
- em breve;
- indisponível;
- label acessível da avaliação;
- moeda/formatos quando necessário.

Nome, descrição e avaliações continuarão vindo de `product.translations[language]`.

## Formatação de preço

1. Usar `Intl.NumberFormat`/pipe Angular com o locale correspondente para evitar strings manuais.
2. Exibir `Kz` para AOA e `€` para EUR.
3. Não converter valores em runtime; o mock fornecerá um preço explícito por moeda.

## Ficheiros previstos

- Nova branch `codex/feature/home-featured-products`.
- `packages/core/src/lib/models/product.interface.ts`
- `packages/core/src/lib/mocks/products.mock.ts`
- `packages/core/src/lib/facades/product.facade.ts`, somente se o view model exigir um computed reutilizável adicional.
- Novo componente compartilhado `product-card` e respetiva exportação.
- `packages/storefront/src/app/pages/home/home.ts`
- `packages/storefront/src/app/pages/home/home.html`
- `packages/storefront/src/app/pages/home/home.css`
- `packages/storefront/public/assets/i18n/pt.json`
- `packages/storefront/public/assets/i18n/fr.json`
- Três imagens WebP otimizadas.

## Validação

1. Confirmar exatamente três produtos destacados e ordenados.
2. Confirmar troca PT/FR nos textos estáticos e dados dos produtos.
3. Confirmar troca AOA/EUR sem conversão implícita.
4. Testar hover, foco, teclado, toque e produto indisponível.
5. Validar Flexbox em 1440, 1536, 1920, tablet e mobile.
6. Verificar que nenhum JPG pesado novo é carregado pela seção.
7. Comparar chaves PT/FR.
8. Executar testes do componente se o generator criar infraestrutura adequada.
9. Executar Prettier, `git diff --check` e build de desenvolvimento via Nx, incluindo SSR.

## Fora do escopo

- Estado persistente do carrinho.
- Bloco flutuante do cesto.
- Página individual do produto.
- Catálogo completo.
- Conversão cambial em tempo real.
