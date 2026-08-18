function setup() {
  createCanvas(windowWidth, windowHeight); // el lienzo ocupa toda la ventana del navegador
  background(240); // pinta el fondo blanco roto (240 = casi blanco, pero se distingue del blanco puro de la ventana), una sola vez
  strokeWeight(4); // grosor del trazo en píxeles (por defecto sería 1, muy fino)

  const botonGuardar = createButton('Guardar dibujo'); // crea un <button> HTML
  botonGuardar.position(10, 10); // lo coloca a 10px del borde superior izquierdo
  botonGuardar.mousePressed(guardarDibujo); // al hacer clic, ejecuta guardarDibujo()

  const botonBorrar = createButton('Borrar dibujo'); // segundo <button> HTML
  botonBorrar.position(10, 40); // 40px por debajo del botón de guardar
  botonBorrar.mousePressed(borrarDibujo); // al hacer clic, ejecuta borrarDibujo()

  const botonVolver = createButton('Back to index');
  botonVolver.position(10, 70);
  botonVolver.mousePressed(() => window.location.href = '../index.html');
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // reajusta el lienzo al nuevo tamaño de ventana
  background(240); // el cambio de tamaño borra el contenido del lienzo, así que repintamos el fondo
}

function draw() {
  if (mouseIsPressed || touches.length > 0) {
    stroke(0);
    if (touches.length > 0) {
      line(pmouseX, pmouseY, touches[0].x, touches[0].y);
    } else {
      line(pmouseX, pmouseY, mouseX, mouseY);
    }
  }
}

function keyPressed() {
  if (key === 's') {
    guardarDibujo();
  }
}

function guardarDibujo() {
  saveCanvas('mi-dibujo', 'png'); // descarga el lienzo actual como mi-dibujo.png
}

function borrarDibujo() {
  background(240); // repinta el fondo entero, tapando cualquier trazo dibujado encima
}
