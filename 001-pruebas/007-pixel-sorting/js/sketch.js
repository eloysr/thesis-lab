let imagenOriginal = null;
let imagenOrdenada = null;
let sortType = 'brightness';
let sortAngle = 0;
let sortLength = 100;
let sortGap = 1;
let enableProcessing = false;

function setup() {
  const canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('sketch-holder');

  let zonaBotones = createDiv().addClass('zona-botones');
  zonaBotones.parent('sketch-holder');

  let grupoTitulo = createDiv().addClass('grupo-titulo');
  grupoTitulo.parent(zonaBotones);

  let tituloBotonera = createP('PIXEL SORTING');
  tituloBotonera.addClass('titulo-botonera');
  tituloBotonera.parent(grupoTitulo);

  let textoIntro = createP('Sort pixels of an image based on brightness, color or saturation');
  textoIntro.addClass('texto-intro');
  textoIntro.parent(grupoTitulo);

  let separadorIntro = createDiv().addClass('separador-zona');
  separadorIntro.parent(zonaBotones);

  // Cargar imagen con input HTML estándar
  let inputFile = createInput();
  inputFile.attribute('type', 'file');
  inputFile.attribute('accept', 'image/*');
  inputFile.style('display', 'none');
  inputFile.parent(zonaBotones);

  let botonCargar = createButton('Load image');
  botonCargar.addClass('boton');
  botonCargar.addClass('boton-archivo');
  botonCargar.parent(zonaBotones);
  botonCargar.mousePressed(() => inputFile.elt.click());

  inputFile.changed(() => {
    let archivo = inputFile.elt.files[0];
    if (archivo && archivo.type.startsWith('image/')) {
      cargarImagen(archivo);
    }
  });

  // Tipo de ordenamiento
  let filaMetodo = createDiv().addClass('fila-etiqueta');
  filaMetodo.parent(zonaBotones);

  let etiquetaMetodo = createP('Sort by');
  etiquetaMetodo.addClass('etiqueta-control');
  etiquetaMetodo.parent(filaMetodo);

  let selectorMetodo = createSelect();
  selectorMetodo.addClass('boton');
  selectorMetodo.parent(filaMetodo);
  selectorMetodo.option('Brightness', 'brightness');
  selectorMetodo.option('Hue', 'hue');
  selectorMetodo.option('Saturation', 'saturation');
  selectorMetodo.selected('brightness');

  let explicacionMetodo = createP('Dark → Light');
  explicacionMetodo.addClass('explicacion-metodo');
  explicacionMetodo.parent(zonaBotones);

  selectorMetodo.changed(() => {
    sortType = selectorMetodo.value();

    if (sortType === 'brightness') {
      explicacionMetodo.html('Dark → Light');
    } else if (sortType === 'hue') {
      explicacionMetodo.html('Red → Yellow → Green → Cyan → Blue → Magenta');
    } else if (sortType === 'saturation') {
      explicacionMetodo.html('Desaturated (gray) → Saturated (pure color)');
    }

    if (enableProcessing) {
      procesarImagen();
    }
  });

  // Activar/desactivar procesamiento
  let filaActivar = createDiv().addClass('fila-acciones');
  filaActivar.parent(zonaBotones);

  let botonActivar = createButton('Enable');
  botonActivar.addClass('boton');
  botonActivar.addClass('boton-reset');
  botonActivar.parent(filaActivar);

  let estadoProcesamiento = createP('Status: <strong>Inactive</strong>');
  estadoProcesamiento.addClass('info-procesamiento');
  estadoProcesamiento.parent(zonaBotones);

  botonActivar.mousePressed(() => {
    if (!imagenOriginal) {
      alert('Please load an image first');
      return;
    }
    enableProcessing = !enableProcessing;
    if (enableProcessing) {
      botonActivar.addClass('activo');
      estadoProcesamiento.html('Status: <strong>Enabled</strong>');
      procesarImagen();
    } else {
      botonActivar.removeClass('activo');
      estadoProcesamiento.html('Status: <strong>Disabled</strong>');
    }
  });

  // Reset
  let botonReset = createButton('Reset');
  botonReset.addClass('boton');
  botonReset.addClass('boton-reset');
  botonReset.parent(filaActivar);

  botonReset.mousePressed(() => {
    imagenOriginal = null;
    imagenOrdenada = null;
    enableProcessing = false;
    botonActivar.removeClass('activo');
    selectorMetodo.selected('brightness');
    sortType = 'brightness';
    estadoProcesamiento.html('Status: <strong>Inactive</strong>');
  });

  let separadorVolver = createDiv().addClass('separador-zona');
  separadorVolver.parent(zonaBotones);

  let filaVolver = createDiv().addClass('fila-acciones');
  filaVolver.parent(zonaBotones);

  let botonVolver = createA('../../index.html', 'Back');
  botonVolver.addClass('boton');
  botonVolver.addClass('boton-reset');
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

function cargarImagen(archivo) {
  let reader = new FileReader();
  reader.onload = function(e) {
    let img = new Image();
    img.onload = function() {
      // Crear canvas temporal
      let w = img.width;
      let h = img.height;
      let tempCanvas = document.createElement('canvas');
      tempCanvas.width = w;
      tempCanvas.height = h;
      let ctx = tempCanvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // Extraer píxeles
      let imgData = ctx.getImageData(0, 0, w, h);

      // Crear p5.Image
      imagenOriginal = createImage(w, h);
      imagenOriginal.loadPixels();
      for (let i = 0; i < imgData.data.length; i++) {
        imagenOriginal.pixels[i] = imgData.data[i];
      }
      imagenOriginal.updatePixels();
    };
    img.onerror = function() {
      console.error('Error al cargar la imagen');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(archivo);
}

function procesarImagen() {
  if (!imagenOriginal || !enableProcessing) return;

  imagenOriginal.loadPixels();
  let w = imagenOriginal.width;
  let h = imagenOriginal.height;

  imagenOrdenada = createImage(w, h);
  imagenOrdenada.loadPixels();

  // Extraer todos los píxeles con sus valores de ordenamiento
  let pixeles = [];
  for (let i = 0; i < imagenOriginal.pixels.length; i += 4) {
    let r = imagenOriginal.pixels[i];
    let g = imagenOriginal.pixels[i + 1];
    let b = imagenOriginal.pixels[i + 2];
    let a = imagenOriginal.pixels[i + 3];

    let sortValue;
    if (sortType === 'brightness') {
      sortValue = 0.299 * r + 0.587 * g + 0.114 * b;
    } else if (sortType === 'hue') {
      sortValue = getHue(r, g, b);
    } else if (sortType === 'saturation') {
      sortValue = getSaturation(r, g, b);
    }

    pixeles.push({
      r: r,
      g: g,
      b: b,
      a: a,
      sortValue: sortValue
    });
  }

  // Ordenar todos los píxeles
  pixeles.sort((a, b) => a.sortValue - b.sortValue);

  // Redistribuir los píxeles ordenados en la imagen
  for (let i = 0; i < pixeles.length; i++) {
    let idx = i * 4;
    imagenOrdenada.pixels[idx] = pixeles[i].r;
    imagenOrdenada.pixels[idx + 1] = pixeles[i].g;
    imagenOrdenada.pixels[idx + 2] = pixeles[i].b;
    imagenOrdenada.pixels[idx + 3] = pixeles[i].a;
  }

  imagenOrdenada.updatePixels();
}

function getHue(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let h = 0;

  if (max === min) {
    h = 0;
  } else if (max === r) {
    h = ((g - b) / (max - min) + (g < b ? 6 : 0)) / 6;
  } else if (max === g) {
    h = ((b - r) / (max - min) + 2) / 6;
  } else if (max === b) {
    h = ((r - g) / (max - min) + 4) / 6;
  }

  return h * 255;
}

function getSaturation(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  let max = Math.max(r, g, b);
  let min = Math.min(r, g, b);
  let l = (max + min) / 2;
  let s = 0;

  if (max === min) {
    s = 0;
  } else if (l < 0.5) {
    s = (max - min) / (max + min);
  } else {
    s = (max - min) / (2 - max - min);
  }

  return s * 255;
}

function draw() {
  background('#000000');

  if (enableProcessing && imagenOrdenada) {
    let escala = min(width / imagenOrdenada.width, height / imagenOrdenada.height) * 0.9;
    let w = imagenOrdenada.width * escala;
    let h = imagenOrdenada.height * escala;
    let x = (width - w) / 2;
    let y = (height - h) / 2;
    image(imagenOrdenada, x, y, w, h);
  } else if (imagenOriginal) {
    let escala = min(width / imagenOriginal.width, height / imagenOriginal.height) * 0.9;
    let w = imagenOriginal.width * escala;
    let h = imagenOriginal.height * escala;
    let x = (width - w) / 2;
    let y = (height - h) / 2;
    image(imagenOriginal, x, y, w, h);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
