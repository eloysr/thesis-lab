/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * ---------------------------------
 * Interpolation – Linear and Easing
 * ---------------------------------
 * 
 * This file is a collection of all easing interpolation functions.
 *
 * What this file does:
 * - Displays all easing functions from easing.js in a grid
 * - Shows the easing curve itself for each easing function 
 * - Animates a dot moving along a line using the easing function to interpolate its x position
 * - Includes linear interpolation for comparison
 */


let easings = [];
let cellW, cellH, curveW, curveH;
let gridOffsetX = 0;
const cols = 10;
const rows = 4;
const margin = 30;
const gap = margin / 2;
const innerPadding = margin / 2;
const duration = 2000;

// Runs once when the sketch starts
function setup() {

  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);

  // Define easings with their metadata for layout and labeling
  easings = [
    { name: 'linear', fn: x => x },
    { name: 'easeInSine', fn: easeInSine },
    { name: 'easeOutSine', fn: easeOutSine },
    { name: 'easeInOutSine', fn: easeInOutSine },
    { name: 'easeInQuad', fn: easeInQuad },
    { name: 'easeOutQuad', fn: easeOutQuad },
    { name: 'easeInOutQuad', fn: easeInOutQuad },
    { name: 'easeInCubic', fn: easeInCubic },
    { name: 'easeOutCubic', fn: easeOutCubic },
    { name: 'easeInOutCubic', fn: easeInOutCubic },
    { name: 'easeInQuart', fn: easeInQuart },
    { name: 'easeOutQuart', fn: easeOutQuart },
    { name: 'easeInOutQuart', fn: easeInOutQuart },
    { name: 'easeInQuint', fn: easeInQuint },
    { name: 'easeOutQuint', fn: easeOutQuint },
    { name: 'easeInOutQuint', fn: easeInOutQuint },
    { name: 'easeInExpo', fn: easeInExpo },
    { name: 'easeOutExpo', fn: easeOutExpo },
    { name: 'easeInOutExpo', fn: easeInOutExpo },
    { name: 'easeInCirc', fn: easeInCirc },
    { name: 'easeOutCirc', fn: easeOutCirc },
    { name: 'easeInOutCirc', fn: easeInOutCirc },
    { name: 'easeInBack', fn: easeInBack },
    { name: 'easeOutBack', fn: easeOutBack },
    { name: 'easeInOutBack', fn: easeInOutBack },
    { name: 'easeInElastic', fn: easeInElastic },
    { name: 'easeOutElastic', fn: easeOutElastic },
    { name: 'easeInOutElastic', fn: easeInOutElastic },
    { name: 'easeInBounce', fn: easeInBounce },
    { name: 'easeOutBounce', fn: easeOutBounce },
    { name: 'easeInOutBounce', fn: easeInOutBounce },
  ];

  // Pre-compute y-range for each easing (some go below 0 or above 1)
  for (let e of easings) {
    let vals = [];
    for (let i = 0; i <= 200; i++) vals.push(e.fn(i / 200));
    e.minY = min(...vals);
    e.maxY = max(...vals);
  }

  // Calculate layout based on initial window size
  calcLayout();
}

// Runs continuously (frame by frame)
function draw() {

  // Clear the frame with a black background.
  background(0);

  // progress value to animate the dot along each curve.
  // t goes from 0 to 1 over duration milliseconds, looping back to 0 after each cycle.
  let t = (millis() % duration) / duration;

  // Draw each easing function in its own panel in the grid.
  for (let i = 0; i < easings.length; i++) {

    // Calculate row, column, and panel position (px, py) for this easing function
    let row, col, px, py;
    if (i === 0) {
      // Linear
      row = 0;
      let totalW = cols * cellW + (cols - 1) * gap;
      px = gridOffsetX;
      py = margin;
    } else {
      row = floor((i - 1) / cols) + 1;
      col = (i - 1) % cols;
      px = gridOffsetX + col * (cellW + gap);
      py = margin + row * (cellH + gap);
    }

    // Draw the panel for this easing function with the current progress t
    drawPanel(easings[i], px, py, t);
  }
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {

  resizeCanvas(windowWidth, windowHeight);

  // Re-calculate layout dimensions based on the new window size and defined margins/gaps.
  calcLayout();
}

// Calculates layout dimensions based on current window size and defined margins/gaps.
function calcLayout() {

  // Available width and height for the grid after accounting for margins on all sides.
  let availW = windowWidth - margin * 2;
  let availH = windowHeight - margin * 2;

  // Cell size driven by height; cap width so cells are never wider than tall
  cellH = (availH - (rows - 1) * gap) / rows;
  cellW = min((availW - (cols - 1) * gap) / cols, cellH);

  // Center the grid horizontally if there's extra space
  let gridW = cols * cellW + (cols - 1) * gap;
  gridOffsetX = (windowWidth - gridW) / 2;

  // Curve area is the cell size minus inner padding and label space at the bottom  
  curveW = cellW - innerPadding * 2;
  curveH = cellH - innerPadding * 6;
}

// Draws a single panel for the given easing function at position (px, py) with animation progress t (0..1).
function drawPanel(easing, px, py, t) {

  // Panel background: rounded rectangle with a dark fill and no stroke
  fill(15);
  noStroke();
  rect(px, py, cellW, cellH, 5);

  // CURVE ––––––––––––––––––––––––––––––––––––––––––

  // Y-axis: scale to actual value range so overshoot curves stay visible
  let yRange = easing.maxY - easing.minY;
  let yPad = max(yRange * 0.15, 0.05);
  let yLo = easing.minY - yPad;
  let yHi = easing.maxY + yPad;

  // Full curve
  stroke(32);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i <= 100; i++) {
    let x = i / 100;
    let y = easing.fn(x); // Apply the easing function to get the y value for this x, , example: let value = easeInSine(t);
    vertex(
      px + innerPadding + x * curveW,
      py + innerPadding + curveH - map(y, yLo, yHi, 0, curveH)
    );
  }
  endShape();

  // Progress along the curve (lightgrey)
  stroke(128);
  strokeWeight(2);
  noFill();
  beginShape();
  for (let i = 0; i <= t * 100; i++) {
    let x = i / 100;
    let y = easing.fn(x); // Apply the easing function to get the y value for this x, example: let value = easeInSine(t);
    vertex(
      px + innerPadding + x * curveW,
      py + innerPadding + curveH - map(y, yLo, yHi, 0, curveH)
    );
  }
  endShape();

  // BALL ––––––––––––––––––––––––––––––––––––––––––

  // Ball moving along the line using the eased value to interpolate its x position.

  // Apply the easing function to get the eased progress value
  let easedT = easing.fn(t); // example: let easedT = easeInSine(t);

  // Define the start and end x positions for the ball's movement along the line.
  let startX = px + innerPadding;
  let endX = px + cellW - innerPadding;

  // Use the eased value to interpolate the x position
  let ballX = lerp(startX, endX, easedT);
  let ballY = py + innerPadding + curveH + innerPadding;

  // Draw the line that the ball moves along
  stroke(32);
  strokeWeight(2);
  line(startX, ballY, endX, ballY);

  // Draw the ball at the eased position
  fill(255);
  noStroke();
  circle(ballX, ballY, 10);

  // LABEL ––––––––––––––––––––––––––––––––––––––––––

  // Label with the name of the easing function

  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(12);
  textFont('monospace');
  text(easing.name, px + cellW / 2, py + cellH - innerPadding * 2);
}