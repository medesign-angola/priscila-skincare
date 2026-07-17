# Plano de correção — conteúdo editorial dos kits

## Objetivo

Corrigir a origem do texto inferior, encapsular o noise no `org-hero` e alinhar o conteúdo editorial ao comportamento e aos espaçamentos do frame do Figma.

## 1. Footnote orientado pelo kit

- Adicionar `editorialFootnote` a `KitHomeTranslation`.
- Definir o texto em PT e FR dentro de cada kit que possua apresentação na Home.
- Incluir o campo no `HomeKitViewModel`.
- Substituir:

```html
{{ 'KITS_SECTION.EDITORIAL_FOOTNOTE' | translate }}
```

por:

```html
{{ kit.editorialFootnote }}
```

- Remover `EDITORIAL_FOOTNOTE` de `pt.json` e `fr.json`, mantendo nesses arquivos apenas textos globais de interface, como “Encontrar” e “Ver produtos”.

## 2. Noise encapsulado no `org-hero`

- Manter `[hasNoise]="true"` nas variantes `org-hero-split` e `org-hero-cover` usadas pela seção de kits.
- Mover a regra `.noise-overlay` de `packages/storefront/src/styles.css` para os estilos dos componentes compartilhados:
  - `hero-split.css`;
  - `hero-cover.css`.
- Garantir a ordem de camadas:
  - mídia/gradiente no fundo;
  - noise acima da mídia;
  - conteúdo acima do noise.
- Usar uma opacidade controlada e sutil, sem alterar a legibilidade do texto.
- Remover a dependência do `@org/shared` em estilos globais do storefront.
- Preservar `hasNoise = false` como default e preservar os `[hasNoise]="false"` explícitos da Hero principal.

## 3. Padding configurável no conteúdo do `org-hero`

- Adicionar ao `HeroSplitComponent` e ao `HeroCoverComponent` um input opcional e retrocompatível:

```ts
contentPadding = input<string>();
```

- Aplicar o valor inline somente quando fornecido; sem input, as classes atuais continuam controlando a Hero existente.
- Na seção de kits, fornecer um padding fluido equivalente aos 32 px do frame de 1440 px:

```html
contentPadding="clamp(1.5rem, 2.222vw, 4rem)"
```

- O mesmo valor será usado nas quatro bordas do container castanho, reproduzindo o inset observado no Figma e adaptando-se a 1536 px e telas maiores.

## 4. Conteúdo superior sticky

- Tornar `.kits-editorial__intro` sticky no desktop.
- Usar como offset o mesmo token fluido do padding editorial, evitando valores desconectados.
- Preservar a largura editorial do texto e os espaços internos entre título e descrição.
- Verificar o contexto de overflow do `org-hero`; caso `overflow-hidden` impeça o sticky real, trocar apenas nessa variante por `overflow: clip` através de um input/configuração opcional, sem alterar o recorte visual nem a Hero principal.
- No mobile, desativar o sticky e manter o bloco em fluxo normal sobre a zona segura da imagem.

## 5. Estrutura visual esperada

No frame de 1440 px:

- conteúdo afastado proporcionalmente das bordas do painel castanho;
- título e descrição no topo esquerdo;
- bloco superior fixando-se dentro dos limites da área editorial durante o scroll;
- CTA e footnote do kit alinhados à base esquerda;
- imagem da modelo e gradiente sem deslocamento;
- noise perceptível, porém sutil.

## 6. Validação

- Conferir PT e FR alternando o idioma pelo seletor já existente.
- Confirmar que cada kit pode fornecer um footnote diferente.
- Confirmar que o noise aparece somente quando `hasNoise` estiver ativo.
- Testar o sticky e os insets em 1440 e 1536 px.
- Testar tablet/mobile e garantir que o conteúdo não cubra o rosto ou ultrapasse o painel.
- Confirmar que a Hero principal não sofreu mudanças visuais.
- Executar formatação, `git diff --check` e build Nx completo com SSR/prerender.

## Correção complementar após validação visual

### Padding vertical local

- Adicionar exclusivamente a `.kits-editorial__intro` o equivalente a `py-8`:

```css
padding-block: 2rem;
```

- Não alterar o inset geral do conteúdo nem o posicionamento do CTA.

### Sticky realmente funcional

- Substituir `overflow: hidden` por `overflow: clip` no wrapper externo `.kits-editorial__hero`.
- Manter `overflowMode="clip"` no `org-hero` interno.
- Essa mudança remove o ancestral de scroll artificial que atualmente impede o comportamento sticky, preservando o recorte visual da mídia.
- Manter `.kits-editorial__intro` com `position: sticky` e offset pelo token `--kits-editorial-inset`.
- Confirmar que o sticky permanece limitado à altura do painel editorial.
- Continuar desativando o sticky no mobile.

### Noise com presença visual

- Adicionar `isolation: isolate` aos containers `hero-cover` e `hero-split` para tornar previsível a composição das camadas.
- Manter a mídia no fundo, elevar o noise acima dela e manter o conteúdo acima do noise.
- Ajustar a textura para uma combinação perceptível sobre o gradiente castanho:
  - `mix-blend-mode: soft-light`;
  - opacidade inicial entre `0.3` e `0.35`, refinada visualmente;
  - `background-size` controlado para evitar que a textura de 1440 px desapareça por escala ou densidade do ecrã.
- Confirmar que o asset `/assets/images/noise.png` responde no build e aparece tanto no `org-hero-split` quanto no `org-hero-cover` quando `hasNoise` for verdadeiro.
- Não ativar o noise na Hero principal, que continua passando `[hasNoise]="false"`.

### Nova validação

- Inspecionar no navegador os estilos computados de `.noise-overlay` e `.kits-editorial__intro`.
- Testar o sticky rolando do início ao fim do painel editorial.
- Conferir o noise em 100% e 125% de escala do navegador.
- Reexecutar build Nx com SSR/prerender e `git diff --check`.

## Commit

Após validação:

```text
fix(storefront): align kits editorial content
```
