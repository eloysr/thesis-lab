# Fase 6 — Botón para borrar el dibujo

## Objetivo

Añadir un segundo botón, debajo del de guardar, que borre el contenido dibujado en el lienzo sin recargar la página.

## Backup previo

Antes de tocar `js/sketch.js`, se guardó otra copia en `backups/sketch.<fecha-hora>.js`, siguiendo el mismo criterio que en fases anteriores.

## Código (`js/sketch.js`)

```js
const botonBorrar = createButton('Borrar dibujo'); // segundo <button> HTML
botonBorrar.position(10, 50); // 40px por debajo del botón de guardar
botonBorrar.mousePressed(borrarDibujo); // al hacer clic, ejecuta borrarDibujo()
```

```js
function borrarDibujo() {
  background(240); // repinta el fondo entero, tapando cualquier trazo dibujado encima
}
```

## Explicación línea por línea

- `createButton('Borrar dibujo')`, `.position(10, 50)`, `.mousePressed(borrarDibujo)`: mismo patrón que el botón de guardar (Fase 5). Se posiciona 40px por debajo del primer botón para que no se solapen.
- `function borrarDibujo() { background(240); }`: reutiliza la misma técnica ya usada en `windowResized()` (Fase 4) — repintar `background(240)` sobre todo el lienzo tapa cualquier trazo anterior. No hace falta ninguna función nueva de p5; es la misma idea de "repintar el fondo" aplicada a demanda (al pulsar el botón) en vez de solo al redimensionar la ventana.

## Verificación

Abrir `index.html`, dibujar algo, y pulsar "Borrar dibujo": el lienzo debe quedar limpio, con el fondo blanco roto, sin recargar la página. Los botones y la tecla `s` para guardar deben seguir funcionando después de borrar.
