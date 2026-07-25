# Mapa de ícones do Storefront

Este documento identifica os ícones atualmente desenhados no código ou
representados por caracteres. Os ficheiros definitivos exportados do Figma
podem ser guardados em:

`packages/storefront/public/assets/icons/`

Use SVG sempre que o Figma disponibilizar o formato.

## Header e navegação

| Asset sugerido | Utilização | Implementação atual | Ficheiro |
| --- | --- | --- | --- |
| `logo.svg` | Logotipo central | SVG inline | `packages/shared/src/lib/components/header/header.html` |
| `language-globe.svg` | Idioma e moeda, desktop e mobile | SVG inline reutilizado do desktop | `packages/shared/src/lib/components/header/header.html` |
| `menu.svg` | Abrir menu mobile | CSS | `packages/shared/src/lib/components/header/header.css` |
| `close.svg` | Fechar menu e preferências | CSS/caractere | `packages/shared/src/lib/components/header/header.html` |
| `user.svg` | Área do utilizador | SVG inline | `packages/shared/src/lib/components/header/header.html` |
| `shopping-bag.svg` | Abrir cesto | SVG inline | `packages/shared/src/lib/components/header/header.html` |
| `arrow-right.svg` | Links e botões de navegação | SVG da hero reutilizado | `packages/shared/src/lib/components/header/header.html` |
| `arrow-left.svg` | Voltar do submenu | `arrow-right` rodado 180° | `packages/shared/src/lib/components/header/header.html` |
| `quantity-minus.svg` | Diminuir quantidade no cesto | Caractere | `packages/shared/src/lib/components/header/header.html` |
| `quantity-plus.svg` | Aumentar quantidade no cesto | Caractere | `packages/shared/src/lib/components/header/header.html` |
| `select-chevron-down.svg` | Select de idioma/moeda | CSS/nativo | `packages/shared/src/lib/components/header/header.css` |

## Hero e secções editoriais

| Asset sugerido | Utilização | Implementação atual | Ficheiro |
| --- | --- | --- | --- |
| `check.svg` | Banner ativo da hero | SVG inline | `packages/storefront/src/app/pages/home/sections/hero-section/hero-section.html` |
| `arrow-right.svg` | CTA da hero | SVG inline de referência | `packages/storefront/src/app/pages/home/sections/hero-section/hero-section.html` |
| `play.svg` | Reproduzir vídeo da hero | SVG inline | `packages/storefront/src/app/pages/home/sections/hero-section/hero-section.html` |
| `pause.svg` | Pausar vídeo da hero | SVG inline | `packages/storefront/src/app/pages/home/sections/hero-section/hero-section.html` |
| `arrow-right.svg` | CTAs de kits | SVG inline | `packages/storefront/src/app/pages/home/sections/kits-section/kits-section.html` |
| `arrow-right.svg` | CTA de coleção | SVG inline | `packages/storefront/src/app/pages/home/sections/featured-collection-section/featured-collection-section.html` |
| `arrow-right.svg` | CTA da fundadora | Caractere | `packages/storefront/src/app/pages/about/sections/about-founder-section/about-founder-section.html` |

## Testemunhos

| Asset sugerido | Utilização | Implementação atual | Ficheiro |
| --- | --- | --- | --- |
| `star.svg` | Classificação geral | SVG inline | `packages/storefront/src/app/pages/home/sections/customer-testimonials-section/customer-testimonials-section.html` |
| `arrow-right.svg` | Deixar avaliação | SVG inline | `packages/storefront/src/app/pages/home/sections/customer-testimonials-section/customer-testimonials-section.html` |
| `play.svg` | Reproduzir testemunho | SVG inline | `packages/storefront/src/app/pages/home/sections/customer-testimonials-section/customer-testimonials-section.html` |
| `pause.svg` | Pausar testemunho | SVG inline | `packages/storefront/src/app/pages/home/sections/customer-testimonials-section/customer-testimonials-section.html` |
| `volume.svg` | Ativar som | SVG inline | `packages/storefront/src/app/pages/home/sections/customer-testimonials-section/customer-testimonials-section.html` |
| `volume-muted.svg` | Desativar som | SVG inline | `packages/storefront/src/app/pages/home/sections/customer-testimonials-section/customer-testimonials-section.html` |
| `chevron-left.svg` | Página anterior | SVG inline | `packages/storefront/src/app/pages/home/sections/customer-testimonials-section/customer-testimonials-section.html` |
| `chevron-right.svg` | Página seguinte | SVG inline | `packages/storefront/src/app/pages/home/sections/customer-testimonials-section/customer-testimonials-section.html` |

## Produtos e detalhes

| Asset sugerido | Utilização | Implementação atual | Ficheiro |
| --- | --- | --- | --- |
| `tag.svg` | Novo, desconto ou disponível em breve | SVG inline | `packages/shared/src/lib/components/product-card/product-card.html` |
| `star.svg` | Avaliação do produto | SVG inline | `packages/shared/src/lib/components/product-card/product-card.html` |
| `tag.svg` | Etiquetas do catálogo | SVG inline | `packages/storefront/src/app/pages/products/products.html` |
| `tag.svg` | Etiquetas da secção de produtos | SVG inline | `packages/storefront/src/app/pages/home/sections/products-catalog-section/products-catalog-section.html` |
| `compare-handle.svg` | Draggable antes/depois | CSS/caracteres | `packages/storefront/src/app/pages/product-details/sections/product-results-section/product-results-section.css` |
| `arrow-right.svg` | Ver todos os ingredientes | Caractere | `packages/storefront/src/app/pages/product-details/sections/product-ingredients-section/product-ingredients-section.html` |
| `arrow-right.svg` | Deixar avaliação do produto | Caractere | `packages/storefront/src/app/pages/product-details/sections/product-reviews-section/product-reviews-section.html` |
| `select-chevron-down.svg` | Seleção de tamanho | CSS | `packages/storefront/src/app/pages/product-details/sections/product-purchase-section/product-purchase-section.css` |

## Autenticação e conta

| Asset sugerido | Utilização | Implementação atual | Ficheiro |
| --- | --- | --- | --- |
| `arrow-right.svg` | Continuar no login | Caractere | `packages/storefront/src/app/pages/auth/sign-in/sign-in.html` |
| `arrow-right.svg` | Ver detalhes da encomenda | Caractere | `packages/storefront/src/app/pages/account/components/order-card/order-card.html` |
| `arrow-left.svg` | Voltar das encomendas | Caractere | `packages/storefront/src/app/pages/account/order-details/order-details.html` |
| `check.svg` | Estado da encomenda | Caractere | `packages/storefront/src/app/pages/account/order-details/order-details.html` |
| `arrow-right.svg` | Repetir encomenda | Caractere | `packages/storefront/src/app/pages/account/order-details/order-details.html` |
| `empty-orders.svg` | Estado vazio das encomendas | Caractere provisório | `packages/storefront/src/app/pages/account/orders/orders.html` |

## Footer

| Asset sugerido | Utilização | Implementação atual | Ficheiro |
| --- | --- | --- | --- |
| `instagram.svg` | Instagram, desktop e mobile | SVG inline | `packages/shared/src/lib/components/footer/footer.html` |
| `facebook.svg` | Facebook, desktop e mobile | SVG inline | `packages/shared/src/lib/components/footer/footer.html` |
| `tiktok.svg` | TikTok, desktop e mobile | SVG inline | `packages/shared/src/lib/components/footer/footer.html` |

## Convenção para substituição

- O mesmo asset deve ser reutilizado em todas as ocorrências equivalentes.
- Os ícones de ação devem usar `currentColor` quando precisarem acompanhar a
  cor do botão.
- Cada ícone deve manter largura e altura explícitas.
- Ícones decorativos recebem `aria-hidden="true"`.
- Botões que apresentam apenas um ícone mantêm uma label acessível.
