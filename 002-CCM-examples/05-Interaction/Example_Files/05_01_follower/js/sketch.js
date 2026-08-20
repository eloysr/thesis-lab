/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -------------------------------------
 * Drawing – Points, Lines, and Follower
 * -------------------------------------
 * 
 * This file demonstrates how to create interactive drawings. 
 * The sketch is divided into three panels, each showcasing a different drawing technique:
 * 
 * 1. Points: Draws points at the mouse position. 
 * 2. Lines: Draws lines connecting the previous mouse position to the current mouse position.
 * 3. Follower: A circle that smoothly follows the mouse cursor using linear interpolation (lerp). 
 *    Draws lines connecting the previous and current follower positions.
 *
 * What this file does:
 * - Sets up a canvas divided into three panels.
 * - Uses off-screen graphics buffers to draw points, lines, and the follower separately.
 * - Implements mouse interaction to draw on the respective panels based on the cursor's position.
 * - Provides a clear function to reset the drawings when the 'C' key is pressed.
 * 
 * Controls:
 * - Move the mouse over each panel to draw points, lines, or the follower.
 * - Press the 'C' key to clear all drawings from the panels.  
*/

let panelWidth;
let pointsBuffer, linesBuffer, followerBuffer;
let followerX, followerY;
let pfollowerX, pfollowerY;
const followerSpeed = 0.05;  
const red = 'rgb(255, 80, 80)';
const blue = 'rgb(80, 200, 255)';
const green = 'rgb(120, 255, 160)';

// Runs once when the sketch starts
function setup() {
  createCanvas(windowWidth, windowHeight);
  reset();
  textFont('monospace');
  textAlign(CENTER);
}

// Runs continuously (frame by frame)
function draw() {

  // Background for the main canvas
  background(0);

  // ––––– Panel 1: Points ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  // Draw point at mouse position when over panel 1
  if (mouseX < panelWidth) {
    pointsBuffer.stroke(red);
    pointsBuffer.strokeWeight(4);
    pointsBuffer.point(mouseX, mouseY);
  }

  // Display points panel
  image(pointsBuffer, 0, 0);

  // ––––– Panel 2: Lines –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  // Draw line from previous mouse position to current mouse position when over panel 2
  if (mouseX >= panelWidth && mouseX < panelWidth * 2) {
    // Coordinates relative to panel origin
    let lx = mouseX - panelWidth;
    let ly = mouseY;
    let lpx = pmouseX - panelWidth;
    let lpy = pmouseY;
    linesBuffer.stroke(blue);
    linesBuffer.strokeWeight(2);
    linesBuffer.line(lpx, lpy, lx, ly);
  }

  // Display lines panel
  image(linesBuffer, panelWidth, 0);

  // ––––– Panel 3: Follower ––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  // Mouse coordinates relative to panel 3
  let targetX = mouseX - panelWidth * 2;
  let targetY = mouseY;

  // Move follower towards mouse position using linear interpolation (lerp)
  followerX = lerp(followerX, targetX, followerSpeed);
  followerY = lerp(followerY, targetY, followerSpeed);

  // Draw trail into buffer
  followerBuffer.stroke(green);
  followerBuffer.strokeWeight(2);
  followerBuffer.line(pfollowerX, pfollowerY, followerX, followerY);

  // Remember previous follower position
  pfollowerX = followerX;
  pfollowerY = followerY;

  // Display follower panel
  image(followerBuffer, panelWidth * 2, 0);

  // Display the follower and its connection to the mouse cursor when mouse is over panel 3
  if (mouseX >= panelWidth * 2) {
    // Connection line: mouse cursor → follower
    stroke(green);
    strokeWeight(1);
    line(mouseX, mouseY, followerX + panelWidth * 2, followerY);
    // Mouse position
    stroke(green);
    strokeWeight(1);
    noFill();
    ellipse(mouseX, mouseY, 15, 15);
    // Follower circle
    noStroke();
    fill(green);
    ellipse(followerX + panelWidth * 2, followerY, 10, 10);
  }

  // –––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

  // Divider lines
  stroke(32);
  strokeWeight(1);
  line(panelWidth, 0, panelWidth, height);
  line(panelWidth * 2, 0, panelWidth * 2, height);

  // Labels
  displayLabels();
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  reset();
}

// Clear all buffers with key 'C'
function keyPressed() {
  if (key === 'c' || key === 'C') {
    reset();
  }
}

function reset() {
  // Calculate panel width
  panelWidth = width / 3;

  // Create off-screen graphics buffers for each panel
  pointsBuffer = createGraphics(panelWidth, height);
  linesBuffer = createGraphics(panelWidth, height);
  followerBuffer = createGraphics(panelWidth, height);

  // Clear buffers
  pointsBuffer.background(0);
  linesBuffer.background(0);
  followerBuffer.background(0);

  // Reset follower position to mouse position
  followerX = mouseX - panelWidth * 2;
  followerY = mouseY;
  pfollowerX = mouseX - panelWidth * 2;
  pfollowerY = mouseY;
}

// Display labels for each panel and hint at the bottom
function displayLabels() {
  noStroke();

  // Panel 1 – Points
  fill(red);
  text('1 — POINTS', panelWidth * 0.5, 40);
  fill(128);
  text('point(mouseX, mouseY)', panelWidth * 0.5, 60);

  // Panel 2 – Lines
  fill(blue);
  text('2 — LINES', panelWidth * 1.5, 40);
  fill(128);
  text('line(pmouseX, pmouseY, mouseX, mouseY)', panelWidth * 1.5, 60);

  // Panel 3 – Follower
  fill(green);
  text('3 — FOLLOWER', panelWidth * 2.5, 40);
  fill(128);
  text('followerX = lerp(followerX, mouseX, ' + followerSpeed + ')', panelWidth * 2.5, 60);
  text('followerX = lerp(followerX, mouseX, ' + followerSpeed + ')', panelWidth * 2.5, 80);

  // Hint
  fill(128);
  text('Move your mouse over each panel to draw ', width / 2, height - 60);
  text('C = clear all', width / 2, height - 40);
}