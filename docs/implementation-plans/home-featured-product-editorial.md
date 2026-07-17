# Plano de implementação — produto editorial destacado da Home

## Referência

- Figma: node `161:3422`.
- Frame analisado: 1440 × 925.
- Produto existente: `prod-6` — Caramel Body Cream.

## Leitura do design

A seção é um destaque editorial de produto único composto por:

- respiro vertical externo equivalente à seção editorial anterior;
- painel de mídia em `cover`, com aproximadamente 765 px de altura no frame de 1440 px;
- título e descrição no topo esquerdo;
- CTA “Ad. ao carrinho” com moeda e preço na base esquerda;
- texto complementar abaixo do CTA;
- conteúdo branco sobre mídia clara/levemente escurecida;
- estrutura superior sticky e região inferior independente, sem sobreposição.

Não é um novo `ProductCard`; é uma apresentação editorial orientada por produto e deve reutilizar `org-hero-cover`.

## Branch

Após aprovação, criar:

```text
codex/feature/home-product-editorial
```

A branch partirá do estado atual da seção de kits já validada.

## Modelo de produto

### Conteúdo traduzível

Adicionar opcionalmente a `ProductTranslation`:

```ts
editorial?: {
  headline: string;
  description: string;
  footnote: string;
};
```

Isso permite que título, descrição e texto inferior mudem imediatamente entre PT e FR sem ficarem fixos no componente.

### Apresentação editorial

Adicionar ao `Product` um atributo opcional independente de `featured`:

```ts
homeEditorial?: {
  order: number;
  mediaType: 'image' | 'video';
  mediaUrl: string;
  placeholderUrl?: string;
  hasNoise?: boolean;
};
```

- `featured` continuará controlando exclusivamente os cards de produtos destacados.
- `homeEditorial` controlará exclusivamente esta nova seção.
- O Caramel Body Cream continuará fora da lista de cards, evitando regressão visual na seção anterior.

## Dados do Caramel Body Cream

Atualizar `prod-6` com:

- `commerce`:
  - preço AOA de `150000` conforme o mockup;
  - preço EUR coerente com a estratégia de preços já usada no projeto;
  - disponibilidade `in-stock`;
- conteúdo editorial PT correspondente ao Figma;
- versão editorial equivalente em francês;
- mídia de cover e placeholder próprios;
- ordem editorial para permitir futuros destaques sem alterar o componente.

## Mídia

- Identificar/exportar do Figma a mídia do creme sendo aplicado.
- Se for vídeo:
  - armazenar em `assets/videos/products/`;
  - otimizar para web;
  - gerar poster WebP;
  - usar carregamento apropriado à posição da seção;
- Se for imagem:
  - exportar e converter para WebP;
  - dimensionar para cover em ecrãs de alta densidade sem carregar resolução excessiva;
  - gerar placeholder pequeno para blur-up.
- Não usar a captura completa do frame como background, porque ela contém texto e interface incorporados.
- Registrar o peso final dos assets.

## ProductFacade

Criar um computed específico:

```ts
homeEditorialProducts
```

Responsabilidades:

- filtrar produtos com `homeEditorial` e conteúdo editorial no idioma atual;
- ordenar por `homeEditorial.order`;
- preservar a entidade e o `commerce` para preço/disponibilidade;
- não interferir em `featuredProducts`.

## Componente Angular

Gerar pelo Nx um componente standalone e `OnPush`:

```text
packages/storefront/src/app/pages/home/sections/featured-product-editorial-section/
├── featured-product-editorial-section.ts
├── featured-product-editorial-section.html
└── featured-product-editorial-section.css
```

## View model

O componente injetará:

- `ProductFacade` para produto e idioma;
- `HeaderService` para moeda selecionada.

Um `computed` produzirá:

- ID do produto;
- headline, descrição e footnote traduzidos;
- mídia e placeholder;
- disponibilidade;
- rótulo de moeda (`Kz` ou `€`);
- preço formatado com `Intl.NumberFormat` e locale atual.

Nenhuma transformação será executada diretamente no template.

## Reutilização do `org-hero-cover`

- Renderizar a mídia com `org-hero-cover`.
- Usar `height="100%"`, `contentPadding` fluido e `overflowMode="clip"`, como na seção de kits.
- Ativar noise apenas se o node/mídia realmente exigir, por meio de `homeEditorial.hasNoise`.
- Reutilizar blur-up, poster, tratamento de vídeo e stacking do componente compartilhado.
- Não duplicar uma implementação de mídia em `featured-product-editorial-section`.

## Estrutura sticky sem colisão

Aplicar a estrutura já corrigida na seção de kits:

```html
<div class="product-editorial__content">
  <div class="product-editorial__intro-region">
    <div class="product-editorial__intro">...</div>
  </div>

  <div class="product-editorial__action">...</div>
</div>
```

- A região superior será flexível e limitará o sticky.
- A ação será `flex: 0 0 auto` e ficará fora do limite sticky.
- O intro terá `py-8` local e offset pelo inset editorial.
- No mobile, o intro voltará ao fluxo normal.

## CTA de carrinho

- Exibir texto traduzido “Ad. ao carrinho”.
- Exibir moeda e preço do `commerce`, reagindo ao seletor de preferências.
- Emitir apenas a intenção `addToCart(productId)` enquanto não existir serviço de carrinho definitivo.
- Desabilitar o botão quando indisponível.
- Reutilizar o padrão de hover já aprovado na seção de kits:
  - fundo caramelo;
  - texto/preço brancos;
  - transição específica e suave;
  - tratamento de movimento reduzido.

## CSS responsivo

- Usar Flexbox.
- Usar `clamp()`, `aspect-ratio`, percentuais e tokens de inset.
- Manter proporção visual em 1440, 1536 e resoluções maiores.
- Em tablet/mobile:
  - reposicionar conteúdo sobre uma zona legível da mídia;
  - permitir largura integral do CTA;
  - evitar que texto cubra o foco principal da imagem;
  - remover sticky quando necessário.

## Tradução

Adicionar apenas textos globais de interface aos JSONs:

- CTA de carrinho, caso a chave existente de `FEATURED_PRODUCTS.ADD_TO_CART` não seja semanticamente reutilizada;
- estado indisponível e rótulos acessíveis.

Headline, descrição e footnote virão do próprio produto.

## Integração na Home

- Importar o novo componente em `HomeComponent`.
- Inserir `<app-featured-product-editorial-section />` depois da seção de kits, seguindo a ordem recebida do Figma.
- Manter o CSS totalmente encapsulado no componente.

## Validação

- Comparar layout com o node em 1440 e 1536 px.
- Confirmar sticky sem sobreposição com o CTA.
- Confirmar preço AOA e EUR ao trocar preferências.
- Confirmar atualização PT/FR sem reload.
- Confirmar que a lista anterior continua com exatamente três produtos destacados.
- Confirmar que o produto editorial permanece fora dos cards.
- Testar disponibilidade, foco, hover e movimento reduzido.
- Verificar carregamento e peso da mídia.
- Executar formatação, `git diff --check` e build Nx completo com SSR/prerender.

## Commit

Após a seção estar completa e validada:

```text
feat(storefront): add featured product editorial section
```
