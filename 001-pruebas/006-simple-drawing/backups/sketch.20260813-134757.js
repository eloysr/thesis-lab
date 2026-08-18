function setup() {
  createCanvas(windowWidth, windowHeight); // el lienzo ocupa toda la ventana del navegador
  background(240); // pinta el fondo blanco roto (240 = casi blanco, pero se distingue del blanco puro de la ventana), una sola vez
  strokeWeight(4); // grosor del trazo en píxeles (por defecto sería 1, muy fino)

  const botonGuardar = createButton('Guardar dibujo'); // crea un <button> HTML
  botonGuardar.position(10, 10); // lo coloca a 10px del borde superior izquierdo
  botonGuardar.mousePressed(guardarDibujo); // al hacer clic, ejecuta guardarDibujo()
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // reajusta el lienzo al nuevo tamaño de ventana
  background(240); // el cambio de tamaño borra el contenido del lienzo, así que repintamos el fondo
}

function draw() {
  if (mouseIsPressed) {
    stroke(0); // color del trazo: negro
    line(pmouseX, pmouseY, mouseX, mouseY); // línea del punto anterior al punto actual
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
