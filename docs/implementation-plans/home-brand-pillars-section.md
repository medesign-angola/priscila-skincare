# Seção de compromissos da marca — Home

## Referência analisada

- Figma: node `161:3390`.
- Frame desktop: `1440 × 245 px`.
- Conteúdo interno: `1376 px`, iniciado em `x: 32 px` e `y: 80 px`.
- Quatro colunas de `320 px`, separadas por gaps de `32 px`.
- Nenhum asset de imagem, ícone ou interação.

## Correção do nome da branch

A branch foi criada como `codex/feature/home-featured-products` antes de o node estar acessível. Como o design representa compromissos institucionais e não produtos destacados, renomeá-la para:

```text
codex/feature/home-brand-pillars
```

Isso altera apenas o nome local da branch; não modifica commits nem código.

## Estrutura Angular

1. Adicionar a nova `<section>` imediatamente depois do encerramento da hero em `home.html`.
2. Representar os quatro itens por uma coleção readonly no `HomeComponent`, contendo apenas chaves de tradução:
   - título;
   - descrição.
3. Renderizar os itens com `@for`, mantendo o template conciso e permitindo futuras alterações editoriais sem duplicar markup.
4. Usar estrutura semântica de seção + lista + artigos; incluir um heading acessível visualmente oculto para identificar o bloco sem introduzir texto que não existe no mock.
5. Importar `TranslatePipe` no componente standalone da home.

## Conteúdo

### Português

1. Fórmulas com ativos
   - Nossas fórmulas têm ativos de cuidado da pele altamente concentrados.
2. Peles sensíveis
   - Nossos produtos são testados para todos os tipos de pele, incluindo as sensíveis.
3. Fabricado na França
   - Desenvolvemos e fabricamos nossas fórmulas na França.
4. Certificado de segurança
   - Todos os nossos produtos são certificados e feitos para sua segurança.

### Francês

Adicionar traduções equivalentes ao catálogo `fr.json`, usando a mesma estrutura de chaves do catálogo português.

## Fidelidade visual e escala fluida

Criar classes próprias em `home.css`, usando o frame de `1440px` como referência visual, mas sem prender a composição a medidas rígidas:

- padding horizontal e vertical através de `clamp()` e unidades relativas, calibrado para coincidir com o mock em `1440px` e crescer de forma controlada em `1536px`, `1920px` e superiores;
- container `display: flex` com quatro itens de largura equivalente, usando `flex: 1 1 0`;
- gap também fluido com `clamp()`, mantendo a proporção visual entre as colunas em ecrãs maiores;
- divisória direita `1px solid #ddd7ce` nas três primeiras colunas;
- padding interno de cada item em unidade relativa e com escala fluida;
- texto `#1a1917`;
- título Inter com tamanho fluido por `clamp()`, peso `600`, uppercase e letter-spacing relativo;
- descrição Inter com tamanho fluido por `clamp()`, peso normal e line-height `1.5`;
- distância vertical entre título e descrição definida por `clamp()`;
- altura natural da seção, sem `height` fixa;
- manter títulos e descrições completos, sem truncamento ou `line-clamp`;
- permitir que a altura natural acompanhe traduções maiores, mantendo o alinhamento pelo próprio Flexbox.

Valores absolutos serão usados somente onde representam uma constante visual que não deve escalar, como a borda física de `1px`. Espaçamentos, tipografia e largura não ficarão presos a `80px`, `32px`, `16px` ou outros valores fixos.

### Estratégia para ecrãs maiores

1. Não aplicar um `max-width` que congele a faixa em `1440px`; ela continuará ocupando a largura disponível.
2. Usar proporções fluidas com limites sensatos em `clamp()` para que o conteúdo cresça em ecrãs maiores sem produzir espaços ou textos excessivos.
3. Manter cada item com a mesma participação no Flexbox, independentemente da largura total.
4. Usar `clamp()` no `font-size`, gaps e paddings para preservar a leitura proporcional do mock sem truncar conteúdo.

## Responsividade

O node fornecido cobre desktop; para manter a seção funcional nos restantes breakpoints:

1. Até `905px`: ativar `flex-wrap`; cada item ocupará aproximadamente metade da linha através de um `flex-basis` percentual que considera o gap fluido, com divisórias reorganizadas entre linhas e colunas.
2. Até `600px`: mudar `flex-direction` para coluna; cada item ocupará toda a largura, com padding lateral e vertical fluidos e divisórias horizontais entre itens.
3. Não usar carrossel nem scroll horizontal, pois os conteúdos são curtos e informativos.

## Tradução

Adicionar as chaves em `HOME.BRAND_PILLARS` nos dois catálogos:

- `LABEL` para o heading acessível;
- `ACTIVE_FORMULAS.TITLE` e `DESCRIPTION`;
- `SENSITIVE_SKIN.TITLE` e `DESCRIPTION`;
- `MADE_IN_FRANCE.TITLE` e `DESCRIPTION`;
- `SAFETY_CERTIFIED.TITLE` e `DESCRIPTION`.

Confirmar programaticamente que PT e FR continuam com o mesmo conjunto de chaves.

## Ficheiros previstos

- `packages/storefront/src/app/pages/home/home.ts`
- `packages/storefront/src/app/pages/home/home.html`
- `packages/storefront/src/app/pages/home/home.css`
- `packages/storefront/public/assets/i18n/pt.json`
- `packages/storefront/public/assets/i18n/fr.json`

Também será renomeada a branch local. Nenhum model, mock, facade, header ou asset será alterado.

## Validação

1. Conferir a composição em `1440px` contra o screenshot e metadata do Figma.
2. Validar que `1536px`, `1920px` e larguras superiores mantêm as proporções e aproveitam o espaço disponível.
3. Validar o comportamento Flexbox com quatro, duas e uma coluna nos breakpoints definidos.
4. Alternar PT/FR e confirmar títulos, descrições e label acessível.
5. Confirmar que a seção começa imediatamente depois da hero e que o scroll Lenis continua normal.
6. Comparar as chaves dos catálogos PT/FR.
7. Executar Prettier, `git diff --check` e build de desenvolvimento do storefront via Nx, incluindo SSR.

## Fora do escopo

- Seção de produtos destacados.
- Animações de entrada ao scroll.
- Alterações na hero.
- Novos assets ou dependências.
