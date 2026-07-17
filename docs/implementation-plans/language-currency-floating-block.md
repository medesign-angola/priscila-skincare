# Bloco flutuante de idioma e moeda

## Objetivo

Implementar o bloco flutuante aberto pelo controlo `PT / €` ou `PT / Kz` e pelo ícone do globo no header, seguindo o node `290:7848` do Figma. O bloco permitirá preparar idioma e moeda e aplicá-los em conjunto através de “Atualizar preferências”.

## Estrutura visual

1. Transformar o rótulo de idioma/moeda e o globo num único botão acessível, mantendo a aparência atual do header.
2. Criar um painel branco centralizado na viewport, acima da hero e do restante conteúdo, contendo:
   - título “Linguagem e moeda”;
   - botão de fechar no canto superior direito;
   - controlo segmentado “Português / Francês”;
   - seletor de moeda/mercado;
   - botão principal “Atualizar preferências”.
3. Reproduzir do mock:
   - fundo branco e geometria compacta;
   - castanho da marca no segmento ativo e no botão principal;
   - bordas cinza-claro;
   - tipografia uppercase;
   - espaçamentos e alinhamentos do painel.
4. Não aplicar overlay escuro, pois ele não aparece no design fornecido; usar somente a camada transparente necessária para clique externo e isolamento da interação.

## Estado e fluxo de dados

1. Adicionar ao header o estado de abertura do bloco.
2. Manter seleções temporárias (`draftLanguage` e `draftCurrency`) separadas dos inputs aplicados:
   - ao abrir, copiar os valores atuais;
   - selecionar idioma ou moeda altera apenas o rascunho;
   - “Atualizar preferências” emite `languageChange` e `currencyChange`, depois fecha o painel;
   - fechar sem atualizar descarta as mudanças temporárias.
3. Reutilizar os outputs e estados existentes:
   - `ProductFacade.currentLanguage` para `pt | fr`;
   - `HeaderService.currency` para `AOA | EUR`.
4. Representar as opções monetárias por dados tipados, mantendo separados:
   - valor interno: `AOA` ou `EUR`;
   - código exibido: `KZ` ou `EUR`;
   - mercado exibido: `Angola` ou `Europa`.

## Interações e acessibilidade

1. Abrir por clique no conjunto idioma/moeda + globo.
2. Fechar por:
   - botão ×;
   - Escape;
   - clique fora do painel;
   - confirmação das preferências.
3. Ao abrir:
   - fechar qualquer dropdown de Produtos/Coleção;
   - mover o foco para o botão de fechar ou primeiro controlo;
   - impedir que o clique de abertura seja interpretado como clique externo.
4. Ao fechar, devolver o foco ao gatilho do globo.
5. Usar semântica de diálogo (`role="dialog"`, `aria-modal`, título associado), estados `aria-pressed` no idioma e label explícita no seletor.
6. Manter apenas um listener global de teclado/clique enquanto o painel estiver aberto, seguindo a otimização já usada nos dropdowns.
7. Respeitar `prefers-reduced-motion`.

## Responsividade

1. Desktop: painel centralizado com dimensões próximas do mock.
2. Viewports estreitas: largura limitada por margens laterais de 16 px, sem overflow horizontal.
3. Manter botão e campos com área de toque adequada.

## Organização prevista

- `packages/shared/src/lib/components/header/header.ts`
  - estado, rascunhos, opções tipadas, abertura, fecho e aplicação.
- `packages/shared/src/lib/components/header/header.html`
  - gatilho acessível e estrutura do diálogo.
- `packages/shared/src/lib/components/header/header.css`
  - layout fiel ao Figma, transição e responsividade.
- O `app.html`, `ProductFacade` e `HeaderService` já estão ligados pelos inputs/outputs existentes; só serão alterados caso a compilação revele alguma necessidade real.

## Validação

1. Abrir e fechar por todos os caminhos previstos.
2. Confirmar que fechar cancela mudanças não aplicadas.
3. Confirmar que atualizar aplica idioma e moeda simultaneamente no header.
4. Confirmar exclusividade entre diálogo e dropdowns de navegação.
5. Validar foco, Escape, clique externo e navegação por teclado.
6. Verificar desktop e viewport estreita.
7. Executar formatação, `git diff --check` e build de desenvolvimento do storefront via Nx.

## Fora do escopo

- Conversão real de preços entre AOA e EUR.
- Persistência em `localStorage`, cookies ou backend.
- Tradução completa dos textos estáticos da aplicação.
- Blocos flutuantes do utilizador e do cesto.
