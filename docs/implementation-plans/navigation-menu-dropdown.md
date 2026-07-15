# Plano de implementação — Dropdown de produtos do header

Status: implementado — aguardando revisão visual e autorização para commit  
Branch: `codex/feature/navigation-menu-dropdown`  
Referência Figma: arquivo `VFgpUdcrnOLXhHrrfc9RZ5`, node `161:4074`  
Escopo desta etapa: dropdown desktop aberto ao clicar em **Produtos**

## 1. Resultado esperado

Ao clicar em **Produtos**, o header manterá a sua posição sobre a hero e abrirá um painel branco imediatamente abaixo dele, alinhado às margens laterais do header. O painel exibirá:

- CTA **Ver todos** no topo, com seta à direita;
- os 14 produtos do catálogo em sequência numerada (`01`–`14`);
- nome traduzido do produto;
- thumbnail de `40 × 40 px` alinhada à direita;
- rolagem interna quando a altura disponível for insuficiente.

O clique novamente em **Produtos**, a tecla `Escape`, um clique fora do painel ou uma navegação fecharão o dropdown.

## 2. Decisões de arquitetura

### Componente responsável

O dropdown ficará dentro do `HeaderComponent`, em `@org/shared`, porque visualmente e comportamentalmente pertence à navegação global.

O `shared` não importará `ProductFacade` nem qualquer tipo de `core`. O componente receberá uma lista simples por `input()`. Isso preserva a direção atual das dependências:

```text
storefront ──► shared
storefront ──► core

shared não depende de core
```

### Origem dos dados

O `App` continuará sendo o ponto de composição. Ele transformará `facade.products()` em uma lista pequena, já traduzida, e a entregará ao header:

```ts
readonly headerProducts = computed(() => {
  const language = this.facade.currentLanguage();

  return this.facade.products().map((product) => ({
    id: product.id,
    name: product.translations[language].name,
    image: product.images[0],
  }));
});
```

No template raiz:

```html
<org-header
  [products]="headerProducts()"
  [theme]="headerService.theme()"
  [currentLanguage]="facade.currentLanguage()"
  [currency]="headerService.currency()"
/>
```

## 3. Alterações previstas por arquivo

### `packages/shared/src/lib/components/header/header.ts`

Será criado um view model local e pequeno:

```ts
export interface HeaderProductItem {
  id: string;
  name: string;
  image: string;
}
```

O componente receberá os produtos e controlará o estado do painel com Signals:

```ts
products = input<readonly HeaderProductItem[]>([]);
productsMenuOpen = signal(false);

toggleProductsMenu(): void;
closeProductsMenu(): void;
```

Também serão tratados:

- `Escape` para fechar;
- clique fora do conjunto header/painel;
- fechamento após selecionar **Ver todos** ou um produto;
- estado `aria-expanded` sincronizado com o Signal.

Não será utilizado acesso direto a `document` durante SSR sem proteção. Eventos globais serão registrados por recursos compatíveis com Angular e liberados ao destruir o componente.

### `packages/shared/src/lib/components/header/header.html`

O link **Produtos** será convertido em botão sem aparência nativa, pois ele passa a controlar um menu:

```html
<button
  type="button"
  aria-haspopup="menu"
  [attr.aria-expanded]="productsMenuOpen()"
  aria-controls="products-navigation-menu"
  (click)="toggleProductsMenu()"
>
  Produtos
</button>
```

O painel será renderizado condicionalmente com a sintaxe de controle do Angular:

```html
@if (productsMenuOpen()) {
<section id="products-navigation-menu" aria-label="Produtos">
  <a routerLink="/produtos" (click)="closeProductsMenu()">
    <span>Ver todos</span>
    <!-- seta reutilizável em SVG -->
  </a>

  <ul role="menu">
    @for (product of products(); track product.id; let index = $index) {
    <li role="none">
      <a role="menuitem" (click)="closeProductsMenu()">
        <span>{{ formatIndex(index) }}</span>
        <span>{{ product.name }}</span>
        <img [src]="product.image" [alt]="product.name" />
      </a>
    </li>
    }
  </ul>
</section>
}
```

Como ainda não existe rota de detalhe de produto, os itens individuais não receberão uma rota inventada nesta funcionalidade. Eles terão comportamento visual e acessível de item; a navegação será conectada quando a rota de produto for definida. **Ver todos** apontará para `/produtos`, conforme a intenção já presente no header, embora essa rota ainda precise ser criada em uma funcionalidade posterior.

### `packages/shared/src/lib/components/header/header.css`

Será adicionado um stylesheet próprio para evitar tornar o template ainda mais extenso e para representar com precisão o estado aberto.

Parâmetros extraídos do Figma:

| Propriedade            |                        Valor |
| ---------------------- | ---------------------------: |
| Fundo                  |                    `#ffffff` |
| Raio                   |                        `2px` |
| Padding interno        |                       `32px` |
| Recuo do CTA           |                       `16px` |
| Padding do CTA         |                  `12px 24px` |
| Espaço CTA/lista       |                       `16px` |
| Altura de cada produto |                       `40px` |
| Espaço entre produtos  |                        `4px` |
| Thumbnail              |                  `40 × 40px` |
| Tipografia             |     Inter, `14px`, uppercase |
| Tracking               |                     `0.28px` |
| Cor primária/CTA       |                    `#7d6645` |
| Cor do texto           | `#1a1917` com `opacity: 0.5` |

Posicionamento previsto:

```css
.products-menu {
  position: fixed;
  top: 110px;
  left: 40px;
  right: 40px;
  max-height: calc(100dvh - 110px);
  overflow-y: auto;
  background: #fff;
  border-radius: 2px;
  padding: 32px;
}
```

O `z-index` ficará abaixo do conteúdo interativo do header e acima da hero. O painel não substituirá nem escurecerá o fundo da hero, seguindo a captura fornecida.

As transições respeitarão `prefers-reduced-motion`. A abertura usará uma animação breve de opacidade e deslocamento vertical; não será adicionada nova dependência.

### `packages/storefront/src/app/app.ts`

- importar `computed`;
- criar `headerProducts` a partir de `ProductFacade`;
- garantir atualização automática dos nomes quando o idioma mudar.

### `packages/storefront/src/app/app.html`

- conectar `[products]="headerProducts()"` ao `org-header`;
- manter os bindings atuais de tema, idioma e moeda.

### Assets do catálogo

O inventário do mock e do filesystem mostra que a convenção já está definida:

| Produto                     |          Mock |                                   Assets locais |
| --------------------------- | ------------: | ----------------------------------------------: |
| `product-1`                 |     4 imagens | 4 JPEGs (`product-1-1.jpg` a `product-1-4.jpg`) |
| `product-2`                 |     4 imagens | 4 JPEGs (`product-2-1.jpg` a `product-2-4.jpg`) |
| `product-3`                 |     4 imagens | 4 JPEGs (`product-3-1.jpg` a `product-3-4.jpg`) |
| `product-4` a `product-11`  | 1 imagem cada |                              1 JPEG por produto |
| `product-12` a `product-14` | 1 imagem cada |                                  ainda ausentes |

Existem, portanto, 20 imagens locais: as primeiras 12 pertencem aos três primeiros produtos e as oito seguintes pertencem aos produtos 4–11. Esses assets serão preservados e reutilizados; não serão baixados novamente nem duplicados.

O problema atual é de correspondência de extensão: o mock referencia `.png`, mas os 20 arquivos existentes são `.jpg`. Durante a implementação:

1. todos os caminhos existentes no mock serão corrigidos de `.png` para `.jpg`;
2. somente os thumbnails ausentes de `product-12`, `product-13` e `product-14` serão obtidos dos respectivos nodes do Figma;
3. esses três arquivos serão salvos como `product-12-1.jpg`, `product-13-1.jpg` e `product-14-1.jpg` em `packages/storefront/public/assets/images/products/`;
4. o dropdown usará `product.images[0]`, sem criar uma segunda estrutura de assets;
5. não haverá hotlink para as URLs temporárias do Figma.

Não serão redimensionados ou recomprimidos os 20 arquivos existentes nesta funcionalidade, pois isso seria uma otimização de mídia separada. Também não serão alterados benefícios, reviews ou outras informações do catálogo.

## 4. Comportamentos e acessibilidade

### Abertura e fechamento

- clique em **Produtos**: alterna aberto/fechado;
- clique dentro do painel: não fecha, exceto ao escolher uma ação;
- clique fora: fecha;
- `Escape`: fecha e devolve o foco ao botão **Produtos**;
- mudança de rota: fecha;
- apenas um painel de navegação poderá estar aberto por vez.

### Teclado e semântica

- botão com `aria-haspopup` e `aria-expanded`;
- painel identificado por `aria-controls`;
- foco visível em CTA e itens;
- ordem de tabulação natural;
- thumbnails com texto alternativo útil;
- números visuais não serão anunciados de forma redundante.

### Responsividade

O node recebido especifica o layout desktop. Nesta funcionalidade:

- desktop/tablet largo: fidelidade ao frame enviado;
- larguras menores: painel preserva margens seguras, reduz padding e usa rolagem interna;
- o desenho de uma navegação mobile completa não será inventado sem um frame próprio do Figma.

## 5. Fora do escopo

- criar página `/produtos`;
- criar página de detalhe de produto;
- implementar dropdowns de **Coleção**, idioma, conta ou carrinho;
- alterar a composição visual da hero;
- adicionar backend, busca ou filtros;
- adicionar bibliotecas de overlay/animação.

## 6. Sequência de implementação

1. Preservar os 20 assets existentes e baixar somente os três produtos ausentes.
2. Normalizar no mock as extensões dos caminhos para `.jpg`.
3. Criar o view model traduzido no `App`.
4. Adicionar o input e o estado do menu no `HeaderComponent`.
5. Implementar o markup acessível no header.
6. Implementar estilos e posicionamento fiéis ao Figma.
7. Implementar fechamento por clique externo, `Escape` e seleção.
8. Conferir visualmente sobre a hero nas larguras de referência.
9. Executar as validações Nx.
10. Apresentar o diff e os resultados antes de solicitar autorização para commit.

## 7. Validação prevista

Os comandos serão executados pelo package manager do workspace:

```powershell
npm.cmd exec nx run shared:lint
npm.cmd exec nx run shared:typecheck
npm.cmd exec nx run storefront:lint
npm.cmd exec nx run storefront:typecheck
npm.cmd exec nx run storefront:build
```

Checklist visual e funcional:

- [ ] painel alinhado às margens do header;
- [ ] painel inicia abaixo da navegação e sobre a hero;
- [ ] CTA e seta correspondem ao Figma;
- [ ] lista apresenta exatamente 14 produtos;
- [ ] numeração usa dois dígitos;
- [ ] nomes acompanham o idioma atual;
- [ ] thumbnails são locais, nítidos e `40 × 40px`;
- [ ] painel não ultrapassa a viewport sem permitir scroll;
- [ ] abertura e todos os caminhos de fechamento funcionam;
- [ ] interação por teclado e foco funcionam;
- [ ] SSR continua compilando;
- [ ] lint, typecheck e build passam.

## 8. Estratégia de commit

Após implementação e validação completas, será proposto um único commit lógico:

```text
feat(shared): add products navigation dropdown
```

O commit só será criado após autorização explícita.

## 9. Pontos que a aprovação deste plano confirma

Ao aprovar, considera-se autorizado:

1. implementar o dropdown como parte do `HeaderComponent` compartilhado;
2. fornecer os produtos pelo `App`, sem acoplar `shared` a `core`;
3. usar o comportamento de fechamento descrito;
4. reutilizar os 20 assets existentes, adicionar somente os três ausentes e corrigir as extensões do mock;
5. limitar esta entrega ao layout desktop/adaptação segura, sem inventar um menu mobile completo;
6. não criar ainda as páginas de catálogo e detalhe.
