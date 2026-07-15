# Integração da transição da hero na branch de produtos destacados

## Estado atual

- Branch ativa: `codex/feature/home-featured-products`.
- A seção de produtos destacados está implementada e validada, mas ainda não possui commit.
- A correção da hero está isolada em `codex/fix/home-hero-transition` no commit `5ca5fa5`.
- As duas branches partilham o ancestral `9d62dc9`.

## Estratégia

Usar um merge real, e não copiar manualmente o código ou fazer cherry-pick. Isso preserva no histórico:

- o commit próprio dos pilares;
- o commit próprio dos produtos destacados;
- o commit original da correção da hero;
- um merge explícito mostrando onde as linhas de desenvolvimento foram reunidas.

## Execução

1. Verificar novamente `git diff --check` e o estado dos ficheiros da seção.
2. Gravar a seção de produtos destacados na branch atual:

```text
feat(storefront): add featured products section
```

3. Executar:

```text
git merge --no-ff codex/fix/home-hero-transition
```

4. Resolver o conflito esperado em `home.css` preservando simultaneamente:
   - estilos dos pilares;
   - estilos dos produtos destacados;
   - composição e keyframes da transição da hero;
   - regra `prefers-reduced-motion` da hero.
5. Não alterar HTML, traduções, models ou ProductCard durante a resolução do merge.
6. Finalizar o merge com mensagem explícita:

```text
merge: integrate smooth hero transition
```

## Validação após o merge

1. Confirmar que os três commits/contextos aparecem no grafo Git.
2. Confirmar worktree limpo.
3. Executar `git diff --check`.
4. Executar build de desenvolvimento do storefront via Nx, incluindo SSR.
5. Confirmar que permanecem presentes:
   - hero e transição suavizada;
   - seção dos pilares;
   - seção dos três produtos destacados;
   - traduções PT/FR;
   - ProductCard compartilhado;
   - WebP otimizados.

## Resultado esperado

A branch `codex/feature/home-featured-products` torna-se a linha integrada da home até esta etapa, mantendo cada funcionalidade identificável e reversível pelo seu próprio commit.
