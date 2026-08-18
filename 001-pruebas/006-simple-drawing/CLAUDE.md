# 006-assisted-coding

Pequeña herramienta de dibujo hecha con [p5.js](https://p5js.org/) para practicar programación asistida. Se dibuja con el ratón sobre un lienzo y se puede guardar el resultado como imagen.

## Estructura

- `index.html` — página que carga p5.js y el sketch.
- `js/sketch.js` — todo el código del dibujo (setup, draw, eventos de ratón y teclado).
- `libraries/p5.js` — copia local de p5.js v1.11.11 (no se usa CDN).
- `css/` — estilos, si hacen falta.
- `assets/` — recursos estáticos (imágenes, fuentes), si hacen falta.
- `process/` — documentación del proceso de construcción, una fase por archivo.

## Cómo ejecutar

Este sketch no carga recursos externos (imágenes, fuentes, etc.), así que basta con abrir `index.html` directamente en el navegador (doble clic o "Abrir con..."). Si en algún momento se necesita servirlo por http (por ejemplo al añadir `loadImage`), se puede usar cualquier servidor estático a preferencia (extensión Live Server de VSCode, `npx serve`, etc.) — no se usa Python en este proyecto.

## Convenciones

- Mantener el código lo más simple posible: sin frameworks ni build tools, solo HTML + JS plano + p5.js.
- Cada línea de código debe poder explicarse; no añadir nada que no se entienda o no se necesite.
