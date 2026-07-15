# Plano de implementação — galeria editorial de produto da Home

## Referência

- Figma: node `161:3363`.
- Produto representado no design: Snow White Oil.
- A seção possui texto editorial, uma mídia principal central e cinco imagens numeradas.

## Nomenclatura recomendada para o backoffice

Evitar novos campos booleanos como `featured`, `featuredTwo` ou nomes baseados na ordem da página. A ordem da Home pode mudar, enquanto a função visual da seção permanece.

Usar o campo **Posicionamentos na Home**, permitindo que um produto tenha mais de um posicionamento:

| Chave técnica       | Nome exibido no backoffice | Uso                                                         |
| ------------------- | -------------------------- | ----------------------------------------------------------- |
| `featured-products` | Home — Produtos destacados | Cards da seção de produtos destacados já existente          |
| `editorial-cover`   | Home — Editorial em cover  | Seção criada com vídeo/imagem em tela ampla e CTA           |
| `editorial-gallery` | Home — Galeria editorial   | Nova composição com mídia central e cinco imagens numeradas |

Entre as duas seções editoriais mencionadas pelo utilizador:

- Caramel Body Cream: `editorial-cover`;
- novo produto selecionado: `editorial-gallery`.

Essas chaves são semânticas, estáveis e podem virar opções de enum no Laravel/backoffice.

## Evolução do modelo

Introduzir um modelo discriminado, preparado para um produto ocupar diferentes áreas:

```ts
type ProductHomePlacement =
  | {
      type: 'featured-products';
      order: number;
    }
  | {
      type: 'editorial-cover';
      order: number;
      mediaType: 'image' | 'video';
      mediaUrl: string;
      placeholderUrl?: string;
      hasNoise?: boolean;
    }
  | {
      type: 'editorial-gallery';
      order: number;
      coverImage: string;
      imageIndexes: number[];
    };
```

No produto:

```ts
homePlacements?: ProductHomePlacement[];
```

### Migração sem quebra

- Migrar o atual `homeEditorial` do Caramel Body Cream para `type: 'editorial-cover'`.
- Nesta etapa, manter `featured`/`featuredOrder` funcionando para os cards atuais, reduzindo o risco da mudança.
- Preparar o facade para também compreender `featured-products`; a remoção definitiva dos campos antigos fica para quando o backend/backoffice adotar o novo contrato.
- Não usar um único campo `highlighted`, pois ele não informa onde nem como o produto será apresentado.

## Imagens do produto

- Manter `Product.images` como a galeria canônica, agora com validação futura de no mínimo cinco imagens.
- A nova seção usa cinco posições numeradas por meio de `imageIndexes`, sem copiar URLs para o posicionamento.
- A imagem central é `coverImage`, pois o Figma contém seis posições visuais: uma principal mais cinco numeradas.
- No Laravel, validar que os índices configurados existem no produto.
- Caso o produto tenha mais de cinco imagens, o backoffice permitirá escolher exatamente quais cinco e a respetiva ordem.

## Produto desta etapa

- Verificar qual produto existente melhor corresponde ao Snow White Oil do mock.
- Se ele ainda não existir como entidade, selecionar temporariamente um produto Snow White existente com mídia suficiente, sem alterar o nome comercial dele.
- Marcar somente esse produto com `editorial-gallery`.
- Não adicioná-lo automaticamente à vitrine de cards nem ao `editorial-cover`.
- Conteúdo de título e descrição deve vir da tradução do produto/posicionamento, nunca do template.

## Facade

Criar helpers/computeds por chave semântica:

```ts
featuredGridProducts;
editorialCoverProducts;
editorialGalleryProducts;
```

- Cada computed filtra `homePlacements` pelo `type` correspondente.
- A ordenação usa `order` do posicionamento, não a ordem do array de produtos.
- O computed da galeria resolve `coverImage` e os cinco `imageIndexes` contra a entidade do produto.
- Um posicionamento inválido ou incompleto não deve quebrar a Home; ele será omitido.

## Componente da nova seção

Gerar um componente standalone e `OnPush`:

```text
packages/storefront/src/app/pages/home/sections/product-editorial-gallery-section/
├── product-editorial-gallery-section.ts
├── product-editorial-gallery-section.html
└── product-editorial-gallery-section.css
```

- Usar Flexbox, seguindo a preferência já definida para a Home.
- Coluna esquerda: texto sticky no topo e imagens `01`/`02` na base.
- Centro: `coverImage` vertical e dominante.
- Coluna direita: imagens `03`/`04`/`05`.
- Números serão elementos de interface sobre as imagens, não parte dos arquivos.
- Usar `clamp()`, proporções e `aspect-ratio`, evitando dimensões rígidas dependentes apenas de 1440 px.
- Em telas menores, transformar a composição em faixa horizontal ou sequência vertical legível, mantendo a imagem principal em destaque.
- Respeitar `loading="lazy"`, `decoding="async"` e dimensões intrínsecas para reduzir layout shift.

## Conteúdo traduzível

Adicionar conteúdo específico do posicionamento `editorial-gallery`:

```ts
galleryEditorial?: {
  headline: string;
  description: string;
};
```

- PT e FR serão resolvidos pelo idioma atual.
- O nome técnico do posicionamento não será traduzido no modelo; apenas o rótulo do backoffice.

## Assets

- Usar as imagens locais do produto quando estiverem disponíveis.
- Converter para WebP e gerar tamanhos adequados à posição central e às miniaturas editoriais, se os arquivos atuais forem JPG/PNG pesados.
- Não manter URLs temporárias do MCP do Figma no código.
- Antes de qualquer exportação/conversão, confirmar com o utilizador se os arquivos já existem localmente.

## Integração na Home

- Inserir `<app-product-editorial-gallery-section />` depois da seção editorial em cover, conforme a sequência enviada.
- Manter HTML, CSS e lógica encapsulados no componente da seção.

## Validação

- Conferir a composição em 1440, 1536 e telas maiores.
- Conferir comportamento em tablet e mobile.
- Confirmar exatamente uma mídia central e cinco imagens numeradas.
- Confirmar troca PT/FR sem reload.
- Confirmar que Caramel Body Cream aparece apenas em `editorial-cover`.
- Confirmar que o novo produto aparece apenas em `editorial-gallery`, salvo configuração explícita adicional.
- Confirmar que a vitrine anterior continua com três cards.
- Executar `git diff --check`, lint direcionado e build Nx.

## Branch e commit

Criar, após aprovação:

```text
codex/feature/home-product-editorial-gallery
```

Commit sugerido:

```text
feat(storefront): add product editorial gallery section
```
