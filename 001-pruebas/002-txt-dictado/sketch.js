let interletrado = 15;
let mic;
let nivel = 0;
let micActivo = false;
let boton;
let texto = "SAY SOMETHING...";
let reconocimiento;

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("Helvetica");
  textStyle(BOLD);
  textAlign(CENTER, CENTER);

  mic = new p5.AudioIn();

  boton = createButton("Activate microphone");
  boton.position(20, 20);
  boton.mousePressed(activarMicrofono);
}

function activarMicrofono() {
  userStartAudio();
  mic.start();
  micActivo = true;
  boton.hide();

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  reconocimiento = new SpeechRecognition();
  reconocimiento.lang = "es-ES";
  reconocimiento.continuous = true;
  reconocimiento.interimResults = true;

  reconocimiento.onresult = (evento) => {
    let resultado = evento.results[evento.results.length - 1];
    texto = resultado[0].transcript.toUpperCase();
  };

  reconocimiento.onend = () => {
    reconocimiento.start();
  };

  reconocimiento.start();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(20);
  fill(255);

  if (micActivo) {
    nivel = mic.getLevel();
  }

  // Amplificamos la señal del micrófono para que el efecto sea más dramático
  let nivelAmplificado = constrain(nivel * 8, 0, 1);

  let tamano = map(nivelAmplificado, 0, 1, 20, 600);
  textSize(tamano);

  // Calculamos el ancho del texto con ese tamaño
  let anchoTexto = 0;
  for (let i = 0; i < texto.length; i++) {
    anchoTexto += textWidth(texto.charAt(i)) + interletrado;
  }
  anchoTexto -= interletrado;

  // Límite de seguridad: si no cabe en pantalla, lo reducimos
  let anchoDisponible = width - 120;
  if (anchoTexto > anchoDisponible) {
    tamano = tamano * (anchoDisponible / anchoTexto);
    textSize(tamano);

    anchoTexto = 0;
    for (let i = 0; i < texto.length; i++) {
      anchoTexto += textWidth(texto.charAt(i)) + interletrado;
    }
    anchoTexto -= interletrado;
  }

  // Posición fija, centrada, sin animación de movimiento
  let x = width / 2 - anchoTexto / 2;
  let y = height / 2;

  for (let i = 0; i < texto.length; i++) {
    let letra = texto.charAt(i);
    let letraWidth = textWidth(letra);
    text(letra, x + letraWidth / 2, y);
    x += letraWidth + interletrado;
  }
}