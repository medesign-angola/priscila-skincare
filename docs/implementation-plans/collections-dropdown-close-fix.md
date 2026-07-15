# Correção do fecho do dropdown de Coleções

## Problema observado

O estado `activeNavigationMenu` controla simultaneamente a visibilidade e o conteúdo do painel. Ao fechar o dropdown de Coleções, esse estado muda imediatamente para `null`. Enquanto a transição visual de saída ainda decorre, o computed `navigationMenuItems` interpreta o valor nulo como Produtos e substitui as quatro coleções pela lista completa de produtos. A mudança aumenta momentaneamente a altura do painel.

## Implementação proposta

1. Separar o menu apresentado do estado que controla se o painel está aberto:
   - `activeNavigationMenu` continuará indicando se o painel está aberto;
   - um novo estado `displayedNavigationMenu` conservará o último menu selecionado durante a animação de fecho.

2. Fazer os computeds de itens, rota e rótulo lerem `displayedNavigationMenu`, evitando qualquer troca de conteúdo quando `activeNavigationMenu` passar para `null`.

3. Ao abrir ou alternar entre Produtos e Coleção:
   - atualizar imediatamente `displayedNavigationMenu`;
   - abrir o painel ou mantê-lo aberto sem recriar listeners e sem atraso perceptível.

4. Ao fechar:
   - alterar somente `activeNavigationMenu` para `null`;
   - manter os itens da última seleção montados durante a transição;
   - preservar o retorno de foco correto ao usar Escape.

5. Validar os seguintes cenários:
   - abrir e fechar Coleção sem mostrar produtos;
   - abrir e fechar Produtos sem trocar o conteúdo;
   - alternar Produtos → Coleção e Coleção → Produtos com o painel aberto;
   - fechar por clique no gatilho, clique externo, Escape e link “Ver todos”;
   - executar o build de desenvolvimento do storefront através do Nx.

## Ficheiros previstos

- `packages/shared/src/lib/components/header/header.ts`
- Nenhuma alteração prevista no HTML, CSS, models, mocks ou assets.

## Resultado esperado

O dropdown encerra mantendo as quatro coleções durante toda a animação, sem salto de altura nem exposição momentânea da lista de produtos.
