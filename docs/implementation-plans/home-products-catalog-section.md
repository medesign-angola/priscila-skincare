# Plano de implementação — catálogo de produtos da Home

## Referência

- Figma: node `161:3470`.
- Layout desktop: título sticky à esquerda e produtos em três colunas.
- Espaçamento horizontal entre cards: 8 px.
- Espaçamento vertical entre linhas: 32 px.
- Primeira apresentação: 9 produtos.
- Limite máximo da seção: 18 produtos.

## Leitura funcional

- A seção apresenta a listagem geral de produtos da Home.
- Produtos pertencentes a `featured-products`, `editorial-cover` ou `editorial-gallery` também aparecem aqui normalmente.
- A regra de não duplicação aplica-se apenas entre os três posicionamentos editoriais/destaques, não à listagem geral.
- Os primeiros 9 produtos são renderizados inicialmente.
- Quando o utilizador alcança o fim do lote visível, o próximo lote é adicionado.
- Com a configuração de produção, o segundo lote contém os outros 9 produtos.
- Nunca renderizar mais que 18 produtos nesta seção.

## Configuração manipulável

Criar uma configuração injetável e tipada:

```ts
export interface HomeProductsCatalogConfig {
  initialLimit: number;
  batchSize: number;
  maxProducts: number;
}

export const DEFAULT_HOME_PRODUCTS_CATALOG_CONFIG = {
  initialLimit: 9,
  batchSize: 9,
  maxProducts: 18,
} as const;
```

Expor através de um `InjectionToken`, permitindo testar no componente ou em testes com:

```ts
{
  initialLimit: 2,
  batchSize: 2,
  maxProducts: 6,
}
```

### Normalização defensiva

- `initialLimit`: mínimo 1 e nunca superior a `maxProducts`.
- `batchSize`: mínimo 1.
- `maxProducts`: mínimo 1.
- O componente nunca acessa índices inexistentes.
- Se existirem menos de 18 produtos, mostra todos os disponíveis após os lotes necessários.

## Estado e computeds

No componente:

```ts
visibleLimit = signal(config.initialLimit);
catalogProducts = computed(...slice(0, config.maxProducts));
visibleProducts = computed(...slice(0, visibleLimit()));
hasMoreProducts = computed(...);
allConfiguredProductsVisible = computed(...);
```

- `loadNextBatch()` incrementa pelo `batchSize` sem ultrapassar o menor valor entre quantidade disponível e `maxProducts`.
- A troca de idioma ou moeda atualiza os cards sem reiniciar o lote já exibido.
- IDs continuam sendo a chave do `@for`, evitando reconstruções desnecessárias.

## Gatilho por scroll

- Adicionar um sentinel sem conteúdo depois da lista.
- Criar um `ScrollTrigger` no sentinel com início próximo de `top 90%`.
- Ao entrar, executar `loadNextBatch()`.
- Depois que o Angular renderizar o novo lote:
  - animar apenas os cards recém-adicionados;
  - atualizar/recriar o trigger no novo fim da lista, caso ainda existam lotes;
  - chamar `ScrollTrigger.refresh()` apenas quando necessário.
- O Lenis já chama `ScrollTrigger.update` globalmente em `app.ts`; não criar uma segunda instância de Lenis nem outro ticker.
- Destruir context, triggers e listeners em `DestroyRef`.
- Importar GSAP/ScrollTrigger dinamicamente apenas no browser, mantendo SSR seguro.

## Motion proposta

O Figma não devolveu animações para este node. Portanto, usar uma entrada editorial discreta, coerente com os cards existentes:

```text
opacity: 0 → 1
y: 40px → 0
scale: 0.985 → 1
duration: 0.65s
ease: power3.out
stagger: 0.08s
```

- O primeiro lote anima quando a grelha entra no viewport.
- Lotes seguintes animam apenas os novos cards.
- Não usar `scrub`, pois o card deve concluir a entrada e permanecer estável.
- Não animar propriedades de layout como `width`, `height`, `top` ou `left`.
- Usar `will-change` apenas durante a animação e limpá-lo ao terminar.
- Com `prefers-reduced-motion: reduce`, os cards aparecem imediatamente e o carregamento por scroll continua funcional.

## Dados necessários

O mock possui atualmente 14 produtos, mas somente 4 têm `commerce` completo.

Nesta fase:

- preservar preços já existentes;
- adicionar preços temporários AOA/EUR aos produtos restantes;
- definir disponibilidade coerente com os badges/estado existente;
- não inventar descontos para produtos sem badge;
- manter o limite preparado para 18, mesmo havendo 14 produtos hoje;
- quando forem adicionados `prod-15` a `prod-18`, a seção passa a usá-los automaticamente.

## Categoria real

O `ProductCard` mostra hoje apenas a tradução genérica “Categoria”. Para este catálogo:

- adicionar `categoryLabel` ao `ProductCardData`;
- criar `mappedCategories` no facade;
- resolver `product.categoryId` para o nome real da categoria;
- usar o rótulo genérico apenas como fallback quando o ID não existir;
- manter a API opcional para não quebrar os cards destacados existentes durante a migração.

## View model dos cards

Criar um mapper reutilizável no componente ou facade contendo:

- ID;
- nome e descrição traduzidos;
- categoria resolvida;
- imagem principal;
- rating e total de avaliações;
- preço formatado pela `PriceFormatPipe`/helper compartilhado;
- moeda atual;
- disponibilidade;
- badge.

Não duplicar `Intl.NumberFormat`.

## Componente Angular

Gerar pelo Nx um componente standalone e `OnPush`:

```text
packages/storefront/src/app/pages/home/sections/products-catalog-section/
├── products-catalog-section.ts
├── products-catalog-section.html
├── products-catalog-section.css
└── products-catalog.config.ts
```

- Reutilizar `org-product-card`.
- Não criar uma segunda implementação visual de card.
- Manter seleção do produto e intenção de adicionar ao carrinho como eventos preparados.

## Layout responsivo

### Desktop

- Flexbox entre título e conteúdo.
- Título sticky.
- Conteúdo dos cards com Flexbox e `flex-wrap`.
- Três cards por linha.
- Gap horizontal de `0.5rem`.
- Gap vertical de `2rem`.

### Tablet

- Duas colunas.
- Título deixa de ser sticky quando o espaço lateral não for suficiente.

### Mobile

- Uma coluna ou cards com largura integral, evitando uma grelha excessivamente estreita.
- O carregamento do próximo lote continua por scroll vertical.
- O CTA de adicionar ao carrinho permanece acessível em dispositivos sem hover.

Usar `clamp()`, percentuais e `calc()` para preservar a proporção entre 1440, 1536 e ecrãs maiores.

## Botão “Ver mais”

- Não desenhar nem estilizar o botão antes da entrega do UX.
- Preparar o computed `canShowViewMore` com a condição:
  - existem pelo menos `maxProducts` produtos disponíveis;
  - `visibleLimit` já atingiu `maxProducts`.
- Não exibir placeholder visual.
- Quando o design chegar, o botão será ligado diretamente a esse computed.

## Tradução

Adicionar/usar chaves para:

- título “Produtos”;
- rótulos acessíveis do carregamento progressivo, se necessários;
- futuro CTA somente quando o UX entregar texto e design.

Nomes, descrições e avaliações continuam vindo dos produtos.

## Acessibilidade

- Seção com `aria-labelledby`.
- Lista de cards com semântica de lista.
- Sentinel invisível e fora da ordem de foco.
- A adição de novos cards não move o foco do utilizador.
- Opcionalmente anunciar a quantidade carregada em região `aria-live` discreta, sem anunciar todos os cards individualmente.
- Motion desativável por preferência do sistema.

## Validação

- Configuração padrão: 9 iniciais, depois até 18.
- Configuração de teste: 2 iniciais, lotes de 2, máximo 6.
- Dataset atual de 14 produtos: 9 iniciais e 5 no lote seguinte.
- Confirmar que nunca ultrapassa o máximo.
- Confirmar atualização PT/FR e AOA/EUR sem resetar a paginação.
- Confirmar categoria real em cada card.
- Confirmar entrada GSAP apenas uma vez por card.
- Confirmar integração com Lenis sem ticker duplicado.
- Confirmar SSR sem acesso a `window`/DOM durante renderização.
- Confirmar `prefers-reduced-motion`.
- Executar build core/shared e build browser/SSR/prerender da storefront.
- Executar `git diff --check`.

## Branch e commit

Criar após aprovação:

```text
codex/feature/home-products-catalog
```

Commit sugerido:

```text
feat(storefront): add progressive products catalog section
```
