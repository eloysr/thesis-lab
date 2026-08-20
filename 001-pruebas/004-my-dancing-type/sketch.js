let VERSION = "v1.3";
let interletrado = 15;
let mic;
let nivel = 0;
let micActivo = false;
let boton;
let texto = "Loading phrase...";
let entradaTexto;
let botonAplicarTexto;
const STORAGE_KEY = "textoCambiableConfig";
let botonColor;
let botonFondo;
let botonTamano;
let selectorFuente;
let paletaColores;
let paletaFondo;
let paletaTamano;
let paletaTransparencia;
let botonTransparencia;
let botonReset;
let sliderTransparencia;
let displayTransparencia;
let sliderTamano;
let displayTamano;
let colorTexto = [255, 255, 255];
let colorFondo = [32, 32, 32];
let tamañoTexto = 80;
let fuenteTexto = "Helvetica";
let esNegrita = false;
let transparenciaTexto = 100;
let textoPersonalizado = false;
let swatchSeleccionadoTexto;
let swatchSeleccionadoFondo;
let sizeSeleccionado;
let colorSeleccionadoHex = "#FFFFFF";
let colorFondoHex = "#202020";

const opcionesFuentes = [
  { label: "Helvetica Bold", family: "Helvetica", style: "bold" },
  { label: "Helvetica Light", family: "Helvetica", style: "normal" },
  { label: "Courier Bold", family: "Courier New", style: "bold" },
  { label: "Courier Normal", family: "Courier New", style: "normal" },
  { label: "Garamond", family: "Garamond", style: "normal" },
  { label: "Didot Bold", family: "Didot", style: "bold" }
];

function getCanvasFontFamilyName(fontFamily) {
  return /\s/.test(fontFamily) ? `"${fontFamily}"` : fontFamily;
}

function aplicarFuenteManual(fontFamily, bold, size = tamañoTexto) {
  const fontFamilyName = getCanvasFontFamilyName(fontFamily);
  textFont(fontFamilyName);
  textStyle(bold ? BOLD : NORMAL);
  textSize(size);

  const context = drawingContext;
  if (context) {
    context.font = `${bold ? "700" : "400"} ${size}px ${fontFamilyName}`;
    context.textAlign = "center";
  }
}

function aplicarFuenteAlContexto() {
  aplicarFuenteManual(fuenteTexto, esNegrita, tamañoTexto);
}

function medirAnchoTexto(textoARenderizar, fontFamily, bold, size = tamañoTexto) {
  aplicarFuenteManual(fontFamily, bold, size);
  return textWidth(textoARenderizar);
}

function dibujarTextoSegmentado(textoARenderizar, x, y, fontFamily, bold, size = tamañoTexto) {
  const interletradoActual = interletrado + nivel * 150;
  let anchoTotal = 0;
  for (let i = 0; i < textoARenderizar.length; i++) {
    anchoTotal += medirAnchoTexto(textoARenderizar.charAt(i), fontFamily, bold, size) + interletradoActual;
  }
  anchoTotal -= interletradoActual;

  let posicionX = x - anchoTotal / 2;
  for (let i = 0; i < textoARenderizar.length; i++) {
    const letra = textoARenderizar.charAt(i);
    const letraWidth = medirAnchoTexto(letra, fontFamily, bold, size);
    const letraX = posicionX + letraWidth / 2;
    const desplazamiento = sin(frameCount * 0.2 + i) * nivel * 400;
    const escala = 1 + nivel * 600;

    push();
    translate(letraX, y + desplazamiento);
    scale(escala);
    aplicarFuenteManual(fontFamily, bold, size);
    text(letra, 0, 0);
    pop();

    posicionX += letraWidth + interletradoActual;
  }
}

function aplicarFuenteSeleccionada(opcion) {
  if (!opcion) {
    return;
  }

  fuenteTexto = opcion.family;
  esNegrita = opcion.style === "bold";
  aplicarFuenteAlContexto();
  textFont(fuenteTexto);
  textStyle(esNegrita ? BOLD : NORMAL);
  textSize(tamañoTexto);

  if (typeof document !== "undefined" && document.fonts?.load) {
    document.fonts.load(`1em ${getCanvasFontFamilyName(fuenteTexto)}`).then(() => {
      if (fuenteTexto === opcion.family) {
        aplicarFuenteAlContexto();
        textFont(fuenteTexto);
        textStyle(esNegrita ? BOLD : NORMAL);
        textSize(tamañoTexto);
      }
    });
  }
}

const DEFAULT_CONFIG = {
  texto: "",
  colorTexto: "#FFFFFF",
  colorFondo: "#202020",
  tamañoTexto: 80,
  transparenciaTexto: 100,
  fuenteSeleccionada: "Helvetica Bold"
};

function actualizarEtiquetaInfo(etiquetaInfo) {
  if (!etiquetaInfo) {
    return;
  }

  const ahora = new Date();
  etiquetaInfo.html(`eloy segura @ altura x · ${VERSION} · ${ahora.toLocaleDateString("es-ES")} · ${ahora.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`);
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  fuenteTexto = "Helvetica";
  esNegrita = true;
  textFont("Helvetica");
  textStyle(BOLD);
  textSize(80);
  textAlign(CENTER, CENTER);
  aplicarFuenteAlContexto();

  mic = new p5.AudioIn();

  const etiquetaInfo = createDiv();
  actualizarEtiquetaInfo(etiquetaInfo);
  etiquetaInfo.style("position", "fixed");
  etiquetaInfo.style("bottom", "10px");
  etiquetaInfo.style("right", "12px");
  etiquetaInfo.style("color", "#888");
  etiquetaInfo.style("font-family", "monospace");
  etiquetaInfo.style("font-size", "12px");
  etiquetaInfo.style("z-index", "100");
  etiquetaInfo.style("opacity", "0.8");
  setInterval(() => actualizarEtiquetaInfo(etiquetaInfo), 1000);

  const config = cargarConfiguracion() || DEFAULT_CONFIG;
  aplicarConfigAlEstado(config);

  const uiPanel = createDiv();
  uiPanel.addClass("ui-panel");
  uiPanel.style("position", "fixed");
  uiPanel.style("left", "20px");
  uiPanel.style("top", "20px");
  uiPanel.style("width", "360px");
  uiPanel.style("display", "flex");
  uiPanel.style("flex-direction", "column");
  uiPanel.style("gap", "10px");
  uiPanel.style("z-index", "1000");

  const textoEncabezadoPanel = createDiv("My dancing type");
  textoEncabezadoPanel.parent(uiPanel);
  textoEncabezadoPanel.style("color", "#fff");
  textoEncabezadoPanel.style("font-size", "1.05rem");
  textoEncabezadoPanel.style("font-weight", "700");
  textoEncabezadoPanel.style("font-family", "Helvetica, Arial, sans-serif");
  textoEncabezadoPanel.style("text-align", "left");
  textoEncabezadoPanel.style("padding", "0 0.25rem");

  botonFondo = createButton(`Background · ${colorFondoHex}`);
  botonFondo.parent(uiPanel);
  botonFondo.style("width", "auto");
  botonFondo.style("height", "2.5rem");
  botonFondo.addClass("color-dropdown-button");
  botonFondo.mousePressed(togglePaletaFondo);

  const textoEntradaEtiqueta = createDiv("Write your text here");
  textoEntradaEtiqueta.parent(uiPanel);
  textoEntradaEtiqueta.style("color", "#fff");
  textoEntradaEtiqueta.style("font-size", "0.95rem");
  textoEntradaEtiqueta.style("padding", "0 0.25rem");
  textoEntradaEtiqueta.style("text-align", "left");

  entradaTexto = createInput("");
  entradaTexto.attribute("placeholder", "Text loading...");
  entradaTexto.parent(uiPanel);
  entradaTexto.style("width", "100%");
  entradaTexto.input(() => guardarConfiguracion());
  entradaTexto.elt.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
      aplicarTextoPersonalizado();
    }
  });

  botonAplicarTexto = createButton("Text enter");
  botonAplicarTexto.parent(uiPanel);
  botonAplicarTexto.style("width", "auto");
  botonAplicarTexto.style("height", "2.5rem");
  botonAplicarTexto.mousePressed(aplicarTextoPersonalizado);

  const fuenteEtiqueta = createDiv("Text options");
  fuenteEtiqueta.parent(uiPanel);
  fuenteEtiqueta.style("color", "#fff");
  fuenteEtiqueta.style("font-size", "0.95rem");
  fuenteEtiqueta.style("padding", "0 0.25rem");
  fuenteEtiqueta.style("text-align", "left");

  selectorFuente = createSelect();
  selectorFuente.parent(uiPanel);
  selectorFuente.style("width", "100%");
  selectorFuente.style("height", "2.5rem");

  opcionesFuentes.forEach((opcion) => {
    selectorFuente.option(opcion.label, opcion.label);
  });
  selectorFuente.selected("Helvetica Bold");
  esNegrita = true;

  selectorFuente.changed(() => {
    const seleccionado = selectorFuente.value();
    const seleccion = opcionesFuentes.find((opcion) => opcion.label === seleccionado);
    if (seleccion) {
      aplicarFuenteSeleccionada(seleccion);
      guardarConfiguracion();
    }
  });

  botonTamano = createButton(`Text size · ${tamañoTexto}`);
  botonTamano.parent(uiPanel);
  botonTamano.style("width", "auto");
  botonTamano.style("height", "2.5rem");
  botonTamano.addClass("color-dropdown-button");
  botonTamano.mousePressed(togglePaletaTamano);

  botonColor = createButton(`Color · ${colorSeleccionadoHex}`);
  botonColor.parent(uiPanel);
  botonColor.style("width", "auto");
  botonColor.style("height", "2.5rem");
  botonColor.addClass("color-dropdown-button");
  botonColor.mousePressed(togglePaletaColores);

  botonTransparencia = createButton(`Transparency · ${transparenciaTexto}%`);
  botonTransparencia.parent(uiPanel);
  botonTransparencia.style("width", "auto");
  botonTransparencia.style("height", "2.5rem");
  botonTransparencia.addClass("color-dropdown-button");
  botonTransparencia.mousePressed(togglePaletaTransparencia);

  const separadorOpciones = createDiv();
  separadorOpciones.parent(uiPanel);
  separadorOpciones.addClass("control-separator");

  boton = createButton("Activate microphone");
  boton.parent(uiPanel);
  boton.style("width", "auto");
  boton.style("height", "2.5rem");
  boton.style("background", "rgba(128, 128, 128, 0.5)");
  boton.style("color", "#ffffff");
  boton.style("border", "1px solid rgba(255, 255, 255, 0.2)");
  boton.style("box-shadow", "0 0 0 2px rgba(128, 128, 128, 0.2)");
  boton.mousePressed(activarMicrofono);

  botonReset = createButton("Reset configuration");
  botonReset.parent(uiPanel);
  botonReset.style("width", "auto");
  botonReset.style("height", "2.5rem");
  botonReset.mousePressed(resetConfiguracion);

  paletaColores = createDiv();
  paletaColores.addClass("color-palette");
  paletaColores.position(20, 260);
  paletaColores.style("display", "none");

  paletaFondo = createDiv();
  paletaFondo.addClass("color-palette");
  paletaFondo.position(20, 260);
  paletaFondo.style("display", "none");

  paletaTamano = createDiv();
  paletaTamano.addClass("option-palette");
  paletaTamano.addClass("size-palette");
  paletaTamano.position(20, 260);
  paletaTamano.style("display", "none");

  const tamanoLabel = createDiv("Size");
  tamanoLabel.addClass("option-item");
  tamanoLabel.parent(paletaTamano);
  tamanoLabel.style("justify-content", "flex-start");
  tamanoLabel.style("cursor", "default");
  tamanoLabel.style("background", "transparent");
  tamanoLabel.style("border", "none");
  tamanoLabel.style("box-shadow", "none");

  displayTamano = createDiv(tamañoTexto.toString());
  displayTamano.addClass("option-item");
  displayTamano.parent(paletaTamano);
  displayTamano.style("justify-content", "center");
  displayTamano.style("background", "rgba(255,255,255,0.08)");
  displayTamano.style("border", "1px solid rgba(255,255,255,0.15)");
  displayTamano.style("cursor", "default");

  sliderTamano = createSlider(8, 600, tamañoTexto, 1);
  sliderTamano.parent(paletaTamano);
  sliderTamano.style("width", "100%");
  sliderTamano.input(() => {
    const nuevoTamano = sliderTamano.value();
    tamañoTexto = nuevoTamano;
    botonTamano.html(`Text size · ${nuevoTamano}`);
    displayTamano.html(nuevoTamano.toString());
    guardarConfiguracion();
  });
  sliderTamano.changed(() => {
    paletaTamano.style("display", "none");
  });
  sliderTamano.elt.addEventListener("click", (evento) => evento.stopPropagation());
  sliderTamano.elt.addEventListener("mousedown", (evento) => evento.stopPropagation());

  paletaTransparencia = createDiv();
  paletaTransparencia.addClass("option-palette");
  paletaTransparencia.position(20, 260);
  paletaTransparencia.style("display", "none");

  const transparenciaLabel = createDiv("Transparency");
  transparenciaLabel.addClass("option-item");
  transparenciaLabel.parent(paletaTransparencia);
  transparenciaLabel.style("justify-content", "flex-start");
  transparenciaLabel.style("cursor", "default");
  transparenciaLabel.style("background", "transparent");
  transparenciaLabel.style("border", "none");
  transparenciaLabel.style("box-shadow", "none");

  displayTransparencia = createDiv(`${transparenciaTexto}%`);
  displayTransparencia.addClass("option-item");
  displayTransparencia.parent(paletaTransparencia);
  displayTransparencia.style("justify-content", "center");
  displayTransparencia.style("background", "rgba(255,255,255,0.08)");
  displayTransparencia.style("border", "1px solid rgba(255,255,255,0.15)");
  displayTransparencia.style("cursor", "default");

  sliderTransparencia = createSlider(0, 100, transparenciaTexto, 1);
  sliderTransparencia.parent(paletaTransparencia);
  sliderTransparencia.style("width", "100%");
  sliderTransparencia.input(() => {
    transparenciaTexto = sliderTransparencia.value();
    botonTransparencia.html(`Transparency · ${transparenciaTexto}%`);
    displayTransparencia.html(`${transparenciaTexto}%`);
    guardarConfiguracion();
  });
  sliderTransparencia.changed(() => {
    paletaTransparencia.style("display", "none");
  });
  sliderTransparencia.elt.addEventListener("click", (evento) => evento.stopPropagation());
  sliderTransparencia.elt.addEventListener("mousedown", (evento) => evento.stopPropagation());

  const paleta256 = generarPaleta256();
  paleta256.forEach((color, index) => {
    const swatch = createDiv();
    swatch.addClass("color-swatch");
    swatch.style("background", color.hex);
    swatch.attribute("data-hex", color.hex);
    swatch.parent(paletaColores);
    swatch.mousePressed(() => {
      seleccionarTextoColor(color.hex, swatch);
      paletaColores.style("display", "none");
      guardarConfiguracion();
    });

    if (color.hex === colorSeleccionadoHex) {
      seleccionarTextoColor(color.hex, swatch);
    }
  });

  paleta256.forEach((color, index) => {
    const swatch = createDiv();
    swatch.addClass("color-swatch");
    swatch.style("background", color.hex);
    swatch.attribute("data-hex", color.hex);
    swatch.parent(paletaFondo);
    swatch.mousePressed(() => {
      seleccionarFondoColor(color.hex, swatch);
      paletaFondo.style("display", "none");
      guardarConfiguracion();
    });

    if (color.hex === colorFondoHex) {
      seleccionarFondoColor(color.hex, swatch);
    }
  });

  paletaColores.elt.addEventListener("click", (evento) => evento.stopPropagation());
  paletaFondo.elt.addEventListener("click", (evento) => evento.stopPropagation());
  paletaTamano.elt.addEventListener("click", (evento) => evento.stopPropagation());
  paletaTransparencia.elt.addEventListener("click", (evento) => evento.stopPropagation());
  botonColor.elt.addEventListener("click", (evento) => evento.stopPropagation());
  botonFondo.elt.addEventListener("click", (evento) => evento.stopPropagation());
  botonTamano.elt.addEventListener("click", (evento) => evento.stopPropagation());
  botonTransparencia.elt.addEventListener("click", (evento) => evento.stopPropagation());

  aplicarConfigInicial(config);
  botonColor.html(`Color · ${colorSeleccionadoHex}`);
  botonFondo.html(`Background · ${colorFondoHex}`);
  botonTamano.html(`Text size · ${tamañoTexto}`);
  sliderTamano.value(tamañoTexto);
  displayTamano.html(tamañoTexto.toString());
  botonTransparencia.html(`Transparency · ${transparenciaTexto}%`);
  sliderTransparencia.value(transparenciaTexto);
  displayTransparencia.html(`${transparenciaTexto}%`);
  selectorFuente.selected(config.fuenteSeleccionada || DEFAULT_CONFIG.fuenteSeleccionada);
  const seleccionFuente = opcionesFuentes.find((opcion) => opcion.label === selectorFuente.value());
  if (seleccionFuente) {
    aplicarFuenteSeleccionada(seleccionFuente);
  }

  // No random phrase loading on page load.
}

function aplicarTextoPersonalizado() {
  let valor = entradaTexto.value().trim();

  if (valor.length > 0) {
    texto = valor;
    textoPersonalizado = true;
  } else {
    texto = "Loading phrase...";
    textoPersonalizado = false;
  }

  guardarConfiguracion();
}

function seleccionarTextoColor(hex, swatch) {
  colorTexto = hexToRgb(hex);
  colorSeleccionadoHex = hex;
  botonColor.html(`Color · ${hex}`);

  if (swatchSeleccionadoTexto) {
    swatchSeleccionadoTexto.removeClass("selected");
  }

  swatch.addClass("selected");
  swatchSeleccionadoTexto = swatch;
  guardarConfiguracion();
}

function seleccionarFondoColor(hex, swatch) {
  colorFondo = hexToRgb(hex);
  colorFondoHex = hex;
  botonFondo.html(`Background · ${hex}`);

  if (swatchSeleccionadoFondo) {
    swatchSeleccionadoFondo.removeClass("selected");
  }

  swatch.addClass("selected");
  swatchSeleccionadoFondo = swatch;
  guardarConfiguracion();
}

function seleccionarTamano(size, item) {
  tamañoTexto = size;
  sizeSeleccionado = item;
  botonTamano.html(`Size · ${size}`);

  if (sizeSeleccionado && sizeSeleccionado !== item) {
    sizeSeleccionado.removeClass("selected");
  }

  item.addClass("selected");
  sizeSeleccionado = item;
}

function togglePaletaColores() {
  const display = paletaColores.style("display");
  paletaColores.style("display", display === "none" ? "grid" : "none");
  paletaFondo.style("display", "none");
  paletaTamano.style("display", "none");
  paletaTransparencia.style("display", "none");
}

function togglePaletaFondo() {
  const display = paletaFondo.style("display");
  paletaFondo.style("display", display === "none" ? "grid" : "none");
  paletaColores.style("display", "none");
  paletaTamano.style("display", "none");
  paletaTransparencia.style("display", "none");
}

function togglePaletaTamano() {
  const display = paletaTamano.style("display");
  paletaTamano.style("display", display === "none" ? "grid" : "none");
  paletaColores.style("display", "none");
  paletaFondo.style("display", "none");
  paletaTransparencia.style("display", "none");
}

function togglePaletaTransparencia() {
  const display = paletaTransparencia.style("display");
  paletaTransparencia.style("display", display === "none" ? "grid" : "none");
  paletaColores.style("display", "none");
  paletaFondo.style("display", "none");
  paletaTamano.style("display", "none");
}

function generarPaleta256() {
  const niveles = [0, 32, 64, 96, 128, 160, 192, 224, 255];
  const colores = [];

  for (let r of niveles) {
    for (let g of niveles) {
      for (let b of niveles) {
        colores.push({
          hex: rgbToHex(r, g, b)
        });

        if (colores.length >= 256) {
          return colores;
        }
      }
    }
  }

  return colores;
}

function rgbToHex(r, g, b) {
  return `#${[r, g, b]
    .map((valor) => valor.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}`;
}

function isValidHexColor(value) {
  return typeof value === "string" && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(value);
}

function hexToRgb(hex) {
  const limpio = hex.replace("#", "");
  const valor = limpio.length === 3
    ? limpio.split("").map((char) => char + char).join("")
    : limpio;

  const r = parseInt(valor.slice(0, 2), 16);
  const g = parseInt(valor.slice(2, 4), 16);
  const b = parseInt(valor.slice(4, 6), 16);

  return [r, g, b];
}

function activarMicrofono() {
  userStartAudio();
  mic.start();
  micActivo = true;
  boton.hide();
}

function guardarConfiguracion() {
  const configuracion = {
    texto: entradaTexto.value().trim(),
    colorTexto: colorSeleccionadoHex,
    colorFondo: colorFondoHex,
    tamañoTexto,
    transparenciaTexto,
    fuenteSeleccionada: selectorFuente ? selectorFuente.value() : "Helvetica Bold"
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configuracion));
  } catch (error) {
    console.warn("Could not save configuration:", error);
  }
}

function cargarConfiguracion() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn("Could not load configuration:", error);
    return null;
  }
}

function aplicarConfigAlEstado(config) {
  if (typeof config.texto === "string") {
    texto = config.texto.length > 0 ? config.texto : "Loading phrase...";
    textoPersonalizado = config.texto.length > 0;
  }

  if (isValidHexColor(config.colorTexto)) {
    colorSeleccionadoHex = config.colorTexto;
    colorTexto = hexToRgb(config.colorTexto);
  }

  if (isValidHexColor(config.colorFondo)) {
    colorFondoHex = config.colorFondo;
    colorFondo = hexToRgb(config.colorFondo);
  }

  if (typeof config.tamañoTexto === "number" || typeof config.tamañoTexto === "string") {
    const tam = Number(config.tamañoTexto);
    if (!Number.isNaN(tam)) {
      tamañoTexto = tam;
    }
  }

  if (typeof config.transparenciaTexto === "number" || typeof config.transparenciaTexto === "string") {
    const trans = Number(config.transparenciaTexto);
    if (!Number.isNaN(trans)) {
      transparenciaTexto = trans;
    }
  }

  if (typeof config.fuenteSeleccionada === "string") {
    const opcionesFuentes = [
      { label: "Helvetica Bold", family: "Helvetica", style: "bold" },
      { label: "Helvetica Light", family: "Helvetica", style: "normal" },
      { label: "Courier Bold", family: "Courier New", style: "bold" },
      { label: "Courier Normal", family: "Courier New", style: "normal" },
      { label: "Noto Sans Condensed", family: "Noto Sans Condensed", style: "normal" }
    ];
    const seleccion = opcionesFuentes.find((opcion) => opcion.label === config.fuenteSeleccionada);
    if (seleccion) {
      fuenteTexto = seleccion.family;
      esNegrita = seleccion.style === "bold";
    }
  }
}

function aplicarConfigInicial(config) {
  if (config.texto !== undefined) {
    entradaTexto.value(config.texto);
    texto = config.texto.length > 0 ? config.texto : "Loading phrase...";
    textoPersonalizado = config.texto.length > 0;
  }

  if (isValidHexColor(config.colorTexto)) {
    colorSeleccionadoHex = config.colorTexto;
    colorTexto = hexToRgb(config.colorTexto);
  }

  if (isValidHexColor(config.colorFondo)) {
    colorFondoHex = config.colorFondo;
    colorFondo = hexToRgb(config.colorFondo);
  }

  if (typeof config.tamañoTexto === "number" || typeof config.tamañoTexto === "string") {
    const tam = Number(config.tamañoTexto);
    if (!Number.isNaN(tam)) {
      tamañoTexto = tam;
    }
  }

  if (typeof config.transparenciaTexto === "number" || typeof config.transparenciaTexto === "string") {
    const trans = Number(config.transparenciaTexto);
    if (!Number.isNaN(trans)) {
      transparenciaTexto = trans;
    }
  }

  if (config.fuenteSeleccionada) {
    const opcionesFuentes = [
      { label: "Helvetica Bold", family: "Helvetica", style: "bold" },
      { label: "Helvetica Light", family: "Helvetica", style: "normal" },
      { label: "Courier Bold", family: "Courier New", style: "bold" },
      { label: "Courier Normal", family: "Courier New", style: "normal" }
    ];
    const seleccion = opcionesFuentes.find((opcion) => opcion.label === config.fuenteSeleccionada);
    if (seleccion) {
      fuenteTexto = seleccion.family;
      esNegrita = seleccion.style === "bold";
    }
  }
}

function resetConfiguracion() {
  localStorage.removeItem(STORAGE_KEY);
  aplicarConfigAlEstado(DEFAULT_CONFIG);
  entradaTexto.value("");
  botonColor.html(`Color · ${colorSeleccionadoHex}`);
  botonFondo.html(`Background · ${colorFondoHex}`);
  botonTamano.html(`Text size · ${tamañoTexto}`);
  sliderTamano.value(tamañoTexto);
  displayTamano.html(tamañoTexto.toString());
  botonTransparencia.html(`Transparency · ${transparenciaTexto}%`);
  sliderTransparencia.value(transparenciaTexto);
  displayTransparencia.html(`${transparenciaTexto}%`);
  selectorFuente.selected(DEFAULT_CONFIG.fuenteSeleccionada);
  const seleccionFuente = opcionesFuentes.find((opcion) => opcion.label === selectorFuente.value());
  if (seleccionFuente) {
    aplicarFuenteSeleccionada(seleccionFuente);
  }
  guardarConfiguracion();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  background(colorFondo[0], colorFondo[1], colorFondo[2]);
  const alpha = transparenciaTexto / 100 * 255;
  fill(colorTexto[0], colorTexto[1], colorTexto[2], alpha);

  if (micActivo) {
    nivel = mic.getLevel();
  }

  const anchoTexto = medirAnchoTexto(texto, fuenteTexto, esNegrita, tamañoTexto);
  const xInicio = width / 2 - anchoTexto / 2;
  const y = height / 2;

  dibujarTextoSegmentado(texto, xInicio + anchoTexto / 2, y, fuenteTexto, esNegrita, tamañoTexto);
}