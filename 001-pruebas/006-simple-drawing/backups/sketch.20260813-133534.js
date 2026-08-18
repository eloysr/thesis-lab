function setup() {
  createCanvas(800, 600); // crea el lienzo de 800x600 píxeles
  background(240); // pinta el fondo blanco roto (240 = casi blanco, pero se distingue del blanco puro de la ventana), una sola vez
  strokeWeight(4); // grosor del trazo en píxeles (por defecto sería 1, muy fino)
}

function draw() {
  if (mouseIsPressed) {
    stroke(0); // color del trazo: negro
    line(pmouseX, pmouseY, mouseX, mouseY); // línea del punto anterior al punto actual
  }
}

function keyPressed() {
  if (key === 's') {
    saveCanvas('mi-dibujo', 'png'); // descarga el lienzo actual como mi-dibujo.png
  }
}
