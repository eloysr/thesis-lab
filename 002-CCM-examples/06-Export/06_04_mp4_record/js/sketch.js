/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -----------------
 * Export MP4 Record
 * -----------------
 *
 * This file is a demonstration of how to record and export the canvas as a MP4 file.
 *
 * What this file does:
 * - Sets up the encoder with appropriate settings for quality and performance.
 * - Captures each frame of the animation by drawing the canvas onto an off-screen buffer, then adding it to the encoder.
 * - Finalizes the video file and triggers a download when the animation completes. 
 *
 * Note that the encoder used in this implementation is based on the HME (H264 MP4 Encoder) library,
 * which needs to be included in the project for this code to work.
 * See index.html for the script tag that imports the HME library.
 * */

let backgroundColor = '#000000';
let curvePresets = [
  { text: "Welcome to the internet!",                   color: '#ffc144', lineWidth: 80 },
  { text: "what is the internet?",                      color: '#ff4444', lineWidth: 100 },
  { text: "how could i explain...",                     color: '#caff44', lineWidth: 80 },
  { text: "It's electric!",                             color: '#ffffff', lineWidth: 120 },
  { text: "It′s like we have contact through a cable.", color: '#3a7fff', lineWidth: 60 },
];
let curves = [];
let currentCurve = null;
let isDrawing = false;
let font;
let recorder;
let ui;

// Runs once before the sketch starts
function preload() {
  font = loadFont("assets/Barlow-Bold.ttf");
}

// Runs once when the sketch starts
function setup() {
  let cnv = createCanvas(calcCanvasDimensions()[0], calcCanvasDimensions()[1]);

  // Build and wire up the control panel
  ui = new Interface();
  ui.init();

    // Create the MP4 recorder
  recorder = new MP4Export();
}

// Runs continuously (frame by frame)
function draw() {
  background(backgroundColor);

  if (currentCurve) {
    currentCurve.followMouse(mouseX, mouseY);
  }

  for (let c of curves) {
    c.update();
    c.display();
  }

  if (currentCurve) {
    currentCurve.update();
    currentCurve.display();
  }

  if (recorder.isRecording == true) {
    recorder.update();
  }
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(calcCanvasDimensions()[0], calcCanvasDimensions()[1]);
}

// Calculates the canvas dimensions based on the window size.
function calcCanvasDimensions() {
  let size = min(windowWidth, windowHeight) - 100 > 1080 ? 1080 : min(windowWidth, windowHeight) - 100;
  return [size, size];
}

// Mouse interaction handlers for drawing curves on the canvas.
function mousePressed() {
  isDrawing = true;
  const preset = curvePresets[curves.length % curvePresets.length];
  currentCurve = new Curve(mouseX, mouseY, keyIsDown(SHIFT), preset);
}
function mouseReleased() {
  if (!isDrawing || !currentCurve) return;
  currentCurve.finish();
  if (currentCurve.points.length >= 2) {
    curves.push(currentCurve);
  }
  currentCurve = null;
  isDrawing = false;
}

// Utility function to clear all curves from the canvas and reset the drawing state.
function clearCurves() {
  for (const c of curves) c.remove();
  curves = [];
  if (currentCurve) { currentCurve.remove(); currentCurve = null; }
  isDrawing = false;
}