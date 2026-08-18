# Fase 3 — Guardar el dibujo

## Objetivo

Poder descargar el dibujo como archivo de imagen pulsando una tecla.

## Código (`js/sketch.js`)

```js
function keyPressed() {
  if (key === 's') {
    saveCanvas('mi-dibujo', 'png'); // descarga el lienzo actual como mi-dibujo.png
  }
}
```

(`setup()` y `draw()` no cambian respecto a la Fase 2.)

## Explicación línea por línea

- `function keyPressed() { ... }`: función especial de p5, como `setup()` y `draw()`. p5 la llama automáticamente **una vez** cada vez que se pulsa una tecla (a diferencia de `mouseIsPressed`, que se comprueba en cada fotograma mientras se mantiene pulsado).
- `key`: variable global de p5 con el carácter de la última tecla pulsada, como texto (`'s'`, `'a'`, `'1'`...).
- `if (key === 's')`: solo actuamos si la tecla pulsada es la `s`; cualquier otra tecla no hace nada.
- `saveCanvas('mi-dibujo', 'png')`: p5 convierte el contenido actual del `<canvas>` en una imagen y le pide al navegador que la descargue con el nombre `mi-dibujo.png`. No hace falta servidor ni backend — todo ocurre en el navegador.

## Por qué tecla y no botón

Se eligió una tecla (`s`) en vez de un botón HTML para mantener el código mínimo: no hace falta crear un elemento de botón ni un listener de clic aparte; `keyPressed()` ya es una función que p5 ofrece lista para usar.

## Verificación

Abrir `index.html`, dibujar algo arrastrando el ratón, y pulsar la tecla `s`. El navegador debe descargar un archivo `mi-dibujo.png` con el dibujo hecho.

## Estado de la v1

Con esta fase se completa la herramienta mínima: dibujar con el ratón + guardar como imagen. Mejoras futuras (borrar lienzo, color, grosor variable) quedan pendientes como fase opcional, a decidir después de probar esta versión.
