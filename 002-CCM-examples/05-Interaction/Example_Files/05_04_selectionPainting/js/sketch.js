/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ---------
 * Selection
 * ---------
 * 
 * This file demonstrates how to implement a simple selection and painting tool using p5.js.
 *
 * What this file does:
 * - Loads an image and centers it on the canvas.
 * - Allows the user to click and drag to create a selection rectangle.
 * - Converts the selection into a brush stamp that can be painted onto the canvas.
 * - Implements grid snapping for both selection and painting for better precision.
 * 
 * Controls:
 * 1. Click & drag  → draw a selection rectangle (red outline)
 * 2. Release       → selection becomes a brush stamp
 * 3. Click & drag  → paint the selection onto the canvas
 * 4. Release       → back to selection mode
 * x                → clear the paint layer
 */


let img;
let imgCopy;
let imgBuffer;
let selX, selY, selW, selH;
let distX, distY;
let painting = false;
let imgOffsetX = 0;
let imgOffsetY = 0;

// Size of the grid cells for snapping mouse coordinates
let gridSize = 10;

// Load image before setup() runs
function preload() {
  img = loadImage('assets/example.png');
}

// Runs once when the sketch starts
function setup() {

  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);

  // Create an off-screen graphics buffer for painting
  imgBuffer = createGraphics(windowWidth, windowHeight);

  // Center the image on the canvas
  imgOffsetX = (windowWidth - img.width) / 2;
  imgOffsetY = (windowHeight - img.height) / 2;

  // Set up drawing styles for the selection rectangle
  stroke('#ffffff');
  strokeWeight(2);
  noFill();
}

// Runs continuously (frame by frame)
function draw() {

  // Clear the frame with a black background.
  background(0);

  // Draw the original image centered on the canvas, then overlay the paint buffer
  image(img, imgOffsetX, imgOffsetY);
  image(imgBuffer, 0, 0);

  // Draw the selection rectangle or paint the brush stamp based on the current mode
  if (!painting) {
    // Draw the selection rectangle while dragging
    if (mouseIsPressed) {
      selW = gridify(mouseX) - selX;
      selH = gridify(mouseY) - selY;
      rect(selX, selY, selW, selH);
    }
  } else {
    // Paint the brush stamp along the mouse path while dragging
    if (mouseIsPressed) {
      paintLine();
      image(imgCopy, gridify(mouseX) - distX, gridify(mouseY) - distY);
    } else {
      image(imgCopy, selX, selY);
    }
  }
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// Handles mouse press events for both selection and painting modes
function mousePressed() {
  if (!painting) {
    // Start a new selection
    selX = gridify(mouseX);
    selY = gridify(mouseY);
  } else {
    // Calculate the distance from the mouse to the top-left corner of the selection
    distX = gridify(mouseX) - selX;
    distY = gridify(mouseY) - selY;
  }
}

// Handles mouse release events to toggle between selection and painting modes
function mouseReleased() {
  if (!painting) {
    // Finalize the selection
    selW = gridify(mouseX) - selX;
    selH = gridify(mouseY) - selY;
    selX = min(selX, gridify(mouseX));
    selY = min(selY, gridify(mouseY));

    // Ignore zero-size selections (e.g. a plain click without dragging)
    if (abs(selW) === 0 || abs(selH) === 0) return;

    // Copy the selected area from the original image to create the brush stamp
    imgCopy = img.get(selX - imgOffsetX, selY - imgOffsetY, abs(selW), abs(selH));
  }

  // Switch painting mode and return to selection mode
  painting = !painting;
}

// Handles key release events to clear the paint layer when 'x' is pressed
function keyReleased() {
  if (key === 'x') {
    imgBuffer = createGraphics(windowWidth, windowHeight);
  }
}

// Stamps imgCopy along the mouse path onto imgBuffer
function paintLine() {

  // Snap the previous and current mouse positions to the grid
  let pmX = gridify(pmouseX);
  let mX = gridify(mouseX);
  let pmY = gridify(pmouseY);
  let mY = gridify(mouseY);

  // Calculate the absolute differences in x and y directions 
  let xDif = abs(pmX - mX);
  let yDif = abs(pmY - mY);

  // The number of steps is determined by the larger of the two differences to ensure a smooth line
  let steps = max(xDif, yDif);

  // Interpolate between the previous and current mouse positions and stamp imgCopy at each step
  for (let i = 0; i < steps; i++) {

    // Calculate the interpolated x and y positions for the current step
    let xStep = int(lerp(pmX, mX, i / steps));
    let yStep = int(lerp(pmY, mY, i / steps));

    // Stamp the brush image onto the buffer at the calculated position, adjusting for the distance from the mouse to the selection corner
    imgBuffer.image(imgCopy, xStep - distX, yStep - distY);
  }
}

// Snaps a value to the nearest gridSize increment
function gridify(val) {
  return round(val / gridSize) * gridSize;
}