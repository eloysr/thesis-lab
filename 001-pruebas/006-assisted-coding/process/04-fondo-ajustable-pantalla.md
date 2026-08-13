# Fase 4 — Lienzo ajustado al tamaño de pantalla

## Objetivo

Que el lienzo ocupe siempre el tamaño completo de la ventana del navegador, sea cual sea (en vez del tamaño fijo 800x600 de las fases anteriores).

## Backup previo

Antes de tocar `js/sketch.js`, se guardó una copia en `backups/sketch.<fecha-hora>.js` (carpeta local del proyecto, sin usar git ni afectar al resto del repositorio).

## Código (`js/sketch.js`)

```js
function setup() {
  createCanvas(windowWidth, windowHeight); // el lienzo ocupa toda la ventana del navegador
  background(240);
  strokeWeight(4);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // reajusta el lienzo al nuevo tamaño de ventana
  background(240); // el cambio de tamaño borra el contenido del lienzo, así que repintamos el fondo
}
```

## Explicación línea por línea

- `windowWidth`, `windowHeight`: variables globales de p5 que siempre reflejan el ancho/alto actual de la ventana del navegador.
- `createCanvas(windowWidth, windowHeight)`: en vez de un tamaño fijo (800, 600), el lienzo nace ocupando toda la pantalla disponible en ese momento.
- `function windowResized() { ... }`: función especial de p5 (como `setup`, `draw`, `keyPressed`) que se llama automáticamente cada vez que el usuario cambia el tamaño de la ventana del navegador.
- `resizeCanvas(windowWidth, windowHeight)`: ajusta el `<canvas>` ya existente al nuevo tamaño, en vez de crear uno nuevo.
- `background(240)` dentro de `windowResized()`: necesario porque cambiar el tamaño de un `<canvas>` HTML borra su contenido (comportamiento del propio navegador). Sin repintar el fondo, el lienzo quedaría vacío/transparente tras redimensionar.

## Limitación conocida

Redimensionar la ventana **borra el dibujo actual** (consecuencia del punto anterior). Mantener el dibujo intacto al redimensionar requeriría guardar los píxeles aparte (más complejidad), así que se deja fuera de esta versión simple.

## Verificación

Abrir `index.html`: el lienzo debe ocupar toda la ventana. Cambiar el tamaño de la ventana del navegador: el lienzo debe reajustarse (y su contenido se pierde, como se explica arriba).
