/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -------------------
 * Design Level Coding
 * -------------------
 * 
 * This file is an example of how to build a feature by using a design level coding approach. 
 * 
Prompt (already executed):
Create an interactive spray can drawing tool in p5.js using the existing project structure.

Canvas & Background
Full window canvas. Black background.

Mouse Follower
Drawing position is controlled by a mouse follower.
Follower position lerps toward the mouse with smoothing = 0.25.

Drawing
Draw to a drawingCanvas while mouseIsPressed.
Draw smooth by using the follower position. Connect positions frame-by-frame with line and strokeCap round.
brushSize = 100.
Random brush color with min brightness of 40% to keep contrast on the black background.
Each new mouse press starts a fresh stroke and picks a new random brush color.

Cursor
No filled circle, stroke in current brush color, strokeWeight = 1. Does not stay on the canvas.

Display
Display drawingCanvas. Display cursor above.

Spray Can Drip Effect
A new drip appears whenever the mouse speed drops below slowThreshold, drip origin is at the current follower position
Each drip starts with length = brushSize * 0.25 and speed = dripMaxSpeed.
With every frame, all active drips grow: speed increases by 0.15 
Each drip is a line of strokeWeight = dripSize = brushSize * 0.25, anchored at its origin and extending downward, drawn in the current brush color directly onto drawingCanvas.
When the mouse moves faster than slowThreshold or is released, all active drips are cleared.
Multiple drips can be active simultaneously.

Clear
Pressing X clears the drawingCanvas and removes all active drips.

Global editable variables at the top of the file.
 */


// ─── Global Editable Variables ───────────────────────────────────────────────
const brushSize     = 100;   // Diameter of the spray brush
const smoothing     = 0.25;  // Lerp factor for mouse follower (0 = no movement, 1 = instant)
const dripSize      = brushSize * 0.25; // Height/thickness of a drip line
const dripMinSpeed       = 2;   // Minimum initial speed of a drip (px per frame)
const dripMaxSpeed       = 8;   // Maximum downward speed of a drip (px per frame)
const slowThreshold      = 3;   // Mouse speed (px/frame) below which a drip starts
const dripSpawnDistance  = brushSize * 0.5;   // Min distance between drip origins (prevents stacking)
// ─────────────────────────────────────────────────────────────────────────────

let drawingCanvas;

// Follower state
let followerX, followerY;
let prevFollowerX, prevFollowerY;

// Brush color (HSB)
let brushH, brushS, brushB;

// Drip state
let growingDrips = [];   // Drips currently growing (multiple allowed)

// Mouse speed tracking
let prevMouseX, prevMouseY;

// ─────────────────────────────────────────────────────────────────────────────

function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(HSB, 360, 100, 100, 100);
  noCursor();

  drawingCanvas = createGraphics(windowWidth, windowHeight);
  drawingCanvas.colorMode(HSB, 360, 100, 100, 100);
  drawingCanvas.background(0, 0, 0);

  // Initialise follower at center
  followerX = width  / 2;
  followerY = height / 2;
  prevFollowerX = followerX;
  prevFollowerY = followerY;

  prevMouseX = mouseX;
  prevMouseY = mouseY;

  pickNewColor();
}

// ─────────────────────────────────────────────────────────────────────────────

function draw() {
  // ── Update follower ────────────────────────────────────────────────────────
  prevFollowerX = followerX;
  prevFollowerY = followerY;
  followerX = lerp(followerX, mouseX, smoothing);
  followerY = lerp(followerY, mouseY, smoothing);

  // ── Mouse speed ────────────────────────────────────────────────────────────
  let mouseSpeed = dist(mouseX, mouseY, prevMouseX, prevMouseY);
  prevMouseX = mouseX;
  prevMouseY = mouseY;

  // ── Drawing stroke to canvas ───────────────────────────────────────────────
  if (mouseIsPressed) {
    drawingCanvas.stroke(brushH, brushS, brushB, 100);
    drawingCanvas.strokeWeight(brushSize);
    drawingCanvas.strokeCap(ROUND);
    drawingCanvas.line(prevFollowerX, prevFollowerY, followerX, followerY);
  }

  // ── Drip logic ─────────────────────────────────────────────────────────────
  if (mouseIsPressed && mouseSpeed < slowThreshold) {
    // Spawn a new drip if follower is far enough from all existing drip origins
    let tooClose = growingDrips.some(
      d => dist(followerX, followerY, d.x, d.y) < dripSpawnDistance
    );
    if (!tooClose) {
      growingDrips.push({
        x: followerX, y: followerY,
        length: brushSize * 0.25, speed: dripMaxSpeed,
        h: brushH, s: brushS, b: brushB
      });
    }

    // Grow all active drips
    for (let d of growingDrips) {
      d.speed  = min(d.speed + 0.15, dripMaxSpeed);
      d.length = min(d.length + d.speed, height - d.y);
      paintDrip(d);
    }
  } else {
    // Mouse too fast or released — commit and clear all growing drips
    growingDrips = [];
  }

  // ── Compose display ────────────────────────────────────────────────────────
  background(0, 0, 0);
  image(drawingCanvas, 0, 0);

  // ── Cursor (above everything) ──────────────────────────────────────────────
  noFill();
  stroke(brushH, brushS, brushB, 100);
  strokeWeight(1);
  ellipse(mouseX, mouseY, brushSize, brushSize);
}

// ─── Helper: paint a single drip onto the drawingCanvas ──────────────────────
function paintDrip(d) {
  drawingCanvas.strokeCap(ROUND);
  drawingCanvas.noFill();
  drawingCanvas.stroke(d.h, d.s, d.b, 100);
  drawingCanvas.strokeWeight(dripSize);
  // Line anchored at origin, extending downward by d.length
  drawingCanvas.line(d.x, d.y, d.x, d.y + d.length);
}

// ─── Pick a fresh random brush color ─────────────────────────────────────────
function pickNewColor() {
  brushH = random(360);
  brushS = random(60, 100);
  brushB = random(40, 100); // min brightness 40% for contrast on black
}

// ─────────────────────────────────────────────────────────────────────────────

function mousePressed() {
  pickNewColor();
  // Snap follower to mouse on first press to avoid stale start position
  prevFollowerX = followerX;
  prevFollowerY = followerY;
}

function mouseReleased() {
  growingDrips = [];
}

function keyPressed() {
  if (key == 'x' || key == 'X') {
    drawingCanvas.background(0, 0, 0);
    growingDrips = [];
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // Preserve painting on resize
  let oldCanvas = drawingCanvas;
  drawingCanvas = createGraphics(windowWidth, windowHeight);
  drawingCanvas.colorMode(HSB, 360, 100, 100, 100);
  drawingCanvas.background(0, 0, 0);
  drawingCanvas.image(oldCanvas, 0, 0);
  oldCanvas.remove();
}