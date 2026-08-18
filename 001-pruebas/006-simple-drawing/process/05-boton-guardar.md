# Fase 5 — Botón para guardar

## Objetivo

Añadir un botón en pantalla para guardar el dibujo, además de la tecla `s` ya existente (Fase 3).

## Backup previo

Antes de tocar `js/sketch.js`, se guardó otra copia en `backups/sketch.<fecha-hora>.js`, siguiendo el mismo criterio que en la Fase 4 (backup local del proyecto, sin git).

## Código (`js/sketch.js`)

```js
function setup() {
  createCanvas(windowWidth, windowHeight);
  background(240);
  strokeWeight(4);

  const botonGuardar = createButton('Guardar dibujo'); // crea un <button> HTML
  botonGuardar.position(10, 10); // lo coloca a 10px del borde superior izquierdo
  botonGuardar.mousePressed(guardarDibujo); // al hacer clic, ejecuta guardarDibujo()
}

function keyPressed() {
  if (key === 's') {
    guardarDibujo();
  }
}

function guardarDibujo() {
  saveCanvas('mi-dibujo', 'png'); // descarga el lienzo actual como mi-dibujo.png
}
```

## Explicación línea por línea

- `createButton('Guardar dibujo')`: le pide a p5 que cree un elemento `<button>` de HTML normal y lo añada a la página. Devuelve un objeto que representa ese botón.
- `.position(10, 10)`: coloca el botón a 10 píxeles del borde superior e izquierdo de la ventana (coordenadas CSS de la página, no del lienzo).
- `.mousePressed(guardarDibujo)`: registra qué función ejecutar al hacer clic en **ese botón concreto** (distinto de la variable global `mouseIsPressed`, que se refiere al lienzo entero). Se pasa `guardarDibujo` sin paréntesis: así se le dice "ejecuta esta función cuando ocurra el clic", no "ejecútala ahora".
- `function guardarDibujo() { ... }`: se extrajo la línea `saveCanvas(...)` a su propia función porque ahora dos sitios (`keyPressed` y el botón) necesitan hacer lo mismo. Así `keyPressed()` y el botón simplemente **llaman** a `guardarDibujo()` en vez de repetir el código.

## Decisión: botón DOM vs. botón dibujado en el lienzo

Se planteó dibujar el botón directamente en el `<canvas>` (rectángulo + texto, con detección manual del clic) para no depender de un elemento DOM. Se descartó por una razón funcional, no solo estética:

- Un botón **DOM** (`createButton`) vive fuera del `<canvas>`, así que nunca aparece en la imagen exportada con `saveCanvas()` — el PNG guardado contiene solo el dibujo.
- Un botón **dibujado en el lienzo** es solo píxeles más dentro del mismo `<canvas>` que se exporta: aparecería también en el PNG guardado, tapando esa esquina, salvo que se añadiera lógica extra para ocultarlo justo antes de guardar.

Se decidió mantener el botón DOM por ser la opción que resuelve esto automáticamente con menos código, coherente con el criterio de simplicidad del proyecto.

## Verificación

Abrir `index.html`, dibujar algo, y comprobar que tanto pulsar `s` como hacer clic en el botón "Guardar dibujo" descargan `mi-dibujo.png` con el dibujo (sin el botón dentro de la imagen).
