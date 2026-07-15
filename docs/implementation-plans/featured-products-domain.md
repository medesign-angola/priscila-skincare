# Produtos destacados no domínio

## Constatação no código atual

A home implementada contém neste momento apenas a hero baseada em `featuredKits`. A seção visual de produtos destacados ainda não existe no template da home. Portanto, esta etapa preparará corretamente o domínio e a facade para essa seção, sem inventar o seu layout antes de recebermos o respetivo design.

## Alteração no modelo

Adicionar ao `Product`:

```ts
featured: boolean;
featuredOrder?: number;
```

- `featured` determina se o produto participa da seção.
- `featuredOrder` permite controlar a posição sem depender da ordem física do mock.
- O campo de ordem permanece opcional porque produtos não destacados não precisam dele.

## Dados mockados

1. Adicionar `featured` explicitamente aos 14 produtos, evitando estados implícitos.
2. Marcar inicialmente `Snow White Soap` (`prod-1`) como destacado.
3. Atribuir `featuredOrder: 1` ao produto destacado.
4. Marcar os restantes produtos como `featured: false`.

Esta escolha segue o produto principal já usado no início do catálogo. A seleção poderá ser trocada alterando apenas os dados, sem tocar no componente futuro.

## Facade

Criar um computed derivado:

```ts
readonly featuredProducts = computed(() =>
  this.products()
    .filter((product) => product.featured)
    .sort(
      (a, b) =>
        (a.featuredOrder ?? Number.MAX_SAFE_INTEGER) -
        (b.featuredOrder ?? Number.MAX_SAFE_INTEGER),
    ),
);
```

O computed:

- reage automaticamente ao carregamento/alteração dos produtos;
- entrega somente os produtos destacados;
- respeita a ordem editorial;
- não mistura tradução com seleção de merchandising.

## Ficheiros previstos

- `packages/core/src/lib/models/product.interface.ts`
- `packages/core/src/lib/mocks/products.mock.ts`
- `packages/core/src/lib/facades/product.facade.ts`

Nenhuma alteração prevista no HTML ou CSS da home nesta etapa.

## Validação

1. Confirmar que todos os produtos possuem `featured`.
2. Confirmar que somente `prod-1` está destacado.
3. Confirmar que `featuredProducts()` retorna `prod-1`.
4. Executar formatação e `git diff --check`.
5. Executar o build de desenvolvimento do storefront via Nx.

## Etapa posterior

Quando recebermos o design da seção, ela consumirá diretamente `facade.featuredProducts()` e resolverá nome/descrição através do idioma atual, sem filtros ou IDs codificados no componente.
