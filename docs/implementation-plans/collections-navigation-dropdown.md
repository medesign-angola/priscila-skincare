# Plano de implementação — Dropdown e domínio de coleções

Status: aguardando aprovação  
Figma: arquivo `VFgpUdcrnOLXhHrrfc9RZ5`, node `161:4075`  
Branch recomendada: `codex/feature/collections-navigation-dropdown`

## 1. Resultado da análise do Figma

O dropdown contém quatro coleções, nesta ordem:

| Nº | Coleção | Asset próprio no Figma |
|---:|---|---|
| 01 | Snow White Set Big | sim |
| 02 | Snow White Set Mini | sim |
| 03 | Caramel Set | sim |
| 04 | Caramel Set Mini | sim |

O layout é estruturalmente igual ao dropdown de produtos:

- painel branco com `32px` de padding;
- CTA **Ver todos** e seta;
- linhas de `40px` com intervalo de `4px`;
- numeração com dois dígitos;
- nome em uppercase;
- imagem `40 × 40px`;
- mesmos tokens de cor, tipografia e opacidade.

O painel existente será reutilizado, não duplicado.

## 2. Análise do modelo atual

### `Collection`

```ts
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productIds: string[];
}
```

Limitações:

- o mock contém apenas uma coleção que não corresponde ao Figma;
- `description` é opcional;
- não existe thumbnail para navegação;
- não existe mídia para uma seção editorial;
- não existe suporte explícito a vídeo/poster.

### `Kit`

O modelo de kit contém:

```ts
mediaType: 'image' | 'video';
mediaUrl: string;
mediaStyle: 'split-right' | 'cover';
placeholderUrl?: string;
description: string;
```

Esses campos mostram que a aplicação já precisa distinguir mídia, fallback e apresentação. Porém, copiar tudo literalmente para `Collection` misturaria duas preocupações:

- **conteúdo da mídia:** tipo, URL e poster;
- **layout da seção:** cover, split, background etc.

## 3. Proposta de evolução de `Collection`

```ts
export interface CollectionMedia {
  type: 'image' | 'video';
  url: string;
  posterUrl?: string;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnailImage: string;
  productIds: string[];
  media?: CollectionMedia;
}
```

Decisões:

- `description` passa a ser obrigatória;
- `thumbnailImage` é independente da mídia editorial e otimizada para menus;
- `media` é opcional enquanto o design da seção não definir o asset final;
- vídeo poderá usar `posterUrl` para carregamento e fallback;
- `mediaStyle` não será colocado no domínio da coleção agora; o componente futuro define se a mídia é background, cover ou split;
- o modelo de `Kit` não será refatorado nesta funcionalidade, evitando regressão na hero.

Quando recebermos o design da seção de coleção com vídeo, preencheremos `media` com o vídeo e poster corretos. Não será inventada uma URL nesta etapa.

## 4. Novos mocks e associação aos produtos

As associações serão feitas somente com IDs existentes e pela família indicada nos nomes do catálogo.

### Snow White Set Big

```ts
{
  id: 'col-1',
  name: 'Snow White Set Big',
  slug: 'snow-white-set-big',
  description: 'Rotina completa Snow White para limpeza, hidratação facial e cuidado corporal.',
  thumbnailImage: '/assets/images/collections/thumbnails/snow-white-set-big.webp',
  productIds: ['prod-1', 'prod-3', 'prod-4'],
}
```

- `prod-1`: Snow White Soap;
- `prod-3`: Snow White Body Cream;
- `prod-4`: Snow White Face Cream.

### Snow White Set Mini

```ts
{
  id: 'col-2',
  name: 'Snow White Set Mini',
  slug: 'snow-white-set-mini',
  description: 'Seleção essencial Snow White para uma rotina compacta de cuidado diário.',
  thumbnailImage: '/assets/images/collections/thumbnails/snow-white-set-mini.webp',
  productIds: ['prod-1', 'prod-4'],
}
```

### Caramel Set

```ts
{
  id: 'col-3',
  name: 'Caramel Set',
  slug: 'caramel-set',
  description: 'Cuidado completo Caramel para rosto e corpo com hidratação prolongada.',
  thumbnailImage: '/assets/images/collections/thumbnails/caramel-set.webp',
  productIds: ['prod-5', 'prod-6'],
}
```

- `prod-5`: Pris Caramel Face Cream;
- `prod-6`: Caramel Body Cream.

### Caramel Set Mini

```ts
{
  id: 'col-4',
  name: 'Caramel Set Mini',
  slug: 'caramel-set-mini',
  description: 'Seleção compacta Caramel para hidratação facial e corporal.',
  thumbnailImage: '/assets/images/collections/thumbnails/caramel-set-mini.webp',
  productIds: ['prod-5', 'prod-6'],
}
```

Big e Mini podem apontar para a mesma família de produtos porque o modelo atual representa produtos, não variantes de embalagem. Quando tamanhos ou SKUs forem modelados como variantes, as duas coleções poderão diferenciá-los sem mudar a estrutura do menu.

## 5. Estratégia de imagens

As quatro imagens do Figma são específicas das coleções e não devem ser substituídas por thumbnails de produtos.

Fluxo:

1. baixar somente os quatro assets do node `161:4075` enquanto as URLs estão válidas;
2. preservar a imagem fonte localmente somente se for necessária para páginas futuras;
3. gerar quatro WebPs determinísticos de `80 × 80px` para o dropdown;
4. salvar em:

```text
packages/storefront/public/assets/images/collections/thumbnails/
├── snow-white-set-big.webp
├── snow-white-set-mini.webp
├── caramel-set.webp
└── caramel-set-mini.webp
```

5. validar formato, dimensões, correspondência visual e peso total;
6. objetivo: conjunto abaixo de `50 KB`;
7. nunca usar diretamente URLs temporárias do Figma em produção.

Não será usada IA generativa, pois ela poderia alterar produtos e embalagens. A conversão será apenas resize/crop/WebP determinístico.

## 6. Reutilização do dropdown

O header terá um único estado:

```ts
type HeaderNavigationMenu = 'products' | 'collections';

activeNavigationMenu = signal<HeaderNavigationMenu | null>(null);
navigationMenuInitialized = signal(false);
```

Regras:

- Produtos abre a lista de produtos;
- Coleção abre a lista de coleções;
- clicar no menu já ativo fecha;
- clicar no outro troca o conteúdo imediatamente;
- somente um painel fica aberto;
- clique externo e `Escape` fecham;
- foco retorna ao botão correto;
- listeners globais existem somente enquanto um menu estiver aberto;
- painel permanece montado depois da primeira abertura para evitar custo de recriação.

## 7. API do header

```ts
export interface HeaderNavigationItem {
  id: string;
  name: string;
  image: string;
}

products = input<readonly HeaderNavigationItem[]>([]);
collections = input<readonly HeaderNavigationItem[]>([]);
```

O conteúdo ativo será calculado:

```text
Produtos  → Ver todos → /produtos → 14 items
Coleção   → Ver todos → /colecao  → 4 items
```

O mesmo markup e stylesheet servirão aos dois casos.

## 8. Composição no storefront

### Resolução normalizada dos produtos no facade

Os mocks de coleções e kits continuarão armazenando somente `productIds`. A resolução dos objetos completos será centralizada no `ProductFacade` com um índice computado por ID:

```ts
readonly mappedProducts = computed(
  () => new Map(this.products().map((product) => [product.id, product])),
);
```

Isso evita executar repetidamente `filter()` sobre todo o catálogo e oferece lookup direto para qualquer entidade que referencia produtos.

As coleções serão enriquecidas sem alterar o formato persistido no mock:

```ts
readonly collectionsWithProducts = computed(() => {
  const mappedProducts = this.mappedProducts();

  return this.collections().map((collection) => ({
    ...collection,
    products: collection.productIds
      .map((id) => mappedProducts.get(id))
      .filter((product): product is Product => product !== undefined),
  }));
});
```

O mesmo índice será utilizado pelos kits:

```ts
readonly kitsWithProducts = computed(() => {
  const mappedProducts = this.mappedProducts();

  return this.featuredKits().map((kit) => ({
    ...kit,
    products: kit.productIds
      .map((id) => mappedProducts.get(id))
      .filter((product): product is Product => product !== undefined),
  }));
});
```

O computed `activeKitProducts` existente deixará de filtrar o array inteiro e passará a reutilizar `mappedProducts`:

```ts
readonly activeKitProducts = computed(() => {
  const kit = this.activeKit();
  const mappedProducts = this.mappedProducts();

  if (!kit) return [];

  return kit.productIds
    .map((id) => mappedProducts.get(id))
    .filter((product): product is Product => product !== undefined);
});
```

Benefícios:

- mantém os mocks normalizados;
- elimina objetos de produto duplicados;
- preserva a ordem declarada em `productIds`;
- centraliza a resolução e o tratamento de IDs inexistentes;
- recalcula automaticamente quando produtos, coleções ou kits mudam;
- serve ao dropdown, páginas de coleção, hero e futuras seções editoriais.

### View model do header

```ts
readonly headerCollections = computed(() =>
  this.facade.collectionsWithProducts().map((collection) => ({
    id: collection.id,
    name: collection.name,
    image: collection.thumbnailImage,
  })),
);
```

```html
<org-header
  [products]="headerProducts()"
  [collections]="headerCollections()"
/>
```

O `shared` continuará sem depender de `core`.

## 9. Arquivos previstos

- `packages/core/src/lib/models/collection.interface.ts`
  - tornar descrição obrigatória;
  - adicionar thumbnail e mídia opcional.

- `packages/core/src/lib/mocks/collections.mock.ts`
  - substituir a coleção atual pelas quatro do Figma;
  - ligar cada coleção aos produtos existentes.

- `packages/core/src/lib/facades/product.facade.ts`
  - criar `mappedProducts`;
  - criar `collectionsWithProducts`;
  - criar `kitsWithProducts`;
  - refatorar `activeKitProducts` para reutilizar o índice.

- `packages/shared/src/lib/components/header/header.ts`
  - generalizar o estado para Produtos/Coleção.

- `packages/shared/src/lib/components/header/header.html`
  - transformar Coleção em botão;
  - tornar CTA e lista dinâmicos.

- `packages/shared/src/lib/components/header/header.css`
  - reaproveitar estilos existentes; somente ajustes mínimos.

- `packages/storefront/src/app/app.ts`
  - mapear coleções para o header.

- `packages/storefront/src/app/app.html`
  - conectar `[collections]`.

- `packages/storefront/public/assets/images/collections/thumbnails/`
  - adicionar quatro WebPs otimizados.

## 10. Fora do escopo

- implementar a seção editorial da coleção com vídeo;
- escolher ou inventar qual coleção recebe o vídeo;
- alterar o modelo e componentes de `Kit`;
- criar página `/colecao` ou detalhe;
- modelar SKU/variante de tamanho;
- implementar idioma, usuário ou cesto;
- criar commit ou push sem autorização.

## 11. Validação

1. validar que todos os `productIds` existem;
2. validar que `mappedProducts` resolve produtos de kits e coleções na ordem declarada;
3. validar quatro WebPs em `80 × 80px`;
4. medir peso total;
5. testar abertura, fechamento e troca entre menus;
6. garantir que o dropdown de produtos e a hero não regrediram;
7. executar build Angular/SSR via Nx;
8. executar `git diff --check`;
9. apresentar resultado antes do commit.

## 12. Commit proposto

Após revisão visual e aprovação:

```text
feat(shared): add collections navigation dropdown
```
