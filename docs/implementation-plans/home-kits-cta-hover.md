# Plano de implementação — hover do CTA da seção de kits

## Referência visual

No hover, o botão “Ver produtos” deve:

- trocar o fundo branco pelo tom dourado/caramelo da marca;
- trocar texto e seta para branco;
- preservar tamanho, padding, borda e alinhamento;
- apresentar uma transição curta e fluida, sem piscar.

## Alteração CSS

Atualizar somente o CTA `.kits-editorial__action button` em `kits-section.css`.

### Estado padrão

- Fundo branco.
- Texto e seta em `var(--brand-primary, #7d6645)`.

### Estado hover

- Fundo `var(--color-burgundy-500, #b49667)` ou o token dourado equivalente já utilizado pelo design.
- Texto branco.
- Seta branca por herdar `currentColor`.

### Transição

Aplicar transições específicas:

```css
transition:
  background-color 240ms cubic-bezier(0.22, 1, 0.36, 1),
  color 240ms cubic-bezier(0.22, 1, 0.36, 1),
  transform 180ms ease;
```

- A seta poderá deslocar-se discretamente no eixo X durante o hover.
- No estado `active`, o botão poderá reduzir muito levemente a escala para feedback tátil.
- Em `prefers-reduced-motion: reduce`, remover deslocamentos e transições não essenciais.

## Acessibilidade

- Preservar o `focus-visible` já existente.
- Aplicar o mesmo contraste do hover ao foco por teclado apenas se não ocultar o outline.
- Não depender exclusivamente de movimento para indicar interatividade.

## Validação

- Conferir hover de fundo, texto e seta.
- Confirmar ausência de alteração de layout.
- Testar teclado e movimento reduzido.
- Executar formatação, `git diff --check` e build Nx com SSR/prerender.

## Commit

Após validação:

```text
style(storefront): refine kits CTA hover
```
