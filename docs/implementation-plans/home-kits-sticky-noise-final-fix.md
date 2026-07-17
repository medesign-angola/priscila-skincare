# Plano final — sticky sem sobreposição e noise fiel ao Figma

## Diagnóstico confirmado no Figma

O node `161:3408` utiliza:

```css
background-size: 1024px 1024px;
mix-blend-mode: overlay;
opacity: 0.2;
```

A textura é um asset próprio do frame. O `noise.png` atual do projeto é uma imagem preto/branco muito mais densa e não representa a textura do mockup; por isso alterar apenas opacidade e blend não produz o resultado correto.

## 1. Substituir o asset de noise

- Baixar o asset de textura diretamente do node `161:3408` enquanto a URL temporária do Figma estiver válida.
- Inspecionar formato, transparência e dimensões originais.
- Converter para WebP somente se a conversão preservar corretamente a transparência e a granulação; caso contrário, manter PNG otimizado.
- Armazenar como asset específico reutilizável, por exemplo:

```text
packages/storefront/public/assets/images/textures/hero-noise.webp
```

- Não reutilizar o `noise.png` preto/branco atual nessa seção.

## 2. Restaurar a composição original

Nos componentes `org-hero-cover` e `org-hero-split`:

```css
.noise-overlay {
  background-size: 64rem 64rem;
  mix-blend-mode: overlay;
  opacity: 0.2;
}
```

- Manter `isolation: isolate` para estabilizar o stacking context.
- Noise acima da mídia/gradiente e abaixo do conteúdo.
- Manter `[hasNoise]="true"` na seção de kits.
- Manter `[hasNoise]="false"` na Hero principal.
- Remover a compensação atual de `soft-light`, `opacity: 0.35` e `background-size: 45rem auto`.

## 3. Separar a área sticky da área inferior

A estrutura atual coloca intro sticky e CTA dentro do mesmo flex com `justify-content: space-between`. Quando o intro acompanha o viewport, ele pode alcançar e sobrepor o CTA.

Alterar o template para duas regiões explícitas:

```html
<div class="kits-editorial__content">
  <div class="kits-editorial__intro-region">
    <div class="kits-editorial__intro">...</div>
  </div>

  <div class="kits-editorial__action">...</div>
</div>
```

## 4. Limites do sticky

- `.kits-editorial__content` permanece como coluna de altura completa.
- `.kits-editorial__intro-region` recebe `flex: 1 1 0` e `min-height: 0`, reservando exclusivamente o espaço superior.
- `.kits-editorial__intro` mantém:
  - `position: sticky`;
  - offset pelo inset editorial;
  - `padding-block: 2rem` (`py-8`).
- `.kits-editorial__action` recebe `flex: 0 0 auto` e permanece fora da região sticky.
- O sticky encerra seu movimento no final de `.kits-editorial__intro-region`, antes do CTA, impossibilitando sobreposição.
- No mobile, o intro continua com `position: static`.

## 5. Validação visual

- Confirmar que o intro permanece sticky apenas dentro da região superior.
- Rolar até o fim do painel e confirmar separação constante entre intro e CTA.
- Confirmar que o noise corresponde à textura suave e granulada do mockup.
- Conferir `overlay`, opacidade `0.2` e escala `1024 × 1024` nos estilos computados.
- Verificar que o asset retorna HTTP 200.
- Testar 1440, 1536, tablet e mobile.
- Confirmar que a Hero principal continua sem noise.
- Executar formatação, `git diff --check` e build Nx completo com SSR/prerender.

## Commit

Após validação:

```text
fix(storefront): match kits sticky and noise design
```
