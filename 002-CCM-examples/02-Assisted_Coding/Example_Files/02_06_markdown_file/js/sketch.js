/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * -------------
 * markdown file 
 * -------------
 *
 * This project demonstrates how to use a CLAUDE.md brief to give AI assistants
 * the context they need to work effectively on a codebase — covering purpose,
 * stack, design system, conventions, and current status.
 *
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
  text("context is everything", width / 2, height / 2);
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
