# Maestry Design System — Tokens

Design tokens del núcleo de marca Maestry: color, tipografía, espaciado, radios,
elevación, acentos por vertical y lenguaje de progresión (rangos/emblemas).
Agnóstico de framework — se consume como JSON o como CSS custom properties.

Fuente: `Design System Maestry.dc.html` v0.2 · Septiembre 2026 (documento de
diseño exportado desde Claude Design). Este repo implementa en código el
contenido de ese documento — **no** incluye componentes de UI todavía (fue
una decisión explícita de alcance: primero tokens, componentes después).

## Estructura

```
tokens/                  fuente de verdad (JSON, editable a mano)
  core.json              color núcleo (ink/gold/purple/semantic), tipografía, spacing, radius, elevation
  verticals.json         acento por vertical (9): HORECA + 8 futuras
  ranks.json             6 rangos de progresión + mapeo a emblemas
  themes/dark.json        mapeo semántico tema oscuro (default del colaborador)
  themes/light.json       mapeo semántico tema claro (consumidor final / impreso)

scripts/build-tokens.mjs  genera dist/ a partir de tokens/*.json (sin dependencias)

dist/css/                 CSS custom properties generadas — lo que consume producto
  core.css                 :root { --ink-*, --gold-*, --purple-*, --text-*, --space-*, --radius-*, --elev-* ... }
  theme-dark.css            [data-theme="dark"] (y default en :root)
  theme-light.css           [data-theme="light"]
  verticals.css              [data-vertical="horeca|tenderos|..."]
  ranks.css                   [data-rank="aprendiz|...|maestro"]
dist/json/tokens.json     mismo contenido, resuelto y aplanado, para consumo por JS/otro tooling

assets/                   colección de marca (logos, capa por industria, emblemas, personajes, mockups)
```

Regenerar `dist/` tras editar cualquier `tokens/*.json`:

```
npm run build
```

## Cómo se consume

1. Cargar tipografías (Google Fonts): **Cinzel** (400/500/600/700), **Manrope**
   (400/500/600/700/800), **JetBrains Mono** (400/500).
2. Incluir `dist/css/core.css` + un tema (`theme-dark.css` y/o `theme-light.css`).
3. Marcar el tema en el elemento raíz: `<html data-theme="dark">` o `data-theme="light"`.
   Sin atributo, el default es **oscuro** (modo del colaborador en turno).
4. Marcar la vertical activa en el contenedor de producto: `<body data-vertical="horeca">`,
   incluyendo `verticals.css`. Esto expone `--accent`, `--accent-light`, `--accent-soft`.
   **Regla dura:** el acento de vertical solo se usa en 4 lugares — chip de vertical,
   relleno de progreso activo, filete de dato en material comercial, capa del logo.
   Nunca como color de fondo/tarjeta/botón de la interfaz.
5. Para UI de rango (badges, perfil), incluir `ranks.css` y marcar
   `data-rank="oficial"` (etc.) para heredar `--rank-icon-color/bg/border`.

## Decisiones y supuestos registrados

- **Nombres de escala de color no son contiguos por diseño.** El documento
  fuente solo ancla explícitamente dos tokens (`gold/500 = #E0B24E`,
  `purple/600 = #7A2FBF`) y dos límites (`gold 50→900`, `purple 50→900`,
  `ink 0→900`). El resto de la numeración de cada rampa (8 muestras cada una)
  se completó de forma consistente con esos anclajes — ver comentarios
  `$description` en `tokens/core.json`.
- **Discrepancias de hex entre secciones del documento fuente**, resueltas a
  favor de la sección "02 · Color → Acento por vertical" (la sección de
  tokens) sobre los valores muestreados del arte en "09 · Assets" — marcadas
  con `$discrepancy` en `tokens/verticals.json`:
  - Servicio de mostrador: token `#E06A1B` vs. `#D6690A` en la ficha del asset.
  - Educación: token `#A6741F` vs. `#D69600` en la ficha del asset (idéntico
    al acento de HORECA — probable error de origen, **verificar con diseño**).
  - Logística: token `#8A8F98` vs. `#9AA0A6` en la ficha del asset (diferencia menor).
- **Pendiente, heredado del documento fuente** (no resuelto aquí, ver
  `tokens/ranks.json → $pending` y `emblemsPending`):
  - Nombres de los 6 rangos (Aprendiz → Maestro) son propuesta de diseño, no
    confirmados contra nomenclatura ya en uso en HORECA.
  - 5 acabados de emblema sin crear: verde, teal, blanco, negro/gris, morado transparente.
  - Símbolo plano/vectorial para usos <32px (favicon, sellos): pendiente de creación.

## Restricciones de marca (heredadas del brief, ver `assets/brand/maestry-brandboard.jpeg`)

- HORECA es una **vertical**, no la identidad de Maestry: su paleta actual
  (ocre `#D69600`, chocolate `#341A04`, crema `#FFFCF2`) vive en
  `tokens/verticals.json → horeca` y en `tokens/themes/light.json`, no en `core.json`.
- Oro y púrpura del núcleo se reservan para progresión, recompensa y jerarquía
  máxima — nunca como fondo de bloques largos de texto.
- Contraste WCAG AA como piso: cuerpo ≥4.5:1, títulos ≥24px ≥3:1. Oro sobre
  crema no cumple — usar `gold-text-on-light` (`#8A6114`).
