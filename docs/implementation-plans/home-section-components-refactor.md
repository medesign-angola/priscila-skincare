# Refatoração da Home por componentes de seção

## Objetivo

Transformar a página Home num componente de composição, movendo cada seção para um componente standalone próprio, com template, estado e CSS encapsulados.

## Estrutura proposta

```text
packages/storefront/src/app/pages/home/
├── home.ts
├── home.html
├── home.css
└── sections/
    ├── hero-section/
    │   ├── hero-section.ts
    │   ├── hero-section.html
    │   └── hero-section.css
    ├── brand-pillars-section/
    │   ├── brand-pillars-section.ts
    │   ├── brand-pillars-section.html
    │   └── brand-pillars-section.css
    └── featured-products-section/
        ├── featured-products-section.ts
        ├── featured-products-section.html
        └── featured-products-section.css
```

Os três componentes serão criados com generators Nx, standalone e `OnPush`.

## Responsabilidades

### `HomeComponent`

- Importar e compor as três seções na ordem correta.
- Não conhecer kits, produtos, traduções, moeda ou detalhes visuais.
- `home.html` conterá somente os seletores das seções.
- `home.css` ficará vazio ou apenas com regras estritamente pertencentes à página como composição global.

### `HeroSection`

- Injetar `ProductFacade`.
- Controlar kit ativo, badges, compra e media.
- Conter todo o markup atual da hero.
- Possuir exclusivamente os estilos de slides e transição.
- Receber durante o merge a transição suavizada da branch `codex/fix/home-hero-transition`.

### `BrandPillarsSection`

- Manter a coleção readonly das quatro chaves de tradução.
- Importar `TranslatePipe`.
- Conter o Flexbox fluido, divisórias e breakpoints dos pilares.
- Nenhuma regra de pilares permanecerá em `home.css`.

### `FeaturedProductsSection`

- Injetar `ProductFacade` e `HeaderService`.
- Criar o computed `featuredProductCards`.
- Formatar moeda e preço.
- Tratar `productSelect` e `addToCart`.
- Compor os `ProductCard` compartilhados.
- Conter somente o layout da seção: heading lateral, lista Flexbox e scroll-snap mobile.

### `ProductCard`

- Continuará em `packages/shared` porque pode ser reutilizado no catálogo e noutras páginas.
- Manterá o CSS interno do card, hover, badges, preço e avaliação.

## Estratégia de commits

Para preservar contextos claros apesar das alterações atuais ainda não commitadas:

1. Finalizar e gravar primeiro a seção de produtos destacados no estado funcional já validado:

```text
feat(storefront): add featured products section
```

2. Gerar e extrair as três seções para componentes próprios:

```text
refactor(storefront): extract home section components
```

3. Fazer merge da branch `codex/fix/home-hero-transition`.
4. Resolver o conflito do antigo `home.css` transferindo as regras da transição para `hero-section.css`, sem reintroduzir estilos no componente pai.
5. Finalizar com:

```text
merge: integrate smooth hero transition
```

## Por que os componentes ficam no storefront

As seções completas são específicas da página Home e dependem da sua composição e facades. Colocá-las em `shared` transformaria a biblioteca reutilizável num depósito de funcionalidades específicas de página.

Somente elementos realmente reutilizáveis permanecem em `shared`, como:

- `ProductCard`;
- `HeroCover`;
- `HeroSplit`;
- `Header`.

## Validação

1. Confirmar que `home.html` contém apenas as três seções.
2. Confirmar que cada seção possui CSS próprio e não alcança internamente as outras.
3. Confirmar que não houve alteração visual no processo de extração.
4. Validar PT/FR, AOA/EUR, hero, pilares e produtos.
5. Validar os breakpoints e escalas fluidas.
6. Executar build Nx do storefront e dependências, incluindo SSR.
7. Executar `git diff --check` e confirmar histórico com commits separados.

## Resultado esperado

A Home ficará preparada para receber novas seções sem crescimento descontrolado de `home.ts`, `home.html` e `home.css`, reduzindo conflitos de merge e mantendo cada bloco visual isolado.
