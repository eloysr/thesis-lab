# Fase 1 — Sketch mínimo: canvas y fondo

## Objetivo

Crear el lienzo de dibujo y pintar su fondo, usando las dos funciones base de cualquier sketch de p5.js.

## Código (`js/sketch.js`)

```js
function setup() {
  createCanvas(800, 600); // crea el lienzo de 800x600 píxeles
  background(240); // pinta el fondo blanco roto, una sola vez
}

function draw() {
  // aquí irá la lógica de dibujo con el ratón (Fase 2)
}
```

## Explicación línea por línea

- `function setup() { ... }`: p5 llama a esta función **una sola vez**, justo al arrancar la página. Es el sitio para preparar todo lo que solo hace falta configurar una vez.
  - `createCanvas(800, 600);`: crea el elemento `<canvas>` en el navegador (por eso `index.html` no necesita ningún `<div>` propio) con 800 píxeles de ancho y 600 de alto.
  - `background(240);`: pinta todo el lienzo de un gris con valor 240 sobre 255 — casi blanco, pero ligeramente roto (0 sería negro, 255 blanco puro; en p5, un solo número es una escala de grises). Se usa 240 en vez de 255 para que el lienzo se distinga del blanco puro de la ventana del navegador. Se hace aquí, no en `draw()`.
- `function draw() { ... }`: p5 llama a esta función **en bucle**, por defecto 60 veces por segundo. Es el "motor" de cualquier sketch animado. La dejamos vacía por ahora.

## Decisión de diseño importante

`background()` va en `setup()`, no en `draw()`. Si estuviera en `draw()`, cada uno de los 60 fotogramas por segundo repintaría el fondo blanco encima de cualquier trazo dibujado, borrándolo al instante. Como queremos una herramienta de dibujo persistente (no una animación que se repinta), el fondo solo se pinta una vez al arrancar.

## Verificación

Abrir `index.html` en el navegador (doble clic, o extensión tipo Live Server — sin Python). Debe verse un rectángulo blanco roto de 800x600 px, distinguible del blanco puro de la ventana, sin errores en la consola.

## Siguiente fase

[02-dibujar-con-raton.md](02-dibujar-con-raton.md) — usar la posición del ratón para trazar líneas.
