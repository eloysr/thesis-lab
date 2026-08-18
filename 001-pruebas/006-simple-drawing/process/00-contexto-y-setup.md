# Fase 0 — Contexto y esqueleto del proyecto

## Objetivo

Preparar el proyecto antes de escribir ningún código de dibujo: dejar claro qué es este proyecto (`CLAUDE.md`) y crear la página HTML mínima que carga p5.js y nuestro sketch.

## Decisiones tomadas

- La herramienta es una v1 mínima: dibujar con el ratón (trazo negro fijo sobre fondo blanco) y guardar con la tecla `s`. Sin botón de borrar, sin color, sin grosor variable — eso queda para una fase opcional futura si hace falta.
- Guardar se dispara con teclado (`keyPressed`), no con un botón HTML.
- No se usa Python para servir el proyecto (preferencia explícita). Como el sketch no carga recursos externos, basta con abrir `index.html` directamente en el navegador.
- p5.js se usa desde una copia local (`libraries/p5.js`, v1.11.11), no desde un CDN.

## Archivos creados

### `CLAUDE.md`

Documento de contexto del proyecto: qué es, estructura de carpetas, cómo ejecutarlo, convenciones (simplicidad, cada línea explicable).

### `index.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Herramienta de dibujo</title>
</head>
<body>
  <script src="libraries/p5.js"></script>
  <script src="js/sketch.js"></script>
</body>
</html>
```

Explicación línea por línea:

- `<!DOCTYPE html>`: le dice al navegador que use las reglas modernas de HTML5.
- `<html lang="es">`: raíz del documento; `lang` es metadato de accesibilidad, no afecta al funcionamiento.
- `<meta charset="UTF-8">`: fija la codificación de caracteres.
- `<title>`: texto que aparece en la pestaña del navegador.
- `<body>` vacío: no hace falta ningún `<div>` de contenedor porque p5.js crea su propio `<canvas>` en el DOM automáticamente al llamar a `createCanvas()` (Fase 1).
- Los dos `<script>`: cargan primero la librería (`libraries/p5.js`) y después nuestro código (`js/sketch.js`). El orden importa — si `sketch.js` se cargara antes, fallaría porque intentaría usar funciones de p5 (`createCanvas`, `background`...) que todavía no existirían.

## Verificación

Abrir `index.html` en el navegador: debe verse una página en blanco sin errores en la consola (todavía no hay nada dibujado porque `sketch.js` está vacío — eso es la Fase 1).

## Siguiente fase

[01-canvas-basico.md](01-canvas-basico.md) — crear el lienzo y pintar el fondo.
