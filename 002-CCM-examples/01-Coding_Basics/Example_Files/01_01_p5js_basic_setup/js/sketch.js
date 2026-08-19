/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 * 
 * -----------------
 * p5.js Basic Setup
 * -----------------
 * 
 * This file is a starter template for your own p5.js code.
 *
 * What this file does:
 * - setup(): Runs once when the sketch starts. Add your startup code here. 
 * - draw(): Runs continuously (frame by frame). Add your display code here.
 * - windowResized(): Resizes the canvas when the browser window changes.
 */


// Runs once when the sketch starts
function setup() {

  // Default full-window canvas.
  createCanvas(windowWidth, windowHeight);

  // ----------------- Add your startup code here. -----------------
}

// Runs continuously (frame by frame)
function draw() {

  // Clear the frame with a black background.
  background(0);

  // ----------------- Add your display code here. -----------------

  // Example: Display a message in the center of the canvas.
  fill(255);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(28);
  text("p5.js is ready", width / 2, height / 2);
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
