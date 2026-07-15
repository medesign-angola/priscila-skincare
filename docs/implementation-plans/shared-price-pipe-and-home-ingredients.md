# Plano de implementação — pipe de preço e seção de ingredientes

## Ordem de execução

O trabalho será dividido em duas funcionalidades completas e dois commits:

1. criar e aplicar a pipe compartilhada de preço;
2. implementar a seção institucional de ingredientes da Home.

Nenhum código será implementado antes da aprovação deste plano.

---

## 1. Pipe compartilhada de preço

### Problema atual

- A hero usa `number: '1.2-2'`, resultando no agrupamento padrão inadequado ao design.
- Os cards e o editorial de produto criam `Intl.NumberFormat` manualmente nos componentes.
- A mesma regra está distribuída em diferentes contextos e pode produzir resultados divergentes.

### Localização

Gerar pelo Nx uma pipe standalone na biblioteca compartilhada:

```text
packages/shared/src/lib/pipes/price-format/price-format.pipe.ts
```

Exportá-la pelo entry point de `@org/shared` para que possa ser usada na hero, nos cards e nas próximas páginas.

### API proposta

```ts
transform(
  value: number | null | undefined,
  currency: 'AOA' | 'EUR',
  language: 'pt' | 'fr' = 'pt',
  includeCurrency = true,
): string
```

Exemplos esperados:

```text
270000 | AOA | pt → Kz 270 000,00
270000 | AOA | fr → 270 000,00 Kz
270 | EUR | pt → 270,00 €
270 | EUR | fr → 270,00 €
```

- Usar `Intl.NumberFormat` internamente.
- Normalizar o símbolo comercial de AOA para `Kz`, conforme o design.
- Preservar duas casas decimais.
- Usar espaços de agrupamento adequados ao locale em vez de vírgulas anglo-saxônicas.
- Retornar string vazia para valores ausentes, evitando `NaN` no template.
- Manter a pipe pura.

### Aplicação

#### Hero

Substituir:

```html
{{ kit.currency }} {{ kit.price | number: '1.2-2' }}
```

pela pipe nova.

Nesta etapa, a hero continuará usando o valor AOA já existente no kit. A migração completa do modelo de kits para preços AOA/EUR deve ser feita quando o contrato de preços do kit for revisto, pois hoje ele só possui um `price` e um `currency`.

#### Produtos destacados

- Remover o `Intl.NumberFormat` do componente da seção.
- Passar valor, moeda e idioma para a pipe antes de entregar o texto ao `ProductCard`, ou adaptar o card para receber o valor bruto caso isso não amplie desnecessariamente o escopo.

#### Editorial em cover

- Remover o segundo `Intl.NumberFormat` manual.
- Formatar o preço no template com a mesma pipe.
- Manter reação imediata ao `HeaderService.currency()` e ao idioma atual.

### Testes da pipe

Criar testes unitários cobrindo:

- AOA em português;
- AOA em francês;
- EUR em português e francês;
- zero;
- valor decimal;
- `null` e `undefined`.

### Branch e commit

Branch sugerida:

```text
codex/refactor/shared-price-format-pipe
```

Commit:

```text
refactor(shared): centralize price formatting
```

---

## 2. Seção institucional de ingredientes

## Referência visual

- Figma: node `161:3450`.
- Estrutura desktop: duas áreas em Flexbox.
- Esquerda: título, descrição, lista de nove ingredientes e nota final.
- Direita: imagem editorial grande.
- Frame de referência: 1440 px de largura, inset lateral fluido e respiro vertical amplo.

### Ingredientes apresentados

1. Hidroxiapatita
2. Papaína
3. Óleo de cravo
4. Xilitol
5. Cobre
6. Neem
7. Bromelaína
8. Óleo de coco
9. Salsinha

### Modelo de dados

Criar uma entidade normalizada, preparada para o futuro backoffice:

```ts
interface Ingredient {
  id: string;
  thumbnailImage: string;
  editorialImage: string;
  translations: {
    pt: { name: string };
    fr: { name: string };
  };
}
```

Criar também uma apresentação específica da Home:

```ts
interface HomeIngredientsPresentation {
  ingredientIds: string[];
  initialIngredientId: string;
  translations: {
    pt: {
      headline: string;
      description: string;
      footnote: string;
    };
    fr: {
      headline: string;
      description: string;
      footnote: string;
    };
  };
}
```

- A entidade `Ingredient` evita repetir nomes e thumbnails em produtos diferentes.
- `ingredientIds` determina seleção e ordem da seção.
- `initialIngredientId` define qual ingrediente e imagem aparecem ao carregar a Home.
- Cada ingrediente possui thumbnail e imagem editorial principal próprias.
- A seção institucional não será acoplada ao `ingredients` interno de um único produto.
- No futuro, produtos poderão referenciar `ingredientIds` no backend.

### Mocks e facade

- Criar os nove ingredientes em mock.
- Criar a configuração da seção da Home com IDs ordenados e imagem editorial.
- Adicionar ao `ProductFacade`, ou a uma facade de catálogo caso a estrutura atual justifique, um `mappedIngredients` e um computed `homeIngredients`.
- Resolver os nomes usando `currentLanguage()`.
- O componente receberá um view model pronto, sem procurar IDs no template.

### Assets

- São necessários nove thumbnails e nove imagens editoriais principais.
- Verificar primeiro se os dezoito arquivos existem localmente.
- Se não existirem, confirmar com o utilizador antes de baixar os assets do Figma.
- Converter os arquivos para WebP, mantendo:
  - thumbnails pequenos e leves;
  - imagem editorial dimensionada para ecrãs de alta densidade;
  - nenhuma URL temporária do MCP no código.

Nomenclatura:

```text
assets/images/ingredients/hydroxyapatite.webp
assets/images/ingredients/editorial/hydroxyapatite.webp
assets/images/ingredients/papain.webp
assets/images/ingredients/editorial/papain.webp
assets/images/ingredients/clove-oil.webp
assets/images/ingredients/xylitol.webp
assets/images/ingredients/copper.webp
assets/images/ingredients/neem.webp
assets/images/ingredients/bromelain.webp
assets/images/ingredients/coconut-oil.webp
assets/images/ingredients/parsley.webp
```

### Componente Angular

Gerar pelo Nx um componente standalone e `OnPush`:

```text
packages/storefront/src/app/pages/home/sections/ingredients-section/
├── ingredients-section.ts
├── ingredients-section.html
└── ingredients-section.css
```

### Layout e comportamento

- Usar Flexbox.
- Área esquerda e imagem direita com proporções fluidas.
- Usar `clamp()` para inset, espaçamentos, tipografia e altura.
- Manter o bloco superior separado da lista e o footnote alinhado à base.
- Cada item terá índice, nome e thumbnail e será um botão semântico.
- O primeiro ingrediente, ou `initialIngredientId`, inicia ativo.
- Ao clicar num ingrediente, a imagem editorial principal muda para a imagem desse ingrediente.
- O item ativo fica com opacidade total; os restantes mantêm opacidade reduzida, conforme o Figma.
- Hover e focus dão pré-destaque visual ao item, mas não alteram a seleção definitiva.
- A troca de imagem terá crossfade suave, sem flash branco e sem desmontar a área de mídia.
- As imagens serão pré-carregadas de forma controlada depois da imagem inicial para que o primeiro clique não fique lento.
- Respeitar `prefers-reduced-motion`, removendo o crossfade quando solicitado pelo sistema.
- Em tablet/mobile, texto aparece primeiro, seguido pela imagem editorial e lista legível, sem comprimir thumbnails.
- Usar `loading="lazy"`, `decoding="async"` e dimensões intrínsecas.

### Acessibilidade

- Seção identificada por `aria-labelledby`.
- Lista semântica ordenada com botões reais.
- Thumbnails decorativos terão `alt=""` quando o nome adjacente já descrever o ingrediente.
- O botão ativo terá `aria-pressed="true"` e associação acessível com a imagem apresentada.
- A seleção funcionará por clique, Enter e Espaço.
- Não depender exclusivamente do hover para leitura ou seleção.

### Integração na Home

- Inserir a seção depois da galeria editorial de produto, seguindo a ordem recebida.
- Encapsular todo o CSS no componente.

### Validação

- Comparar em 1440 e 1536 px.
- Testar desktop, tablet e mobile.
- Confirmar os nove ingredientes na ordem definida.
- Confirmar mudança da imagem por clique e teclado.
- Confirmar estado ativo, crossfade sem flash e movimento reduzido.
- Confirmar PT/FR sem reload.
- Verificar peso das dezoito imagens.
- Executar testes da pipe, build do core/shared e build Nx da storefront.
- Executar `git diff --check`.

### Branch e commit

Após concluir a pipe, criar:

```text
codex/feature/home-ingredients-section
```

Commit:

```text
feat(storefront): add home ingredients section
```
