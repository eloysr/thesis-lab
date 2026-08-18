# Fase 2 — Dibujar con el ratón

## Objetivo

Trazar líneas en el lienzo siguiendo el movimiento del ratón mientras se mantiene pulsado.

## Código (`js/sketch.js`)

```js
function setup() {
  createCanvas(800, 600);
  background(240);
  strokeWeight(4); // grosor del trazo en píxeles (por defecto sería 1, muy fino)
}

function draw() {
  if (mouseIsPressed) {
    stroke(0); // color del trazo: negro
    line(pmouseX, pmouseY, mouseX, mouseY); // línea del punto anterior al punto actual
  }
}
```

## Explicación línea por línea

- `mouseIsPressed`: variable booleana que p5 actualiza sola — `true` mientras cualquier botón del ratón está pulsado, `false` si no. Al estar dentro de `draw()`, se comprueba en cada uno de los 60 fotogramas por segundo.
- `stroke(0)`: fija el color de **trazo/contorno** (no de relleno) para lo que se dibuje después. `0` es negro en escala de grises (igual que `background()`, es un solo número).
- `line(pmouseX, pmouseY, mouseX, mouseY)`: dibuja un segmento entre dos puntos.
  - `pmouseX, pmouseY`: posición del ratón en el fotograma **anterior** ("p" de *previous*).
  - `mouseX, mouseY`: posición del ratón en el fotograma **actual**.
  - Las cuatro son variables globales que p5 mantiene actualizadas automáticamente; no hace falta calcularlas.
- `strokeWeight(4)` (en `setup()`): fija el grosor del trazo en píxeles (por defecto es 1, muy fino). Al ser una configuración fija, no una posición que cambia cada fotograma, va en `setup()` junto a `background()`, y se aplica a todas las `line()` posteriores.

## Por qué unir dos puntos y no dibujar solo el punto actual

`draw()` se ejecuta ~60 veces por segundo. Si el ratón se mueve rápido, entre un fotograma y el siguiente puede desplazarse varios píxeles. Dibujar solo un punto en la posición actual (`point(mouseX, mouseY)`) dejaría huecos y un trazo punteado. Al dibujar una línea desde el punto anterior hasta el actual, el trazo queda continuo sin importar la velocidad del ratón.

## Por qué el trazo se acumula en vez de borrarse

Porque `background()` solo se llama una vez, en `setup()` (ver Fase 1). Si estuviera dentro de `draw()`, cada fotograma repintaría el fondo y borraría las líneas anteriores.

## Verificación

Abrir `index.html` y dibujar arrastrando el ratón con el botón pulsado sobre el lienzo. Debe verse un trazo negro continuo siguiendo el recorrido del ratón.

## Siguiente fase

[03-guardar-dibujo.md](03-guardar-dibujo.md) — guardar el resultado como archivo de imagen.
