/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * --------------------------
 * Paper.js – Vector Graphics
 * --------------------------
 * 
 * This file is a demonstration of using the paper.js library for vector graphics.
 * It shows how to combine two shapes (a ring and a circle) using different 
 * boolean modes (unite, intersect, subtract, exclude, divide) and how to find 
 * and display the intersection points of their outlines.
 *
 * What this file does:
 * - Sets up two canvas layers: one for p5.js (background) and one for paper.js (overlay).
 * - Creates a ring shape and a cursor circle using paper.js.
 * - On each frame, applies the currently selected boolean operation to combine the 
 *   ring and circle, and displays the result.
 * - Finds the intersection points of ring and circle outlines and marks them with dots.
 * - Allows the user to click to cycle through the different boolean modes.
 *
 * Why two canvases?
 * paper.js clears its own canvas every frame. If both libraries shared one canvas, 
 * paper.js would erase the p5.js background every frame. 
 * The fix: paper.js gets its own transparent overlay canvas placed on top. 
 * Mouse events pass through it (pointerEvents: none) so p5.js still receives them.

 * What are boolean modes?
 * Two shapes can be combined mathematically:
 * - unite     → merge both shapes into one
 * - intersect → keep only the area where both overlap
 * - subtract  → cut the cursor shape out of the ring
 * - exclude   → keep areas that do NOT overlap (XOR)
 * - divide    → split both shapes at every intersection point
 *
 * What are path intersections?
 * Wherever the outlines of two shapes cross each other, paper.js can find
 * the exact crossing points. Here they are shown as pink dots.
 *
 * Controls:
 * Click through the five boolean modes

 * Note: Make sure to load the paper.js library in your HTML file.
 * 
 * For more information on paper.js, see: http://paperjs.org
 */


let paperOverlay;        // paper.js needs its own <canvas> element separate from p5.js
let ring;                // paper.js ring shape object
let circle;              // paper.js circle shape object
let booleanResult;       // Every frame, the boolean result is recalculated and stored here
let intersectionPoints;  // Dot markers shown at path intersection points
const modes = ['unite', 'intersect', 'subtract', 'exclude', 'divide'];
let currentIndex = 0;    // Index of the currently active mode


// Runs once when the sketch starts
function setup() {

  // Create the p5.js canvas — this is LAYER 1 (background)
  createCanvas(windowWidth, windowHeight);

  // Create a second, separate canvas for paper.js — this is LAYER 2 (overlay)
  paperOverlay = document.createElement('canvas');
  paperOverlay.width = width;
  paperOverlay.height = height;

  // Position the overlay canvas directly on top of the p5.js canvas
  Object.assign(paperOverlay.style, {
    position: 'absolute',
    top: '0',
    left: '0',
    pointerEvents: 'none'  // mouse clicks pass through to p5.js below
  });
  document.body.appendChild(paperOverlay);

  // Connect paper.js to the overlay canvas
  paper.setup(paperOverlay);

  // Disable paper.js's own animation loop — p5.js draw() drives everything
  paper.view.autoUpdate = false;

  // Build the initial scene
  buildScene();
}

// Creates all paper.js shapes and styles, and positions them in the center of the canvas.
// Called once on startup and again whenever the window is resized,
// so all shapes stay centered and correctly sized.
function buildScene() {

  // Remove all existing paper.js objects
  paper.project.clear();

  // Calculate the center of the canvas and a base radius
  const cx = windowWidth / 2;
  const cy = windowHeight / 2;
  const r = Math.min(windowWidth, windowHeight) * 0.20;

  // Build the ring using a boolean subtract:
  // outer circle minus inner circle = donut with a hole
  const outer = new paper.Path.Circle({ center: [cx, cy], radius: r });
  const inner = new paper.Path.Circle({ center: [cx, cy], radius: r * 0.48 });
  ring = outer.subtract(inner); // this creates a CompoundPath (shape with a hole)
  ring.strokeColor = new paper.Color(1.0, 1.0, 1.0, 0.5);
  ring.strokeWidth = 1.5;
  ring.fillColor = new paper.Color(1.0, 1.0, 1.0, 0.3);

  // The original circles are no longer needed — remove them from the scene
  outer.remove();
  inner.remove();

  // Create the cursor circle — starts far off-screen until the mouse moves in
  circle = new paper.Path.Circle({
    center: new paper.Point(-400, -400),
    radius: r * 0.68,
    strokeColor: new paper.Color(1, 1, 1, 0.40),
    strokeWidth: 1.5,
    fillColor: new paper.Color(1, 1, 1, 0.05)
  });
}

// Runs continuously (frame by frame)
function draw() {

  // Clear the frame with a black background.
  background(0);

  // Move the paper.js circle to wherever the mouse currently is.
  // mouseX and mouseY come from p5.js, paper.Point is a paper.js coordinate.
  circle.position = new paper.Point(mouseX, mouseY);

  // Remove the boolean result and intersection points from the previous frame
  // before calculating fresh ones — otherwise shapes pile up endlessly
  if (booleanResult) { booleanResult.remove(); booleanResult = null; }
  if (intersectionPoints) { intersectionPoints.remove(); intersectionPoints = null; }


  // Shape Operation 
  // paper.js PathItems have methods like .unite(), .subtract(), etc.
  // Here we call whichever operation is currently selected by currentIndex.
  // The result is a brand-new shape we can style and display.

  const op = modes[currentIndex]; // e.g. 'subtract'
  booleanResult = ring[op](circle); // e.g. ring.subtract(circle)

  // Helper: apply stroke and fill to a single path item
  function applyColor(item, fillAlpha) {
    item.strokeColor = new paper.Color(1.0, 1.0, 1.0, 1.0);
    item.strokeWidth = 8;
    item.fillColor = new paper.Color(1.0, 1.0, 1.0, fillAlpha);
  }

  // 'divide' can return a Group containing multiple separate path pieces
  if (booleanResult instanceof paper.Group) {
    booleanResult.children.forEach((child, i) => {
      applyColor(child, 0.4 + i * 0.15); // slightly different alpha per piece
    });
  } else {
    applyColor(booleanResult, 0.4);
  }

  // Push the boolean result to the back so intersection dots appear on top
  booleanResult.sendToBack();


  // Path Intersections
  // getIntersections() returns all points where two path outlines cross.
  // The ring is a CompoundPath (has children), so we loop over its sub-paths.
  let intersections = [];
  const ringPaths = ring.children ? ring.children : [ring];

  ringPaths.forEach(child => {
    intersections = intersections.concat(circle.getIntersections(child));
  });

  if (intersections.length > 0) {
    intersectionPoints = new paper.Group();

    intersections.forEach(loc => {

      // Sharp inner dot (small, fully opaque)
      const dot = new paper.Path.Circle({
        center: loc.point,
        radius: 4.5,
        fillColor: new paper.Color(1.0, 0.0, 1.0, 1.0),
        strokeColor: new paper.Color(1.0, 0.0, 1.0, 1.0),
        strokeWidth: 1
      });

      intersectionPoints.addChild(dot);
    });
  }

  // Manually trigger paper.js to render its canvas
  // (needed because we turned off autoUpdate in setup)
  paper.view.update();

  // Draw the mode label and hint text on top via p5.js
  displayInfo();
}

// Draws the current boolean mode label and hint text at the bottom of the canvas.
function displayInfo() {
  noStroke();
  fill(255);
  textFont('monospace');
  textAlign(CENTER, TOP);
  textSize(16);
  text(modes[currentIndex], width / 2, height - 75);
  textSize(12);
  fill(192);
  text('click to change mode', width / 2, height - 50);
}

// Cycles to the next boolean mode on mouse click
function mousePressed() {
  // % modes.length wraps back to 0 after the last mode
  currentIndex = (currentIndex + 1) % modes.length;
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {

  resizeCanvas(windowWidth, windowHeight);

  // Resize the paper.js overlay canvas to match
  paperOverlay.width = windowWidth;
  paperOverlay.height = windowHeight;
  paper.view.viewSize = new paper.Size(windowWidth, windowHeight);

  // Rebuild all shapes so they stay centered at the new size
  buildScene();
}