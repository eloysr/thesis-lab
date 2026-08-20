let VERSION = "v1.2";

let mic;
let palabras = [];
let escuchando = false;
let reconocimiento;
let botonEscuchar, botonParar, botonLimpiar;
let nivelPico = 0;

let volumenMaximo = 0.30;
let tamanoMinimo = 8;
let tamanoMaximo = 500;

let margen = 40;
let espacioEntrePalabras = 20;

let disposicion = { posiciones: [], alturaTotal: 0 };
let necesitaRecalcular = true;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Helvetica");
  textStyle(BOLD);
  textAlign(LEFT, TOP);

  mic = new p5.AudioIn();

  botonEscuchar = createButton("Listen");
  botonEscuchar.addClass("back-button");
  botonEscuchar.mousePressed(empezarAEscuchar);
  fijarEnPantalla(botonEscuchar, 20);

  botonParar = createButton("Stop listening");
  botonParar.addClass("back-button");
  botonParar.mousePressed(pararDeEscuchar);
  fijarEnPantalla(botonParar, 120);
  botonParar.hide();

  botonLimpiar = createButton("Clear");
  botonLimpiar.addClass("back-button");
  // clase adicional para diferenciar visualmente la acción
  botonLimpiar.addClass("limpiar-button");
  botonLimpiar.mousePressed(limpiar);
  fijarEnPantalla(botonLimpiar, 420);

  let etiqueta = createDiv(VERSION + " · " + new Date().toLocaleTimeString());
  etiqueta.style("position", "fixed");
  etiqueta.style("bottom", "10px");
  etiqueta.style("right", "12px");
  etiqueta.style("color", "#888");
  etiqueta.style("font-family", "monospace");
  etiqueta.style("font-size", "12px");
  etiqueta.style("z-index", "100");
}

function fijarEnPantalla(elemento, izquierda) {
  elemento.style("position", "fixed");
  elemento.style("top", "20px");
  elemento.style("left", izquierda + "px");
  elemento.style("z-index", "100");
}

function limpiar() {
  palabras = [];
  necesitaRecalcular = true;
}

function empezarAEscuchar() {
  userStartAudio();
  mic.start();
  escuchando = true;

  botonEscuchar.hide();
  botonParar.show();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  reconocimiento = new SpeechRecognition();
  reconocimiento.lang = "es-ES";
  reconocimiento.continuous = true;
  reconocimiento.interimResults = false;

  reconocimiento.onresult = function (evento) {
    let resultado = evento.results[evento.results.length - 1];
    let frase = resultado[0].transcript.trim();

    let nivelAjustado = constrain(nivelPico / volumenMaximo, 0, 1);
    let tamano = lerp(tamanoMinimo, tamanoMaximo, nivelAjustado);

    console.log("pico:", nivelPico.toFixed(4), "→ tamaño:", tamano.toFixed(0));

    let trozos = frase.split(" ");
    for (let i = 0; i < trozos.length; i++) {
      if (trozos[i].length > 0) {
        palabras.push({ texto: trozos[i], tamano: tamano });
      }
    }

    nivelPico = 0;
    necesitaRecalcular = true;
  };

  reconocimiento.onend = function () {
    if (escuchando) reconocimiento.start();
  };

  reconocimiento.start();
}

function pararDeEscuchar() {
  escuchando = false;
  mic.stop();
  if (reconocimiento) reconocimiento.stop();

  botonParar.hide();
  botonEscuchar.show();
}

function windowResized() {
  resizeCanvas(windowWidth, height);
  necesitaRecalcular = true;
}

function calcularDisposicion() {
  let posiciones = [];
  let x = margen;
  let y = margen;
  let alturaLinea = 0;

  for (let i = 0; i < palabras.length; i++) {
    let palabra = palabras[i];
    textSize(palabra.tamano);
    let ancho = textWidth(palabra.texto);

    if (x + ancho > width - margen && x > margen) {
      x = margen;
      y += alturaLinea;
      alturaLinea = 0;
    }

    posiciones.push({ palabra: palabra, x: x, y: y });

    x += ancho + espacioEntrePalabras;
    alturaLinea = max(alturaLinea, palabra.tamano * 1.2);
  }

  return { posiciones: posiciones, alturaTotal: y + alturaLinea + margen };
}

function draw() {
  if (escuchando) {
    nivelPico = max(nivelPico, mic.getLevel());
  }

  if (necesitaRecalcular) {
    disposicion = calcularDisposicion();
    necesitaRecalcular = false;

    let alturaNecesaria = max(windowHeight, disposicion.alturaTotal);
    if (abs(alturaNecesaria - height) > 1) {
      resizeCanvas(width, alturaNecesaria);
      necesitaRecalcular = true;
      return;
    }
  }

  background(20);
  fill(255);

  for (let i = 0; i < disposicion.posiciones.length; i++) {
    let item = disposicion.posiciones[i];
    textSize(item.palabra.tamano);
    text(item.palabra.texto, item.x, item.y);
  }
}