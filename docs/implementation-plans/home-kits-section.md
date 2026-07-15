# Plano de implementação — seção de kits da Home

## Referências do Figma

- Área editorial do kit: node `161:3408` (1440 × 925).
- Área “Encontrar”: node `161:3333` (1440 × 422).

Os dois frames serão tratados como uma única seção funcional da Home, composta por duas áreas visuais independentes:

1. destaque editorial imersivo;
2. navegação por quatro kits.

## Leitura do design

### 1. Destaque editorial

- Respiro vertical externo proporcional à viewport.
- Painel de mídia com aproximadamente 16:9, fundo em tons de castanho/dourado e imagem ocupando prioritariamente o lado direito.
- Conteúdo alinhado à esquerda e distribuído verticalmente:
  - título curto em caixa alta;
  - descrição editorial;
  - CTA “Ver produtos” com seta;
  - texto complementar na base.
- A mídia deve preencher o painel sem deformação e admitir imagem ou vídeo conforme o modelo do kit.

### 2. Área “Encontrar”

- Fundo branco e espaçamento interno responsivo.
- Título lateral/sticky em desktop.
- Quatro cartões em linha, implementados com Flexbox.
- Cada cartão contém imagem 1:1 aproximada, índice `01–04` e descrição curta em caixa alta.
- Em telas menores, a lista passa a ser um carrossel horizontal nativo com `scroll-snap`, sem biblioteca adicional.

## Alterações de dados e domínio

### `ProductService`

- Adicionar `getKits()` para disponibilizar o catálogo completo.
- Manter `getFeaturedKits()` como projeção exclusiva da Hero.
- Evitar que a nova seção dependa apenas dos kits marcados como `featured`.

### `ProductFacade`

- Criar o signal `kits` com todos os kits.
- Alimentar `featuredKits` a partir da seleção destinada à Hero, preservando o comportamento atual.
- Alterar `kitsWithProducts` para projetar `kits()` e resolver `productIds` por meio do `mappedProducts()` já existente.
- Expor um computed específico e ordenado para os quatro kits apresentados na Home, sem fazer pesquisas repetidas por produto no template.

### Modelo `Kit`

- Preservar os atributos existentes de mídia e descrição.
- Acrescentar somente os metadados de apresentação que pertencem ao domínio da seção, como:
  - `homeOrder?: number`;
  - `thumbnailImage?: string`;
  - `editorialDescription?: string`, caso o texto inferior não represente a descrição principal do kit.
- Não colocar classes CSS, medidas ou textos de interface dentro do modelo.

### Mocks

- Ajustar/criar quatro kits coerentes com os cartões do Figma.
- Relacionar cada kit aos produtos existentes exclusivamente por `productIds`.
- Garantir que nenhum ID inválido produza cartões incompletos.
- Manter os kits usados pela Hero funcionais e sem alteração visual acidental.

## Assets

- Obter do Figma as imagens dos quatro cartões e a mídia editorial.
- Converter imagens raster para WebP, preservando enquadramento e qualidade visual.
- Criar versões adequadas ao uso real, evitando carregar imagens de largura total nos thumbnails.
- Para vídeo, manter arquivo otimizado e poster WebP; aplicar `preload="metadata"` ou `none` conforme a posição final da seção.
- Armazenar em `packages/storefront/public/assets/images/kits/` e, se necessário, `assets/videos/kits/`.
- Registrar dimensões e peso final no encerramento da implementação.

## Componente Angular

Criar um componente standalone e `OnPush`:

```text
packages/storefront/src/app/pages/home/sections/kits-section/
├── kits-section.ts
├── kits-section.html
└── kits-section.css
```

### TypeScript

- Injetar `ProductFacade`.
- Importar e reutilizar os componentes `org-hero-*` existentes em `@org/shared`, seguindo a mesma integração já utilizada pela Hero da Home.
- Construir um view model por `computed`, contendo:
  - dados traduzidos do kit;
  - produtos já resolvidos;
  - mídia editorial e thumbnail;
  - índice formatado;
  - link/intent para visualizar o kit ou seus produtos.
- Evitar chamadas de métodos de transformação diretamente no template.

### Template

- Usar elementos semânticos (`section`, headings, links/botões e lista).
- Renderizar a área editorial a partir do kit selecionado para destaque usando o `org-hero` correspondente ao `mediaStyle` (`cover` ou `split-right`).
- Manter no `org-hero` a responsabilidade por imagem/vídeo, poster, blur-up, enquadramento e comportamento de carregamento.
- Projetar sobre essa base apenas o conteúdo específico do frame: título, descrição, CTA e texto complementar.
- Renderizar os quatro cartões com `@for (...; track kit.id)`.
- Incluir `alt` significativo nas imagens e rótulo acessível no CTA.
- Emitir ou encaminhar apenas a intenção de navegação; não inventar rota de detalhe ainda inexistente.

### CSS responsivo

- Usar Flexbox, conforme o padrão definido para a Home.
- Aproveitar a estrutura e o comportamento responsivo oferecidos pelo `org-hero`; criar apenas os overrides locais indispensáveis à aparência desta seção.
- Não duplicar em `kits-section.css` regras de mídia, vídeo, blur-up ou posicionamento que já pertençam ao componente compartilhado.
- Usar `clamp()`, percentuais, `aspect-ratio`, `min()` e `max()` para escala fluida.
- Evitar medidas rígidas extraídas literalmente do frame de 1440 px.
- Preservar a proporção visual em 1440, 1536 e resoluções maiores.
- Em tablet/mobile:
  - reposicionar o conteúdo editorial sobre uma área de contraste segura;
  - tornar o título “Encontrar” não sticky;
  - permitir scroll horizontal dos cartões com `scroll-snap`;
  - respeitar `prefers-reduced-motion` caso exista animação de entrada.

## Tradução

- Adicionar as chaves de interface em `pt.json` e `fr.json`:
  - título “Encontrar”;
  - CTA “Ver produtos”;
  - rótulos acessíveis.
- Manter os conteúdos próprios dos kits no modelo com estrutura traduzível, ou adaptar o modelo para traduções PT/FR se a análise durante a implementação confirmar que esses textos mudam por idioma.
- A troca de idioma deve atualizar a seção imediatamente pelo signal já conectado ao serviço de tradução.

## Integração na Home

- Importar `KitsSection` no `HomeComponent`.
- Inserir `<app-kits-section />` depois de produtos destacados, seguindo a ordem atual dos frames fornecidos.
- Manter `home.css` apenas como estilo do container da página; todo o visual ficará em `kits-section.css`.

## Reutilização do `org-hero`

- A área editorial faz parte da mesma família visual das banners da Hero e será construída sobre os componentes compartilhados já existentes.
- O fluxo seguirá o padrão atual da Home:
  - `mediaStyle: 'cover'` seleciona a variante de cobertura;
  - `mediaStyle: 'split-right'` seleciona a variante dividida;
  - `mediaType`, `mediaUrl` e `placeholderUrl` continuam vindo do modelo `Kit`.
- As diferenças do novo design serão tratadas por conteúdo projetado/inputs disponíveis e estilos locais da seção.
- Se algum pequeno comportamento visual necessário não puder ser configurado atualmente, será criado um input opcional e retrocompatível no componente compartilhado, mantendo inalterada a Hero existente.
- Não será criada uma segunda implementação de banner ou mídia em paralelo ao `org-hero`.

## Validação

- Conferência visual nas larguras 1440 e 1536, além de tablet e mobile.
- Confirmar que as duas áreas mantêm continuidade visual e não causam overflow horizontal na página.
- Confirmar que Hero, Pilares e Produtos Destacados continuam inalterados.
- Confirmar que qualquer extensão feita no `org-hero` é retrocompatível e não altera os banners já existentes.
- Confirmar que os kits resolvem produtos pelo `mappedProducts` e ignoram IDs ausentes com segurança.
- Verificar carregamento e peso dos assets.
- Executar formatação e `git diff --check`.
- Executar o build do storefront pelo Nx, incluindo SSR/prerender.

## Estratégia de branch e commit

- Criar, após aprovação, a branch `codex/feature/home-kits-section` a partir do estado atual validado.
- Fazer um commit único quando as duas áreas estiverem completas e validadas:

```text
feat(storefront): add home kits section
```

As duas áreas pertencem à mesma funcionalidade e compartilham modelo, assets e view model; por isso serão gravadas juntas.
