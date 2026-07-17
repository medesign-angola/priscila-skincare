# Integração do storefront com o serviço de tradução

## Objetivo desta etapa

Ligar a preferência de idioma já controlada pelo header ao `@ngx-translate`, tornando funcional a tradução da navegação e do novo bloco de idioma/moeda. Esta será a primeira integração completa do fluxo, sem ainda traduzir toda a home.

## Arquitetura

1. Manter temporariamente `ProductFacade.currentLanguage` como fonte única de verdade para `pt | fr`, evitando introduzir dois estados concorrentes nesta feature.
2. Injetar `TranslateService` no componente raiz do storefront.
3. Criar um `effect` no componente raiz que:
   - observa `facade.currentLanguage()`;
   - chama `TranslateService.use(language)`;
   - mantém o ngx-translate sincronizado quando “Atualizar preferências” emite o novo idioma.
4. Não ligar moeda ao idioma. `AOA/EUR` continuará independente de `pt/fr`.

## Textos incluídos nesta primeira etapa

Adicionar chaves equivalentes em `pt.json` e `fr.json` para:

- Header:
  - Produtos;
  - Coleção;
  - Sobre.
- Dropdown de navegação:
  - Ver todos;
  - labels acessíveis de Produtos e Coleções.
- Bloco de preferências:
  - Linguagem e moeda;
  - Fechar preferências;
  - Idioma;
  - Português;
  - Francês;
  - Moeda e mercado;
  - Angola;
  - Europa;
  - Atualizar preferências.

Os nomes de produtos e coleções não serão colocados nos JSON nesta etapa:

- produtos já usam `product.translations[language]`;
- coleções ainda não possuem um modelo traduzível e continuarão com os nomes do mock.

## Componentes

### Header compartilhado

1. Importar `TranslatePipe` no componente standalone.
2. Substituir os textos fixos do template por chaves do ngx-translate.
3. Traduzir também `aria-label` e o título dinâmico do painel através de `TranslateService`/pipe, evitando acessibilidade apenas em português.
4. Preservar as traduções dos nomes de produtos recebidas pelo input e todo o comportamento atual dos dropdowns.

### Storefront raiz

1. Injetar `TranslateService`.
2. Sincronizar o serviço com `ProductFacade.currentLanguage` através de um único `effect`.
3. Manter o binding atual do header; confirmar Francês continuará atualizando o signal e passará também a atualizar o ngx-translate.

## Catálogos JSON

1. Organizar as novas chaves em grupos previsíveis:
   - `HEADER`;
   - `NAVIGATION_MENU`;
   - `PREFERENCES`.
2. Manter as chaves existentes `GLOBAL` e `HOME` sem remoções.
3. Garantir a mesma estrutura e o mesmo conjunto de chaves em Português e Francês.

## Ficheiros previstos

- `packages/storefront/src/app/app.ts`
- `packages/shared/src/lib/components/header/header.ts`
- `packages/shared/src/lib/components/header/header.html`
- `packages/storefront/public/assets/i18n/pt.json`
- `packages/storefront/public/assets/i18n/fr.json`

Não são previstas alterações no CSS, models, mocks ou serviço de moeda.

## Validação

1. Abrir o bloco com Português ativo e confirmar que nada muda antes de aplicar.
2. Selecionar Francês e aplicar:
   - header passa para Francês;
   - dropdown e bloco de preferências passam para Francês;
   - nomes dos produtos usam as traduções francesas existentes;
   - moeda permanece inalterada.
3. Repetir o fluxo para voltar a Português.
4. Fechar sem aplicar e confirmar que o idioma global não muda.
5. Confirmar carregamento no browser e renderização SSR sem chave visível ou erro de loader.
6. Comparar programaticamente as chaves dos dois JSON.
7. Executar formatação, `git diff --check` e build de desenvolvimento via Nx.

## Evolução posterior, fora do escopo

- Criar um `LocalizationService` independente do `ProductFacade`.
- Persistir idioma entre sessões.
- Traduzir toda a home e páginas futuras.
- Tornar `Collection` e `Kit` traduzíveis no domínio.
- Atualizar título e atributo `lang` do documento dinamicamente.
