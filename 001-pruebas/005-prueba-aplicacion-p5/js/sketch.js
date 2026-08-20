// Plantilla mínima de p5.js
// setup() se ejecuta una vez al arrancar
// draw() se ejecuta en bucle (por defecto ~60 fps)

let palabras = ['I Feel So Free', 'Good For The Soul', 'One Step Away', 'Bring Your Love', 'Danceteria', 'Read My Lips', 'Everything', 'Love Sensation', 'Love Without Words', 'Bizarre', 'School', 'Fragile', 'My Sins Are My Savior', 'Betrayal', 'The Test', 'L.E.S. Girl'];


function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');

  // Valores por defecto del texto, aplicados siempre al cargar la página
  document.documentElement.style.setProperty('--tamano-palabra', '24px');
  document.documentElement.style.setProperty('--color-palabra', '#ffffff');
  document.documentElement.style.setProperty('--fuente-palabra', 'Helvetica');
  document.documentElement.style.setProperty('--peso-palabra', 'normal');
  document.documentElement.style.setProperty('--cursiva-palabra', 'normal');
  document.documentElement.style.setProperty('--interletrado-palabra', '0px');
  document.documentElement.style.setProperty('--interlineado-palabra', '1');
  document.documentElement.style.setProperty('--alineacion-palabra', 'left');
  document.documentElement.style.setProperty('--transformacion-palabra', 'none');

  let zonaBotones = createDiv().addClass('zona-botones');
  zonaBotones.parent('sketch-holder');

  let grupoTitulo = createDiv().addClass('grupo-titulo');
  grupoTitulo.parent(zonaBotones);

  let tituloBotonera = createP('DISTORTED TYPE');
  tituloBotonera.addClass('titulo-botonera');
  tituloBotonera.parent(grupoTitulo);

  let textoIntro = createP('Test 05. User interface to modify text characteristics displayed on the right');
  textoIntro.addClass('texto-intro');
  textoIntro.parent(grupoTitulo);

  let separadorIntro = createDiv().addClass('separador-zona');
  separadorIntro.parent(zonaBotones);

  let filaTamano = createDiv().addClass('fila-etiqueta');
  filaTamano.parent(zonaBotones);

  let etiquetaTamano = createP('Text size');
  etiquetaTamano.addClass('etiqueta-control');
  etiquetaTamano.parent(filaTamano);

  let valorTamano = createP('24 pt');
  valorTamano.addClass('etiqueta-control');
  valorTamano.parent(filaTamano);

  let selectorTamano = createSlider(4, 300, 24, 1);
  selectorTamano.addClass('deslizador');
  selectorTamano.parent(zonaBotones);

  selectorTamano.input(() => {
    let tamano = selectorTamano.value();
    valorTamano.html(tamano + ' pt');
    document.documentElement.style.setProperty('--tamano-palabra', tamano + 'px');
  });

  let filaColor = createDiv().addClass('fila-etiqueta');
  filaColor.parent(zonaBotones);

  let grupoEtiquetaColor = createDiv().addClass('grupo-etiqueta-color');
  grupoEtiquetaColor.parent(filaColor);

  let etiquetaColor = createP('Text color');
  etiquetaColor.addClass('etiqueta-control');
  etiquetaColor.parent(grupoEtiquetaColor);

  let selectorColor = createColorPicker('#ffffff');
  selectorColor.addClass('selector-color');
  selectorColor.parent(grupoEtiquetaColor);

  let valorColor = createP('#ffffff');
  valorColor.addClass('etiqueta-control');
  valorColor.parent(filaColor);

  selectorColor.input(() => {
    let color = selectorColor.value();
    valorColor.html(color);
    document.documentElement.style.setProperty('--color-palabra', color);
  });

  let fuentes = ['Helvetica', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS'];

  let filaFuente = createDiv().addClass('fila-etiqueta');
  filaFuente.parent(zonaBotones);

  let etiquetaFuente = createP('Font');
  etiquetaFuente.addClass('etiqueta-control');
  etiquetaFuente.parent(filaFuente);

  let selectorFuente = createSelect();
  selectorFuente.addClass('boton');
  selectorFuente.parent(filaFuente);
  fuentes.forEach(fuente => {
    selectorFuente.option(fuente);
  });
  selectorFuente.selected(fuentes[0]);

  selectorFuente.changed(() => {
    let fuente = selectorFuente.value();
    document.documentElement.style.setProperty('--fuente-palabra', fuente);
  });

  let estilos = ['Normal', 'Italic', 'Bold', 'Bold Italic'];

  let filaEstilo = createDiv().addClass('fila-etiqueta');
  filaEstilo.parent(zonaBotones);

  let etiquetaEstilo = createP('Style');
  etiquetaEstilo.addClass('etiqueta-control');
  etiquetaEstilo.parent(filaEstilo);

  let selectorEstilo = createSelect();
  selectorEstilo.addClass('boton');
  selectorEstilo.parent(filaEstilo);
  estilos.forEach(estilo => {
    selectorEstilo.option(estilo);
  });
  selectorEstilo.selected(estilos[0]);

  selectorEstilo.changed(() => {
    let estilo = selectorEstilo.value();

    let peso = estilo.includes('Bold') ? 'bold' : 'normal';
    let cursiva = estilo.includes('Italic') ? 'italic' : 'normal';

    document.documentElement.style.setProperty('--peso-palabra', peso);
    document.documentElement.style.setProperty('--cursiva-palabra', cursiva);
  });

  let interletrados = ['0px', '1px', '2px', '4px', '8px', '12px'];

  let filaInterletrado = createDiv().addClass('fila-etiqueta');
  filaInterletrado.parent(zonaBotones);

  let etiquetaInterletrado = createP('Letter spacing');
  etiquetaInterletrado.addClass('etiqueta-control');
  etiquetaInterletrado.parent(filaInterletrado);

  let selectorInterletrado = createSelect();
  selectorInterletrado.addClass('boton');
  selectorInterletrado.parent(filaInterletrado);
  interletrados.forEach(valor => {
    selectorInterletrado.option(valor);
  });
  selectorInterletrado.selected(interletrados[0]);

  selectorInterletrado.changed(() => {
    let valor = selectorInterletrado.value();
    document.documentElement.style.setProperty('--interletrado-palabra', valor);
  });

  let interlineados = ['1', '1.2', '1.5', '2', '2.5', '3'];

  let filaInterlineado = createDiv().addClass('fila-etiqueta');
  filaInterlineado.parent(zonaBotones);

  let etiquetaInterlineado = createP('Line height');
  etiquetaInterlineado.addClass('etiqueta-control');
  etiquetaInterlineado.parent(filaInterlineado);

  let selectorInterlineado = createSelect();
  selectorInterlineado.addClass('boton');
  selectorInterlineado.parent(filaInterlineado);
  interlineados.forEach(valor => {
    selectorInterlineado.option(valor);
  });
  selectorInterlineado.selected(interlineados[0]);

  selectorInterlineado.changed(() => {
    let valor = selectorInterlineado.value();
    document.documentElement.style.setProperty('--interlineado-palabra', valor);
  });

  let alineaciones = ['Left', 'Center', 'Right', 'Justify'];

  let filaAlineacion = createDiv().addClass('fila-etiqueta');
  filaAlineacion.parent(zonaBotones);

  let etiquetaAlineacion = createP('Text align');
  etiquetaAlineacion.addClass('etiqueta-control');
  etiquetaAlineacion.parent(filaAlineacion);

  let selectorAlineacion = createSelect();
  selectorAlineacion.addClass('boton');
  selectorAlineacion.parent(filaAlineacion);
  alineaciones.forEach(valor => {
    selectorAlineacion.option(valor);
  });
  selectorAlineacion.selected(alineaciones[0]);

  selectorAlineacion.changed(() => {
    let valor = selectorAlineacion.value().toLowerCase();
    document.documentElement.style.setProperty('--alineacion-palabra', valor);
  });

  let transformaciones = [
    { etiqueta: 'Normal', valor: 'none' },
    { etiqueta: 'Uppercase', valor: 'uppercase' },
    { etiqueta: 'Lowercase', valor: 'lowercase' },
    { etiqueta: 'Capitalize', valor: 'capitalize' }
  ];

  let filaTransformacion = createDiv().addClass('fila-etiqueta');
  filaTransformacion.parent(zonaBotones);

  let etiquetaTransformacion = createP('Text case');
  etiquetaTransformacion.addClass('etiqueta-control');
  etiquetaTransformacion.parent(filaTransformacion);

  let selectorTransformacion = createSelect();
  selectorTransformacion.addClass('boton');
  selectorTransformacion.parent(filaTransformacion);
  transformaciones.forEach(t => {
    selectorTransformacion.option(t.etiqueta, t.valor);
  });
  selectorTransformacion.selected('none');

  selectorTransformacion.changed(() => {
    let valor = selectorTransformacion.value();
    document.documentElement.style.setProperty('--transformacion-palabra', valor);
  });

  let lineaDivisoria = createDiv().addClass('linea-divisoria');
  lineaDivisoria.parent('sketch-holder');

  // ... el resto de tu setup (lista de palabras, etc.)

   const contenedorPalabras = createDiv().addClass('lista-palabras');
  contenedorPalabras.parent('sketch-holder');

  palabras.forEach(palabra => {
    let elementoPalabra = createP('').addClass('palabra').parent(contenedorPalabras);
    let letras = [];

    for (let letra of palabra) {
      let caracter = (letra === ' ') ? String.fromCharCode(160) : letra;
      let spanLetra = createSpan(caracter);
      spanLetra.addClass('letra');
      spanLetra.parent(elementoPalabra);
      letras.push(spanLetra);
    }

    elementoPalabra.mouseOver(() => {
      if (!distort2Activo) return;
      letras.forEach(letraSpan => {
        let despX = (Math.random() * 40) - 20;
        let despY = (Math.random() * 40) - 20;
        let giro = (Math.random() * 60) - 30;
        letraSpan.style('transform', `translate(${despX}px, ${despY}px) rotate(${giro}deg)`);
      });
    });

    elementoPalabra.mouseOut(() => {
      letras.forEach(letraSpan => {
        letraSpan.style('transform', 'none');
      });
    });
  });

  let titulo = createP('').addClass('titulo');
  titulo.parent('sketch-holder');

  let separadorReset = createDiv().addClass('separador-zona');
  separadorReset.parent(zonaBotones);

  let filaAcciones = createDiv().addClass('fila-acciones');
  filaAcciones.parent(zonaBotones);

  let botonReset = createButton('Reset');
  botonReset.addClass('boton');
  botonReset.addClass('boton-reset');
  botonReset.parent(filaAcciones);

  let botonDistort = createButton('Distort 01');
  botonDistort.addClass('boton');
  botonDistort.addClass('boton-reset');
  botonDistort.parent(filaAcciones);

  let distortActivo = false;
  botonDistort.mousePressed(() => {
    distortActivo = !distortActivo;
    if (distortActivo) {
      contenedorPalabras.addClass('distort-activo');
      botonDistort.addClass('activo');
    } else {
      contenedorPalabras.removeClass('distort-activo');
      botonDistort.removeClass('activo');
    }
  });

  let botonDistort2 = createButton('Distort 02');
  botonDistort2.addClass('boton');
  botonDistort2.addClass('boton-reset');
  botonDistort2.parent(filaAcciones);

  let distort2Activo = false;
  botonDistort2.mousePressed(() => {
    distort2Activo = !distort2Activo;
    if (distort2Activo) {
      contenedorPalabras.addClass('distort2-activo');
      botonDistort2.addClass('activo');
    } else {
      contenedorPalabras.removeClass('distort2-activo');
      botonDistort2.removeClass('activo');
    }
  });

  botonReset.mousePressed(() => {
    // Valores CSS por defecto
    document.documentElement.style.setProperty('--tamano-palabra', '24px');
    document.documentElement.style.setProperty('--color-palabra', '#ffffff');
    document.documentElement.style.setProperty('--fuente-palabra', 'Helvetica');
    document.documentElement.style.setProperty('--peso-palabra', 'normal');
    document.documentElement.style.setProperty('--cursiva-palabra', 'normal');
    document.documentElement.style.setProperty('--interletrado-palabra', '0px');
    document.documentElement.style.setProperty('--interlineado-palabra', '1');
    document.documentElement.style.setProperty('--alineacion-palabra', 'left');
    document.documentElement.style.setProperty('--transformacion-palabra', 'none');

    // Devuelve cada control a su estado inicial
    selectorTamano.value(24);
    valorTamano.html('24 pt');

    selectorColor.value('#ffffff');
    valorColor.html('#ffffff');

    selectorFuente.selected('Helvetica');
    selectorEstilo.selected('Normal');
    selectorInterletrado.selected('0px');
    selectorInterlineado.selected('1');
    selectorAlineacion.selected('Left');
    selectorTransformacion.selected('none');

    // Desactiva también los modos Distort
    distortActivo = false;
    contenedorPalabras.removeClass('distort-activo');
    botonDistort.removeClass('activo');

    distort2Activo = false;
    contenedorPalabras.removeClass('distort2-activo');
    botonDistort2.removeClass('activo');
  });

  let separadorVolver = createDiv().addClass('separador-zona');
  separadorVolver.parent(zonaBotones);

  let filaVolver = createDiv().addClass('fila-acciones');
  filaVolver.parent(zonaBotones);

  let botonVolver = createA('../../index.html', 'Back to homepage');
  botonVolver.addClass('boton');
  botonVolver.addClass('boton-reset');
  botonVolver.addClass('boton-volver');
  botonVolver.parent(filaVolver);

  let pieVersion = createP('').addClass('pie-version');
  pieVersion.parent(zonaBotones);

  function actualizarPie() {
    const ahora = new Date();
    const fecha = ahora.toLocaleDateString();
    const hora = ahora.toLocaleTimeString();
    pieVersion.html(`eloy segura @ altura x - v1.0 — ${fecha} ${hora}`);
  }
  actualizarPie();
  setInterval(actualizarPie, 1000);
}

function draw() {
  background('#3498db');
  noStroke();
 fill(255, 255, 255, 100); // blanco, bastante transparente
  circle(mouseX, mouseY, 40);
}

// Mantiene el canvas ajustado al tamaño de la ventana
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
