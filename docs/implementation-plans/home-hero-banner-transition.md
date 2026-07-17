# Suavização da transição dos banners da hero

## Diagnóstico

A hero mantém os banners montados, o que é positivo para evitar recriação de imagens e vídeos. O efeito de piscar vem principalmente do CSS atual:

```css
transition:
  opacity 0.09s ease-in-out,
  visibility 0.09s ease-in-out;
```

Problemas identificados:

1. `90ms` é curto demais para um crossfade de imagens em ecrã inteiro.
2. O banner que sai reduz a opacidade ao mesmo tempo que o próximo aumenta. No meio da transição, a composição dos dois não fica totalmente opaca e o fundo inferior aparece, criando um breve escurecimento/flash.
3. `visibility` muda no mesmo intervalo da opacidade, podendo retirar a camada anterior antes de a entrada estar visualmente concluída.
4. Não existe uma ordem de camadas explícita entre o banner ativo e o banner anterior.
5. A hero não define uma cor-base própria para proteger contra qualquer transparência residual.

## Estratégia de transição

Em vez de fazer os dois banners desaparecerem simultaneamente:

1. O banner anterior permanecerá totalmente opaco e temporariamente visível na camada inferior.
2. O novo banner ficará acima dele e animará de `opacity: 0` para `opacity: 1`.
3. Somente depois da duração da entrada o banner anterior receberá `visibility: hidden`.
4. A ordem será controlada explicitamente por `z-index`:
   - banner ativo na camada superior;
   - banner anterior na camada de suporte;
   - fundo-base da hero abaixo de ambos.

Isso garante cobertura visual de 100% durante todo o processo, eliminando o intervalo em que o fundo aparece.

## Movimento

1. Usar uma duração próxima de `600–700ms`, adequada para mídia em ecrã inteiro.
2. Aplicar uma curva suave de entrada, por exemplo `cubic-bezier(0.22, 1, 0.36, 1)`.
3. Animar somente `opacity`; não usar `transition: all` nos banners.
4. Adicionar `will-change: opacity` e isolamento de composição para favorecer execução pela GPU.
5. Em `prefers-reduced-motion: reduce`, remover a animação e fazer a troca imediatamente.

## Proteção de carregamento

1. Manter todos os banners montados para que imagens, placeholders e vídeo sejam preparados antes da seleção.
2. Definir uma cor de fundo coerente com a paleta da hero, evitando branco/preto caso algum media ainda não esteja pronto.
3. Adicionar `preload="auto"` ao vídeo da hero para aumentar a probabilidade de o primeiro frame já estar disponível na troca.
4. Preservar o sistema `BlurUpDirective` e os placeholders existentes; eles continuarão cobrindo a fase de carregamento da mídia em alta resolução.

## Conteúdo da hero

O pedido é especificamente sobre os banners. Nesta correção:

- não alterar textos, kits ou controladores;
- não recriar a camada de conteúdo;
- não adicionar animações que atrasem a resposta ao clique;
- manter a seleção do kit imediata, animando apenas a apresentação visual do novo fundo.

## Ficheiros previstos

- `packages/storefront/src/app/pages/home/home.css`
  - nova composição das camadas e animação de entrada.
- `packages/shared/src/lib/components/hero-cover/hero-cover.html`
  - preload explícito do vídeo.

Nenhuma alteração prevista em models, facade, mocks, traduções ou assets.

## Validação

1. Alternar repetidamente imagem → vídeo e vídeo → imagem.
2. Confirmar que nunca aparece fundo branco, preto ou escurecimento intermediário.
3. Confirmar que o clique continua respondendo imediatamente.
4. Confirmar que placeholder e high-resolution continuam fazendo blur-up sem flash.
5. Testar `prefers-reduced-motion`.
6. Verificar desktop e mobile, incluindo ecrãs maiores.
7. Executar Prettier, `git diff --check` e build de desenvolvimento do storefront via Nx.
