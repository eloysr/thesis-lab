/*
 * © 2026 Schultzschultz. Created for 'Schultzschultz Creative Coding Masterclass'.
 * For educational use only. All rights reserved.
 *
 * ----------------------
 * Coding Basics – Canvas
 * ----------------------
 *
 * This file is an example of how to set up a canvas using p5.js.
 *
 * What this file does:
 * - It creates a canvas element on the page where you can draw.
 * - It sets up a draw loop that runs continuously, allowing you to create animations or interactive graphics.
 */

// Set the background color for the canvas.
// You can change this to any color you like.
// (e.g., 255 for white, or a hex color code like the following).
const backgroundColor = "#ba5b5b";

// Runs once when the sketch starts
function setup() {
  // Create a canvas element and add it to the page.
  createCanvas(500, 600);

  // To make the canvas fill the entire browser window, use:
    createCanvas(windowWidth, windowHeight);

}

// Runs continuously (frame by frame)
function draw() {
  // Clear the frame with the background color. This will erase anything drawn in the previous frame.
      background(backgroundColor);

  // Example: Draw a simple diagonal cross across the canvas.
    stroke(0);
    line(0, 0, width, height);
    line(width, 0, 0, height);
}

// Keeps the canvas size in sync with the browser window.
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
